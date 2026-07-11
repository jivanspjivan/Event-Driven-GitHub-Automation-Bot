const crypto = require('crypto');
const pool = require('../db/pool');
const { required } = require('../config/env');

const getEncryptionKey = () => {
  const value = required('TOKEN_ENCRYPTION_KEY');
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    const error = new Error('TOKEN_ENCRYPTION_KEY must contain exactly 64 hexadecimal characters');
    error.statusCode = 503;
    throw error;
  }
  return Buffer.from(value, 'hex');
};

const encryptToken = (accessToken) => {
  const initializationVector = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), initializationVector);
  const encryptedAccessToken = Buffer.concat([
    cipher.update(accessToken, 'utf8'),
    cipher.final(),
  ]);

  return {
    encryptedAccessToken: encryptedAccessToken.toString('base64'),
    initializationVector: initializationVector.toString('base64'),
    authenticationTag: cipher.getAuthTag().toString('base64'),
  };
};

const decryptToken = ({ encryptedAccessToken, initializationVector, authenticationTag }) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(initializationVector, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(authenticationTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedAccessToken, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

const saveCredential = async (userId, accessToken) => {
  const encrypted = encryptToken(accessToken);
  await pool.query(
    `INSERT INTO github_credentials (
       user_id, encrypted_access_token, initialization_vector, authentication_tag
     ) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       encrypted_access_token = EXCLUDED.encrypted_access_token,
       initialization_vector = EXCLUDED.initialization_vector,
       authentication_tag = EXCLUDED.authentication_tag,
       updated_at = NOW()`,
    [
      userId,
      encrypted.encryptedAccessToken,
      encrypted.initializationVector,
      encrypted.authenticationTag,
    ],
  );
};

const getCredential = async (userId) => {
  const result = await pool.query(
    `SELECT encrypted_access_token, initialization_vector, authentication_tag
       FROM github_credentials
      WHERE user_id = $1`,
    [userId],
  );
  if (!result.rows[0]) return null;
  return decryptToken({
    encryptedAccessToken: result.rows[0].encrypted_access_token,
    initializationVector: result.rows[0].initialization_vector,
    authenticationTag: result.rows[0].authentication_tag,
  });
};

module.exports = { encryptToken, decryptToken, saveCredential, getCredential };
