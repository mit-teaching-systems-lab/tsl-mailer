// mysql dump
// script to get out posts from a forum
// select wp_posts.guid, user_email, user_nicename, post_title, post_content from wp_posts LEFT JOIN wp_users ON wp_users.ID=wp_posts.post_author where post_parent=xyz;

var fs = require('fs');
var Mustache = require('mustache');
var TSV = require('tsv');


var tsvString = fs.readFileSync('output.tsv').toString();
var rows = TSV.parse(tsvString);

var emails = rows.slice(98, 99).map(function(row) {
  var toEmailAddres = row.user_email;
  var postContent = (row.post_content || '').replace(/\\n/g, "\n");
  // console.log(postContent);
  // return;
  var LIMIT = 500;
  var params = {
    title: 'Launching Innovation in Schools',
    membersUrl: 'https://launching-innovation.teachingsystemslab.org/members/',
    name: row.user_nicename,
    lead: 'Hello!',
    quote: postContent,
    postExcerpt: (postContent && postContent.length > LIMIT)
      ? postContent.slice(0, LIMIT) + '...'
      : postContent,
    postTitle: row.post_title,
    postUrl: row.guid,
    ctaUrl: 'https://launching-innovation.teachingsystemslab.org/forums/forum/official-course-forums/course-feedback/'
  };

  var templateString = fs.readFileSync('email.html.mustache').toString();
  return Mustache.render(templateString, params);
});

console.log(emails[0]);

// // var mgcmd = require('mailgun-cmd');
// // var message = new mgcmd.Message();
// // message
// //   .apikey(process.env.MAILGUN_API_KEY)
// //   .domain('mg.teachingsystemslab.org')
// //   .from(process.env.FROM_EMAIL)
// //   .to(toEmailAddress)
// //   .subject(subject)
// //   .html(html);
// // message.send();