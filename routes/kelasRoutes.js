const express = require('express');
const router = express.Router();
const kelasController = require('../controllers/kelasController');
const { globalLimiter } = require('../middlewares/rateLimiter');
const optionalAuth = require('../middlewares/optionalLimiter');

router.get('/', optionalAuth, globalLimiter, kelasController.getAllClasses);
router.post('/', kelasController.createClass);
router.post('/bulk', kelasController.createClassBulk);
router.put('/:id', kelasController.updateClass);
router.delete('/:id/:schoolId', kelasController.deleteClass);

module.exports = router;