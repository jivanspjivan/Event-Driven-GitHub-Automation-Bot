const crypto = require('crypto');

const verifyGitHubSignature = (rawBody, signature, secret) => {
  if (!Buffer.isBuffer(rawBody) || !signature || !signature.startsWith('sha256=')) return false;

  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    suppliedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
};

module.exports = { verifyGitHubSignature };
