const express = require('express');
const router = express.Router();
const parentController = require('../controllers/orangTuaController');

router.get('/', parentController.getAllParents);
router.post('/', parentController.createParent);
router.put('/:id', parentController.updateParent);
router.delete('/:id', parentController.deleteParent);
router.get('/:parentId/kehadiran-siswa', parentController.getChildrenAttendance);
router.post('/login', parentController.loginParentWithoutPassword);
router.get('/search-student', parentController.searchStudentForRegister);
router.put('/:id/update-profile', parentController.updateProfile);
router.get('/:id', parentController.getParentById);
router.post('/link-child', parentController.linkChild);
router.delete('/unlink-child', parentController.unlinkChild);

module.exports = router;