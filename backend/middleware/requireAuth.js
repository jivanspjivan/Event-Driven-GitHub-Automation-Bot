const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
  }

  return next();
};

module.exports = requireAuth;
