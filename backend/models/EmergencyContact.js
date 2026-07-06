const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    id: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    relationship: {
        type: String,
        trim: true   // e.g. "Mother", "Friend", "Husband", "Doctor"
    }
}, { timestamps: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);