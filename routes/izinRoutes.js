const express = require('express');
const router = express.Router();
const izinController = require('../controllers/izinController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

// Izin routes
router.post('/siswa/izin', protect, izinController.createIzinSiswa);
router.get('/siswa/izin/:siswaId', optionalAuth, izinController.getIzinBySiswa);
router.get('/siswa/izin/:id/children', optionalAuth, izinController.getIzinChildren);
router.delete('/siswa/izin/:id', protect, izinController.deleteIzin);

router.get('/guru/izin', protect, izinController.getAllIzin);
router.get('/guru/izin-stats', protect, izinController.getIzinStats);
router.get('/pending', protect, izinController.getPendingIzin);
router.put('/guru/izin/:id/approve', protect, izinController.approveIzin);
router.put('/guru/izin/:id/reject', protect, izinController.rejectIzin);

module.exports = router;
