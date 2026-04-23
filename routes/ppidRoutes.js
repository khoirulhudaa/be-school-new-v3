const express = require('express');
const ppidController = require('../controllers/ppidController');

const router = express.Router();

router.get('/', ppidController.getAllPpidDocuments);
router.post('/', ppidController.createPpidDocument);
router.put('/:id', ppidController.updatePpidDocument);
router.delete('/:id', ppidController.deletePpidDocument);

module.exports = router;