const express = require('express');
const schoolRulesController = require('../controllers/ruleController');

const router = express.Router();

router.get('/', schoolRulesController.getAllSchoolRules);
router.post('/', schoolRulesController.createSchoolRules);
router.put('/:id', schoolRulesController.updateSchoolRules);
router.delete('/:id', schoolRulesController.deleteSchoolRules);

module.exports = router;