const express = require('express');
const router = express.Router();
const ortuController = require('../controllers/ortuDashboardController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

// Ortu dashboard routes
router.get('/dashboard', optionalAuth, ortuController.getDashboard);
router.get('/anak', optionalAuth, ortuController.getAnak);
router.get('/anak/:anakId/kehadiran', optionalAuth, ortuController.getKehadiranAnak);
router.get('/anak/:anakId/izin', optionalAuth, ortuController.getIzinAnak);
router.get('/anak/:anakId/tugas', optionalAuth, ortuController.getTugasAnak);
router.get('/anak/:anakId/nilai', optionalAuth, ortuController.getNilaiAnak);
router.get('/anak/:anakId/jadwal', optionalAuth, ortuController.getJadwalAnak);
router.post('/anak/:anakId/izin', protect, ortuController.createIzinAnak);

module.exports = router;