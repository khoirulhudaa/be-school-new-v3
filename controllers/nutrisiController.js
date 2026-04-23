const { Op } = require('sequelize');
const sequelize = require('../config/database');
const NutrisiLog = require('../models/nutrisi_log');
const Makanan = require('../models/makanan');
const Student = require('../models/siswa');

// POST /nutrisi/log
exports.logMakanan = async (req, res) => {
  try {
    const { siswa_id, makanan_id, tanggal, waktu_makan, porsi = 1, foto_bukti } = req.body;
    
    if (!siswa_id || !makanan_id || !tanggal || !waktu_makan) {
      return res.status(400).json({ success: false, message: 'siswa_id, makanan_id, tanggal, dan waktu_makan wajib diisi' });
    }
    
    const makanan = await Makanan.findByPk(makanan_id);
    if (!makanan) return res.status(404).json({ success: false, message: 'Makanan tidak ditemukan' });
    
    const log = await NutrisiLog.create({
      siswa_id, makanan_id, tanggal, waktu_makan, porsi,
      foto_bukti,
      source: foto_bukti ? 'ai_analyze' : 'manual'
    });
    
    await updateMBGDaily(siswa_id, tanggal);
    
    res.json({ success: true, data: log, makanan });
  } catch (err) {
    console.error('[nutrisiController.logMakanan]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /nutrisi/:siswaId
exports.getLogHarian = async (req, res) => {
  try {
    const { siswaId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    const logs = await NutrisiLog.findAll({
      where: { siswa_id: siswaId, tanggal: date },
      include: [{ model: Makanan, as: 'Makanan' }],
      order: [['created_at', 'ASC']]
    });
    
    const totals = logs.reduce((acc, log) => {
      const m = log.Makanan;
      if (!m) return acc;
      acc.kalori += (m.kalori * log.porsi);
      acc.protein += (parseFloat(m.protein_g) * log.porsi);
      acc.lemak += (parseFloat(m.lemak_g) * log.porsi);
      acc.karbo += (parseFloat(m.karbo_g) * log.porsi);
      acc.fiber += (parseFloat(m.fiber_g) * log.porsi);
      return acc;
    }, { kalori: 0, protein: 0, lemak: 0, karbo: 0, fiber: 0 });
    
    const kategoriTerdeteksi = [...new Set(logs.map(l => l.Makanan?.kategori).filter(Boolean))];
    
    res.json({ 
      success: true, 
      data: { logs, totals, tanggal: date },
      summary: {
        total_items: logs.length,
        kalori: Math.round(totals.kalori),
        protein: totals.protein.toFixed(1),
        lemak: totals.lemak.toFixed(1),
        karbo: totals.karbo.toFixed(1),
        fiber: totals.fiber.toFixed(1),
        mbg: {
          karbo: kategoriTerdeteksi.includes('karbo'),
          protein: kategoriTerdeteksi.includes('protein'),
          sayur: kategoriTerdeteksi.includes('sayur'),
          buah: kategoriTerdeteksi.includes('buah'),
          susu: kategoriTerdeteksi.includes('susu'),
          score: kategoriTerdeteksi.length * 20,
          badge: kategoriTerdeteksi.length >= 5 ? 'perfect' : kategoriTerdeteksi.length >= 3 ? 'alright' : kategoriTerdeteksi.length >= 2 ? 'almost' : 'none'
        }
      }
    });
  } catch (err) {
    console.error('[nutrisiController.getLogHarian]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /nutrisi/:siswaId/week
exports.getLogMingguan = async (req, res) => {
  try {
    const { siswaId } = req.params;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    
    const logs = await NutrisiLog.findAll({
      where: {
        siswa_id: siswaId,
        tanggal: { [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]] }
      },
      include: [{ model: Makanan, as: 'Makanan' }],
      order: [['tanggal', 'ASC']]
    });
    
    const dailySummary = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailySummary[dateStr] = { kalori: 0, protein: 0, lemak: 0, karbo: 0, fiber: 0, items: 0, mbg_score: 0 };
    }
    
    logs.forEach(log => {
      if (dailySummary[log.tanggal] && log.Makanan) {
        const m = log.Makanan;
        dailySummary[log.tanggal].kalori += (m.kalori * log.porsi);
        dailySummary[log.tanggal].protein += (parseFloat(m.protein_g) * log.porsi);
        dailySummary[log.tanggal].lemak += (parseFloat(m.lemak_g) * log.porsi);
        dailySummary[log.tanggal].karbo += (parseFloat(m.karbo_g) * log.porsi);
        dailySummary[log.tanggal].fiber += (parseFloat(m.fiber_g) * log.porsi);
        dailySummary[log.tanggal].items += 1;
      }
    });
    
    // Calculate mbg score per day
    Object.keys(dailySummary).forEach(date => {
      const dayLogs = logs.filter(l => l.tanggal === date);
      const kategori = [...new Set(dayLogs.map(l => l.Makanan?.kategori).filter(Boolean))];
      dailySummary[date].mbg_score = kategori.length * 20;
    });
    
    res.json({ 
      success: true, 
      data: dailySummary, 
      week_start: startDate.toISOString().split('T')[0], 
      week_end: endDate.toISOString().split('T')[0] 
    });
  } catch (err) {
    console.error('[nutrisiController.getLogMingguan]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

async function updateMBGDaily(siswaId, tanggal) {
  // mbg_daily table will be created via migration or manual SQL
  try {
    const logs = await NutrisiLog.findAll({
      where: { siswa_id: siswaId, tanggal },
      include: [{ model: Makanan, as: 'Makanan' }]
    });
    
    const kategori = [...new Set(logs.map(l => l.Makanan?.kategori).filter(Boolean))];
    const totals = logs.reduce((acc, log) => {
      const m = log.Makanan;
      if (!m) return acc;
      acc.kalori += (m.kalori * log.porsi);
      acc.protein += parseFloat(m.protein_g) * log.porsi;
      return acc;
    }, { kalori: 0, protein: 0 });
    
    // Upsert mbg_daily via raw query
    await sequelize.query(`
      INSERT INTO mbg_daily (siswa_id, tanggal, has_karbo, has_protein, has_sayur, has_buah, has_susu, total_kalori, total_protein, updated_at)
      VALUES (${siswaId}, '${tanggal}', ${kategori.includes('karbo')}, ${kategori.includes('protein')}, ${kategori.includes('sayur')}, ${kategori.includes('buah')}, ${kategori.includes('susu')}, ${totals.kalori}, ${totals.protein}, NOW())
      ON DUPLICATE KEY UPDATE
        has_karbo = VALUES(has_karbo),
        has_protein = VALUES(has_protein),
        has_sayur = VALUES(has_sayur),
        has_buah = VALUES(has_buah),
        has_susu = VALUES(has_susu),
        total_kalori = VALUES(total_kalori),
        total_protein = VALUES(total_protein),
        updated_at = NOW()
    `);
  } catch (err) {
    console.error('[updateMBGDaily]', err.message);
  }
}
