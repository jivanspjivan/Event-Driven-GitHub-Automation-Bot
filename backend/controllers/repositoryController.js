const {
  listRepositories,
  getRepository,
} = require('../services/githubRepositoryService');
const {
  getSelectedRepository,
  saveSelectedRepository,
  clearSelectedRepository,
} = require('../services/repositorySelectionService');

const getRepositories = async (req, res) => {
  const [repositories, selectedRepository] = await Promise.all([
    listRepositories(req.session.githubAccessToken),
    getSelectedRepository(req.session.user.databaseId),
  ]);
  res.status(200).json({ repositories, selectedRepository });
};

const selectRepository = async (req, res) => {
  const repositoryId = Number(req.body.repositoryId);
  if (!Number.isSafeInteger(repositoryId) || repositoryId <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'A valid repositoryId is required',
    });
  }

  // Fetching by ID verifies that the authenticated GitHub user can access it.
  const repository = await getRepository(req.session.githubAccessToken, repositoryId);
  await saveSelectedRepository(req.session.user.databaseId, repository);

  return res.status(200).json({ selectedRepository: repository });
};

const clearRepositorySelection = async (req, res) => {
  await clearSelectedRepository(req.session.user.databaseId);
  res.status(204).send();
};

module.exports = { getRepositories, selectRepository, clearRepositorySelection };
