const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ── OTP helpers ──────────────────────────────────────────────────────────────
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function getMailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

async function sendOtpEmail(email, name, otp) {
  const transporter = getMailTransporter();
  await transporter.sendMail({
    from: `"SafeHer" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'SafeHer — Verify Your Email',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#0d1628;border-radius:16px;color:#f1f5f9;">
        <h2 style="color:#fb7185;margin-bottom:8px;">Email Verification</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Welcome to SafeHer! Use the code below to verify your email address:</p>
        <div style="margin:24px 0;text-align:center;">
          <span style="display:inline-block;padding:16px 32px;background:linear-gradient(to right,#fb7185,#a855f7);color:#fff;font-size:32px;font-weight:bold;letter-spacing:12px;border-radius:12px;">
            ${otp}
          </span>
        </div>
        <p style="font-size:13px;color:#94a3b8;">This code expires in <strong>10 minutes</strong>. If you did not create an account, you can safely ignore this email.</p>
        <hr style="border-color:#1e293b;margin:24px 0;" />
        <p style="font-size:12px;color:#64748b;">SafeHer · Emergency Safety Platform</p>
      </div>`,
  });
}

// ── Shared cookie options ────────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,                                      // JS cannot read this cookie
  secure: process.env.NODE_ENV === 'production',       // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,                   // 7 days in ms
};

// ── Helper: sign token + set cookie + respond ────────────────────────────────
function signAndRespond(res, userId, extraData = {}) {
  const payload = { user: { id: userId } };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ msg: 'ok', ...extraData });
}

// ── In-memory store for pending registrations (not yet verified) ─────────────
// Key: email (lowercase), Value: { name, email, phone, hashedPassword, otpHash, otpExpires }
const pendingRegistrations = new Map();

// Auto-cleanup expired pending registrations every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingRegistrations) {
    if (data.otpExpires < now) pendingRegistrations.delete(email);
  }
}, 15 * 60 * 1000);

// ── REGISTER ─────────────────────────────────────────────────────────────────
// Does NOT create the user in DB. Stores data in memory + sends OTP.
// Account is only created after successful OTP verification.
exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    // Check if a verified account already exists with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();

    // Store in memory (overwrites any previous pending registration for same email)
    pendingRegistrations.set(email.toLowerCase(), {
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      hashedPassword,
      otpHash: hashOtp(otp),
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 min
    });

    await sendOtpEmail(email, name, otp);
    res.json({ msg: 'OTP sent to your email', email });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── VERIFY OTP ───────────────────────────────────────────────────────────────
// Validates OTP against in-memory store, then creates the user in DB.
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ msg: 'Email and OTP are required' });

  try {
    const key = email.toLowerCase();
    const pending = pendingRegistrations.get(key);

    if (!pending) {
      return res.status(404).json({ msg: 'No pending registration found. Please register again.' });
    }

    // Check expiry
    if (pending.otpExpires < Date.now()) {
      pendingRegistrations.delete(key);
      return res.status(400).json({ msg: 'OTP has expired. Please register again.' });
    }

    // Compare hashed OTP
    if (hashOtp(otp) !== pending.otpHash) {
      return res.status(400).json({ msg: 'Invalid OTP. Please try again.' });
    }

    // Double-check no one created this account in the meantime
    const existingUser = await User.findOne({ email: key });
    if (existingUser) {
      pendingRegistrations.delete(key);
      return res.status(400).json({ msg: 'An account with this email already exists' });
    }

    // ✅ OTP valid — NOW create the user in DB
    const user = new User({
      name: pending.name,
      email: pending.email,
      password: pending.hashedPassword,
      phone: pending.phone,
    });
    await user.save();

    // Clean up pending store
    pendingRegistrations.delete(key);

    // Auto-login after verification
    signAndRespond(res, user.id, { name: user.name, email: user.email });
  } catch (err) {
    console.error('verifyOtp error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── RESEND OTP ───────────────────────────────────────────────────────────────
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Email is required' });

  try {
    const key = email.toLowerCase();
    const pending = pendingRegistrations.get(key);

    if (!pending) {
      return res.status(404).json({ msg: 'No pending registration found. Please register again.' });
    }

    const otp = generateOtp();
    pending.otpHash = hashOtp(otp);
    pending.otpExpires = Date.now() + 10 * 60 * 1000;

    await sendOtpEmail(email, pending.name, otp);
    res.json({ msg: 'New OTP sent to your email' });
  } catch (err) {
    console.error('resendOtp error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    signAndRespond(res, user.id, { name: user.name, email: user.email });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── LOGOUT ───────────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  const { maxAge, ...clearOpts } = COOKIE_OPTIONS;
  res.clearCookie('token', clearOpts);
  res.json({ msg: 'Logged out' });
};

// ── GET ME ───────────────────────────────────────────────────────────────────
// @route  GET /api/auth/me
// @desc   Get current logged-in user profile
// @access Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
// @route  POST /api/auth/forgot-password
// @desc   Generate a reset token and email a link to the user
// @access Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'No account found with this email address.' });

    // Generate a cryptographically-secure random token
    // crypto already imported at top
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed   = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken   = hashed;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink   = `${frontendUrl}/reset-password/${rawToken}`;

    // Send email via nodemailer
    const transporter = getMailTransporter();

    await transporter.sendMail({
      from: `"SafeHer" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'SafeHer — Password Reset Request',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#0d1628;border-radius:16px;color:#f1f5f9;">
          <h2 style="color:#fb7185;margin-bottom:8px;">Password Reset</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>We received a request to reset your SafeHer password. Click the button below to set a new password.</p>
          <a href="${resetLink}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:linear-gradient(to right,#fb7185,#a855f7);color:#fff;font-weight:bold;border-radius:12px;text-decoration:none;">
            Reset My Password
          </a>
          <p style="font-size:13px;color:#94a3b8;">This link expires in <strong>1 hour</strong>. If you did not request a reset, you can safely ignore this email.</p>
          <hr style="border-color:#1e293b;margin:24px 0;" />
          <p style="font-size:12px;color:#64748b;">SafeHer · Emergency Safety Platform</p>
        </div>`,
    });

    res.json({ msg: 'Password reset link sent successfully.' });
  } catch (err) {
    console.error('forgotPassword error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── RESET PASSWORD ─────────────────────────────────────────────────────────────
// @route  POST /api/auth/reset-password/:token
// @desc   Validate token and set new password
// @access Public
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6)
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });

  try {
    // crypto already imported at top
    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken:   hashed,
      resetPasswordExpires: { $gt: Date.now() },   // not yet expired
    });

    if (!user)
      return res.status(400).json({ msg: 'Reset link is invalid or has expired.' });

    const salt = await bcrypt.genSalt(10);
    user.password             = await bcrypt.hash(password, salt);
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ msg: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('resetPassword error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};
