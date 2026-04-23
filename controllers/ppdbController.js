const Ppdb = require('../models/ppdb');

exports.getAllPpdb = async (req, res) => {
  try {
    const { schoolId, year } = req.query;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId wajib disertakan' });
    }

    const where = { 
      schoolId: parseInt(schoolId),
      isActive: true 
    };

    if (year) {
      where.year = year;
    }

    const ppdb = await Ppdb.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: ppdb });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPpdb = async (req, res) => {
  try {
    const { year, description, schoolId, startDate, endDate, requirements, quota, contactEmail, contactPhone, admissionPaths } = req.body;

    if (!year || !description || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'year, description, dan schoolId wajib diisi' 
      });
    }

    if (requirements && (!Array.isArray(requirements) || !requirements.every(item => typeof item === 'string'))) {
      return res.status(400).json({ 
        success: false, 
        message: 'requirements harus berupa array string' 
      });
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid' });
    }

    const ppdb = await Ppdb.create({
      year,
      description,
      schoolId: parseInt(schoolId),
      startDate: startDate || null,
      endDate: endDate || null,
      requirements: requirements || [],
      quota: quota ? parseInt(quota) : null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      admissionPaths: admissionPaths || []
    });

    res.status(201).json({ success: true, data: ppdb });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePpdb = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      year, 
      description, 
      startDate, 
      endDate, 
      requirements,      // ← ini wajib ada di destructuring
      quota, 
      contactEmail, 
      contactPhone,
      admissionPaths
    } = req.body;

    const ppdb = await Ppdb.findByPk(id);
    if (!ppdb) {
      return res.status(404).json({ success: false, message: 'Informasi PPDB tidak ditemukan' });
    }

    if (year !== undefined) ppdb.year = year;
    if (description !== undefined) ppdb.description = description;
    if (startDate !== undefined) ppdb.startDate = startDate;
    if (endDate !== undefined) ppdb.endDate = endDate;
    if (admissionPaths !== undefined) {
      
    if (!Array.isArray(admissionPaths)) {
      return res.status(400).json({ success: false, message: 'admissionPaths harus berupa array' });
    }
    ppdb.admissionPaths = admissionPaths;
  }

    // Validasi dan update requirements (sekarang aman karena sudah di-destructure)
    if (requirements !== undefined) {
      if (!Array.isArray(requirements) || !requirements.every(item => typeof item === 'string')) {
        return res.status(400).json({ 
          success: false, 
          message: 'requirements harus berupa array string' 
        });
      }
      ppdb.requirements = requirements;
    }

    if (quota !== undefined) ppdb.quota = quota ? parseInt(quota) : null;
    if (contactPhone !== undefined) ppdb.contactPhone = contactPhone;
    if (contactEmail !== undefined) {
      if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        return res.status(400).json({ success: false, message: 'Format email tidak valid' });
      }
      ppdb.contactEmail = contactEmail;
    }

    await ppdb.save();
    res.json({ success: true, data: ppdb });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePpdb = async (req, res) => {
  try {
    const { id } = req.params;
    const ppdb = await Ppdb.findByPk(id);

    if (!ppdb) {
      return res.status(404).json({ success: false, message: 'Informasi PPDB tidak ditemukan' });
    }

    ppdb.isActive = false;
    await ppdb.save();

    res.json({ success: true, message: 'Informasi PPDB berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};