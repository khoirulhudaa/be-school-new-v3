const express = require('express');
const router = express.Router();
const sekolahController = require('../controllers/sekolahController');

router.get('/', sekolahController.getAllSchools);
router.get('/stats', sekolahController.getDashboardStats);
router.get('/distribution', sekolahController.getSchoolDistribution);
router.get('/paged', sekolahController.getAllSchoolsPaginated);
router.put('/status', sekolahController.updateSchoolStatus);
router.get('/export/sekolah', sekolahController.exportAllSchoolsExcel);
router.get('/export/siswa/:schoolId', sekolahController.exportSiswaBySchoolExcel);
router.get('/export/guru/:schoolId', sekolahController.exportGuruBySchoolExcel);
router.put('/bulk-status', sekolahController.bulkUpdateSchoolStatus);

module.exports = router;