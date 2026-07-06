/**
 * Input validation middleware for SafeHer API routes.
 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ msg: 'Name is required' });
  }
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ msg: 'A valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });
  }

  // Sanitize
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ msg: 'A valid email is required' });
  }
  if (!password) {
    return res.status(400).json({ msg: 'Password is required' });
  }

  req.body.email = email.trim().toLowerCase();

  next();
};
