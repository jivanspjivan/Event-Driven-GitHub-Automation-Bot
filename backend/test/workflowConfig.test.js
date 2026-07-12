const test = require('node:test');
const assert = require('node:assert/strict');

test('provides safe default retry workflow settings', () => {
  const workflow = require('../config/workflows').githubAutomation;
  assert.equal(workflow.key, 'github_automation');
  assert.equal(workflow.enabled, true);
  assert.equal(workflow.retryCount, 3);
  assert.equal(workflow.lookbackMinutes, 30);
  assert.equal(workflow.staleRunningMinutes, 30);
  assert.equal(workflow.batchSize, 20);
});
