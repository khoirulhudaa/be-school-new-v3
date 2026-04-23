const express = require('express');
const programController = require('../controllers/programController');

const router = express.Router();

router.get('/', programController.getAllPrograms);
router.post('/', programController.createProgram);
router.put('/:id', programController.updateProgram);
router.delete('/:id', programController.deleteProgram);

module.exports = router;