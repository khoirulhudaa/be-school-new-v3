// controllers/visionMissionController.js
const VisionMission = require('../models/visiMisi');

exports.getAllVisionMissions = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const visionMissions = await VisionMission.findAll({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: visionMissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createVisionMission = async (req, res) => {
  try {
    const { vision, missions, pillars, kpis, schoolId } = req.body;

    if (!vision || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vision dan schoolId wajib diisi' 
      });
    }

    // Validasi tipe data (opsional tapi direkomendasikan)
    if (!Array.isArray(missions)) {
      return res.status(400).json({ success: false, message: 'missions harus berupa array' });
    }
    if (!Array.isArray(pillars)) {
      return res.status(400).json({ success: false, message: 'pillars harus berupa array' });
    }
    if (!Array.isArray(kpis)) {
      return res.status(400).json({ success: false, message: 'kpis harus berupa array' });
    }

    const newVisionMission = await VisionMission.create({ 
      vision,
      missions: missions || [],           // array string
      pillars: pillars || [],             // array string
      kpis: kpis || [],                   // array object {indicator, target}
      schoolId: parseInt(schoolId)
    });

    res.status(201).json({ success: true, data: newVisionMission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateVisionMission = async (req, res) => {
  try {
    const { id } = req.params;
    const { vision, missions, pillars, kpis } = req.body;

    const visionMission = await VisionMission.findByPk(id);
    if (!visionMission) {
      return res.status(404).json({ success: false, message: 'Visi Misi tidak ditemukan' });
    }

    // Update hanya field yang dikirim
    if (vision !== undefined) visionMission.vision = vision;
    if (missions !== undefined) {
      if (!Array.isArray(missions)) {
        return res.status(400).json({ success: false, message: 'missions harus array' });
      }
      visionMission.missions = missions;
    }
    if (pillars !== undefined) {
      if (!Array.isArray(pillars)) {
        return res.status(400).json({ success: false, message: 'pillars harus array' });
      }
      visionMission.pillars = pillars;
    }
    if (kpis !== undefined) {
      if (!Array.isArray(kpis)) {
        return res.status(400).json({ success: false, message: 'kpis harus array' });
      }
      visionMission.kpis = kpis;
    }

    await visionMission.save();
    res.json({ success: true, data: visionMission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteVisionMission = async (req, res) => {
  try {
    const { id } = req.params;

    const visionMission = await VisionMission.findByPk(id);
    if (!visionMission) {
      return res.status(404).json({ success: false, message: 'Visi Misi tidak ditemukan' });
    }

    visionMission.isActive = false;
    await visionMission.save();

    res.json({ success: true, message: 'Visi Misi berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};