const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Contact', ContactSchema);
