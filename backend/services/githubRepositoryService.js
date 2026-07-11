const GITHUB_API_VERSION = '2022-11-28';
const GITHUB_API_URL = 'https://api.github.com';

const githubRequest = async (accessToken, path) => {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || 'GitHub repository request failed');
    error.statusCode = response.status === 401 ? 401 : response.status === 404 ? 404 : 502;
    throw error;
  }

  return body;
};

const toRepository = (repository) => ({
  id: repository.id,
  name: repository.name,
  fullName: repository.full_name,
  owner: repository.owner.login,
  description: repository.description,
  private: repository.private,
  defaultBranch: repository.default_branch,
  htmlUrl: repository.html_url,
  updatedAt: repository.updated_at,
  permissions: repository.permissions || null,
});

const listRepositories = async (accessToken) => {
  const repositories = await githubRequest(
    accessToken,
    '/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
  );
  return repositories.map(toRepository);
};

const getRepository = async (accessToken, repositoryId) => {
  const repository = await githubRequest(accessToken, `/repositories/${repositoryId}`);
  return toRepository(repository);
};

module.exports = { listRepositories, getRepository };
