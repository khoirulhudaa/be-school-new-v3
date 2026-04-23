const express = require('express');
const faqController = require('../controllers/faqController');

const router = express.Router();

router.get('/', faqController.getAllFAQs);
router.post('/', faqController.createFAQ);
router.put('/:id', faqController.updateFAQ);
router.delete('/:id', faqController.deleteFAQ);

module.exports = router;