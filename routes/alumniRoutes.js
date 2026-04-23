// routes/alumniRoutes.js
const express = require('express');
const multer = require('multer');
const alumniController = require('../controllers/alumniController');
const optionalAuth = require('../middlewares/optionalLimiter');
const alumniLimiter = require('../middlewares/alumniLimiter');

const router = express.Router();

// Gunakan memory storage karena upload ke Cloudinary, bukan disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.get('/', optionalAuth, alumniLimiter, alumniController.getAllAlumni);
router.post('/', upload.single('photo'), alumniController.createAlumni);
router.put('/:id', upload.single('photo'), alumniController.updateAlumni);
router.delete('/:id', alumniController.deleteAlumni);
router.post('/alumni-display', alumniController.updateAlumniDisplay);
router.get('/get-alumni-display/:schoolId', optionalAuth, alumniLimiter, alumniController.getAlumniDisplaySetting);
router.get('/find', optionalAuth, alumniLimiter, alumniController.getAlumniByIds);

// Aksi verifikasi
router.patch('/:id/approve', alumniController.approveAlumni);

// Jejak Alumni - Featured, Stats, Contributors
router.get('/featured', optionalAuth, alumniController.getFeaturedAlumni);
router.get('/stats', optionalAuth, alumniController.getAlumniStats);
router.get('/contributors', optionalAuth, alumniLimiter, alumniController.getAlumniContributors);

module.exports = router;