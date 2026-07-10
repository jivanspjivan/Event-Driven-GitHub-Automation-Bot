const express = require('express');
const {
  githubLogin,
  githubCallback,
  getCurrentUser,
  logout,
} = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', requireAuth, logout);

module.exports = router;
