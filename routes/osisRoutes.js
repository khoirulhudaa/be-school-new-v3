const express = require('express');
const multer = require('multer');
const osisController = require('../controllers/osisController');
const { globalLimiter } = require('../middlewares/rateLimiter');
const optionalAuth = require('../middlewares/optionalLimiter');

const router = express.Router();

// Konfigurasi multer langsung di sini (memory storage untuk Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // maksimal 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan (jpeg, png, webp, dll)'), false);
    }
  }
});

// Routes
router.get('/', optionalAuth, globalLimiter, osisController.getOsis);

// POST dengan multiple files (4 field foto berbeda)
router.post(
  '/',
  upload.fields([
    { name: 'ketuaFoto',     maxCount: 1 },
    { name: 'wakilFoto',     maxCount: 1 },
    { name: 'bendaharaFoto', maxCount: 1 },
    { name: 'sekretarisFoto',maxCount: 1 },
  ]),
  osisController.createOrUpdateOsis
);

router.post('/riwayat', osisController.addToRiwayat);

module.exports = router;