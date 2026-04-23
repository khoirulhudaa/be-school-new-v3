const express = require('express');
const multer = require('multer');
const calendarController = require('../controllers/kalenderController');

const router = express.Router();

// Memory storage untuk Cloudinary (sama seperti guruTendik)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.get('/', calendarController.getAllCalendarEvents);
router.post('/', upload.single('photo'), calendarController.createCalendarEvent);
router.put('/:id', upload.single('photo'), calendarController.updateCalendarEvent);
router.delete('/:id', calendarController.deleteCalendarEvent);

module.exports = router;