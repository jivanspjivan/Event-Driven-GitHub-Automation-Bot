const pool = require('../db/pool');

const upsertUser = async (githubUser) => {
  const result = await pool.query(
    `INSERT INTO users (github_id, login, name, avatar_url, profile_url)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (github_id) DO UPDATE SET
       login = EXCLUDED.login,
       name = EXCLUDED.name,
       avatar_url = EXCLUDED.avatar_url,
       profile_url = EXCLUDED.profile_url,
       updated_at = NOW()
     RETURNING id, github_id, login, name, avatar_url, profile_url`,
    [
      githubUser.id,
      githubUser.login,
      githubUser.name,
      githubUser.avatar_url,
      githubUser.html_url,
    ],
  );

  return result.rows[0];
};

module.exports = { upsertUser };
