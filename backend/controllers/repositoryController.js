const {
  listRepositories,
  getRepository,
} = require('../services/githubRepositoryService');

const saveSession = (req) =>
  new Promise((resolve, reject) => req.session.save((error) => (error ? reject(error) : resolve())));

const getRepositories = async (req, res) => {
  const repositories = await listRepositories(req.session.githubAccessToken);
  res.status(200).json({ repositories, selectedRepository: req.session.selectedRepository || null });
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
  req.session.selectedRepository = repository;
  await saveSession(req);

  return res.status(200).json({ selectedRepository: repository });
};

const clearRepositorySelection = async (req, res) => {
  delete req.session.selectedRepository;
  await saveSession(req);
  res.status(204).send();
};

module.exports = { getRepositories, selectRepository, clearRepositorySelection };
