const express = require('express');
const router = express.Router();
const kuisController = require('../controllers/kuisController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

router.get('/', optionalAuth, kuisController.getAllKuis);
router.get('/:id', optionalAuth, kuisController.getKuisById);
router.get('/kelas/:kelasId', optionalAuth, kuisController.getKuisByKelas);
router.get('/guru/:guruId', optionalAuth, kuisController.getKuisByGuru);
router.post('/', protect, kuisController.createKuis);
router.put('/:id', protect, kuisController.updateKuis);
router.delete('/:id', protect, kuisController.deleteKuis);
router.get('/:kuisId/soal', optionalAuth, kuisController.getSoalByKuis);
router.post('/:kuisId/soal', protect, kuisController.createSoal);
router.post('/:kuisId/submit', optionalAuth, kuisController.submitJawaban);
router.get('/:kuisId/hasil/:siswaId', optionalAuth, kuisController.getHasilKuis);

module.exports = router;