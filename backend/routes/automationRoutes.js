const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  getRules,
  createRule,
  updateRule,
  deleteRule,
} = require('../controllers/automationController');

const router = express.Router();

router.use(requireAuth);
router.get('/', getRules);
router.post('/', createRule);
router.patch('/:ruleId', updateRule);
router.delete('/:ruleId', deleteRule);

module.exports = router;
