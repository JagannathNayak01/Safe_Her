const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const EmergencyContact = require('../models/EmergencyContact');

// Get all emergency contacts for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const contacts = await EmergencyContact.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a new emergency contact
router.post('/', auth, async (req, res) => {
    const { name, phone, email, gender, id, address, relationship } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ msg: 'Name is required' });
    }
    if (!phone || !phone.trim()) {
        return res.status(400).json({ msg: 'Phone number is required' });
    }

    try {
        const contact = new EmergencyContact({
            user: req.user.id,
            name: name.trim(),
            phone: phone.trim(),
            email: email?.trim(),
            gender,
            id: id?.trim(),
            address: address?.trim(),
            relationship: relationship?.trim()
        });

        const newContact = await contact.save();
        res.status(201).json(newContact);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update an emergency contact
router.put('/:id', auth, async (req, res) => {
    try {
        const contact = await EmergencyContact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: 'Contact not found' });

        // Ensure user owns this contact
        if (contact.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Assign fields
        ['name', 'phone', 'email', 'gender', 'id', 'address', 'relationship'].forEach(field => {
            if (req.body[field] !== undefined) {
                contact[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
            }
        });

        const updated = await contact.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete an emergency contact
router.delete('/:id', auth, async (req, res) => {
    try {
        const contact = await EmergencyContact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: 'Contact not found' });

        // Ensure user owns this contact
        if (contact.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await EmergencyContact.deleteOne({ _id: req.params.id });
        res.json({ message: 'Contact deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;