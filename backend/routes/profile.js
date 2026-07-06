const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const auth     = require('../middleware/authMiddleware');
const User     = require('../models/User');

// ── Multer: store avatars in backend/uploads/avatars/ ───────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // name file after userId so each user only keeps one avatar
    cb(null, `avatar_${req.user.id}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only image files are allowed (jpg, png, gif, webp)'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max (matches frontend guard)
});

// ── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({
      name:         user.name,
      email:        user.email,
      phone:        user.phone        || '',
      avatar:       user.avatar       || '',
      avatarBase64: user.avatarBase64 || '',
    });
  } catch (err) {
    console.error('GET /profile error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PUT /api/profile ─────────────────────────────────────────────────────────
router.put('/', auth, async (req, res) => {
    const { name, email, phone } = req.body;
    if (!name?.trim()) return res.status(400).json({ msg: 'Name is required' });
    if (!email?.trim()) return res.status(400).json({ msg: 'Email is required' });

  try {
    const existing = await User.findOne({ email: email.trim() });
    if (existing && existing._id.toString() !== req.user.id) {
      return res.status(400).json({ msg: 'Email already in use by another account' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim(), email: email.trim(), phone: phone?.trim() || '' },
      { new: true }
    ).select('-password');

    res.json({ name: user.name, email: user.email, phone: user.phone || '', avatar: user.avatar || '', msg: 'Profile updated' });
  } catch (err) {
    console.error('PUT /profile error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST /api/profile/avatar ─────────────────────────────────────────────────
// Accepts multipart/form-data with field name "avatar"
router.post('/avatar', auth, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ msg: 'Image must be under 2 MB' });
      }
      return res.status(400).json({ msg: err.message || 'Upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No image uploaded' });

    // 1. Build the public URL path (served as static from /uploads)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // 2. Convert the saved file to a base64 data URI to store in MongoDB
    const fileBuffer = fs.readFileSync(req.file.path);
    const mimeType   = req.file.mimetype || 'image/jpeg';
    const avatarBase64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

    // 3. Save both path (disk) and base64 (DB) to the User document
    await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl, avatarBase64 });

    res.json({ avatar: avatarUrl, avatarBase64, msg: 'Profile picture updated' });
  } catch (err) {
    console.error('POST /profile/avatar error:', err.message);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// ── DELETE /api/profile/avatar ───────────────────────────────────────────────
router.delete('/avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.avatar) {
      const filePath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    // Clear both disk path and DB base64
    await User.findByIdAndUpdate(req.user.id, { avatar: '', avatarBase64: '' });
    res.json({ msg: 'Profile picture removed' });
  } catch (err) {
    console.error('DELETE /profile/avatar error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PUT /api/profile/password ────────────────────────────────────────────────
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ msg: 'Current and new password are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ msg: 'New password must be at least 6 characters' });

  try {
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error('PUT /profile/password error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
