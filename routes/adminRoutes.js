const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // Sesuaikan path-nya
const { protect } = require('../middlewares/protect'); // Pastikan middleware ini ada

// Gunakan middleware protect agar semua route di bawah ini wajib login
router.use(protect);

// --- MANAJEMEN ADMIN (CRUD) ---

// Mendapatkan semua admin dalam satu sekolah (berdasarkan NPSN)
router.get('/', adminController.getAdminsBySchool);

// Membuat admin tambahan baru
router.post('/', adminController.createAdmin);
router.post('/import', adminController.bulkCreateAdmin); // Ini yang handle File

// Update data admin (Nama, Email, Status)
router.put('/:id', adminController.updateAdmin);

// Menghapus admin
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;