const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/protect');
const Kehadiran = require('../models/kehadiran');
const Siswa = require('../models/siswa');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');

// Export attendance per student
router.get('/export-attendance/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { year } = req.query;

    const siswa = await Siswa.findByPk(id);
    if (!siswa) {
      return res.status(404).json({ success: false, message: 'Siswa not found' });
    }

    const whereClause = { siswaId: parseInt(id) };
    if (year) {
      whereClause.tanggal = { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` };
    }

    const attendances = await Kehadiran.findAll({
      where: whereClause,
      order: [['tanggal', 'ASC']]
    });

    // Create Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kehadiran');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Jam Masuk', key: 'jamMasuk', width: 12 },
      { header: 'Jam Pulang', key: 'jamPulang', width: 12 },
    ];

    attendances.forEach((att, index) => {
      worksheet.addRow({
        no: index + 1,
        tanggal: att.tanggal ? att.tanggal.toISOString().split('T')[0] : '',
        status: att.status || '',
        jamMasuk: att.jamMasuk || '-',
        jamPulang: att.jamPulang || '-',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=kehadiran_${siswa.name}_${year || 'all'}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;