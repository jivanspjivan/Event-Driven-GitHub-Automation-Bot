const test = require('node:test');
const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
const { isRuleApplicable } = require('../services/webhookService');

test('runs issue triage only when an issue is opened', () => {
  const rule = { action_type: 'triage_issue' };
  assert.equal(isRuleApplicable(rule, 'issues', 'opened'), true);
  assert.equal(isRuleApplicable(rule, 'issues', 'closed'), false);
  assert.equal(isRuleApplicable(rule, 'push', undefined), false);
});

test('record_event applies to its matched event regardless of payload action', () => {
  assert.equal(isRuleApplicable({ action_type: 'record_event' }, 'issues', 'closed'), true);
});
