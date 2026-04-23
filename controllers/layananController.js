const Service = require('../models/layanan');

exports.getAllServices = async (req, res) => {
  try {
    const { schoolId, type } = req.query;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId wajib disertakan' });
    }

    const where = { 
      schoolId: parseInt(schoolId),
      isActive: true 
    };

    if (type && ['publik', 'internal'].includes(type)) {
      where.type = type;
    }

    const services = await Service.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// createService
exports.createService = async (req, res) => {
  try {
    const { title, description, type, schoolId, noTelephone, atasNama, email } = req.body;

    if (!title || !description || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'title, description, dan schoolId wajib diisi' 
      });
    }

    if (type && !['publik', 'internal'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type harus publik atau internal' });
    }

    // Validasi email jika diisi
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid' });
    }

    const service = await Service.create({
      title,
      description,
      type: type || 'publik',
      schoolId: parseInt(schoolId),
      noTelephone: noTelephone || null,
      atasNama: atasNama || null,
      email: email || null,
    });

    res.status(201).json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// updateService (tambahkan di bagian update field)
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, noTelephone, atasNama, email } = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });
    }

    if (title !== undefined) service.title = title;
    if (description !== undefined) service.description = description;
    if (type !== undefined) {
      if (!['publik', 'internal'].includes(type)) {
        return res.status(400).json({ success: false, message: 'type harus publik atau internal' });
      }
      service.type = type;
    }
    if (noTelephone !== undefined) service.noTelephone = noTelephone;
    if (atasNama !== undefined) service.atasNama = atasNama;
    if (email !== undefined) {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Format email tidak valid' });
      }
      service.email = email;
    }

    await service.save();
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });
    }

    service.isActive = false;
    await service.save();

    res.json({ success: true, message: 'Layanan berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};