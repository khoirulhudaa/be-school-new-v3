const express = require('express');
const router = express.Router();
const materiController = require('../controllers/materiController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

router.get('/', optionalAuth, materiController.getAllMateri);
router.get('/:id', optionalAuth, materiController.getMateriById);
router.get('/kelas/:kelasId', optionalAuth, materiController.getMateriByKelas);
router.get('/guru/:guruId', optionalAuth, materiController.getMateriByGuru);
router.post('/', protect, materiController.createMateri);
router.put('/:id', protect, materiController.updateMateri);
router.delete('/:id', protect, materiController.deleteMateri);

module.exports = router;