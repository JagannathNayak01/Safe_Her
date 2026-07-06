const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { addContact, getContacts, deleteContact, updateContact } = require('../controllers/contactController');

router.post('/', auth, addContact);
router.get('/', auth, getContacts);
router.delete('/:id', auth, deleteContact);
router.put('/:id', auth, updateContact);

module.exports = router;
