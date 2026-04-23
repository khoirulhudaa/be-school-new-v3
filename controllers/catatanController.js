const { Catatan, CatatanGuru } = require('../models/catatan');
const { BkAssessments } = require('../models/bk_assessments');
const { Op } = require('sequelize');

class CatatanController {
  // Get catatan siswa (list all)
  async getCatatanSiswa(req, res) {
    try {
      const { siswaId } = req.params;
      const { page = 1, limit = 50, archived } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = { siswaId: parseInt(siswaId) };

      // Filter by archive status if provided
      if (archived !== undefined) {
        where.isArchived = archived === 'true' ? 1 : 0;
      }

      const { count, rows } = await Catatan.findAndCountAll({
        where,
        order: [
          ['isPinned', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit),
        offset,
      });

      return res.json({
        success: true,
        data: rows,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit) },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Create catatan siswa
  async createCatatanSiswa(req, res) {
    try {
      const { siswaId, judul, isi, warna, tanggal, isPinned, isArchived, isChecklist, checklist, labels } = req.body;

      const data = await Catatan.create({
        siswaId: parseInt(siswaId),
        judul,
        isi,
        warna: warna || '#FFFFF9C4',
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        isPinned: isPinned || false,
        isArchived: isArchived || false,
        isChecklist: isChecklist || false,
        checklist: checklist || [],
        labels: labels || [],
      });

      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update catatan siswa
  async updateCatatanSiswa(req, res) {
    try {
      const { id } = req.params;
      const { judul, isi, warna, tanggal, isPinned, isArchived, isChecklist, checklist, labels } = req.body;

      const catatan = await Catatan.findByPk(parseInt(id));
      if (!catatan) {
        return res.status(404).json({ success: false, message: 'Catatan tidak ditemukan' });
      }

      await catatan.update({
        judul: judul !== undefined ? judul : catatan.judul,
        isi: isi !== undefined ? isi : catatan.isi,
        warna: warna !== undefined ? warna : catatan.warna,
        tanggal: tanggal ? new Date(tanggal) : catatan.tanggal,
        isPinned: isPinned !== undefined ? isPinned : catatan.isPinned,
        isArchived: isArchived !== undefined ? isArchived : catatan.isArchived,
        isChecklist: isChecklist !== undefined ? isChecklist : catatan.isChecklist,
        checklist: checklist !== undefined ? checklist : catatan.checklist,
        labels: labels !== undefined ? labels : catatan.labels,
      });

      return res.json({ success: true, data: catatan });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Delete catatan siswa
  async deleteCatatanSiswa(req, res) {
    try {
      const { id } = req.params;

      const catatan = await Catatan.findByPk(parseInt(id));
      if (!catatan) {
        return res.status(404).json({ success: false, message: 'Catatan tidak ditemukan' });
      }

      await catatan.destroy();
      return res.json({ success: true, message: 'Catatan berhasil dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Toggle archive catatan
  async toggleArchiveCatatan(req, res) {
    try {
      const { id } = req.params;

      const catatan = await Catatan.findByPk(parseInt(id));
      if (!catatan) {
        return res.status(404).json({ success: false, message: 'Catatan tidak ditemukan' });
      }

      await catatan.update({ isArchived: !catatan.isArchived });
      return res.json({ success: true, data: catatan });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Toggle pin catatan
  async togglePinCatatan(req, res) {
    try {
      const { id } = req.params;

      const catatan = await Catatan.findByPk(parseInt(id));
      if (!catatan) {
        return res.status(404).json({ success: false, message: 'Catatan tidak ditemukan' });
      }

      await catatan.update({ isPinned: !catatan.isPinned });
      return res.json({ success: true, data: catatan });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get catatan guru (catatan from guru about students)
  async getCatatanGuru(req, res) {
    try {
      const { guruId } = req.params;
      const { kelasId, date } = req.query;

      const where = { guruId: parseInt(guruId) };
      if (kelasId) where.kelasId = parseInt(kelasId);
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt = { [Op.gte]: startDate, [Op.lt]: endDate };
      }

      const catatans = await CatatanGuru.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      return res.json({ success: true, data: catatans });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Create catatan guru
  async createCatatanGuru(req, res) {
    try {
      const { siswaId, guruId, kelasId, catatan, kategori } = req.body;

      const data = await CatatanGuru.create({
        siswaId: parseInt(siswaId),
        guruId: parseInt(guruId),
        kelasId: parseInt(kelasId),
        catatan,
        kategori,
      });

      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get BK assessments for siswa
  async getBkAssessments(req, res) {
    try {
      const { siswaId } = req.params;
      const { tipo } = req.query;

      const where = { siswaId: parseInt(siswaId) };
      if (tipo) where.tipo = tipo;

      const assessments = await BkAssessments.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      return res.json({ success: true, data: assessments });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Create BK assessment
  async createBkAssessment(req, res) {
    try {
      const { siswaId, guruId, tipo, descripcion, fecha, estado } = req.body;

      const data = await BkAssessments.create({
        siswaId: parseInt(siswaId),
        guruId: parseInt(guruId),
        tipo,
        descripcion,
        fecha,
        estado,
      });

      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CatatanController();