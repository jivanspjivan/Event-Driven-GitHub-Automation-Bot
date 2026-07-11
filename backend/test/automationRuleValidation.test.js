const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCreateRule } = require('../services/automationRuleValidation');

test('accepts a configured issue triage rule', () => {
  assert.deepEqual(
    validateCreateRule({
      eventName: 'issues',
      actionType: 'triage_issue',
      configuration: { label: ' bug ', assignee: 'octocat' },
    }),
    {
      eventName: 'issues',
      actionType: 'triage_issue',
      configuration: { label: 'bug', assignee: 'octocat' },
    },
  );
});

test('rejects triage for a non-issue event or invalid assignee', () => {
  assert.throws(
    () =>
      validateCreateRule({
        eventName: 'push',
        actionType: 'triage_issue',
        configuration: { label: 'bug', assignee: 'octocat' },
      }),
    /only be used with the issues event/,
  );
  assert.throws(
    () =>
      validateCreateRule({
        eventName: 'issues',
        actionType: 'triage_issue',
        configuration: { label: 'bug', assignee: 'not valid' },
      }),
    /valid GitHub assignee login/,
  );
});
