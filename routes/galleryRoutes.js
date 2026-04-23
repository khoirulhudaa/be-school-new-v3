const express = require('express');
const multer = require('multer');
const path = require('path');
const galleryController = require('../controllers/galleryController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Routes yang sudah ada
router.get('/', galleryController.getGalleryItems);
router.post('/', upload.single('image'), galleryController.createGalleryItem);

// Tambahan baru
router.put('/:id', upload.single('image'), galleryController.updateGalleryItem);
router.delete('/:id', galleryController.deleteGalleryItem);

module.exports = router;