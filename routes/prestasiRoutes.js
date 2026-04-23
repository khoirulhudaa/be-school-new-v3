const express = require('express');
const multer = require('multer');
const achievementController = require('../controllers/prestasiController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', achievementController.getAllAchievements);
router.post('/', upload.single('imageUrl'), achievementController.createAchievement);     
router.put('/:id', upload.single('imageUrl'), achievementController.updateAchievement);
router.delete('/:id', achievementController.deleteAchievement);

module.exports = router;