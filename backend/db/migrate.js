const fs = require('fs/promises');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = require('./pool');

const migrate = async () => {
  const migrationPath = path.join(__dirname, 'migrations', '001_initial.sql');
  const migration = await fs.readFile(migrationPath, 'utf8');
  await pool.query(migration);
  console.log('PostgreSQL migration completed');
};

migrate()
  .catch((error) => {
    console.error('PostgreSQL migration failed', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
