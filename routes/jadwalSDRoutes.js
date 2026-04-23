const express = require('express');
const jadwalController = require('../controllers/jadwalSDController');

const router = express.Router();

// Rekomendasi endpoint yang cocok dengan client
router.get('/kelas/:kelas/shift/:shift', jadwalController.getJadwalByKelasAndShift);

// Untuk admin/CRUD
router.get('/', jadwalController.getAllJadwal);
router.post('/', jadwalController.createOrUpdateJadwal);      // create atau update
router.delete('/:id', jadwalController.deleteJadwal);         // soft delete
router.put('/:id', jadwalController.createOrUpdateJadwal);

module.exports = router;