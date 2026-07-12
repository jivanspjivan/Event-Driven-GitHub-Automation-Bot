const { required } = require('../config/env');

const escapeSlackText = (value) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('@', '＠');

const getWebhookUrl = () => {
  const value = required('SLACK_WEBHOOK_URL');
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('SLACK_WEBHOOK_URL must be a valid URL');
  }
  if (url.protocol !== 'https:' || url.hostname !== 'hooks.slack.com') {
    throw new Error('SLACK_WEBHOOK_URL must use https://hooks.slack.com');
  }
  return url.toString();
};

const sendIssueTriageNotification = async ({ repository, issue, label, assignee }) => {
  const repositoryName = escapeSlackText(repository.fullName);
  const issueTitle = escapeSlackText(issue.title);
  const reporter = escapeSlackText(issue.reporter);
  const safeLabel = escapeSlackText(label);
  const safeAssignee = escapeSlackText(assignee);
  const issueUrl = new URL(issue.htmlUrl).toString();
  const fallbackText = `New GitHub issue #${issue.number} in ${repositoryName}: ${issueTitle}`;

  const response = await fetch(getWebhookUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      text: fallbackText,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: 'New issue triaged', emoji: true },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*<${issueUrl}|#${issue.number} ${issueTitle}>*\nRepository: *${repositoryName}*`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Reported by*\n${reporter}` },
            { type: 'mrkdwn', text: `*Assigned to*\nGitHub: ${safeAssignee}` },
            { type: 'mrkdwn', text: `*Label*\n${safeLabel}` },
            { type: 'mrkdwn', text: '*Status*\nReady for investigation' },
          ],
        },
      ],
    }),
  });

  const responseText = await response.text();
  if (!response.ok || responseText.trim() !== 'ok') {
    const error = new Error(`Slack notification failed with status ${response.status}`);
    error.statusCode = 502;
    error.slackStatusCode = response.status;
    throw error;
  }
};

module.exports = { sendIssueTriageNotification };
