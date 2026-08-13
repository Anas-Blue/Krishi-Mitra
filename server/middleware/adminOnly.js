const { errorResponse } = require('../utils/response');

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return errorResponse(res, 'Admin access required', 403);
  }
  next();
};

module.exports = adminOnly;
