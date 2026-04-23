// routes/sejarahSekolahRoutes.js
const express = require('express');
const multer = require('multer');
const sejarahSekolahController = require('../controllers/sejarahSekolahController');

const router = express.Router();

// Gunakan memory storage karena upload ke Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.get('/', sejarahSekolahController.getSejarah);
router.post('/', upload.array('kepalaPhotos', 20), sejarahSekolahController.createSejarah); // Max 20 foto
router.put('/:id', upload.array('kepalaPhotos', 20), sejarahSekolahController.updateSejarah);
router.delete('/:id', sejarahSekolahController.deleteSejarah);

module.exports = router;