const express = require('express');
const multer = require('multer');
const sponsorController = require('../controllers/partnerController');

const router = express.Router();

// Memory storage → buffer langsung ke Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes CRUD Sponsor
router.get('/', sponsorController.getAllSponsors);
router.post('/', upload.single('imageUrl'), sponsorController.createSponsor);
router.put('/:id', upload.single('imageUrl'), sponsorController.updateSponsor);
router.delete('/:id', sponsorController.deleteSponsor);

module.exports = router;