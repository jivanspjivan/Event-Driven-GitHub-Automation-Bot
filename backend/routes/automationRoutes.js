const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
  getRules,
  getDeliveries,
  createRule,
  updateRule,
  deleteRule,
} = require('../controllers/automationController');

const router = express.Router();

router.use(requireAuth);
router.get('/', getRules);
router.get('/deliveries', getDeliveries);
router.post('/', createRule);
router.patch('/:ruleId', updateRule);
router.delete('/:ruleId', deleteRule);

module.exports = router;
