/**
 * Global error-handling middleware.
 * Must be registered LAST (after all routes) in server.js.
 */
module.exports = function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err.stack || err.message || err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ msg: messages.join(', ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({ msg: 'Duplicate field value entered' });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ msg: 'Resource not found' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ msg: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ msg: 'Token expired' });
  }

  res.status(err.statusCode || 500).json({
    msg: err.message || 'Internal server error'
  });
};
