const cron = require('node-cron');
const logger = require('../config/logger');
const workflowConfig = require('../config/workflows').githubAutomation;
const { syncWorkflowDefinition, runWorkflow } = require('../services/workflowService');

let scheduledTask;
let running = false;

const executeRetryWorkflow = async (processor) => {
  if (running) {
    logger.warn('Retry workflow skipped because the previous run is active');
    return [];
  }
  running = true;
  try {
    const workflow = await syncWorkflowDefinition(workflowConfig);
    if (!workflow.is_enabled) return [];
    const outcomes = await runWorkflow(workflow, processor);
    logger.info('Retry workflow completed', {
      workflowId: workflow.workflow_id,
      claimedJobCount: outcomes.length,
      successCount: outcomes.filter(({ transition }) => transition.jobStatus === 'success').length,
      retryCount: outcomes.filter(({ transition }) => transition.retryAvailable).length,
      failedCount: outcomes.filter(({ transition }) => transition.jobStatus === 'failed').length,
    });
    return outcomes;
  } finally {
    running = false;
  }
};

const startRetryWorkflow = async (processor) => {
  if (!cron.validate(workflowConfig.cronExpression)) {
    throw new Error('RETRY_WORKFLOW_CRON is not a valid cron expression');
  }
  const workflow = await syncWorkflowDefinition(workflowConfig);
  if (!workflow.is_enabled) {
    logger.info('Retry workflow is disabled', { workflowId: workflow.workflow_id });
    return null;
  }
  scheduledTask = cron.schedule(workflow.cron_expression, () =>
    executeRetryWorkflow(processor).catch((error) =>
      logger.error('Retry workflow failed', { errorMessage: error.message, stack: error.stack }),
    ),
  );
  setImmediate(() =>
    executeRetryWorkflow(processor).catch((error) =>
      logger.error('Initial retry workflow failed', { errorMessage: error.message, stack: error.stack }),
    ),
  );
  logger.info('Retry workflow scheduled', {
    workflowId: workflow.workflow_id,
    cronExpression: workflow.cron_expression,
    retryCount: workflow.retry_count,
  });
  return scheduledTask;
};

const stopRetryWorkflow = () => scheduledTask?.stop();

module.exports = { executeRetryWorkflow, startRetryWorkflow, stopRetryWorkflow };
