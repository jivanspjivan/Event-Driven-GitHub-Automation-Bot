const { Pool } = require('pg');
const { required } = require('../config/env');

const pool = new Pool({
  connectionString: required('DATABASE_URL'),
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error);
});

module.exports = pool;
