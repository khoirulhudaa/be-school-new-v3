const express = require('express');
const schoolOrganizationController = require('../controllers/organisasiController');

const router = express.Router();

// Routes (no file upload needed for this entity)
router.get('/', schoolOrganizationController.getAllSchoolOrganizations);
router.post('/', schoolOrganizationController.createSchoolOrganization);
router.put('/:id', schoolOrganizationController.updateSchoolOrganization);
router.delete('/:id', schoolOrganizationController.deleteSchoolOrganization);

module.exports = router;