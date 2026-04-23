const express = require('express');
const multer = require('multer');
const instagramController = require('../controllers/feedController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', instagramController.getAllFeeds);
router.post('/', upload.single('media'), instagramController.createFeed);
router.put('/:id', upload.single('media'), instagramController.updateFeed);
router.delete('/:id', instagramController.deleteFeed);

module.exports = router;