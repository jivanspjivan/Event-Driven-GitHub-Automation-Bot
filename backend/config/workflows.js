const positiveInteger = (name, fallback) => {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
};

const nonNegativeInteger = (name, fallback) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
};

module.exports = {
  githubAutomation: {
    key: 'github_automation',
    enabled: process.env.RETRY_WORKFLOW_ENABLED !== 'false',
    cronExpression: process.env.RETRY_WORKFLOW_CRON || '* * * * *',
    retryCount: nonNegativeInteger('RETRY_WORKFLOW_COUNT', 3),
    lookbackMinutes: positiveInteger('RETRY_WORKFLOW_LOOKBACK_MINUTES', 30),
    staleRunningMinutes: positiveInteger('RETRY_WORKFLOW_STALE_MINUTES', 30),
    batchSize: positiveInteger('RETRY_WORKFLOW_BATCH_SIZE', 20),
  },
};
