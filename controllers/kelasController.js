const Class = require('../models/kelas');

exports.getAllClasses = async (req, res) => {
  try {
    const { schoolId } = req.query;
    const classes = await Class.findAll({ 
      where: { schoolId },
      order: [['className', 'ASC']] 
    });
    res.json({ success: true, data: classes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// exports.createClass = async (req, res) => {
//   try {
//     const { schoolId, className } = req.body;
//     const newClass = await Class.create({ schoolId, className });
//     res.json({ success: true, data: newClass });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };



exports.getAllClasses = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId diperlukan' });
    }

    const classes = await Class.findAll({ 
      where: { schoolId },
      order: [['className', 'ASC']] 
    });
    
    res.json({ success: true, data: classes });
  } catch (err) {
    console.error('Error getAllClasses:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { schoolId, className, waliKelas, waliKelasPhone, waliKelasEmail } = req.body;

    if (!schoolId || !className?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId dan className wajib diisi' 
      });
    }

    const normalizedName = className.trim();

    const existing = await Class.findOne({
      where: { schoolId, className: normalizedName }
    });

    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: `Kelas sudah pernah dibuat!` 
      });
    }

    const newClass = await Class.create({ 
      schoolId, 
      className: normalizedName,
      waliKelas:      waliKelas?.trim()      || null,
      waliKelasPhone: waliKelasPhone?.trim() || null,
      waliKelasEmail: waliKelasEmail?.trim() || null,
    });

    res.status(201).json({ success: true, data: newClass });
  } catch (err) {
    console.error('Error createClass:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        success: false, 
        message: 'Nama kelas sudah digunakan untuk sekolah ini (duplikat)' 
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createClassBulk = async (req, res) => {
  try {
    const { schoolId, classes } = req.body;

    if (!schoolId || !Array.isArray(classes)) {
      return res.status(400).json({ success: false, message: 'Data tidak valid' });
    }

    const results = { success: 0, failed: [] };

    for (const item of classes) {
      const normalizedName = item.className?.trim();

      if (!normalizedName) {
        results.failed.push({ className: '(Kosong)', reason: 'Nama kelas wajib diisi' });
        continue;
      }

      // Cek Duplikat di database
      const existing = await Class.findOne({
        where: { schoolId, className: normalizedName }
      });

      if (existing) {
        results.failed.push({ className: normalizedName, reason: 'Kelas sudah terdaftar' });
        continue;
      }

      // Simpan data
      await Class.create({
        schoolId,
        className: normalizedName,
        waliKelas: item.waliKelas || null,
        waliKelasPhone: item.waliKelasPhone || null,
        waliKelasEmail: item.waliKelasEmail || null
      });

      results.success++;
    }

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('Bulk Create Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const kelas = await Class.findByPk(id);

    if (!kelas) {
      return res.status(404).json({ success: false, message: "Kelas tidak ditemukan" });
    }

    // Update field secara spesifik untuk memastikan data masuk
    await kelas.update({
      className: req.body.className,
      schoolId: req.body.schoolId,
      waliKelas: req.body.waliKelas,
      waliKelasPhone: req.body.waliKelasPhone,
      waliKelasEmail: req.body.waliKelasEmail
    });

    res.json({ success: true, message: "Kelas diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { id, schoolId } = req.params;
    await Class.destroy({ where: { id, schoolId } });
    res.json({ success: true, message: "Kelas dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};