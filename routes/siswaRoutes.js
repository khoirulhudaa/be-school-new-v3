const express = require('express');
const router = express.Router();
const siswaStatsController = require('../controllers/siswaStatsController');
const optionalAuth = require('../middlewares/optionalLimiter');
const { globalLimiter } = require('../middlewares/rateLimiter');

// Student stats routes
router.get('/streak', optionalAuth, siswaStatsController.getStreak);
router.get('/tepat-waktu', optionalAuth, siswaStatsController.getTepatWaktu);
router.get('/teladan', optionalAuth, siswaStatsController.getTeladan);
router.get('/today-stats', optionalAuth, siswaStatsController.getTodayStats);
router.get('/rekap-saya', optionalAuth, siswaStatsController.getRekapSaya);
router.get('/get-attendances', optionalAuth, siswaStatsController.getAttendances);

// Attendance report & early warning (for admin dashboard)
router.get('/attendance-report', optionalAuth, siswaStatsController.getAttendanceReport);
router.get('/early-warning', optionalAuth, siswaStatsController.getEarlyWarning);
router.get('/early-warning/consecutive-absent', optionalAuth, siswaStatsController.getConsecutiveAbsent);
router.get('/early-warning/low-attendance', optionalAuth, siswaStatsController.getLowAttendance);
router.get('/early-warning/frequent-late', optionalAuth, siswaStatsController.getFrequentLate);
router.get('/recap-kelas', optionalAuth, siswaStatsController.getRecapKelas);
// router.get('/global-stats', optionalAuth, siswaStatsController.getGlobalStats);
router.get('/global-stats', optionalAuth, globalLimiter, siswaStatsController.getGlobalAttendanceStats);

// Search siswa & share recap
router.get('/search', optionalAuth, siswaStatsController.searchSiswa);
router.get('/share-rekap-progress', optionalAuth, siswaStatsController.shareRekapProgress);
router.get('/recap-kelas', optionalAuth, globalLimiter, siswaStatsController.getClassRecapWithDetails);
// router.get('/share-rekap', optionalAuth, siswaStatsController.shareRekap);
router.get('/share-rekap', optionalAuth, siswaStatsController.shareRekapHarian);

module.exports = router;
