const pool = require('../db/pool');
const logger = require('../config/logger');
const workflowConfig = require('../config/workflows').githubAutomation;
const { getCredential } = require('./githubCredentialService');
const { triageIssue } = require('./githubIssueService');
const { sendIssueTriageNotification } = require('./slackNotificationService');
const { syncWorkflowDefinition, enqueueWorkflowJob } = require('./workflowService');

const isRuleApplicable = (rule, eventName, payloadAction) =>
  rule.action_type === 'record_event' ||
  (rule.action_type === 'triage_issue' && eventName === 'issues' && payloadAction === 'opened');

const captureAction = async (actionType, operation) => {
  try {
    await operation();
    return { actionType, status: 'completed' };
  } catch (error) {
    return { actionType, status: 'failed', errorMessage: String(error.message || error).slice(0, 1000) };
  }
};

const executeRule = async (rule, repository, payload, completedActions) => {
  if (rule.action_type === 'record_event') {
    return completedActions.has('record_event')
      ? []
      : [{ actionType: 'record_event', status: 'completed' }];
  }
  if (rule.action_type !== 'triage_issue') {
    return [{ actionType: rule.action_type, status: 'failed', errorMessage: `Unsupported action: ${rule.action_type}` }];
  }

  const issueNumber = Number(payload.issue?.number);
  const results = [];
  if (!completedActions.has('github_issue_triage')) {
    results.push(
      await captureAction('github_issue_triage', async () => {
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
      }),
    );
  }

  if (!completedActions.has('slack_notification')) {
    results.push(
      await captureAction('slack_notification', () =>
        sendIssueTriageNotification({
          repository: { fullName: repository.full_name },
          issue: {
            number: issueNumber,
            title: payload.issue?.title,
            reporter: payload.issue?.user?.login,
            htmlUrl: payload.issue?.html_url,
          },
          label: rule.configuration.label,
          assignee: rule.configuration.assignee,
        }),
      ),
    );
  }
  return results;
};

const enqueueDelivery = async ({ deliveryId, eventName, payload }) => {
  const workflow = await syncWorkflowDefinition(workflowConfig);
  const githubRepositoryId = payload.repository?.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const repositoryResult = githubRepositoryId
      ? await client.query('SELECT id FROM repositories WHERE github_repository_id = $1', [githubRepositoryId])
      : { rows: [] };
    const repositoryId = repositoryResult.rows[0]?.id || null;
    const deliveryResult = await client.query(
      `INSERT INTO webhook_deliveries (
         delivery_id, repository_id, event_name, action_name, payload, status
       ) VALUES ($1, $2, $3, $4, $5, 'unprocessed')
       ON CONFLICT (delivery_id) DO NOTHING
       RETURNING id`,
      [deliveryId, repositoryId, eventName, payload.action || null, payload],
    );
    if (deliveryResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return { duplicate: true, status: 'duplicate' };
    }
    const job = await enqueueWorkflowJob(client, workflow, deliveryResult.rows[0].id);
    await client.query('COMMIT');
    return {
      duplicate: false,
      status: 'unprocessed',
      workflowId: Number(workflow.workflow_id),
      jobId: Number(job.job_id),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const processWorkflowJob = async (job) => {
  const deliveryResult = await pool.query(
    `SELECT deliveries.*, repositories.owner_login, repositories.name AS repository_name,
            repositories.full_name
       FROM webhook_deliveries deliveries
       LEFT JOIN repositories ON repositories.id = deliveries.repository_id
      WHERE deliveries.id = $1`,
    [job.delivery_id],
  );
  const delivery = deliveryResult.rows[0];
  if (!delivery) return { status: 'failed', errorMessage: 'Webhook delivery no longer exists' };

  const rulesResult = delivery.repository_id
    ? await pool.query(
        `SELECT id, user_id, action_type, configuration
           FROM automation_rules
          WHERE repository_id = $1 AND event_name = $2 AND enabled = TRUE`,
        [delivery.repository_id, delivery.event_name],
      )
    : { rows: [], rowCount: 0 };
  const applicableRules = rulesResult.rows.filter((rule) =>
    isRuleApplicable(rule, delivery.event_name, delivery.action_name),
  );

  const resultMap = new Map(
    (delivery.action_results || []).map((result) => [result.actionType, result]),
  );
  const completedActions = new Set(
    [...resultMap.values()].filter((result) => result.status === 'completed').map((result) => result.actionType),
  );
  const repository = delivery.repository_id
    ? {
        owner_login: delivery.owner_login,
        name: delivery.repository_name,
        full_name: delivery.full_name,
      }
    : null;

  for (const rule of applicableRules) {
    const results = await executeRule(rule, repository, delivery.payload, completedActions);
    for (const result of results) {
      resultMap.set(result.actionType, result);
      if (result.status === 'completed') completedActions.add(result.actionType);
    }
  }

  const actionResults = [...resultMap.values()];
  const executedActionCount = actionResults.filter((result) => result.status === 'completed').length;
  const failedAction = actionResults.find((result) => result.status === 'failed');
  const errorMessage = failedAction?.errorMessage || null;
  await pool.query(
    `UPDATE webhook_deliveries
        SET matched_rule_count = $2, executed_action_count = $3,
            action_results = $4, error_message = $5
      WHERE id = $1`,
    [delivery.id, rulesResult.rowCount, executedActionCount, JSON.stringify(actionResults), errorMessage],
  );

  logger.info('Webhook workflow job processed', {
    jobId: Number(job.job_id),
    deliveryId: delivery.delivery_id,
    attemptCount: job.attempt_count,
    matchedRuleCount: rulesResult.rowCount,
    executedActionCount,
    failedAction: failedAction?.actionType,
  });
  return failedAction ? { status: 'failed', errorMessage } : { status: 'success' };
};

const listDeliveries = async (userId, limit = 50) => {
  const result = await pool.query(
    `SELECT deliveries.delivery_id, deliveries.event_name, deliveries.action_name,
            deliveries.status, deliveries.matched_rule_count, deliveries.executed_action_count,
            deliveries.error_message, deliveries.action_results, deliveries.received_at,
            deliveries.processed_at, jobs.job_id, jobs.attempt_count, jobs.max_retry_count,
            jobs.available_at AS next_attempt_at
       FROM webhook_deliveries deliveries
       JOIN user_repository_selections selections ON selections.repository_id = deliveries.repository_id
       LEFT JOIN workflow_jobs jobs ON jobs.delivery_id = deliveries.id
      WHERE selections.user_id = $1
      ORDER BY deliveries.received_at DESC
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
    actionResults: row.action_results,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
    jobId: row.job_id ? Number(row.job_id) : null,
    attemptCount: row.attempt_count,
    maxRetryCount: row.max_retry_count,
    nextAttemptAt: row.next_attempt_at,
  }));
};

module.exports = {
  captureAction,
  isRuleApplicable,
  enqueueDelivery,
  processWorkflowJob,
  listDeliveries,
};
