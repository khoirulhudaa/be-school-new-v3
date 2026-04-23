const BkKuis = require('../models/bkKuis');
const BkSoal = require('../models/bkSoal');
const BkHasil = require('../models/bkHasil');
const BkJadwal = require('../models/bkJadwal');
const { Op, Sequelize } = require('sequelize');

// ══════════════════════════════════════════════
// KUIS CRUD
// ══════════════════════════════════════════════

exports.getKuis = async (req, res) => {
  try {
    const { schoolId, page = 1, limit = 10, kategori } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId wajib' });

    const where = { schoolId: parseInt(schoolId), isActive: true };
    if (kategori) where.kategori = kategori;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await BkKuis.findAndCountAll({
      where,
      attributes: {
        include: [
          // Subquery untuk menghitung soal Likert
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM bk_soal AS soal
              WHERE soal.kuisId = BkKuis.id AND soal.tipe = 'likert'
            )`),
            'jmlSoalLikert'
          ],
          // Subquery untuk menghitung soal Essay
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM bk_soal AS soal
              WHERE soal.kuisId = BkKuis.id AND soal.tipe = 'essay'
            )`),
            'jmlSoalEssay'
          ]
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({ 
      success: true, 
      data: rows, 
      total: count, 
      page: parseInt(page), 
      totalPages: Math.ceil(count / limit) 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getKuisById = async (req, res) => {
  try {
    const kuis = await BkKuis.findByPk(req.params.id);
    if (!kuis || !kuis.isActive) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });

    const soal = await BkSoal.findAll({ where: { kuisId: kuis.id }, order: [['urutan', 'ASC']] });
    res.json({ success: true, data: { ...kuis.toJSON(), soal } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createKuis = async (req, res) => {
  try {
    const { schoolId, judul, deskripsi, kategori, soal } = req.body;
    if (!schoolId || !judul || !kategori) return res.status(400).json({ success: false, message: 'schoolId, judul, kategori wajib' });

    const kuis = await BkKuis.create({ schoolId, judul, deskripsi, kategori, createdBy: req.user?.id });

    if (soal && Array.isArray(soal) && soal.length > 0) {
      const soalData = soal.map((s, idx) => ({
        kuisId: kuis.id,
        tipe: s.tipe || 'likert',
        pertanyaan: s.pertanyaan,
        urutan: s.urutan ?? idx,
        labelOpsi0: s.labelOpsi0 || 'Tidak Pernah',
        labelOpsi1: s.labelOpsi1 || 'Kadang-Kadang',
        labelOpsi2: s.labelOpsi2 || 'Sering',
      }));
      await BkSoal.bulkCreate(soalData);
    }

    const result = await BkKuis.findByPk(kuis.id);
    const soalList = await BkSoal.findAll({ where: { kuisId: kuis.id }, order: [['urutan', 'ASC']] });

    res.status(201).json({ success: true, data: { ...result.toJSON(), soal: soalList } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateKuis = async (req, res) => {
  try {
    const kuis = await BkKuis.findByPk(req.params.id);
    if (!kuis) {
      return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });
    }

    const { judul, deskripsi, kategori, soal } = req.body;

    // Update data kuis utama
    if (judul !== undefined) kuis.judul = judul;
    if (deskripsi !== undefined) kuis.deskripsi = deskripsi;
    if (kategori !== undefined) kuis.kategori = kategori;
    await kuis.save();

    // === SYNC SOAL (HAPUS SEMUA & BUAT ULANG) ===
    if (soal && Array.isArray(soal)) {
      // 1. Hapus semua soal lama
      await BkSoal.destroy({ where: { kuisId: kuis.id } });

      // 2. Siapkan soal baru (PASTIKAN kuisId selalu ada)
      const validSoal = soal
        .filter(s => s.pertanyaan && String(s.pertanyaan).trim() !== '')
        .map((s, idx) => ({
          kuisId: kuis.id,                    // ← INI YANG PENTING!
          tipe: s.tipe || 'likert',
          pertanyaan: String(s.pertanyaan).trim(),
          urutan: s.urutan ?? idx,
          labelOpsi0: s.labelOpsi0 || 'Tidak Pernah',
          labelOpsi1: s.labelOpsi1 || 'Kadang-Kadang',
          labelOpsi2: s.labelOpsi2 || 'Sering',
        }));

      if (validSoal.length > 0) {
        await BkSoal.bulkCreate(validSoal);
      }
    }

    // 3. Ambil data terbaru
    const soalList = await BkSoal.findAll({
      where: { kuisId: kuis.id },
      order: [['urutan', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        ...kuis.toJSON(),
        soal: soalList
      }
    });

  } catch (err) {
    console.error("Error updateKuis:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.deleteKuis = async (req, res) => {
  try {
    const kuis = await BkKuis.findByPk(req.params.id);
    if (!kuis) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan' });
    kuis.isActive = false;
    await kuis.save();
    res.json({ success: true, message: 'Kuis berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════
// SOAL CRUD
// ══════════════════════════════════════════════

exports.getSoalByKuis = async (req, res) => {
  try {
    const soal = await BkSoal.findAll({ where: { kuisId: req.params.kuisId }, order: [['urutan', 'ASC']] });
    res.json({ success: true, data: soal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSoal = async (req, res) => {
  try {
    const { kuisId, tipe, pertanyaan, urutan, labelOpsi0, labelOpsi1, labelOpsi2 } = req.body;
    if (!kuisId || !pertanyaan) return res.status(400).json({ success: false, message: 'kuisId dan pertanyaan wajib' });

    const soal = await BkSoal.create({ kuisId, tipe: tipe || 'likert', pertanyaan, urutan: urutan || 0, labelOpsi0, labelOpsi1, labelOpsi2 });
    res.status(201).json({ success: true, data: soal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSoal = async (req, res) => {
  try {
    const soal = await BkSoal.findByPk(req.params.id);
    if (!soal) return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });

    const { tipe, pertanyaan, urutan, labelOpsi0, labelOpsi1, labelOpsi2 } = req.body;
    if (tipe !== undefined) soal.tipe = tipe;
    if (pertanyaan !== undefined) soal.pertanyaan = pertanyaan;
    if (urutan !== undefined) soal.urutan = urutan;
    if (labelOpsi0 !== undefined) soal.labelOpsi0 = labelOpsi0;
    if (labelOpsi1 !== undefined) soal.labelOpsi1 = labelOpsi1;
    if (labelOpsi2 !== undefined) soal.labelOpsi2 = labelOpsi2;
    await soal.save();

    res.json({ success: true, data: soal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSoal = async (req, res) => {
  try {
    const soal = await BkSoal.findByPk(req.params.id);
    if (!soal) return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });
    await soal.destroy();
    res.json({ success: true, message: 'Soal berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────
// Helper: Hitung level dan tindak lanjut
// ──────────────────────────────────────────────
function hitungLevel(totalSkor, maxSkor) {
  if (maxSkor === 0) return { level: 'baik', tindakLanjut: 'apresiasi', persentase: 0 };
  const persen = (totalSkor / maxSkor) * 100;
  let level, tindakLanjut;
  if (persen <= 30) {
    level = 'baik';
    tindakLanjut = 'apresiasi';
  } else if (persen <= 60) {
    level = 'perlu_perhatian';
    tindakLanjut = 'konseling_individu';
  } else {
    level = 'perlu_intervensi';
    tindakLanjut = 'konseling_intensif';
  }
  return { level, tindakLanjut, persentase: parseFloat(persen.toFixed(2)) };
}

// ══════════════════════════════════════════════
// SUBMIT KUIS (Siswa mengisi kuis)
// ══════════════════════════════════════════════

exports.submitKuis = async (req, res) => {
  try {
    const { kuisId, siswaId, namaSiswa, kelasSiswa, schoolId, jawaban } = req.body;
    if (!kuisId || !siswaId || !namaSiswa || !schoolId || !jawaban)
      return res.status(400).json({ success: false, message: 'kuisId, siswaId, namaSiswa, schoolId, jawaban wajib' });

    const kuis = await BkKuis.findByPk(kuisId);
    if (!kuis || !kuis.isActive) return res.status(404).json({ success: false, message: 'Kuis tidak ditemukan atau tidak aktif' });

    const semuaSoal = await BkSoal.findAll({ where: { kuisId } });

    let totalSkor = 0;
    let maxSkor = 0;
    const jawabanLikert = {};
    const jawabanEssay = {};

    for (const soal of semuaSoal) {
      const jawab = jawaban[soal.id];
      if (soal.tipe === 'likert') {
        maxSkor += 2;
        const nilai = parseInt(jawab);
        if (!isNaN(nilai) && nilai >= 0 && nilai <= 2) {
          totalSkor += nilai;
          jawabanLikert[soal.id] = nilai;
        }
      } else if (soal.tipe === 'essay') {
        jawabanEssay[soal.id] = jawab || '';
      }
    }

    const { level, tindakLanjut, persentase } = hitungLevel(totalSkor, maxSkor);

    const hasil = await BkHasil.create({
      kuisId,
      siswaId,
      namaSiswa,
      kelasSiswa,
      schoolId,
      totalSkorLikert: totalSkor,
      maxSkorLikert: maxSkor,
      persentaseSkor: persentase,
      levelMasalah: level,
      tindakLanjut,
      jawabanLikert,
      jawabanEssay,
    });

    res.status(201).json({
      success: true,
      message: 'Kuis berhasil dikumpulkan',
      data: {
        hasilId: hasil.id,
        totalSkor,
        maxSkor,
        persentase,
        levelMasalah: level,
        tindakLanjut,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════
// HASIL KUIS
// ══════════════════════════════════════════════

exports.getHasil = async (req, res) => {
  try {
    const { schoolId, kuisId, siswaId, level, page = 1, limit = 10, sudahDitindaklanjuti } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId wajib' });

    const where = { schoolId: parseInt(schoolId) };
    if (kuisId) where.kuisId = parseInt(kuisId);
    if (siswaId) where.siswaId = parseInt(siswaId);
    if (level) where.levelMasalah = level;
    if (sudahDitindaklanjuti !== undefined) where.sudahDitindaklanjuti = sudahDitindaklanjuti === 'true';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await BkHasil.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit: parseInt(limit), offset,
    });

    res.json({ success: true, data: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getHasilById = async (req, res) => {
  try {
    const hasil = await BkHasil.findByPk(req.params.id);
    if (!hasil) return res.status(404).json({ success: false, message: 'Hasil tidak ditemukan' });

    const kuis = await BkKuis.findByPk(hasil.kuisId);
    const soal = await BkSoal.findAll({ where: { kuisId: hasil.kuisId }, order: [['urutan', 'ASC']] });

    res.json({ success: true, data: { ...hasil.toJSON(), kuis, soal } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCatatanHasil = async (req, res) => {
  try {
    const hasil = await BkHasil.findByPk(req.params.id);
    if (!hasil) return res.status(404).json({ success: false, message: 'Hasil tidak ditemukan' });

    const { catatanGuru, sudahDitindaklanjuti } = req.body;
    if (catatanGuru !== undefined) hasil.catatanGuru = catatanGuru;
    if (sudahDitindaklanjuti !== undefined) hasil.sudahDitindaklanjuti = sudahDitindaklanjuti;
    await hasil.save();

    res.json({ success: true, data: hasil });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStatistik = async (req, res) => {
  try {
    const { schoolId, kuisId } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId wajib' });

    const where = { schoolId: parseInt(schoolId) };
    if (kuisId) where.kuisId = parseInt(kuisId);

    const [total, baik, perluPerhatian, perluIntervensi, belumDitindak] = await Promise.all([
      BkHasil.count({ where }),
      BkHasil.count({ where: { ...where, levelMasalah: 'baik' } }),
      BkHasil.count({ where: { ...where, levelMasalah: 'perlu_perhatian' } }),
      BkHasil.count({ where: { ...where, levelMasalah: 'perlu_intervensi' } }),
      BkHasil.count({ where: { ...where, sudahDitindaklanjuti: false, levelMasalah: { [Op.in]: ['perlu_perhatian', 'perlu_intervensi'] } } }),
    ]);

    res.json({
      success: true,
      data: { total, baik, perluPerhatian, perluIntervensi, belumDitindaklanjuti: belumDitindak }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════
// JADWAL
// ══════════════════════════════════════════════

exports.getJadwal = async (req, res) => {
  try {
    const { schoolId, siswaId, status, tanggalMulai, tanggalAkhir, page = 1, limit = 10 } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId wajib' });

    const where = { schoolId: parseInt(schoolId) };
    if (siswaId) where.siswaId = parseInt(siswaId);
    if (status) where.status = status;
    if (tanggalMulai && tanggalAkhir) where.tanggal = { [Op.between]: [tanggalMulai, tanggalAkhir] };
    else if (tanggalMulai) where.tanggal = { [Op.gte]: tanggalMulai };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await BkJadwal.findAndCountAll({ where, order: [['tanggal', 'ASC'], ['jamMulai', 'ASC']], limit: parseInt(limit), offset });

    res.json({ success: true, data: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createJadwal = async (req, res) => {
  try {
    const { schoolId, hasilId, siswaId, namaSiswa, kelasSiswa, judulPertemuan, deskripsi, tanggal, jamMulai, jamSelesai, lokasi, catatan } = req.body;
    if (!schoolId || !siswaId || !namaSiswa || !judulPertemuan || !tanggal || !jamMulai || !jamSelesai)
      return res.status(400).json({ success: false, message: 'Kolom wajib: schoolId, siswaId, namaSiswa, judulPertemuan, tanggal, jamMulai, jamSelesai' });

    const jadwal = await BkJadwal.create({
      schoolId, hasilId: hasilId || null, siswaId, namaSiswa, kelasSiswa,
      judulPertemuan, deskripsi, tanggal, jamMulai, jamSelesai, lokasi, catatan,
      createdBy: req.user?.id,
    });

    // Jika dari hasil kuis, tandai sudah ditindaklanjuti
    if (hasilId) {
      await BkHasil.update({ sudahDitindaklanjuti: true }, { where: { id: hasilId } });
    }

    res.status(201).json({ success: true, data: jadwal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateJadwal = async (req, res) => {
  try {
    const jadwal = await BkJadwal.findByPk(req.params.id);
    if (!jadwal) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });

    const fields = ['judulPertemuan', 'deskripsi', 'tanggal', 'jamMulai', 'jamSelesai', 'lokasi', 'status', 'catatan'];
    for (const f of fields) {
      if (req.body[f] !== undefined) jadwal[f] = req.body[f];
    }
    await jadwal.save();

    res.json({ success: true, data: jadwal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteJadwal = async (req, res) => {
  try {
    const jadwal = await BkJadwal.findByPk(req.params.id);
    if (!jadwal) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    await jadwal.destroy();
    res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function hitungSkorGabungan(totalLikert, maxLikert, totalEssay, maxEssay) {
  const totalDapat = (totalLikert || 0) + (totalEssay || 0);
  const totalMax = (maxLikert || 0) + (maxEssay || 0);

  if (totalMax === 0) return { level: 'baik', tindakLanjut: 'apresiasi', persentase: 0 };

  const persen = (totalDapat / totalMax) * 100;
  let level, tindakLanjut;

  if (persen <= 30) {
    level = 'baik';
    tindakLanjut = 'apresiasi';
  } else if (persen <= 60) {
    level = 'perlu_perhatian';
    tindakLanjut = 'konseling_individu';
  } else {
    level = 'perlu_intervensi';
    tindakLanjut = 'konseling_intensif';
  }

  return { 
    level, 
    tindakLanjut, 
    persentase: parseFloat(persen.toFixed(2)) 
  };
}

// ══════════════════════════════════════════════
// UPDATE ESSAY SCORE
// ══════════════════════════════════════════════
exports.updateEssayScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { skorEssay, catatanEssay } = req.body;

    // 1. Validasi input
    if (!skorEssay || typeof skorEssay !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: 'skorEssay harus berupa object (e.g. { "soalId": nilai })' 
      });
    }

    // 2. Cari data hasil
    const hasil = await BkHasil.findByPk(id);
    if (!hasil) {
      return res.status(404).json({ success: false, message: 'Hasil tidak ditemukan' });
    }

    // 3. Update data JSON (merge dengan data lama jika ada)
    hasil.skorEssay = { ...(hasil.skorEssay || {}), ...skorEssay };
    
    if (catatanEssay && typeof catatanEssay === 'object') {
      hasil.catatanEssay = { ...(hasil.catatanEssay || {}), ...catatanEssay };
    }

    // 4. Hitung ulang totalSkorEssay dan maxSkorEssay
    // Kita asumsikan max score per soal essay adalah 100
    const currentSkorEntries = Object.entries(hasil.skorEssay);
    let totalSkorEssay = 0;
    
    currentSkorEntries.forEach(([_, nilai]) => {
      totalSkorEssay += parseInt(nilai) || 0;
    });

    const jumlahSoalEssay = currentSkorEntries.length;
    const maxSkorEssay = jumlahSoalEssay * 100;

    hasil.totalSkorEssay = totalSkorEssay;
    hasil.maxSkorEssay = maxSkorEssay;

    // 5. RE-KALKULASI SKOR AKHIR GABUNGAN
    // Ini akan memperbarui levelMasalah dan tindakLanjut berdasarkan nilai baru
    const kalkulasiBaru = hitungSkorGabungan(
      hasil.totalSkorLikert,
      hasil.maxSkorLikert,
      totalSkorEssay,
      maxSkorEssay
    );

    hasil.persentaseSkor = kalkulasiBaru.persentase;
    hasil.levelMasalah = kalkulasiBaru.level;
    hasil.tindakLanjut = kalkulasiBaru.tindakLanjut;
    // 6. Simpan ke Database
    await hasil.save();

    res.json({
      success: true,
      message: 'Penilaian essay berhasil diperbarui',
      data: {
        ...hasil.toJSON(), // Mengirimkan seluruh objek hasil yang sudah di-save
        persentaseSkor: hasil.persentaseSkor,
        levelMasalah: hasil.levelMasalah,
        tindakLanjut: hasil.tindakLanjut,
        totalSkorEssay: hasil.totalSkorEssay,
        maxSkorEssay: hasil.maxSkorEssay,
        skorEssay: hasil.skorEssay
      }
    });

  } catch (err) {
    console.error("Error updateEssayScore:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};