const test = require('node:test');
const assert = require('node:assert/strict');
const { triageIssue } = require('../services/githubIssueService');

test('checks assignee, adds a label, and assigns the issue', async () => {
  const previousFetch = global.fetch;
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, json: async () => ({}) };
  };

  try {
    await triageIssue({
      accessToken: 'secret-token',
      owner: 'octocat',
      repository: 'hello-world',
      issueNumber: 7,
      label: 'bug',
      assignee: 'developer-one',
    });
  } finally {
    global.fetch = previousFetch;
  }

  assert.equal(requests.length, 3);
  assert.match(requests[0].url, /\/assignees\/developer-one$/);
  assert.deepEqual(JSON.parse(requests[1].options.body), { labels: ['bug'] });
  assert.deepEqual(JSON.parse(requests[2].options.body), { assignees: ['developer-one'] });
});
