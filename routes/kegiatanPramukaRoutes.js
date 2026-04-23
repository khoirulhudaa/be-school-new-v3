const express = require('express');
const multer = require('multer');
const kegiatanPramukaController = require('../controllers/kegiatanPramukaController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', kegiatanPramukaController.getAllKegiatan);
router.post('/', upload.single('imageUrl'), kegiatanPramukaController.createKegiatan);
router.put('/:id', upload.single('imageUrl'), kegiatanPramukaController.updateKegiatan);
router.delete('/:id', kegiatanPramukaController.deleteKegiatan);

module.exports = router;