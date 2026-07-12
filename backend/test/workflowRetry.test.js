const test = require('node:test');
const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
const { retryDelayMinutes } = require('../services/workflowService');

test('uses capped exponential delay between workflow attempts', () => {
  assert.equal(retryDelayMinutes(1), 1);
  assert.equal(retryDelayMinutes(2), 2);
  assert.equal(retryDelayMinutes(3), 4);
  assert.equal(retryDelayMinutes(10), 30);
});
