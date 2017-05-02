var fs = require('fs');
var Mustache = require('mustache');
var TSV = require('tsv');
var csvParse = require('csv-parse');
var syncCsvParse = require('csv-parse/lib/sync');
var md5 = require('md5');
var _ = require('lodash');


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

function writeNoPosterEmail(template, folder, row) {
  var templateParams = {
    title: 'Launching Innovation in Schools',
    membersUrl: 'https://launching-innovation.teachingsystemslab.org/members/',
    name: row.username,
    lead: 'Hello!',
    ctaUrl: 'https://launching-innovation.teachingsystemslab.org/forums/forum/official-course-forums/course-feedback/'
  };

  var html = Mustache.render(template, templateParams);
  var fullFilename = folder + row.username + '-' + md5(html) + '.html';
  fs.writeFileSync(fullFilename, html);

  return fullFilename;
}


function readEdXUserRows(edXProfilesFilename) {
  var csvString = fs.readFileSync(edxProfilesFilename).toString();
  return syncCsvParse(csvString, { columns: true });
}


// Check command line arguments
if (process.argv.length !== 4) {
  console.log('Command line argument missing, aborting...');
  console.log('');
  console.log('Usage: node create.js data/posts.tsv data/edx_profiles.csv');
  process.exit(1);
}

console.log('Reading in post data...');
var postsFilename = process.argv[2];
var tsvString = fs.readFileSync(postsFilename).toString();
var rows = TSV.parse(tsvString);

console.log('Reading in EdX users and determining who didn\'t post...');
var edxProfilesFilename = process.argv[3];
var edXUserRows = readEdXUserRows(edxProfilesFilename);
var posterEmails = rows.map(row => row.user_email);
var noPosterRows = edXUserRows.filter(row => !_.includes(posterEmails, row.email));

// Create folder to hold emails
try { fs.mkdirSync('emails'); } catch(e) { }
var folder = 'emails/' + (new Date()).getTime() + '/';
fs.mkdirSync(folder);

console.log(`Writing emails for ${rows.length} users who posted...`);
var posterTemplateFilename = 'templates/litmus-simple.html.mustache';
var posterTemplate = fs.readFileSync(posterTemplateFilename).toString();
var posterEmails = rows.map(function(row) {
  var fullFilename = writeEmail(posterTemplate, folder, row);
  return {
    fromEmail: 'noreply@teachingsystemslab.org',
    toEmail: row.user_email,
    subject: 'Launching Innovation in Schools',
    fullFilename: fullFilename,
    meta: {
      poster: true
    }
  };
});

console.log(`Writing emails for ${noPosterRows.length} users who didn't post...`);
var noPosterTemplateFilename = 'templates/litmus-simple-no-post.html.mustache';
var noPosterTemplate = fs.readFileSync(noPosterTemplateFilename).toString();
var noPosterEmails = noPosterRows.map(function(row) {
  var fullFilename = writeNoPosterEmail(noPosterTemplate, folder, row);
  return {
    fromEmail: 'noreply@teachingsystemslab.org',
    toEmail: row.email,
    subject: 'Launching Innovation in Schools',
    fullFilename: fullFilename,
    meta: {
      poster: false
    }
  };
});

// Output manifest with commands for who to email
var emails = posterEmails.concat(noPosterEmails);
var manifestFilename = folder + '__manifest.json';
fs.writeFileSync(manifestFilename, JSON.stringify({emails}, null, 2));
console.log('Wrote ' + emails.length + ' emails to ' + manifestFilename);
console.log('Done.');