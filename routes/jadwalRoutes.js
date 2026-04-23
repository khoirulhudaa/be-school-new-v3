const express = require('express');
const scheduleController = require('../controllers/jadwalController');

const router = express.Router();

// Routes tanpa upload, jadi tidak perlu multer
router.get('/', scheduleController.getAllSchedules);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;