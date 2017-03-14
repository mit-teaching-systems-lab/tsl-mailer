# tsl-mailer
Grab data, render it as email templates, then mail them out.

Process:
```
# Grab your data from the online course or wherever
> scp remotehost:rows.tsv ./data/rows.tsv

# Edit a template or make a new one.  You can source new layouts from litmus.com.

# Update create.js to point to that template, and update any "from" or "subject" fields.

# Create emails
> node create.js
Wrote 103 emails to emails/1489514972566/manifest.json
Done.

# Go look at them in a browser (remember that email HTML is complicated).

# Send those emails out with Mailgun
> MAILGUN_DOMAIN=mg.teachingsystemslab.org MAILGUN_API_KEY=xyz node mail.js emails/1489514972566/manifest.json
...
```


Example query for grabbing WordPress posts in a forum:
```
SELECT wp_posts.guid, user_email, user_nicename, post_title, post_content from wp_posts LEFT JOIN wp_users ON wp_users.ID=wp_posts.post_author where post_parent=123456;
```
