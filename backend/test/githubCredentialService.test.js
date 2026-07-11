const test = require('node:test');
const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
const { encryptToken, decryptToken } = require('../services/githubCredentialService');

test('encrypts and decrypts a GitHub access token', () => {
  const previousKey = process.env.TOKEN_ENCRYPTION_KEY;
  process.env.TOKEN_ENCRYPTION_KEY = 'a'.repeat(64);

  try {
    const encrypted = encryptToken('github-test-token');
    assert.notEqual(encrypted.encryptedAccessToken, 'github-test-token');
    assert.equal(decryptToken(encrypted), 'github-test-token');
  } finally {
    if (previousKey === undefined) delete process.env.TOKEN_ENCRYPTION_KEY;
    else process.env.TOKEN_ENCRYPTION_KEY = previousKey;
  }
});
