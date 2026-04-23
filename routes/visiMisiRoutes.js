const express = require('express');
const visionMissionController = require('../controllers/visiMisiController');

const router = express.Router();

router.get('/', visionMissionController.getAllVisionMissions);
router.post('/', visionMissionController.createVisionMission);
router.put('/:id', visionMissionController.updateVisionMission);
router.delete('/:id', visionMissionController.deleteVisionMission);

module.exports = router;