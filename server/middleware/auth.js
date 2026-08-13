const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication token required', 401);
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return errorResponse(res, 'User not found', 401);
    }
    req.user = user;
    next();
  } catch {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};

module.exports = authenticate;
