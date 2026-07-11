const crypto = require('crypto');
const { required } = require('../config/env');
const {
  exchangeCodeForToken,
  getAuthenticatedUser,
} = require('../services/githubAuthService');
const { upsertUser } = require('../services/userService');
const { saveCredential } = require('../services/githubCredentialService');

const saveSession = (req) =>
  new Promise((resolve, reject) => req.session.save((error) => (error ? reject(error) : resolve())));

const regenerateSession = (req) =>
  new Promise((resolve, reject) =>
    req.session.regenerate((error) => (error ? reject(error) : resolve())),
  );

const destroySession = (req) =>
  new Promise((resolve, reject) => req.session.destroy((error) => (error ? reject(error) : resolve())));

const githubLogin = async (req, res) => {
  const clientId = required('GITHUB_CLIENT_ID');
  const state = crypto.randomBytes(32).toString('hex');

  req.session.githubOAuthState = state;
  await saveSession(req);

  const authorizationUrl = new URL('https://github.com/login/oauth/authorize');
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', required('GITHUB_CALLBACK_URL'));
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('scope', 'read:user repo');

  res.redirect(authorizationUrl.toString());
};

const githubCallback = async (req, res) => {
  const { code, state } = req.query;
  const expectedState = req.session.githubOAuthState;
  delete req.session.githubOAuthState;

  if (!code || !state || !expectedState || state !== expectedState) {
    const error = new Error('Invalid or expired GitHub OAuth state');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = await exchangeCodeForToken({
    clientId: required('GITHUB_CLIENT_ID'),
    clientSecret: required('GITHUB_CLIENT_SECRET'),
    code,
  });
  const githubUser = await getAuthenticatedUser(accessToken);
  const databaseUser = await upsertUser(githubUser);
  await saveCredential(databaseUser.id, accessToken);

  await regenerateSession(req);
  req.session.user = {
    databaseId: databaseUser.id,
    id: githubUser.id,
    login: githubUser.login,
    name: githubUser.name,
    avatarUrl: githubUser.avatar_url,
    profileUrl: githubUser.html_url,
  };
  req.session.githubAccessToken = accessToken;
  await saveSession(req);

  res.redirect(`${required('FRONTEND_URL').replace(/\/$/, '')}/dashboard`);
};

const getCurrentUser = (req, res) => {
  res.status(200).json({ user: req.session.user });
};

const logout = async (req, res) => {
  await destroySession(req);
  res.clearCookie('github_automation.sid');
  res.status(204).send();
};

module.exports = { githubLogin, githubCallback, getCurrentUser, logout };
