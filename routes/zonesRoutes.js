const express = require('express');
const router = express.Router();
const placesZonesController = require('../controllers/placesZonesController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

// Zones routes (called directly by Flutter at /zones/*)
router.get('/safe', optionalAuth, placesZonesController.getSafeZones);
router.post('/safe', protect, placesZonesController.createSafeZone);
router.get('/alerts', optionalAuth, placesZonesController.getZoneAlerts);
router.put('/alerts/:alertId/read', protect, placesZonesController.readAlert);
router.put('/alerts/read-all', protect, placesZonesController.readAllAlerts);

module.exports = router;