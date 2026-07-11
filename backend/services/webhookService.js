const pool = require('../db/pool');

const processDelivery = async ({ deliveryId, eventName, payload }) => {
  const githubRepositoryId = payload.repository?.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const repositoryResult = githubRepositoryId
      ? await client.query('SELECT id FROM repositories WHERE github_repository_id = $1', [
          githubRepositoryId,
        ])
      : { rows: [] };
    const repositoryId = repositoryResult.rows[0]?.id || null;

    const deliveryResult = await client.query(
      `INSERT INTO webhook_deliveries (
         delivery_id, repository_id, event_name, action_name, payload, status
       ) VALUES ($1, $2, $3, $4, $5, 'received')
       ON CONFLICT (delivery_id) DO NOTHING
       RETURNING id`,
      [deliveryId, repositoryId, eventName, payload.action || null, payload],
    );

    if (deliveryResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return { duplicate: true, matchedRuleCount: 0 };
    }

    const rulesResult = repositoryId
      ? await client.query(
          `SELECT id
             FROM automation_rules
            WHERE repository_id = $1 AND event_name = $2 AND enabled = TRUE`,
          [repositoryId, eventName],
        )
      : { rowCount: 0 };
    const matchedRuleCount = rulesResult.rowCount;
    const status = matchedRuleCount > 0 ? 'processed' : 'ignored';

    await client.query(
      `UPDATE webhook_deliveries
          SET status = $2, matched_rule_count = $3, processed_at = NOW()
        WHERE id = $1`,
      [deliveryResult.rows[0].id, status, matchedRuleCount],
    );
    await client.query('COMMIT');
    return { duplicate: false, matchedRuleCount, status };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listDeliveries = async (userId, limit = 50) => {
  const result = await pool.query(
    `SELECT webhook_deliveries.delivery_id, webhook_deliveries.event_name,
            webhook_deliveries.action_name, webhook_deliveries.status,
            webhook_deliveries.matched_rule_count, webhook_deliveries.received_at,
            webhook_deliveries.processed_at
       FROM webhook_deliveries
       JOIN user_repository_selections
         ON user_repository_selections.repository_id = webhook_deliveries.repository_id
      WHERE user_repository_selections.user_id = $1
      ORDER BY webhook_deliveries.received_at DESC
      LIMIT $2`,
    [userId, limit],
  );
  return result.rows.map((row) => ({
    deliveryId: row.delivery_id,
    eventName: row.event_name,
    actionName: row.action_name,
    status: row.status,
    matchedRuleCount: row.matched_rule_count,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
  }));
};

module.exports = { processDelivery, listDeliveries };
