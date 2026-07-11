const pool = require('../db/pool');

const toRepository = (row) =>
  row
    ? {
        id: Number(row.github_repository_id),
        name: row.name,
        fullName: row.full_name,
        owner: row.owner_login,
        description: row.description,
        private: row.is_private,
        defaultBranch: row.default_branch,
        htmlUrl: row.html_url,
        updatedAt: row.github_updated_at,
        permissions: row.permissions,
      }
    : null;

const getSelectedRepository = async (userId) => {
  const result = await pool.query(
    `SELECT repositories.*
       FROM user_repository_selections
       JOIN repositories ON repositories.id = user_repository_selections.repository_id
      WHERE user_repository_selections.user_id = $1`,
    [userId],
  );
  return toRepository(result.rows[0]);
};

const saveSelectedRepository = async (userId, repository) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const repositoryResult = await client.query(
      `INSERT INTO repositories (
         github_repository_id, owner_login, name, full_name, description, is_private,
         default_branch, html_url, permissions, github_updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (github_repository_id) DO UPDATE SET
         owner_login = EXCLUDED.owner_login,
         name = EXCLUDED.name,
         full_name = EXCLUDED.full_name,
         description = EXCLUDED.description,
         is_private = EXCLUDED.is_private,
         default_branch = EXCLUDED.default_branch,
         html_url = EXCLUDED.html_url,
         permissions = EXCLUDED.permissions,
         github_updated_at = EXCLUDED.github_updated_at,
         updated_at = NOW()
       RETURNING id`,
      [
        repository.id,
        repository.owner,
        repository.name,
        repository.fullName,
        repository.description,
        repository.private,
        repository.defaultBranch,
        repository.htmlUrl,
        repository.permissions,
        repository.updatedAt,
      ],
    );

    await client.query(
      `INSERT INTO user_repository_selections (user_id, repository_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET
         repository_id = EXCLUDED.repository_id,
         selected_at = NOW()`,
      [userId, repositoryResult.rows[0].id],
    );
    await client.query('COMMIT');
    return repository;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const clearSelectedRepository = async (userId) => {
  await pool.query('DELETE FROM user_repository_selections WHERE user_id = $1', [userId]);
};

module.exports = { getSelectedRepository, saveSelectedRepository, clearSelectedRepository };
