const express = require('express');
const router = express.Router();
const activitiesController = require('../controllers/activitiesController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

router.get('/', optionalAuth, activitiesController.getAll);
router.get('/recent', optionalAuth, activitiesController.getRecent);
router.get('/:id', optionalAuth, activitiesController.getById);
router.get('/sekolah/:sekolahId', optionalAuth, activitiesController.getBySekolah);
router.post('/', protect, activitiesController.create);
router.put('/:id', protect, activitiesController.update);
router.delete('/:id', protect, activitiesController.delete);

module.exports = router;