const crypto = require('crypto');

const GITHUB_API_VERSION = '2022-11-28';
const GITHUB_API_URL = 'https://api.github.com';
const REPOSITORY_CACHE_TTL_MS = 60_000;
const REPOSITORY_METADATA_CACHE_TTL_MS = 5 * 60_000;
const repositoryCache = new Map();
const repositoryMetadataCache = new Map();

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
  pushedAt: repository.pushed_at,
  permissions: repository.permissions || null,
});

const getRepositoryMetadata = async (accessToken, repository) => {
  const cacheKey = `${repository.id}:${repository.pushedAt || repository.updatedAt}`;
  const cached = repositoryMetadataCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.metadata;

  const repositoryPath = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  const [languagesResult, commitsResult] = await Promise.allSettled([
    githubRequest(accessToken, `${repositoryPath}/languages`),
    githubRequest(accessToken, `${repositoryPath}/commits?sha=${encodeURIComponent(repository.defaultBranch)}&per_page=1`),
  ]);
  const languages = languagesResult.status === 'fulfilled'
    ? Object.entries(languagesResult.value)
        .sort(([, firstBytes], [, secondBytes]) => secondBytes - firstBytes)
        .slice(0, 3)
        .map(([language]) => language)
    : [];
  const commit = commitsResult.status === 'fulfilled' ? commitsResult.value[0] : null;
  const metadata = {
    techStack: languages,
    latestCommit: commit
      ? {
          sha: commit.sha,
          message: commit.commit?.message?.split('\n')[0] || 'Commit details unavailable',
          author: commit.commit?.author?.name || commit.author?.login || 'Unknown author',
          committedAt: commit.commit?.author?.date || null,
          htmlUrl: commit.html_url,
        }
      : null,
  };

  repositoryMetadataCache.set(cacheKey, {
    metadata,
    expiresAt: Date.now() + REPOSITORY_METADATA_CACHE_TTL_MS,
  });
  return metadata;
};

const enrichRepositories = (accessToken, repositories) => Promise.all(
  repositories.map(async (repository) => ({
    ...repository,
    ...(await getRepositoryMetadata(accessToken, repository)),
  })),
);

const loadAllRepositories = async (accessToken, bypassCache = false) => {
  const cacheKey = crypto.createHash('sha256').update(accessToken).digest('hex');
  const cached = repositoryCache.get(cacheKey);
  if (!bypassCache && cached && cached.expiresAt > Date.now()) return cached.repositories;

  const repositories = [];
  let page = 1;
  while (true) {
    const pageRepositories = await githubRequest(
      accessToken,
      `/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
    );
    repositories.push(...pageRepositories.map(toRepository));
    if (pageRepositories.length < 100) break;
    page += 1;
  }

  repositoryCache.set(cacheKey, {
    repositories,
    expiresAt: Date.now() + REPOSITORY_CACHE_TTL_MS,
  });
  return repositories;
};

const paginateRepositories = (repositories, { search = '', page = 1, pageSize = 10 } = {}) => {
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? repositories.filter((repository) =>
        `${repository.fullName} ${repository.owner} ${repository.description || ''}`
          .toLowerCase()
          .includes(normalizedSearch),
      )
    : repositories;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;
  return {
    repositories: filtered.slice(offset, offset + pageSize),
    pagination: { page: currentPage, pageSize, totalItems, totalPages },
  };
};

const listRepositories = async (accessToken, options = {}) => {
  const repositories = await loadAllRepositories(accessToken, options.bypassCache);
  const result = paginateRepositories(repositories, options);
  return {
    ...result,
    repositories: await enrichRepositories(accessToken, result.repositories),
  };
};

const getRepository = async (accessToken, repositoryId) => {
  const repository = await githubRequest(accessToken, `/repositories/${repositoryId}`);
  return toRepository(repository);
};

module.exports = { listRepositories, getRepository, paginateRepositories };
