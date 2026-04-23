const Students = require('../models/siswa');
const Izin = require('../models/izin');
const { Kehadiran } = require('../models/kehadiran');
const { Op } = require('sequelize');

class OrtuDashboardController {
  // Get dashboard ortu
  async getDashboard(req, res) {
    try {
      const { ortuId } = req.query;
      if (!ortuId) return res.status(400).json({ success: false, message: 'ortuId required' });

      const anak = await Students.findAll({
        where: { orangTuaId: parseInt(ortuId), isActive: true },
        include: [{ model: require('../models/kelas'), as: 'kelas' }],
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dataAnak = await Promise.all(anak.map(async (s) => {
        const hadir = await Kehadiran.count({
          where: {
            siswaId: s.id,
            createdAt: { [Op.gte]: today },
            status: 'hadir',
          },
        });
        const izin = await Izin.count({
          where: {
            siswaId: s.id,
            tanggalMulai: { [Op.lte]: today },
            tanggalAkhir: { [Op.gte]: today },
            status: 'approved',
          },
        });
        return {
          id: s.id,
          nama: s.nama,
          nis: s.nis,
          kelas: s.kelas ? s.kelas.nama : '-',
          status: izin > 0 ? 'izin' : hadir > 0 ? 'hadir' : 'tidak hadir',
        };
      }));

      return res.json({ success: true, data: dataAnak });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get all anak (children)
  async getAnak(req, res) {
    try {
      const { ortuId } = req.query;
      if (!ortuId) return res.status(400).json({ success: false, message: 'ortuId required' });

      const anak = await Students.findAll({
        where: { orangTuaId: parseInt(ortuId), isActive: true },
        attributes: ['id', 'nama', 'nis', 'kelasId'],
        include: [{ model: require('../models/kelas'), as: 'kelas', attributes: ['id', 'nama'] }],
      });

      return res.json({ success: true, data: anak });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get kehadiran anak
  async getKehadiranAnak(req, res) {
    try {
      const { anakId } = req.params;
      const { startDate, endDate } = req.query;

      const where = { siswaId: parseInt(anakId) };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      const kehadiran = await Kehadiran.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      return res.json({ success: true, data: kehadiran });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get izin anak
  async getIzinAnak(req, res) {
    try {
      const { anakId } = req.params;
      const { status } = req.query;

      const where = { siswaId: parseInt(anakId) };
      if (status) where.status = status;

      const izins = await Izin.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: izins });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get tugas anak
  async getTugasAnak(req, res) {
    try {
      const { anakId } = req.params;
      const { status } = req.query;

      const Tugas = require('../models/tugas');
      const where = { siswaId: parseInt(anakId) };
      if (status) where.status = status;

      const tugass = await Tugas.findAll({
        where,
        order: [['tanggal', 'DESC']],
        limit: 50,
      });

      return res.json({ success: true, data: tugass });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get nilai anak
  async getNilaiAnak(req, res) {
    try {
      const { anakId } = req.params;
      const { mapelId, semester } = req.query;

      const { Nilai } = require('../models/nilai');
      const where = { siswaId: parseInt(anakId) };
      if (mapelId) where.mapelId = parseInt(mapelId);
      if (semester) where.semester = semester;

      const nilais = await Nilai.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      return res.json({ success: true, data: nilais });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get jadwal anak
  async getJadwalAnak(req, res) {
    try {
      const { anakId } = req.params;
      const { hari } = req.query;

      const siswa = await Students.findByPk(anakId);
      if (!siswa) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });

      const Jadwal = require('../models/jadwal');
      const where = { kelasId: siswa.kelasId };
      if (hari) where.hari = hari;

      const jadwals = await Jadwal.findAll({
        where,
        order: [['hari', 'ASC'], ['jamMulai', 'ASC']],
      });

      return res.json({ success: true, data: jadwals });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Create izin for anak
  async createIzinAnak(req, res) {
    try {
      const { anakId } = req.params;
      const { jenis, tanggalMulai, tanggalAkhir, deskripsi } = req.body;

      const izin = await Izin.create({
        siswaId: parseInt(anakId),
        jenis,
        tanggalMulai,
        tanggalAkhir,
        deskripsi,
        status: 'pending',
      });

      return res.json({ success: true, data: izin });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new OrtuDashboardController();