const express = require('express');
const multer = require('multer');
const authController = require('../controllers/authController');
const protect = require('../middlewares/auth'); // Import middleware
const router = express.Router();

// Gunakan memory storage (sama dengan alumni)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  // limit 5MB
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Routes
router.post('/register', upload.single('logo'), authController.registerSchool);
router.post('/login', authController.login);
router.get('/profile', protect, authController.getProfile);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-pin', authController.verifyPin);
router.post('/reset-password', authController.resetPassword);
router.put('/update-profile', protect, authController.updateProfile);
router.post('/maintenance/deactivate', authController.deactivateAllSchools);
router.post('/maintenance/activate', authController.activateAllSchools);

module.exports = router;