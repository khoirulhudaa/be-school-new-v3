const Curriculum = require('../models/kurikulum');

exports.getAllCurriculums = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const curriculums = await Curriculum.findAll({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
      order: [['year', 'DESC'], ['createdAt', 'DESC']],
    });

    res.json({ success: true, data: curriculums });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCurriculum = async (req, res) => {
  try {
    const { name, year, type, description, documentUrl, schoolId } = req.body;

    if (!name || !year || !type || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'name, year, type, dan schoolId wajib diisi' 
      });
    }

    // Validasi tahun
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Year harus angka valid (2000-2100)' 
      });
    }

    const newCurriculum = await Curriculum.create({ 
      name, 
      year: parseInt(year),
      type,
      description: description || null,
      documentUrl: documentUrl || null,
      schoolId: parseInt(schoolId)
    });

    res.status(201).json({ success: true, data: newCurriculum });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, year, type, description, documentUrl } = req.body;

    const curriculum = await Curriculum.findByPk(id);
    if (!curriculum) {
      return res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
    }

    // Update field yang dikirim
    if (name) curriculum.name = name;
    if (year !== undefined) {
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return res.status(400).json({ success: false, message: 'Year harus angka valid (2000-2100)' });
      }
      curriculum.year = parseInt(year);
    }
    if (type) curriculum.type = type;
    if (description !== undefined) curriculum.description = description;
    if (documentUrl !== undefined) curriculum.documentUrl = documentUrl;

    await curriculum.save();

    res.json({ success: true, data: curriculum });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;

    const curriculum = await Curriculum.findByPk(id);
    if (!curriculum) {
      return res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
    }

    curriculum.isActive = false;
    await curriculum.save();

    res.json({ success: true, message: 'Kurikulum berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};