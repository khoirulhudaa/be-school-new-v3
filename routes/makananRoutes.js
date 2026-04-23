const express = require('express');
const router = express.Router();
const controller = require('../controllers/makananController');
const authMiddleware = require('../middlewares/auth');

router.get('/', authMiddleware, controller.getMakanan);
router.get('/search/:query', authMiddleware, controller.searchMakanan);
router.get('/kategori/:kategori', authMiddleware, controller.getByKategori);
router.get('/barcode/:code', authMiddleware, controller.getByBarcode);
router.get('/:id', authMiddleware, controller.getMakananById);
router.post('/', authMiddleware, controller.createMakanan);

module.exports = router;
