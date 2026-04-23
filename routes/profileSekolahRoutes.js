// routes/schoolProfileRoutes.js
const express = require('express');
const multer = require('multer');
const schoolProfileController = require('../controllers/profileSekolahController'); // sesuaikan nama file

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadFields = upload.fields([
  { name: 'photoHeadmasterUrl', maxCount: 1 },
  { name: 'heroImage', maxCount: 1 },
  { name: 'logo', maxCount: 1 } // ← TAMBAHKAN INI
]);

router.get('/', schoolProfileController.getSchoolProfile);
router.post('/', uploadFields, schoolProfileController.createSchoolProfile);
router.put('/:id', uploadFields, schoolProfileController.updateSchoolProfile);
router.delete('/:id', schoolProfileController.deleteSchoolProfile);

module.exports = router;