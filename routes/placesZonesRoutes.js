const express = require('express');
const router = express.Router();
const placesZonesController = require('../controllers/placesZonesController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

// Places routes
router.get('/', optionalAuth, placesZonesController.getAllPlaces);
router.get('/nearby', optionalAuth, placesZonesController.getNearbyPlaces);
router.get('/density/:placeId', optionalAuth, placesZonesController.getPlaceDensity);

// Zones routes
router.get('/safe', optionalAuth, placesZonesController.getSafeZones);
router.get('/alerts', optionalAuth, placesZonesController.getZoneAlerts);
router.post('/alerts/read-all', protect, placesZonesController.readAllAlerts);
router.put('/alerts/:alertId/read', protect, placesZonesController.readAlert);
router.post('/check-and-alert', protect, placesZonesController.checkAndAlert);

module.exports = router;
