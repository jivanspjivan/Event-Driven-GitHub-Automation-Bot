const express = require('express');
const { receiveGitHubWebhook } = require('../controllers/webhookController');

const router = express.Router();

router.post('/', receiveGitHubWebhook);

module.exports = router;
