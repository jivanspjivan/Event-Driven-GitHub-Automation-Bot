const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { verifyGitHubSignature } = require('../services/webhookSignatureService');

test('accepts a valid GitHub SHA-256 signature', () => {
  const body = Buffer.from('{"zen":"Keep it logically awesome."}');
  const secret = 'test-secret';
  const signature = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

  assert.equal(verifyGitHubSignature(body, signature, secret), true);
});

test('rejects an invalid or missing signature', () => {
  const body = Buffer.from('{}');

  assert.equal(verifyGitHubSignature(body, `sha256=${'0'.repeat(64)}`, 'test-secret'), false);
  assert.equal(verifyGitHubSignature(body, undefined, 'test-secret'), false);
});
