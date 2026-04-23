const express = require('express');
const multer = require('multer');
const announcementController = require('../controllers/pengumumanController');
const optionalAuth = require('../middlewares/optionalLimiter');
const pengumumanLimiter = require('../middlewares/pengumumanLimiter');

const router = express.Router();

// Gunakan memory storage untuk Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes Announcement
router.get('/', optionalAuth, pengumumanLimiter, announcementController.getAllAnnouncements);
router.post('/', upload.single('imageUrl'), announcementController.createAnnouncement);
router.put('/:id', upload.single('imageUrl'), announcementController.updateAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;