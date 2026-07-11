const pool = require('../db/pool');

const toRule = (row) => ({
  id: Number(row.id),
  eventName: row.event_name,
  actionType: row.action_type,
  configuration: row.configuration,
  enabled: row.enabled,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listRules = async (userId) => {
  const result = await pool.query(
    `SELECT automation_rules.*
       FROM automation_rules
       JOIN user_repository_selections
         ON user_repository_selections.repository_id = automation_rules.repository_id
        AND user_repository_selections.user_id = automation_rules.user_id
      WHERE automation_rules.user_id = $1
      ORDER BY automation_rules.created_at DESC`,
    [userId],
  );
  return result.rows.map(toRule);
};

const createRule = async (userId, { eventName, configuration }) => {
  try {
    const result = await pool.query(
      `INSERT INTO automation_rules (
         user_id, repository_id, event_name, action_type, configuration
       )
       SELECT $1, repository_id, $2, 'record_event', $3
         FROM user_repository_selections
        WHERE user_id = $1
       RETURNING *`,
      [userId, eventName, configuration],
    );

    if (result.rowCount === 0) {
      const error = new Error('Select a repository before creating an automation rule');
      error.statusCode = 409;
      throw error;
    }
    return toRule(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      error.statusCode = 409;
      error.message = `A ${eventName} rule already exists for the selected repository`;
    }
    throw error;
  }
};

const updateRule = async (userId, ruleId, { enabled, configuration }) => {
  const result = await pool.query(
    `UPDATE automation_rules
        SET enabled = COALESCE($3, enabled),
            configuration = COALESCE($4, configuration),
            updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
    [ruleId, userId, enabled, configuration],
  );
  return result.rows[0] ? toRule(result.rows[0]) : null;
};

const deleteRule = async (userId, ruleId) => {
  const result = await pool.query('DELETE FROM automation_rules WHERE id = $1 AND user_id = $2', [
    ruleId,
    userId,
  ]);
  return result.rowCount > 0;
};

module.exports = { listRules, createRule, updateRule, deleteRule };
