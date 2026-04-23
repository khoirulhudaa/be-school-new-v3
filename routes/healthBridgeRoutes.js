const express = require('express');
const router = express.Router();
const healthBridgeController = require('../controllers/healthBridgeController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

// Health records
router.get('/records', optionalAuth, healthBridgeController.getRecords);
router.get('/records/:id', optionalAuth, healthBridgeController.getRecordById);
router.post('/records', protect, healthBridgeController.createRecord);
router.put('/records/:id', protect, healthBridgeController.updateRecord);

// Health check / screening
router.get('/screenings', optionalAuth, healthBridgeController.getScreenings);
router.post('/screenings', protect, healthBridgeController.createScreening);

// Stats
router.get('/stats', optionalAuth, healthBridgeController.getStats);
router.get('/summary', protect, healthBridgeController.getSummary);

module.exports = router;