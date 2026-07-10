const session = require('express-session');
const { required } = require('../config/env');

const sessionMiddleware = session({
  name: 'github_automation.sid',
  secret: required('SESSION_SECRET'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
});

module.exports = sessionMiddleware;
