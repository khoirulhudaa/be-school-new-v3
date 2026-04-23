const { Op } = require('sequelize');
const Tugas = require('../models/tugas');

// 1. TAMBAH TUGAS
exports.createTugas = async (req, res) => {
  try {
    const { 
      judul, namaGuru, emailGuru, deskripsi, jenisSoal, 
      nilaiMinimal, linkEksternal, hari, tanggal, deadlineJam, schoolId, kelas, mapel 
    } = req.body;

    const tugas = await Tugas.create({
      judul, namaGuru, emailGuru, deskripsi, jenisSoal,
      nilaiMinimal, linkEksternal, hari, tanggal, deadlineJam, kelas, mapel,
      schoolId
    });

    res.status(201).json({ success: true, message: 'Tugas berhasil dibuat', data: tugas });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. GET SEMUA TUGAS (Filter per sekolah)
exports.getAllTugas = async (req, res) => {
  try {
    const { guru, mapel, jenis, schoolId } = req.query;
    
    // Syarat utama: hanya mengambil data milik sekolah yang login
    let whereCondition = { schoolId };

    // Filter Nama Guru (Search partial)
    if (guru) {
      whereCondition.namaGuru = { [Op.iLike]: `%${guru}%` };
    }

    // Filter Mata Pelajaran (Search partial)
    if (mapel) {
      whereCondition.mataPelajaran = { [Op.iLike]: `%${mapel}%` };
    }

    // Filter Jenis Soal (Exact match)
    if (jenis) {
      whereCondition.jenisSoal = jenis;
    }

    const tugas = await Tugas.findAll({ 
      where: whereCondition,
      order: [
        ['tanggal', 'DESC'], 
        ['deadlineJam', 'DESC']
      ]
    });

    res.json({ 
      success: true, 
      count: tugas.length, 
      data: tugas 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat tugas: ' + err.message });
  }
};

// 3. GET DETAIL TUGAS
exports.getTugasById = async (req, res) => {
  try {
    const tugas = await Tugas.findOne({ where: { id: req.params.id, schoolId: req.user.id } });
    if (!tugas) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    res.json({ success: true, data: tugas });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// controllers/tugasController.js
exports.updateTugas = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body; // Ambil schoolId dari JSON body

    // Cari tugas berdasarkan ID dan schoolId
    const tugas = await Tugas.findOne({ 
      where: { 
        id: id, 
        schoolId: schoolId 
      } 
    });

    if (!tugas) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tugas tidak ditemukan' 
      });
    }

    // Update data
    await tugas.update(req.body);

    res.json({ 
      success: true, 
      message: 'Tugas berhasil diperbarui', 
      data: tugas 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. HAPUS TUGAS
exports.deleteTugas = async (req, res) => {
  const { id, schoolId } = req.params;
  try {
    const deleted = await Tugas.destroy({ where: { id, schoolId } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    res.json({ success: true, message: 'Tugas berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};