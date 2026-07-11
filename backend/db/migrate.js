const fs = require('fs/promises');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = require('./pool');

const migrate = async () => {
  const migrationsPath = path.join(__dirname, 'migrations');
  const migrationFiles = (await fs.readdir(migrationsPath))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  for (const fileName of migrationFiles) {
    const alreadyApplied = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [
      fileName,
    ]);
    if (alreadyApplied.rowCount > 0) continue;

    const migration = await fs.readFile(path.join(migrationsPath, fileName), 'utf8');
    await pool.query(migration);
    await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [fileName]);
    console.log(`Applied migration ${fileName}`);
  }

  console.log('PostgreSQL migrations completed');
};

migrate()
  .catch((error) => {
    console.error('PostgreSQL migration failed', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
