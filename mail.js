// send emails
// requires:
//   MAILGUN_DOMAIN
//   MAILGUN_API_KEY
// usage:
//   MAILGUN_DOMAIN=foo.com MAILGUN_API_KEY=xyz node mail.js emails/xyz/__manifest.json


var request = require('superagent');
var fs = require('fs');
var promptSync = require('prompt-sync');
var concatSeries = require('async/concatSeries');


function sendEmail(options, info, callback) {
  var fromEmail = info.fromEmail;
  var toEmail = (options && options.debugEmail)
    ? options.debugEmail
    : info.toEmail;
  var subject = info.subject;
  var html = fs.readFileSync(info.fullFilename).toString();

  console.log('Sending `' + subject + '` to ' + toEmail + ' from ' + fromEmail + ', ' + info.fullFilename);
  request
    .post('https://api:' + process.env.MAILGUN_API_KEY + '@api.mailgun.net/v3/' + process.env.MAILGUN_DOMAIN + '/messages')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('Accept', 'application/json')
    .send({
      from: fromEmail,
      to: toEmail,
      subject: subject,
      html: html
    })
    .end(callback);
}

// Read manifest
if (process.argv.length !== 3) {
  console.log('Usage: MAILGUN_DOMAIN=foo.com MAILGUN_API_KEY=xyz node mail.js emails/xyz/__manifest.json');
  process.exit(1);
}
var manifestFilename = process.argv[2];
var manifest = JSON.parse(fs.readFileSync(manifestFilename).toString());

// Debugging options
var options = {
  debugEmail: 'kevin.robinson.0+testing@gmail.com',
  slice: {
    from: 0,
    to: 0
  }
};
var emails = (options.from !== 0 || options.to !== 0)
  ? manifest.emails.slice(options.from, options.to)
  : manifest.emails;

// Confirm
console.log('About to send ' + emails.length + ' emails...');
console.log('options: ' + JSON.stringify(options, null, 2));
var confirmText = 'yes, send ' + emails.length + ' emails';
var promptText = 'Type "' + confirmText + '" to confirm and send:\n> ';
var userText = promptSync()(promptText);
if (userText !== confirmText) {
  console.log('Aborting...');
  process.exit(1);
}

console.log('Sending...');
concatSeries(emails, sendEmail.bind(null, options), (err, responses) => {
  console.log('Sent.');
  console.log('Writing ' + responses.length + ' responses to disk...');
  var folder = 'logs/' + (new Date()).getTime().toString() + '/';
  fs.mkdirSync(folder);
  fs.writeFileSync(folder + 'responses.json', JSON.stringify({manifestFilename, responses}, null, 2));
  console.log('There were ' + responses.filter(response => response.status !== 200).length + ' requests that had errors.');
  console.log('Done.');
});