const Materi = require('../models/materi');

class MateriController {
  async getAllMateri(req, res) {
    try {
      const { schoolId, kelas, mapel } = req.query;
      const where = {};
      if (schoolId) where.schoolId = parseInt(schoolId);
      if (kelas) where.kelas = kelas;
      if (mapel) where.mapel = mapel;

      const materis = await Materi.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      return res.json({ success: true, data: materis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getMateriById(req, res) {
    try {
      const { id } = req.params;
      const materi = await Materi.findByPk(id);
      if (!materi) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });

      return res.json({ success: true, data: materi });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getMateriByKelas(req, res) {
    try {
      const { kelasId } = req.params;
      const { mapelId } = req.query;

      const where = { kelasId: parseInt(kelasId), isActive: true };
      if (mapelId) where.mapelId = parseInt(mapelId);

      const materis = await Materi.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: materis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getMateriByGuru(req, res) {
    try {
      const { guruId } = req.params;
      const { mapelId } = req.query;

      const where = { guruId: parseInt(guruId), isActive: true };
      if (mapelId) where.mapelId = parseInt(mapelId);

      const materis = await Materi.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: materis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createMateri(req, res) {
    try {
      const { schoolId, mapel, kelas, bab, title, contentType, youtubeUrl, documentUrl, linkUrl, namaGuru, emailGuru, description, duration, teacherPhoto } = req.body;

      const materi = await Materi.create({
        schoolId: parseInt(schoolId),
        mapel,
        kelas,
        bab,
        title,
        contentType,
        youtubeUrl,
        documentUrl,
        linkUrl,
        namaGuru,
        emailGuru,
        description,
        duration,
        teacherPhoto,
      });

      return res.json({ success: true, data: materi });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateMateri(req, res) {
    try {
      const { id } = req.params;
      const { title, description, youtubeUrl, documentUrl, linkUrl, contentType, mapel, kelas, bab, duration } = req.body;

      const materi = await Materi.findByPk(id);
      if (!materi) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });

      if (title) materi.title = title;
      if (description) materi.description = description;
      if (youtubeUrl) materi.youtubeUrl = youtubeUrl;
      if (documentUrl) materi.documentUrl = documentUrl;
      if (linkUrl) materi.linkUrl = linkUrl;
      if (contentType) materi.contentType = contentType;
      if (mapel) materi.mapel = mapel;
      if (kelas) materi.kelas = kelas;
      if (bab) materi.bab = bab;
      if (duration) materi.duration = duration;
      await materi.save();

      return res.json({ success: true, data: materi });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteMateri(req, res) {
    try {
      const { id } = req.params;
      const materi = await Materi.findByPk(id);
      if (!materi) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });

      materi.isActive = false;
      await materi.save();

      return res.json({ success: true, message: 'Materi dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new MateriController();