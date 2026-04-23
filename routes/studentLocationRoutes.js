const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middlewares/protect');
const studentLocationController = require('../controllers/studentLocationController');

// Get all locations for admin map view
router.get('/', optionalAuth, studentLocationController.getAllLocations);

// Get latest location per student
router.get('/latest', optionalAuth, studentLocationController.getLatestLocations);

// Record student location (from app)
router.post('/record', protect, studentLocationController.recordLocation);

// Record parent consent
router.post('/consent', protect, studentLocationController.recordConsent);

// Cleanup old locations
router.delete('/cleanup', protect, studentLocationController.cleanupOldLocations);

module.exports = router;