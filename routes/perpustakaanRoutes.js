const express = require('express');
const router = express.Router();
const perpustakaanController = require('../controllers/perpustakaanController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

router.get('/buku', optionalAuth, perpustakaanController.getAllBuku);
router.get('/buku/:id', optionalAuth, perpustakaanController.getBukuById);
router.get('/buku/kategori/:kategori', optionalAuth, perpustakaanController.getBukuByKategori);
router.post('/buku', protect, perpustakaanController.createBuku);
router.put('/buku/:id', protect, perpustakaanController.updateBuku);
router.delete('/buku/:id', protect, perpustakaanController.deleteBuku);

router.get('/peminjaman', optionalAuth, perpustakaanController.getAllPeminjaman);
router.get('/peminjaman/:id', optionalAuth, perpustakaanController.getPeminjamanById);
router.get('/peminjaman/siswa/:siswaId', optionalAuth, perpustakaanController.getPeminjamanBySiswa);
router.post('/peminjaman', protect, perpustakaanController.createPeminjaman);
router.put('/peminjaman/:id/kembali', protect, perpustakaanController.returnBuku);

module.exports = router;