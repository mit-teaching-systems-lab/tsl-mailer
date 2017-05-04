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
    name: row.user_nicename,
    shouldShowPost: (postContent && postContent.trim().length > 0),
    postExcerptHtml: (postContent && postContent.length > LIMIT)
      ? postContent.slice(0, LIMIT) + '...'
      : postContent,
    postTitle: row.post_title
  };

  var html = Mustache.render(template, templateParams);
  var fullFilename = folder + row.user_nicename + '-' + md5(html) + '.html';
  fs.writeFileSync(fullFilename, html);

  return fullFilename;
}

function writeNoPosterEmail(template, folder, row) {
  var templateParams = {
    name: row.username,
    shouldShowPost: false
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
var tsvString = fs.readFileSync(postsFilename).toString().trim();
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
var templateFilename = 'templates/litmus-simple.html.mustache';
var template = fs.readFileSync(templateFilename).toString();

console.log(`Writing emails for ${rows.length} users who posted...`);
var posterEmails = rows.map(function(row) {
  var fullFilename = writeEmail(template, folder, row);
  return {
    fromEmail: 'liis11.154x@gmail.com',
    toEmail: row.user_email,
    subject: 'We want to hear how your work is going!',
    fullFilename: fullFilename,
    meta: {
      poster: true
    }
  };
});

console.log(`Writing emails for ${noPosterRows.length} users who didn't post...`);
var noPosterEmails = noPosterRows.map(function(row) {
  var fullFilename = writeNoPosterEmail(template, folder, row);
  return {
    fromEmail: 'liis11.154x@gmail.com',
    toEmail: row.email,
    subject: 'We want to hear how your work is going!',
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