/**
 * Wraps async route handlers so errors propagate to Express error handler.
 * Eliminates try/catch boilerplate in every route.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
