const GuruTendik = require('../models/guruTendik');
const Izin = require('../models/izin');
const Jadwal = require('../models/jadwal');
const Kehadiran = require('../models/kehadiran');
const Materi = require('../models/materi');
const Kuis = require('../models/kuis');
const Soal = require('../models/soal');
const Siswa = require('../models/siswa');
const Kelas = require('../models/kelas');
const SchoolProfile = require('../models/profileSekolah');
const { Op } = require('sequelize');

class GuruXpresensiController {
  // Get guru profile
  async getProfile(req, res) {
    try {
      const { guruId } = req.query;
      if (!guruId) return res.status(400).json({ success: false, message: 'guruId required' });

      const guru = await GuruTendik.findByPk(guruId, {
        attributes: { exclude: ['password'] },
      });

      if (!guru) return res.status(404).json({ success: false, message: 'Guru tidak ditemukan' });

      return res.json({ success: true, data: guru });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update guru biodata
  async updateBiodata(req, res) {
    try {
      const { id, Name, email, noHp } = req.body;
      if (!id) return res.status(400).json({ success: false, message: 'id required' });

      const guru = await GuruTendik.findByPk(id);
      if (!guru) return res.status(404).json({ success: false, message: 'Guru tidak ditemukan' });

      if (Name) guru.nama = Name;
      if (email) guru.email = email;
      if (noHp) guru.noHp = noHp;

      await guru.save();

      return res.json({ success: true, message: 'Biodata updated', data: guru });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get my izin (guru's own izin requests)
  async getMyIzin(req, res) {
    try {
      const { guruId } = req.query;
      if (!guruId) return res.status(400).json({ success: false, message: 'guruId required' });

      const izins = await Izin.findAll({
        where: { siswaId: parseInt(guruId), jenis: 'guru' },
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: izins });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get all izin requests for approval
  async getAllIzin(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const where = {};
      if (status) where.status = status;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await Izin.findAndCountAll({
        where,
        include: [{ model: Siswa, as: 'siswa', attributes: ['nama', 'nis'] }],
        order: [['createdAt', 'DESC']],
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

  // Get jadwal (schedule)
  async getJadwal(req, res) {
    try {
      const { guruId } = req.query;
      if (!guruId) return res.status(400).json({ success: false, message: 'guruId required' });

      const jadwals = await Jadwal.findAll({
        where: { guruId: parseInt(guruId), isActive: true },
        include: [{ model: Kelas, attributes: ['nama'] }],
        order: [['hari', 'ASC'], ['jamMulai', 'ASC']],
      });

      return res.json({ success: true, data: jadwals });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get nilai (grades)
  async getNilai(req, res) {
    try {
      const { siswaId, kelasId } = req.query;
      const where = {};
      if (siswaId) where.siswaId = parseInt(siswaId);
      if (kelasId) where.kelasId = parseInt(kelasId);

      const nilais = await require('../models/nilai').findAll({
        where,
        include: [
          { model: Siswa, attributes: ['nama', 'nis'] },
          { model: GuruTendik, attributes: ['nama'] },
        ],
        order: [['tanggal', 'DESC']],
      });

      return res.json({ success: true, data: nilais });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Post nilai
  async postNilai(req, res) {
    try {
      const { siswaId, guruId, mapel, nilai, deskripsi } = req.body;
      if (!siswaId || !guruId || !mapel || nilai === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const Nilai = require('../models/nilai');
      const newNilai = await Nilai.create({
        siswaId: parseInt(siswaId),
        guruId: parseInt(guruId),
        mapel,
        nilai: parseFloat(nilai),
        deskripsi,
        tanggal: new Date(),
      });

      return res.json({ success: true, data: newNilai });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get materi (materials)
  async getMateri(req, res) {
    try {
      const { emailGuru, kelasId, schoolId } = req.query;
      const where = {};
      if (emailGuru) where.guruId = emailGuru;
      if (kelasId) where.kelasId = parseInt(kelasId);
      if (schoolId) where.schoolId = parseInt(schoolId);

      const materis = await Materi.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: materis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Post materi
  async postMateri(req, res) {
    try {
      const { schoolId, guruId, kelasId, mapel, judul, deskripsi, tipe, fileUrl } = req.body;

      const materi = await Materi.create({
        schoolId: parseInt(schoolId),
        guruId,
        kelasId,
        mapel,
        judul,
        deskripsi,
        tipe: tipe || 'teks',
        fileUrl,
      });

      return res.json({ success: true, data: materi });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update materi
  async updateMateri(req, res) {
    try {
      const { id } = req.params;
      const { judul, deskripsi, tipe, fileUrl } = req.body;

      const materi = await Materi.findByPk(id);
      if (!materi) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });

      if (judul) materi.judul = judul;
      if (deskripsi) materi.deskripsi = deskripsi;
      if (tipe) materi.tipe = tipe;
      if (fileUrl) materi.fileUrl = fileUrl;

      await materi.save();
      return res.json({ success: true, data: materi });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Delete materi
  async deleteMateri(req, res) {
    try {
      const { id } = req.params;
      await Materi.destroy({ where: { id: parseInt(id) } });
      return res.json({ success: true, message: 'Materi dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get kuis
  async getKuis(req, res) {
    try {
      const { emailGuru } = req.query;
      const where = {};
      if (emailGuru) where.guruId = emailGuru;

      const kuisList = await Kuis.findAll({
        where,
        include: [{ model: Soal, attributes: ['id'] }],
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: kuisList });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get kuis by id
  async getKuisById(req, res) {
    try {
      const { id } = req.params;
      const kuis = await Kuis.findByPk(id, {
        include: [{ model: Soal, order: [['urutan', 'ASC']] }],
      });

      if (!kuis) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });

      return res.json({ success: true, data: kuis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Post kuis
  async postKuis(req, res) {
    try {
      const { materiId, guruId, judul, deskripsi, durasiMenit, batasWaktu } = req.body;

      const kuis = await Kuis.create({
        materiId,
        guruId,
        judul,
        deskripsi,
        durasiMenit: durasiMenit || 30,
        batasWaktu,
      });

      return res.json({ success: true, data: kuis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update kuis
  async updateKuis(req, res) {
    try {
      const { id } = req.params;
      const { judul, deskripsi, durasiMenit, batasWaktu, isActive } = req.body;

      const kuis = await Kuis.findByPk(id);
      if (!kuis) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });

      if (judul) kuis.judul = judul;
      if (deskripsi) kuis.deskripsi = deskripsi;
      if (durasiMenit) kuis.durasiMenit = durasiMenit;
      if (batasWaktu) kuis.batasWaktu = batasWaktu;
      if (isActive !== undefined) kuis.isActive = isActive;

      await kuis.save();
      return res.json({ success: true, data: kuis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Delete kuis
  async deleteKuis(req, res) {
    try {
      const { id } = req.params;
      await Kuis.destroy({ where: { id: parseInt(id) } });
      return res.json({ success: true, message: 'Kuis dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Post soal to kuis
  async postSoal(req, res) {
    try {
      const { kuisId } = req.params;
      const { pertanyaan, tipe, pilihan, jawabanBenar, poin, urutan } = req.body;

      const soal = await Soal.create({
        kuisId: parseInt(kuisId),
        pertanyaan,
        tipe: tipe || 'pilihan_ganda',
        pilihan,
        jawabanBenar,
        poin: poin || 10,
        urutan: urutan || 0,
      });

      return res.json({ success: true, data: soal });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Delete soal
  async deleteSoal(req, res) {
    try {
      const { soalId } = req.params;
      await Soal.destroy({ where: { id: parseInt(soalId) } });
      return res.json({ success: true, message: 'Soal dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get students in class
  async getSiswa(req, res) {
    try {
      const { classId } = req.query;
      if (!classId) return res.status(400).json({ success: false, message: 'classId required' });

      const students = await Siswa.findAll({
        where: { kelasId: parseInt(classId), isActive: true },
        attributes: ['id', 'nama', 'nis'],
        order: [['nama', 'ASC']],
      });

      return res.json({ success: true, data: students });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get attendance summary for guru
  async getAttendanceSummary(req, res) {
    try {
      const { guruId } = req.query;
      if (!guruId) return res.status(400).json({ success: false, message: 'guruId required' });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const hadir = await Kehadiran.count({
        where: { guruId: parseInt(guruId), tanggal: today, status: 'hadir' },
      });
      const izin = await Kehadiran.count({
        where: { guruId: parseInt(guruId), tanggal: today, status: 'izin' },
      });
      const sakit = await Kehadiran.count({
        where: { guruId: parseInt(guruId), tanggal: today, status: 'sakit' },
      });
      const alpha = await Kehadiran.count({
        where: { guruId: parseInt(guruId), tanggal: today, status: 'alpha' },
      });

      return res.json({
        success: true,
        data: { hadir, izin, sakit, alpha, tanggal: today },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get attendance status
  async getAttendanceStatus(req, res) {
    try {
      const { guruId } = req.query;
      if (!guruId) return res.status(400).json({ success: false, message: 'guruId required' });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const attendance = await Kehadiran.findOne({
        where: {
          guruId: parseInt(guruId),
          tanggal: { [Op.gte]: today, [Op.lt]: tomorrow },
        },
      });

      return res.json({
        success: true,
        data: {
          status: attendance?.status || 'alpha',
          jamMasuk: attendance?.jamMasuk || null,
          jamPulang: attendance?.jamPulang || null,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get info sekolah
  async getInfoSekolah(req, res) {
    try {
      const { guruId } = req.query;
      if (!guruId) return res.status(400).json({ success: false, message: 'guruId required' });

      const guru = await GuruTendik.findByPk(guruId);
      if (!guru) return res.status(404).json({ success: false, message: 'Guru tidak ditemukan' });

      const profile = await SchoolProfile.findOne({ where: { schoolId: guru.schoolId } });

      return res.json({ success: true, data: profile });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get chat rooms (placeholder - chat goes to port 4000)
  async getChatRooms(req, res) {
    try {
      // This endpoint redirects to chat server at port 4000
      return res.json({ success: true, data: [], message: 'Use chat server at port 4000' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get pending tasks for guru
  async getPendingTasks(req, res) {
    try {
      const { guruId } = req.query;
      if (!guruId) return res.status(400).json({ success: false, message: 'guruId required' });

      const pendingIzin = await Izin.count({
        where: { status: 'pending', approvedBy: null },
      });

      const pendingKuis = await Kuis.count({
        where: { guruId: parseInt(guruId), isActive: true },
      });

      return res.json({
        success: true,
        data: {
          pendingIzin,
          pendingKuis,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new GuruXpresensiController();
