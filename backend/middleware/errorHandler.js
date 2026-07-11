const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const requestedStatus = err.statusCode || err.status;
  const statusCode =
    Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus < 600
      ? requestedStatus
      : 500;

  const response = {
    status: 'error',
    traceId: req.traceId,
    message:
      statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  const requestLog = req.log;
  if (requestLog) {
    requestLog.error('Request failed', {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      errorMessage: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
