const express = require('express');
const serviceController = require('../controllers/layananController');

const router = express.Router();

router.get('/', serviceController.getAllServices);
router.post('/', serviceController.createService);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

module.exports = router;