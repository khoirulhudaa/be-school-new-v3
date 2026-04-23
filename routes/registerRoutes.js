const express = require('express');
const multer = require('multer');
const schoolAuthController = require('../controllers/registerController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar'), false);
    }
  }
});

router.post('/register', upload.single('logo'), schoolAuthController.registerSchool);

module.exports = router;