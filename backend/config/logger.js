const winston = require('winston');
const { AsyncLocalStorage } = require('node:async_hooks');

const logContext = new AsyncLocalStorage();

const addContext = winston.format((info) => {
  const context = logContext.getStore();
  if (context?.traceId && !info.traceId) info.traceId = context.traceId;
  return info;
});

const developmentFormat = winston.format.printf(
  ({ timestamp, level, message, traceId, ...metadata }) => {
    const trace = traceId ? ` traceId=${traceId}` : '';
    const details = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
    return `${timestamp} ${level}${trace} ${message}${details}`;
  },
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  defaultMeta: { service: 'github-automation-backend' },
  format: winston.format.combine(
    addContext(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? winston.format.json() : developmentFormat,
  ),
  transports: [new winston.transports.Console()],
});

logger.withContext = (context, callback) => logContext.run(context, callback);

module.exports = logger;
