const pool = require('../db/pool');
const { getCredential } = require('./githubCredentialService');
const { triageIssue } = require('./githubIssueService');

const isRuleApplicable = (rule, eventName, payloadAction) =>
  rule.action_type === 'record_event' ||
  (rule.action_type === 'triage_issue' && eventName === 'issues' && payloadAction === 'opened');

const executeRule = async (rule, repository, payload) => {
  if (rule.action_type === 'record_event') return;
  if (rule.action_type !== 'triage_issue') throw new Error(`Unsupported action: ${rule.action_type}`);

  const issueNumber = Number(payload.issue?.number);
  if (!Number.isSafeInteger(issueNumber) || issueNumber <= 0) {
    throw new Error('GitHub issues webhook did not include a valid issue number');
  }
  const accessToken = await getCredential(rule.user_id);
  if (!accessToken) throw new Error('GitHub automation credential is unavailable; sign in again');

  await triageIssue({
    accessToken,
    owner: repository.owner_login,
    repository: repository.name,
    issueNumber,
    label: rule.configuration.label,
    assignee: rule.configuration.assignee,
  });
};

const processDelivery = async ({ deliveryId, eventName, payload }) => {
  const githubRepositoryId = payload.repository?.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const repositoryResult = githubRepositoryId
      ? await client.query('SELECT * FROM repositories WHERE github_repository_id = $1', [
          githubRepositoryId,
        ])
      : { rows: [] };
    const repository = repositoryResult.rows[0] || null;
    const repositoryId = repository?.id || null;

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
          `SELECT id, user_id, action_type, configuration
             FROM automation_rules
            WHERE repository_id = $1 AND event_name = $2 AND enabled = TRUE`,
          [repositoryId, eventName],
        )
      : { rowCount: 0 };
    const matchedRuleCount = rulesResult.rowCount;
    await client.query('COMMIT');

    const applicableRules = rulesResult.rows.filter((rule) =>
      isRuleApplicable(rule, eventName, payload.action),
    );
    let executedActionCount = 0;
    let actionError = null;
    for (const rule of applicableRules) {
      try {
        await executeRule(rule, repository, payload);
        executedActionCount += 1;
      } catch (error) {
        actionError = error;
        break;
      }
    }

    const status = actionError ? 'failed' : executedActionCount > 0 ? 'completed' : 'ignored';
    const errorMessage = actionError?.message?.slice(0, 1000) || null;
    await pool.query(
      `UPDATE webhook_deliveries
          SET status = $2, matched_rule_count = $3, executed_action_count = $4,
              error_message = $5, processed_at = NOW()
        WHERE id = $1`,
      [deliveryResult.rows[0].id, status, matchedRuleCount, executedActionCount, errorMessage],
    );
    return { duplicate: false, matchedRuleCount, executedActionCount, status, errorMessage };
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
            webhook_deliveries.matched_rule_count, webhook_deliveries.executed_action_count,
            webhook_deliveries.error_message, webhook_deliveries.received_at,
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
    executedActionCount: row.executed_action_count,
    errorMessage: row.error_message,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
  }));
};

module.exports = { isRuleApplicable, processDelivery, listDeliveries };
