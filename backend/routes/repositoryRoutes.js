const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  getRepositories,
  selectRepository,
  clearRepositorySelection,
} = require('../controllers/repositoryController');

const router = express.Router();

router.use(requireAuth);
router.get('/', getRepositories);
router.put('/selection', selectRepository);
router.delete('/selection', clearRepositorySelection);

module.exports = router;
