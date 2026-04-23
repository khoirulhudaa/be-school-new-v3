const express = require('express');
const router = express.Router();
const multer = require('multer');
const tugasController = require('../controllers/tugasController');
const { globalLimiter } = require('../middlewares/rateLimiter');
const optionalAuth = require('../middlewares/optionalLimiter');
const tugasLimiter = require('../middlewares/tugasLimiter');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/', tugasController.createTugas);
router.get('/', optionalAuth, tugasLimiter, tugasController.getAllTugas);
router.get('/:id', optionalAuth, tugasLimiter, tugasController.getTugasById);
router.put('/:id', tugasController.updateTugas);
router.delete('/:id/:schoolId', tugasController.deleteTugas);

module.exports = router;