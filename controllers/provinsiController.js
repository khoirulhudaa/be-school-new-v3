// src-provinsi/controllers/provinsiController.js
const { Op } = require('sequelize');
const Provinsi = require('../models/provinsi');

// GET semua provinsi (hanya nama)
exports.getAllProvinsi = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };

    if (search) {
      where.namaProvinsi = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Provinsi.findAndCountAll({
      where,
      attributes: ['id', 'namaProvinsi'],  // hanya ambil yang dibutuhkan
      order: [['namaProvinsi', 'ASC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: rows.map(p => ({
        id: p.id,
        namaProvinsi: p.namaProvinsi
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET satu provinsi berdasarkan ID (hanya nama)
exports.getProvinsiById = async (req, res) => {
  try {
    const { id } = req.params;

    const provinsi = await Provinsi.findOne({
      where: { id, isActive: true },
      attributes: ['id', 'namaProvinsi'],
    });

    if (!provinsi) {
      return res.status(404).json({ success: false, message: 'Provinsi tidak ditemukan' });
    }

    res.json({
      success: true,
      data: {
        id: provinsi.id,
        namaProvinsi: provinsi.namaProvinsi
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE provinsi baru (hanya nama)
exports.createProvinsi = async (req, res) => {
  try {
    const { namaProvinsi } = req.body;

    if (!namaProvinsi || typeof namaProvinsi !== 'string' || namaProvinsi.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'namaProvinsi wajib diisi dan tidak boleh kosong',
      });
    }

    const trimmedName = namaProvinsi.trim();

    // Cek duplikat (case-insensitive)
    const existing = await Provinsi.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('namaProvinsi')),
        sequelize.fn('LOWER', trimmedName)
      ),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Nama provinsi sudah ada',
      });
    }

    const provinsi = await Provinsi.create({
      namaProvinsi: trimmedName,
    });

    res.status(201).json({
      success: true,
      data: {
        id: provinsi.id,
        namaProvinsi: provinsi.namaProvinsi
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE provinsi (hanya nama)
exports.updateProvinsi = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaProvinsi } = req.body;

    if (!namaProvinsi || typeof namaProvinsi !== 'string' || namaProvinsi.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'namaProvinsi wajib diisi dan tidak boleh kosong',
      });
    }

    const provinsi = await Provinsi.findOne({
      where: { id, isActive: true },
    });

    if (!provinsi) {
      return res.status(404).json({ success: false, message: 'Provinsi tidak ditemukan' });
    }

    const trimmedName = namaProvinsi.trim();

    // Cek duplikat jika nama berubah
    if (trimmedName.toLowerCase() !== provinsi.namaProvinsi.toLowerCase()) {
      const existing = await Provinsi.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('namaProvinsi')),
          sequelize.fn('LOWER', trimmedName)
        ),
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Nama provinsi sudah digunakan',
        });
      }
    }

    provinsi.namaProvinsi = trimmedName;
    await provinsi.save();

    res.json({
      success: true,
      data: {
        id: provinsi.id,
        namaProvinsi: provinsi.namaProvinsi
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE (soft delete)
exports.deleteProvinsi = async (req, res) => {
  try {
    const { id } = req.params;

    const provinsi = await Provinsi.findOne({
      where: { id, isActive: true },
    });

    if (!provinsi) {
      return res.status(404).json({ success: false, message: 'Provinsi tidak ditemukan atau sudah dihapus' });
    }

    provinsi.isActive = false;
    await provinsi.save();

    res.json({ success: true, message: 'Provinsi berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};