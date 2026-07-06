const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createIncident, getIncidents, sendAllClear } = require('../controllers/incidentController');

router.post('/', auth, createIncident);
router.get('/', auth, getIncidents);
router.post('/all-clear', auth, sendAllClear); // must be before any /:id routes

module.exports = router;
