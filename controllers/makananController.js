const { Op } = require('sequelize');
const sequelize = require('../config/database');
const M = require('../models/makanan');
const NutrisiLog = require('../models/nutrisi_log');

// GET /makanan - List semua makanan
exports.getMakanan = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || 1;
    const { kategori, search, barcode, limit = 50 } = req.query;
    
    let where = { is_approved: true, schoolId };
    if (kategori) where.kategori = kategori;
    if (barcode) where.barcode = barcode;
    if (search) where.nama = { [Op.like]: `%${search}%` };
    
    const foods = await M.findAll({
      where,
      limit: parseInt(limit),
      order: [['nama', 'ASC']]
    });
    
    res.json({ success: true, data: foods, count: foods.length });
  } catch (err) {
    console.error('[makananController.getMakanan]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /makanan/:id
exports.getMakananById = async (req, res) => {
  try {
    const food = await M.findByPk(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: 'Makanan tidak ditemukan' });
    res.json({ success: true, data: food });
  } catch (err) {
    console.error('[makananController.getMakananById]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /makanan - Tambah makanan baru
exports.createMakanan = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || 1;
    const { barcode, nama, kategori, sub_kategori, kalori, protein_g, lemak_g, karbo_g, fiber_g, serving_size, foto_url } = req.body;
    
    if (!nama || !kategori) {
      return res.status(400).json({ success: false, message: 'Nama dan kategori wajib diisi' });
    }
    
    const food = await M.create({
      schoolId, barcode, nama, kategori, sub_kategori, kalori, protein_g, lemak_g, karbo_g, fiber_g, serving_size, foto_url,
      created_by: req.user?.id,
      is_approved: req.user?.role === 'admin' ? true : false
    });
    
    res.json({ success: true, data: food, message: 'Makanan berhasil ditambahkan' });
  } catch (err) {
    console.error('[makananController.createMakanan]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /makanan/kategori/:kategori
exports.getByKategori = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || 1;
    const foods = await M.findAll({
      where: { kategori: req.params.kategori, is_approved: true, schoolId },
      order: [['nama', 'ASC']]
    });
    res.json({ success: true, data: foods, count: foods.length });
  } catch (err) {
    console.error('[makananController.getByKategori]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /makanan/search/:query
exports.searchMakanan = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || 1;
    const foods = await M.findAll({
      where: { nama: { [Op.like]: `%${req.params.query}%` }, is_approved: true, schoolId },
      limit: 20,
      order: [['nama', 'ASC']]
    });
    res.json({ success: true, data: foods, count: foods.length });
  } catch (err) {
    console.error('[makananController.searchMakanan]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /makanan/barcode/:code
exports.getByBarcode = async (req, res) => {
  try {
    const food = await M.findOne({ where: { barcode: req.params.code } });
    if (!food) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan', barcode: req.params.code });
    res.json({ success: true, data: food, found: true });
  } catch (err) {
    console.error('[makananController.getByBarcode]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
