const express = require('express');
const router = express.Router();
const votingController = require('../controllers/votingController');
const multer = require('multer');

// Konfigurasi Multer (simpan di memory untuk dikirim ke Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Batas 5MB per foto
});

// Middleware untuk menangani 2 foto (Ketua & Wakil)
const cpUpload = upload.fields([
  { name: 'chairmanImg', maxCount: 1 }, 
  { name: 'viceChairmanImg', maxCount: 1 }
]);

// --- Route untuk kandidat ---
router.get('/kandidat', votingController.getCandidates);

// Tambahkan cpUpload di POST dan PUT
router.post('/kandidat', cpUpload, votingController.createCandidate); 
router.post('/submit', cpUpload, votingController.submitVote); 
router.post('/verifikasi-kode', votingController.verifyCode);
router.put('/kandidat/:id', cpUpload, votingController.updateCandidate);

router.delete('/kandidat/:id', votingController.deleteCandidate);

// --- Route untuk Token ---
router.post('/generate-kode', votingController.generateCodes);
router.get('/list-kode', votingController.listCodes);
router.get('/suara', votingController.getResults);
router.get('/voting-status', votingController.getVotingStatus);
router.delete('/kode/:id', votingController.deleteCode);
router.delete('/bulk-delete-kode', votingController.bulkDeleteCodes);
router.post('/delete-selected-kode', votingController.deleteSelectedCodes);

module.exports = router;