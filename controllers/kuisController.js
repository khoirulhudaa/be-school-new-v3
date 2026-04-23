const { Kuis, Soal, HasilKuis } = require('../models/kuis');
const Siswa = require('../models/siswa');
const GuruTendik = require('../models/guruTendik');
const Materi = require('../models/materi');
const { Op } = require('sequelize');

class KuisController {
  // Helper: verify guru belongs to school
  async _verifyGuruSchool(guruId, schoolId) {
    const guru = await GuruTendik.findByPk(guruId, { attributes: ['id', 'schoolId'] });
    return guru && guru.schoolId === parseInt(schoolId);
  }

  // Helper: verify siswa belongs to school
  async _verifySiswaSchool(siswaId, schoolId) {
    const siswa = await Siswa.findByPk(siswaId, { attributes: ['id', 'schoolId'] });
    return siswa && siswa.schoolId === parseInt(schoolId);
  }

  async getAllKuis(req, res) {
    try {
      const { schoolId, kelasId, mapelId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      // Get all guru from this school
      const gurus = await GuruTendik.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id']
      });
      const guruIds = gurus.map(g => g.id);

      // Get all materi from this school
      const materis = await Materi.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id']
      });
      const materiIds = materis.map(m => m.id);

      const kuis = await Kuis.findAll({
        where: {
          aktif: 1,
          [Op.or]: [
            { guruId: { [Op.in]: guruIds } },
            { materiId: { [Op.in]: materiIds } }
          ]
        },
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      return res.json({ success: true, data: kuis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getKuisById(req, res) {
    try {
      const { id, schoolId } = req.params;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      const kuis = await Kuis.findByPk(id);
      if (!kuis) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });

      // Security: verify guru belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyGuruSchool(kuis.guruId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      return res.json({ success: true, data: kuis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getKuisByKelas(req, res) {
    try {
      const { kelasId, schoolId } = req.params;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      // Get all guru from this school
      const gurus = await GuruTendik.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id']
      });
      const guruIds = gurus.map(g => g.id);

      const kuis = await Kuis.findAll({
        where: {
          [Op.and]: [
            { kelasId: parseInt(kelasId) },
            { aktif: 1 },
            { guruId: { [Op.in]: guruIds } }
          ]
        },
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: kuis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getKuisByGuru(req, res) {
    try {
      const { guruId, schoolId } = req.params;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Security: verify guru belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyGuruSchool(guruId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const kuis = await Kuis.findAll({
        where: { guruId: parseInt(guruId), aktif: 1 },
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: kuis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createKuis(req, res) {
    try {
      const { sekolahId, guruId, kelasId, mapelId, judul, deskripsi, durasi, status } = req.body;
      const enforcedSchoolId = sekolahId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      // Security: verify guru belongs to school
      const isValid = await this._verifyGuruSchool(guruId, enforcedSchoolId);
      if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });

      const kuis = await Kuis.create({
        guruId: parseInt(guruId),
        kelasId: parseInt(kelasId) || null,
        materiId: parseInt(mapelId) || null,
        judul,
        deskripsi,
        waktuMenit: durasi || 30,
        aktif: 1,
      });

      return res.json({ success: true, data: kuis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateKuis(req, res) {
    try {
      const { id } = req.params;
      const { judul, deskripsi, durasi, status, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      const kuis = await Kuis.findByPk(id);
      if (!kuis) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });

      // Security: verify guru belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyGuruSchool(kuis.guruId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      if (judul) kuis.judul = judul;
      if (deskripsi) kuis.deskripsi = deskripsi;
      if (durasi) kuis.waktuMenit = durasi;
      if (status) kuis.aktif = status === 'published' ? 1 : 0;
      await kuis.save();

      return res.json({ success: true, data: kuis });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteKuis(req, res) {
    try {
      const { id } = req.params;
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      const kuis = await Kuis.findByPk(id);
      if (!kuis) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });

      // Security: verify guru belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyGuruSchool(kuis.guruId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      kuis.aktif = 0;
      await kuis.save();

      return res.json({ success: true, message: 'Kuis dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getSoalByKuis(req, res) {
    try {
      const { kuisId, schoolId } = req.params;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Verify kuis belongs to school
      if (enforcedSchoolId) {
        const kuis = await Kuis.findByPk(kuisId);
        if (!kuis) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });
        const isValid = await this._verifyGuruSchool(kuis.guruId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const soals = await Soal.findAll({
        where: { kuisId: parseInt(kuisId) },
        order: [['urutan', 'ASC']],
      });

      return res.json({ success: true, data: soals });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createSoal(req, res) {
    try {
      const { kuisId } = req.params;
      const { teksSoal, tipeSoal, options, jawabanBenar, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Security: verify kuis belongs to school
      if (enforcedSchoolId) {
        const kuis = await Kuis.findByPk(kuisId);
        if (!kuis) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });
        const isValid = await this._verifyGuruSchool(kuis.guruId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const soal = await Soal.create({
        kuisId: parseInt(kuisId),
        teksSoal,
        tipeSoal: tipeSoal || 'pg',
        options: options ? JSON.stringify(options) : null,
        jawabanBenar,
      });

      return res.json({ success: true, data: soal });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async submitJawaban(req, res) {
    try {
      const { kuisId } = req.params;
      const { siswaId, jawaban, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      // Security: verify siswa belongs to school
      const isValidSiswa = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
      if (!isValidSiswa) return res.status(403).json({ success: false, message: 'Akses ditolak' });

      // Security: verify kuis exists
      const kuis = await Kuis.findByPk(kuisId);
      if (!kuis) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });

      // Calculate score
      let benar = 0;
      let salah = 0;
      const jawabanUser = [];

      for (const jb of jawaban) {
        const soal = await Soal.findByPk(jb.soalId);
        const isCorrect = soal && soal.jawabanBenar === jb.jawaban;
        if (isCorrect) benar++;
        else salah++;
        jawabanUser.push({ soalId: jb.soalId, jawaban: jb.jawaban, benar: isCorrect });
      }

      const score = (benar / (benar + salah)) * 100;

      const hasil = await HasilKuis.create({
        kuisId: parseInt(kuisId),
        siswaId: parseInt(siswaId),
        score,
        jawabanUser: JSON.stringify(jawabanUser),
        benar,
        salah,
      });

      return res.json({ success: true, data: hasil });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getHasilKuis(req, res) {
    try {
      const { kuisId, siswaId } = req.params;
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      // Security: verify siswa belongs to school
      const isValidSiswa = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
      if (!isValidSiswa) return res.status(403).json({ success: false, message: 'Akses ditolak' });

      // Security: verify kuis belongs to school
      const kuis = await Kuis.findByPk(kuisId);
      if (!kuis) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });
      const isValidKuis = await this._verifyGuruSchool(kuis.guruId, enforcedSchoolId);
      if (!isValidKuis) return res.status(403).json({ success: false, message: 'Akses ditolak' });

      const hasil = await HasilKuis.findOne({
        where: {
          kuisId: parseInt(kuisId),
          siswaId: parseInt(siswaId),
        },
      });

      return res.json({ success: true, data: hasil });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new KuisController();
