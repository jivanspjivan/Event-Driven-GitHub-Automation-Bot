const crypto = require('crypto');
const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const traceId = crypto.randomUUID();
  const startedAt = new Date();
  const startedAtNs = process.hrtime.bigint();

  req.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);

  logger.withContext({ traceId }, () => {
    logger.info('Request started', {
      method: req.method,
      path: req.originalUrl,
      startedAt: startedAt.toISOString(),
    });

    res.once('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAtNs) / 1e6;
      logger.info('Request completed', {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      });
    });

    res.once('close', () => {
      if (res.writableEnded) return;
      const durationMs = Number(process.hrtime.bigint() - startedAtNs) / 1e6;
      logger.warn('Request connection closed before completion', {
        method: req.method,
        path: req.originalUrl,
        durationMs: Number(durationMs.toFixed(2)),
      });
    });

    next();
  });
};

module.exports = requestLogger;
