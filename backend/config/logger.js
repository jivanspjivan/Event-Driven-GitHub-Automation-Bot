const winston = require('winston');

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
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? winston.format.json() : developmentFormat,
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
