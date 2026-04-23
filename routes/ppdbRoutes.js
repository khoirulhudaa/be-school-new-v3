// routes/ppdbRoutes.js
const express = require('express');
const ppdbController = require('../controllers/ppdbController');

const router = express.Router();

router.get('/', ppdbController.getAllPpdb);
router.post('/', ppdbController.createPpdb);
router.put('/:id', ppdbController.updatePpdb);
router.delete('/:id', ppdbController.deletePpdb);

module.exports = router;