const GITHUB_API_VERSION = '2026-03-10';

const parseGitHubResponse = async (response, fallbackMessage) => {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.error_description || body.message || fallbackMessage);
    error.statusCode = response.status >= 400 && response.status < 500 ? 401 : 502;
    throw error;
  }

  return body;
};

const exchangeCodeForToken = async ({ clientId, clientSecret, code }) => {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const token = await parseGitHubResponse(response, 'GitHub token exchange failed');

  if (!token.access_token) {
    const error = new Error('GitHub did not return an access token');
    error.statusCode = 401;
    throw error;
  }

  return token.access_token;
};

const getAuthenticatedUser = async (accessToken) => {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
  });

  return parseGitHubResponse(response, 'Unable to load the GitHub user');
};

module.exports = { exchangeCodeForToken, getAuthenticatedUser };
