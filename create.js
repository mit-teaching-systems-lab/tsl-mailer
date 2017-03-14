var fs = require('fs');
var Mustache = require('mustache');
var TSV = require('tsv');
var md5 = require('md5');


// Create email and write it to disk
function writeEmail(template, folder, row) {
  var postContent = (row.post_content || '').replace(/\\n/g, "\n");
  var LIMIT = 500;
  var templateParams = {
    title: 'Launching Innovation in Schools',
    membersUrl: 'https://launching-innovation.teachingsystemslab.org/members/',
    name: row.user_nicename,
    lead: 'Hello!',
    quote: postContent,
    postExcerptHtml: (postContent && postContent.length > LIMIT)
      ? postContent.slice(0, LIMIT) + '...'
      : postContent,
    postTitle: row.post_title,
    postUrl: row.guid,
    ctaUrl: 'https://launching-innovation.teachingsystemslab.org/forums/forum/official-course-forums/course-feedback/'
  };

  var html = Mustache.render(template, templateParams);
  var fullFilename = folder + row.user_nicename + '-' + md5(html) + '.html';
  fs.writeFileSync(fullFilename, html);

  return fullFilename;
}


// Read in data
var tsvString = fs.readFileSync('data/output.tsv').toString();
var rows = TSV.parse(tsvString);
try { fs.mkdirSync('emails'); } catch(e) { }
var folder = 'emails/' + (new Date()).getTime() + '/';
fs.mkdirSync(folder);

// Create emails and write to disk
var templateFilename = 'templates/litmus-simple.html.mustache';
var template = fs.readFileSync(templateFilename).toString();
var emails = rows.map(function(row) {
  var fullFilename = writeEmail(template, folder, row);
  
  return {
    fromEmail: 'noreply@teachingsystemslab.org',
    toEmail: row.user_email,
    subject: 'Launching Innovation in Schools',
    fullFilename: fullFilename
  };
});

// Output manifest with commands for who to email
var manifestFilename = folder + 'manifest.json';
fs.writeFileSync(manifestFilename, JSON.stringify({ emails: emails }, null, 2));
console.log('Wrote ' + emails.length + ' emails to ' + manifestFilename);
console.log('Done.');