const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/presenceController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

// Presence routes
router.post('/checkin', protect, presenceController.checkin);
router.post('/checkout', protect, presenceController.checkout);
router.delete('/checkout', protect, presenceController.checkout); // REST delete
router.get('/active', optionalAuth, presenceController.getActive);
router.get('/my-checkin', optionalAuth, presenceController.getMyCheckin);
router.post('/update-location', protect, presenceController.updateLocation);

module.exports = router;
