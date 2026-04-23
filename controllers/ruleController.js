const SchoolRules = require('../models/rules');

exports.getAllSchoolRules = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const schoolRules = await SchoolRules.findAll({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: schoolRules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSchoolRules = async (req, res) => {
  try {
    const { rules, schoolId } = req.body;

    if (!rules || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rules dan schoolId wajib diisi' 
      });
    }

    if (!Array.isArray(rules)) {
      return res.status(400).json({ success: false, message: 'rules harus berupa array' });
    }

    const newSchoolRules = await SchoolRules.create({ 
      rules,
      schoolId: parseInt(schoolId)
    });

    res.status(201).json({ success: true, data: newSchoolRules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSchoolRules = async (req, res) => {
  try {
    const { id } = req.params;
    const { rules } = req.body;

    const schoolRules = await SchoolRules.findByPk(id);
    if (!schoolRules) {
      return res.status(404).json({ success: false, message: 'Aturan Sekolah tidak ditemukan' });
    }

    if (rules !== undefined) {
      if (!Array.isArray(rules)) {
        return res.status(400).json({ success: false, message: 'rules harus array' });
      }
      schoolRules.rules = rules;
    }

    await schoolRules.save();
    res.json({ success: true, data: schoolRules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSchoolRules = async (req, res) => {
  try {
    const { id } = req.params;

    const schoolRules = await SchoolRules.findByPk(id);
    if (!schoolRules) {
      return res.status(404).json({ success: false, message: 'Aturan Sekolah tidak ditemukan' });
    }

    schoolRules.isActive = false;
    await schoolRules.save();

    res.json({ success: true, message: 'Aturan Sekolah berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};