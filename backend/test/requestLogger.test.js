const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const logger = require('../config/logger');
const requestLogger = require('../middleware/requestLogger');

test('adds one trace ID to the request and response', () => {
  logger.silent = true;
  const req = { method: 'GET', originalUrl: '/health' };
  const res = new EventEmitter();
  res.statusCode = 200;
  res.writableEnded = true;
  res.setHeader = (name, value) => {
    res.headers = { ...res.headers, [name]: value };
  };

  let nextCalled = false;
  requestLogger(req, res, () => {
    nextCalled = true;
  });
  res.emit('finish');

  assert.equal(nextCalled, true);
  assert.match(req.traceId, /^[0-9a-f-]{36}$/);
  assert.equal(res.headers['X-Trace-Id'], req.traceId);
  assert.equal(req.log, undefined);
  logger.silent = false;
});
