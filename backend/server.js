const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const logger = require('./config/logger');
const { processWorkflowJob } = require('./services/webhookService');
const { startRetryWorkflow, stopRetryWorkflow } = require('./workers/retryWorkflow');

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const server = app.listen(PORT, () => {
  logger.info('Server started', { port: Number(PORT), environment: process.env.NODE_ENV });
  startRetryWorkflow(processWorkflowJob).catch((error) =>
    logger.error('Unable to start retry workflow', { errorMessage: error.message, stack: error.stack }),
  );
});

const shutdown = (signal) => {
  logger.info('Server shutdown requested', { signal });
  stopRetryWorkflow();
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
