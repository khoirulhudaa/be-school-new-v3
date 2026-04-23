const express = require('express');
const multer = require('multer');
const path = require('path');
const albumController = require('../controllers/albumController');

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
router.get('/', albumController.getAllAlbums);
router.post('/', upload.single('cover'), albumController.createAlbum);

// Tambahan baru
router.put('/:id', upload.single('cover'), albumController.updateAlbum);
router.delete('/:id', albumController.deleteAlbum);

module.exports = router;