// send emails
// requires:
//   MAILGUN_DOMAIN
//   MAILGUN_API_KEY
// usage:
//   MAILGUN_DOMAIN=foo.com MAILGUN_API_KEY=xyz node mail.js emails/1232141190/manifest.json


var request = require('superagent');
var fs = require('fs');


function sendEmailPromise(info) {
  var fromEmail = info.fromEmail;
  // var toEmail = info.toEmail;
  var toEmail = 'kevin.robinson.0+test@gmail.com';
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
    .end(function(err, result) {
      if (err || result.status != 200) {
        console.log(JSON.stringify({err, result}, null, 2));
      } else {
        console.log('.');
      }
    });
}

// Read manifest and send all
var manifestFilename = process.argv[2];
var manifest = JSON.parse(fs.readFileSync(manifestFilename).toString());
var promises = manifest.emails.slice(1, 2).map(sendEmailPromise);
Promise.all(promises).then(function() {
  console.log('Done.');
});
