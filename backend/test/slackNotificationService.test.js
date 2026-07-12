const test = require('node:test');
const assert = require('node:assert/strict');
const { sendIssueTriageNotification } = require('../services/slackNotificationService');

test('sends an issue triage message to the configured Slack webhook', async () => {
  const previousUrl = process.env.SLACK_WEBHOOK_URL;
  const previousFetch = global.fetch;
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T000/B000/secret';
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, text: async () => 'ok' };
  };

  try {
    await sendIssueTriageNotification({
      repository: { fullName: 'octocat/hello-world' },
      issue: {
        number: 7,
        title: 'Login <button> is broken',
        reporter: 'qa-user',
        htmlUrl: 'https://github.com/octocat/hello-world/issues/7',
      },
      label: 'bug',
      assignee: 'developer-one',
    });
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SLACK_WEBHOOK_URL;
    else process.env.SLACK_WEBHOOK_URL = previousUrl;
  }

  const payload = JSON.parse(request.options.body);
  assert.equal(request.url, 'https://hooks.slack.com/services/T000/B000/secret');
  assert.match(payload.text, /New GitHub issue #7/);
  assert.match(payload.blocks[1].text.text, /Login &lt;button&gt; is broken/);
  assert.doesNotMatch(request.options.body, /secret/);
});
