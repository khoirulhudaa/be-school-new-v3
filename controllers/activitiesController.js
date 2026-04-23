const Activities = require('../models/activities');

class ActivitiesController {
  async getAll(req, res) {
    try {
      const { sekolahId, tipo, limit = 50 } = req.query;
      const where = { isActive: true };
      if (sekolahId) where.sekolahId = parseInt(sekolahId);
      if (tipo) where.tipo = tipo;

      const activities = await Activities.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
      });

      return res.json({ success: true, data: activities });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const activity = await Activities.findByPk(id);
      if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

      return res.json({ success: true, data: activity });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getBySekolah(req, res) {
    try {
      const { sekolahId } = req.params;
      const { tipo } = req.query;

      const where = { sekolahId: parseInt(sekolahId), isActive: true };
      if (tipo) where.tipo = tipo;

      const activities = await Activities.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: activities });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { sekolahId, tipo, judul, deskripsi, tanggal, lokasi, coverUrl } = req.body;

      const activity = await Activities.create({
        sekolahId: parseInt(sekolahId),
        tipo,
        judul,
        deskripsi,
        tanggal,
        lokasi,
        coverUrl,
      });

      return res.json({ success: true, data: activity });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const activity = await Activities.findByPk(id);
      if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) activity[key] = updates[key];
      });
      await activity.save();

      return res.json({ success: true, data: activity });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const activity = await Activities.findByPk(id);
      if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

      activity.isActive = false;
      await activity.save();

      return res.json({ success: true, message: 'Activity deleted' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get recent activities for dashboard
  async getRecent(req, res) {
    try {
      const { schoolId, limit = 10 } = req.query;
      const where = { isActive: true };
      if (schoolId) where.sekolahId = parseInt(schoolId);

      const activities = await Activities.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
      });

      return res.json({ success: true, data: activities });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ActivitiesController();