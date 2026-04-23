const express = require('express');
const router = express.Router();
const siswaStatsController = require('../controllers/siswaStatsController');
const optionalAuth = require('../middlewares/optionalLimiter');
const { globalLimiter, loginLimiter } = require('../middlewares/rateLimiter');
const multer = require('multer');
const { protectMultiRole } = require('../middlewares/protectMultiRole');

// Gunakan memory storage agar buffer bisa dikirim langsung ke Cloudinary
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Batas 5MB sesuai UI frontend
});

// Endpoint: /api/siswa
router.get('/', siswaStatsController.getAllStudents); // Sesuai fetch di frontend tadi
router.get('/all-no-pagination', siswaStatsController.getAllStudentsNoPagination);
router.post('/', upload.single('photo'), siswaStatsController.createStudent);
router.post('/bulk', siswaStatsController.bulkCreateStudents);
router.get('/search', siswaStatsController.getStudentSearch);
router.put('/:id', upload.single('photo'), siswaStatsController.updateStudent);
router.delete('/:id', siswaStatsController.deleteStudent);
router.post('/login', loginLimiter, siswaStatsController.checkStudentAuth);
router.get('/:parentId/anak', siswaStatsController.getParentChildren);
router.get('/:id/location', siswaStatsController.updateStudentLocation );
router.put('/class/bulk-update-class', siswaStatsController.updateClassByBatch);

// --- API ABSENSI ---
// Endpoint: /api/siswa/scan
router.post('/scan', siswaStatsController.scanQRCode);
router.get('/get-attendances', protectMultiRole, siswaStatsController.getAttendanceHistory);

router.get('/validate-qr', siswaStatsController.validateUserByQR);

// Mark Absence (Izin, Sakit, Alpha - Satuan atau Bulk)
router.post('/mark-absence', siswaStatsController.markAbsence);
router.get('/detail/:id', siswaStatsController.getUserDetail);
// --- 3. API STATISTIK & LAPORAN ---
router.get('/share-rekap', siswaStatsController.shareRekapHarian);
router.get('/share-rekap-progress', siswaStatsController.shareRekapProgress);
// Statistik Dashboard (Hadir, Sakit, Izin, Alpha hari ini)
router.get('/today-stats', siswaStatsController.getTodayStats);
router.get('/summary-attendances', siswaStatsController.getAttendanceSummary);
router.get('/attendance-report', optionalAuth, globalLimiter, siswaStatsController.getAttendanceReport);
router.get('/early-warning', siswaStatsController.getEarlyWarningReport);
router.get('/hall-of-fame', siswaStatsController.getPublicHallOfFame);

// Attendance report & early warning (for admin dashboard)
router.get('/attendance-report', optionalAuth, siswaStatsController.getAttendanceReport);
router.get('/early-warning', optionalAuth, siswaStatsController.getEarlyWarning);
router.get('/early-warning/consecutive-absent', optionalAuth, siswaStatsController.getConsecutiveAbsent);
router.get('/early-warning/low-attendance', optionalAuth, siswaStatsController.getLowAttendance);
router.get('/early-warning/frequent-late', optionalAuth, siswaStatsController.getFrequentLate);
// router.get('/recap-kelas', optionalAuth, siswaStatsController.getRecapKelas);
// router.get('/global-stats', optionalAuth, siswaStatsController.getGlobalStats);
router.get('/global-stats', optionalAuth, globalLimiter, siswaStatsController.getGlobalAttendanceStats);

// Search siswa & share recap
router.get('/search', optionalAuth, siswaStatsController.searchSiswa);
router.get('/share-rekap-progress', optionalAuth, siswaStatsController.shareRekapProgress);
router.get('/recap-kelas', optionalAuth, globalLimiter, siswaStatsController.getClassRecapWithDetails);

// router.get('/share-rekap', optionalAuth, siswaStatsController.shareRekap);
router.get('/share-rekap', optionalAuth, siswaStatsController.shareRekapHarian);

// Student stats routes
router.get('/streak', optionalAuth, siswaStatsController.getStreak);
router.get('/tepat-waktu', optionalAuth, siswaStatsController.getTepatWaktu);
router.get('/teladan', optionalAuth, siswaStatsController.getTeladan);
router.get('/today-stats', optionalAuth, siswaStatsController.getTodayStats);
router.get('/rekap-saya', optionalAuth, siswaStatsController.getRekapSaya);
router.get('/get-attendances', optionalAuth, siswaStatsController.getAttendances);

module.exports = router;
