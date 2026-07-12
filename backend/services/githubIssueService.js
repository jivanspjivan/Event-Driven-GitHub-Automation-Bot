const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2026-03-10';

const githubRequest = async (accessToken, path, options = {}) => {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(15_000),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
      ...options.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.message || 'GitHub issue automation request failed');
    error.statusCode = 502;
    error.githubStatusCode = response.status;
    throw error;
  }
  return body;
};

const triageIssue = async ({ accessToken, owner, repository, issueNumber, label, assignee }) => {
  const repositoryPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;
  const encodedAssignee = encodeURIComponent(assignee);

  await githubRequest(accessToken, `${repositoryPath}/assignees/${encodedAssignee}`);
  await githubRequest(accessToken, `${repositoryPath}/issues/${issueNumber}/labels`, {
    method: 'POST',
    body: JSON.stringify({ labels: [label] }),
  });
  await githubRequest(accessToken, `${repositoryPath}/issues/${issueNumber}/assignees`, {
    method: 'POST',
    body: JSON.stringify({ assignees: [assignee] }),
  });
};

module.exports = { triageIssue };
