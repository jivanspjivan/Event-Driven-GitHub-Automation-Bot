const test = require('node:test');
const assert = require('node:assert/strict');
const { paginateRepositories } = require('../services/githubRepositoryService');

const repositories = [
  { fullName: 'octocat/api', owner: 'octocat', description: 'Backend service' },
  { fullName: 'octocat/web', owner: 'octocat', description: 'Frontend application' },
  { fullName: 'acme/worker', owner: 'acme', description: 'Background API jobs' },
];

test('searches the complete repository set before pagination', () => {
  const result = paginateRepositories(repositories, { search: 'api', page: 1, pageSize: 1 });
  assert.equal(result.pagination.totalItems, 2);
  assert.equal(result.pagination.totalPages, 2);
  assert.equal(result.repositories[0].fullName, 'octocat/api');

  const secondPage = paginateRepositories(repositories, { search: 'api', page: 2, pageSize: 1 });
  assert.equal(secondPage.repositories[0].fullName, 'acme/worker');
});
