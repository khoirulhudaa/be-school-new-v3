const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/protect');
const controller = require('../controllers/bannerPricingController');

router.get('/', controller.getAllPricing);
router.get('/:planId', controller.getPricingByPlan);
router.post('/', controller.createPricing);
router.put('/:planId', controller.updatePricing);
router.delete('/:planId', controller.deletePricing);
router.post('/reset-defaults', controller.resetToDefaults);

module.exports = router;