    const express = require('express');
    const multer = require('multer');
    const facilityController = require('../controllers/fasilitasController');

    const router = express.Router();

    // Gunakan memory storage karena kita akan mengirim buffer ke Cloudinary
    const storage = multer.memoryStorage();
    const upload = multer({ storage });

    // Routes untuk Fasilitas
    router.get('/', facilityController.getAllFacilities);
    router.post('/', upload.single('imageUrl'), facilityController.createFacility);
    router.put('/:id', upload.single('imageUrl'), facilityController.updateFacility);
    router.delete('/:id', facilityController.deleteFacility);

    module.exports = router;