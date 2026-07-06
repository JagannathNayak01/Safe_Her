const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  timestamp: { type: Date, default: Date.now },
  contactsNotified: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyContact' }],
  contactsEscalated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyContact' }],
  escalationStatus: {
    type: String,
    enum: ['pending', 'escalated', 'cancelled'],
    default: 'pending',
  },
  escalatedAt: { type: Date },
  allClearAt:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Incident', IncidentSchema);
