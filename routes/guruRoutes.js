const express = require('express');
const router = express.Router();
const guruController = require('../controllers/guruController');
const { protect, optionalAuth } = require('../middlewares/auth');

// Guru Profile
router.get('/profile', optionalAuth, guruController.getProfile);
router.put('/profile/biodata', protect, guruController.updateBiodata);

// Guru Izin
router.get('/my-izin', protect, guruController.getMyIzin);
router.get('/izin', protect, guruController.getAllIzin);

// Guru Schedule
router.get('/jadwal', optionalAuth, guruController.getJadwal);

// Guru Nilai
router.get('/nilai', optionalAuth, guruController.getNilai);
router.post('/nilai', protect, guruController.postNilai);

// Guru Materi
router.get('/materi', optionalAuth, guruController.getMateri);
router.post('/materi', protect, guruController.postMateri);
router.put('/materi/:id', protect, guruController.updateMateri);
router.delete('/materi/:id', protect, guruController.deleteMateri);

// Guru Kuis
router.get('/kuis', optionalAuth, guruController.getKuis);
router.post('/kuis', protect, guruController.postKuis);
router.get('/kuis/:id', optionalAuth, guruController.getKuisById);
router.put('/kuis/:id', protect, guruController.updateKuis);
router.delete('/kuis/:id', protect, guruController.deleteKuis);
router.post('/kuis/:kuisId/soal', protect, guruController.postSoal);
router.delete('/kuis/soal/:soalId', protect, guruController.deleteSoal);

// Guru Siswa
router.get('/siswa', optionalAuth, guruController.getSiswa);
router.get('/attendance-summary', optionalAuth, guruController.getAttendanceSummary);
router.get('/attendance-status', optionalAuth, guruController.getAttendanceStatus);

// Guru Info Sekolah
router.get('/info-sekolah', optionalAuth, guruController.getInfoSekolah);

// Guru Chat Rooms
router.get('/chat/rooms', protect, guruController.getChatRooms);

// Guru Pending Tasks
router.get('/pending-tasks', protect, guruController.getPendingTasks);

module.exports = router;
