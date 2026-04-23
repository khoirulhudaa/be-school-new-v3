const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

// Student/Guru panic SOS
router.post('/panic', protect, sosController.panic);

// Parent SOS - notify children
router.post('/parent-panic', protect, sosController.parentPanic);

// Check user SOS status (for polling)
router.get('/check/:userId/:userType', optionalAuth, sosController.checkStatus);

// Check parent SOS for student (for polling)
router.get('/parent-check/:studentId', optionalAuth, sosController.checkParentSOS);

// Get user history
router.get('/history/:userId/:userType', optionalAuth, sosController.getHistory);

// Admin: Get all SOS history for school
router.get('/admin/history', protect, sosController.getAllHistory);

// Admin: Resolve SOS with notes
router.put('/resolve/:sosId', protect, sosController.resolve);

// Acknowledge SOS
router.put('/acknowledge/:sosId', protect, sosController.acknowledge);

module.exports = router;