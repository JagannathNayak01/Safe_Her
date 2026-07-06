const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables first
dotenv.config();

const authRoutes          = require('./routes/auth');
const contactRoutes       = require('./routes/contacts');
const incidentRoutes      = require('./routes/incidents');
const emergencyContactRoutes = require('./routes/emergencyContacts');
const profileRoutes       = require('./routes/profile');   // Phase 2

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,   // allow cookies on cross-origin requests
}));
app.use(cookieParser());
app.use(bodyParser.json());

// ── Serve uploaded avatars as static files ───────────────────────────────────
// e.g. GET http://localhost:5000/uploads/avatars/avatar_abc123.jpg
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// ── Rate limiters ────────────────────────────────────────────────────────────
// Auth: max 20 requests per 15 min per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { msg: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// SOS: max 20 alerts per hour per IP in production only — skipped in dev so testing isn't blocked
const sosLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  skip: () => process.env.NODE_ENV !== 'production',
  message: { msg: 'Too many SOS alerts sent from this IP. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',               authLimiter, authRoutes);
app.use('/api/contacts',           contactRoutes);
app.use('/api/incidents',          sosLimiter,  incidentRoutes);
app.use('/api/emergency-contacts', emergencyContactRoutes);
app.use('/api/profile',            profileRoutes);                 // Phase 2

// ── Database ─────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ── Global error handler (must be last middleware, before listen) ────────────
app.use(errorHandler);

// ── Server ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
