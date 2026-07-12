# Demo screenshot guide

Add the following PNG files to this directory. The root README already references these exact names.

```text
01-login-page.png
02-welcome-profile.png
03-choose-repository.png
04-repository-list.png
05-automation-dashboard.png
06-slack-notification.png
07-neon-database.png
08-github-issue-triaged.png
09-two-webhook-events.png          # recommended
10-retry-history.png               # recommended
11-live-deployment.png             # recommended
```

## Capture guidance

- Use one consistent browser width, preferably 1440px.
- Crop empty browser chrome when it does not add useful context.
- Use the same demo repository throughout the flow.
- Keep repository and issue names readable.
- Redact database URLs, passwords, OAuth secrets, webhook secrets, tokens, cookies, email addresses you do not want public, and the Slack Incoming Webhook URL.
- Do not show `.env`, browser developer-tool storage, request authorization headers, or the encrypted credential table contents.
- Prefer real end-to-end evidence over manually inserted database rows.
- Compress images before committing them if individual files are very large.
