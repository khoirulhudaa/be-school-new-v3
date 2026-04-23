const express = require('express');
const router = express.Router();
const GoogleAuthController = require('../controllers/googleAuthController');

// Google Register for Ortu (Parent)
router.post('/google-register/ortu', GoogleAuthController.googleRegisterOrtu);

// Google Register for Siswa (Student)
router.post('/google-register/siswa', GoogleAuthController.googleRegisterSiswa);

// Logout
router.post('/logout', GoogleAuthController.logout);

module.exports = router;
