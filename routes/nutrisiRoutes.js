const express = require('express');
const router = express.Router();
const controller = require('../controllers/nutrisiController');
const authMiddleware = require('../middlewares/auth');

router.post('/log', authMiddleware, controller.logMakanan);
router.get('/:siswaId', authMiddleware, controller.getLogHarian);
router.get('/:siswaId/week', authMiddleware, controller.getLogMingguan);

module.exports = router;
