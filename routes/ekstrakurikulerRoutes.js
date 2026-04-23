const express = require('express');
const multer = require('multer');
const ekstrakurikulerController = require('../controllers/ekstrakurikulerController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET    /ekstrakurikuler?schoolId=xx
router.get('/', ekstrakurikulerController.getAllEkstrakurikuler);

// POST   /ekstrakurikuler       (multipart/form-data, field 'image' opsional)
router.post('/', upload.single('image'), ekstrakurikulerController.createEkstrakurikuler);

// PUT    /ekstrakurikuler/:id   (image opsional)
router.put('/:id', upload.single('image'), ekstrakurikulerController.updateEkstrakurikuler);

// DELETE /ekstrakurikuler/:id
router.delete('/:id', ekstrakurikulerController.deleteEkstrakurikuler);

module.exports = router;