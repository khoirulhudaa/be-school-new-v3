const express = require('express');
const router = express.Router();

const provinsiCtrl = require('../controllers/provinsiController');

router.get('/', provinsiCtrl.getAllProvinsi);
router.get('/:id', provinsiCtrl.getProvinsiById);

router.post('/', provinsiCtrl.createProvinsi);
router.put('/:id', provinsiCtrl.updateProvinsi);
router.delete('/:id', provinsiCtrl.deleteProvinsi);

module.exports = router;