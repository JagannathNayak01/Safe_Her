const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  phone:        { type: String, default: '' },
  avatar:       { type: String, default: '' },
  avatarBase64: { type: String, default: '' },
  contacts:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  resetPasswordToken:   { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
