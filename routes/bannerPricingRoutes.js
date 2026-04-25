const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/protect');
const controller = require('../controllers/bannerPricingController');

router.get('/', protect, controller.getAllPricing);
router.get('/:planId', protect, controller.getPricingByPlan);
router.post('/', protect, controller.createPricing);
router.put('/:planId', protect, controller.updatePricing);
router.delete('/:planId', protect, controller.deletePricing);
router.post('/reset-defaults', protect, controller.resetToDefaults);

module.exports = router;