const express = require('express');
const router = express.Router();
const faceController = require('../controllers/faceController');
const authMiddleware = require('../middlewares/scanQrStatis'); // middleware auth yang sudah ada
const { globalLimiter } = require('../middlewares/rateLimiter');

router.post('/enroll', authMiddleware, faceController.enrollFace);
router.get('/descriptor', authMiddleware, faceController.getDescriptor);
router.post('/absen', authMiddleware, globalLimiter, faceController.faceAbsen);

// Alias untuk compatibility dengan Flutter Xpresensi
router.post('/face-record', authMiddleware, globalLimiter, faceController.faceAbsen);

module.exports = router;