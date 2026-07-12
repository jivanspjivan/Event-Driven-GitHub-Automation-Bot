const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const { required } = require('../config/env');
const pool = require('../db/pool');

const PostgreSqlStore = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === 'production';

const sessionMiddleware = session({
  name: 'github_automation.sid',
  secret: required('SESSION_SECRET'),
  store: new PostgreSqlStore({
    pool,
    tableName: 'session',
    createTableIfMissing: false,
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  },
});

module.exports = sessionMiddleware;
