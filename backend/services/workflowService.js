const pool = require('../db/pool');

const syncWorkflowDefinition = async (config) => {
  const result = await pool.query(
    `INSERT INTO workflow_definitions (
       workflow_key, is_enabled, cron_expression, retry_count, lookback_minutes,
       stale_running_minutes, batch_size
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (workflow_key) DO UPDATE SET
       is_enabled = EXCLUDED.is_enabled,
       cron_expression = EXCLUDED.cron_expression,
       retry_count = EXCLUDED.retry_count,
       lookback_minutes = EXCLUDED.lookback_minutes,
       stale_running_minutes = EXCLUDED.stale_running_minutes,
       batch_size = EXCLUDED.batch_size,
       updated_at = NOW()
     RETURNING *`,
    [
      config.key,
      config.enabled,
      config.cronExpression,
      config.retryCount,
      config.lookbackMinutes,
      config.staleRunningMinutes,
      config.batchSize,
    ],
  );
  return result.rows[0];
};

const enqueueWorkflowJob = async (client, workflow, deliveryId) => {
  const result = await client.query(
    `INSERT INTO workflow_jobs (workflow_id, delivery_id, max_retry_count)
     VALUES ($1, $2, $3)
     ON CONFLICT (delivery_id) DO NOTHING
     RETURNING job_id, status`,
    [workflow.workflow_id, deliveryId, workflow.retry_count],
  );
  return result.rows[0] || null;
};

const claimWorkflowJobs = async (workflow) => {
  const lookbackStart = new Date(Date.now() - workflow.lookback_minutes * 60_000);
  const lastRunAt = workflow.last_run_at ? new Date(workflow.last_run_at) : null;
  const windowStart = lastRunAt && lastRunAt > lookbackStart ? lastRunAt : lookbackStart;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `WITH recovered AS (
         UPDATE workflow_jobs
            SET status = 'unprocessed', locked_at = NULL, available_at = NOW(),
                last_error = COALESCE(last_error, 'Recovered stale running job'), updated_at = NOW()
          WHERE workflow_id = $1
            AND status = 'running'
            AND locked_at <= NOW() - ($2 * INTERVAL '1 minute')
          RETURNING delivery_id
       )
       UPDATE webhook_deliveries
          SET status = 'unprocessed'
        WHERE id IN (SELECT delivery_id FROM recovered)`,
      [workflow.workflow_id, workflow.stale_running_minutes],
    );

    const result = await client.query(
      `WITH candidates AS (
         SELECT job_id
           FROM workflow_jobs
          WHERE workflow_id = $1
            AND status = 'unprocessed'
            AND available_at <= NOW()
          ORDER BY CASE WHEN updated_at >= $3 THEN 0 ELSE 1 END, available_at, created_at
          FOR UPDATE SKIP LOCKED
          LIMIT $2
       ), claimed AS (
         UPDATE workflow_jobs jobs
            SET status = 'running', attempt_count = attempt_count + 1,
                locked_at = NOW(), updated_at = NOW()
           FROM candidates
          WHERE jobs.job_id = candidates.job_id
          RETURNING jobs.*
       )
       UPDATE webhook_deliveries deliveries
          SET status = 'running'
         FROM claimed
        WHERE deliveries.id = claimed.delivery_id
       RETURNING claimed.*`,
      [workflow.workflow_id, workflow.batch_size, windowStart],
    );

    await client.query(
      'UPDATE workflow_definitions SET last_run_at = NOW(), updated_at = NOW() WHERE workflow_id = $1',
      [workflow.workflow_id],
    );
    await client.query('COMMIT');
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const retryDelayMinutes = (attemptCount) => Math.min(2 ** Math.max(attemptCount - 1, 0), 30);

const getWorkflowTransition = (job, result) => {
  const succeeded = result.status === 'success';
  const retryAvailable = !succeeded && job.attempt_count <= job.max_retry_count;
  const jobStatus = succeeded ? 'success' : retryAvailable ? 'unprocessed' : 'failed';
  const deliveryStatus = succeeded ? 'success' : retryAvailable ? 'unprocessed' : 'failed';
  const delayMinutes = retryAvailable ? retryDelayMinutes(job.attempt_count) : 0;
  return { jobStatus, deliveryStatus, retryAvailable, delayMinutes };
};

const finishWorkflowJob = async (job, result) => {
  const transition = getWorkflowTransition(job, result);
  const { jobStatus, deliveryStatus, retryAvailable, delayMinutes } = transition;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE workflow_jobs
          SET status = $2, available_at = NOW() + ($3 * INTERVAL '1 minute'),
              locked_at = NULL, last_error = $4, updated_at = NOW(),
              completed_at = CASE WHEN $2 IN ('success', 'failed') THEN NOW() ELSE NULL END
        WHERE job_id = $1`,
      [job.job_id, jobStatus, delayMinutes, result.errorMessage || null],
    );
    await client.query(
      `UPDATE webhook_deliveries
          SET status = $2, error_message = $3,
              processed_at = CASE WHEN $2 IN ('success', 'failed') THEN NOW() ELSE NULL END
        WHERE id = $1`,
      [job.delivery_id, deliveryStatus, result.errorMessage || null],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return transition;
};

const runWorkflow = async (workflow, processor) => {
  const jobs = await claimWorkflowJobs(workflow);
  const outcomes = [];
  for (const job of jobs) {
    let result;
    try {
      result = await processor(job);
    } catch (error) {
      result = { status: 'failed', errorMessage: String(error.message || error).slice(0, 1000) };
    }
    outcomes.push({ job, result, transition: await finishWorkflowJob(job, result) });
  }
  return outcomes;
};

module.exports = {
  syncWorkflowDefinition,
  enqueueWorkflowJob,
  claimWorkflowJobs,
  retryDelayMinutes,
  getWorkflowTransition,
  finishWorkflowJob,
  runWorkflow,
};
