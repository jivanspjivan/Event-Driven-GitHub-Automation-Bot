const test = require('node:test');
const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
const { retryDelayMinutes, getWorkflowTransition } = require('../services/workflowService');

test('uses capped exponential delay between workflow attempts', () => {
  assert.equal(retryDelayMinutes(1), 1);
  assert.equal(retryDelayMinutes(2), 2);
  assert.equal(retryDelayMinutes(3), 4);
  assert.equal(retryDelayMinutes(10), 30);
});

test('requeues failures until retries are exhausted', () => {
  assert.deepEqual(
    getWorkflowTransition({ attempt_count: 1, max_retry_count: 3 }, { status: 'failed' }),
    { jobStatus: 'unprocessed', deliveryStatus: 'unprocessed', retryAvailable: true, delayMinutes: 1 },
  );
  assert.deepEqual(
    getWorkflowTransition({ attempt_count: 4, max_retry_count: 3 }, { status: 'failed' }),
    { jobStatus: 'failed', deliveryStatus: 'failed', retryAvailable: false, delayMinutes: 0 },
  );
  assert.deepEqual(
    getWorkflowTransition({ attempt_count: 1, max_retry_count: 3 }, { status: 'success' }),
    { jobStatus: 'success', deliveryStatus: 'success', retryAvailable: false, delayMinutes: 0 },
  );
});
