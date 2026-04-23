const express = require('express');
const curriculumController = require('../controllers/kurikulumController');

const router = express.Router();

// Tidak perlu multer karena tidak ada upload file (hanya URL dokumen)
router.get('/', curriculumController.getAllCurriculums);
router.post('/', curriculumController.createCurriculum);
router.put('/:id', curriculumController.updateCurriculum);
router.delete('/:id', curriculumController.deleteCurriculum);

module.exports = router;