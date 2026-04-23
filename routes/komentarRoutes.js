const express = require('express');
const komentarController = require('../controllers/komentarController');
const settingController = require('../controllers/settingRatingController');
const optionalAuth = require('../middlewares/optionalLimiter');
const ulasanLimiter = require('../middlewares/ulasanLimiter');

const router = express.Router();

// Routes
router.get('/', optionalAuth, ulasanLimiter, komentarController.getAllComments);
router.post('/', komentarController.createComment);
router.delete('/:id', komentarController.deleteComment);
router.get('/settings', settingController.getSettings);
router.post('/settings', settingController.updateSettings);

module.exports = router;