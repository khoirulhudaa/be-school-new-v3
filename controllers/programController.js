const Program = require('../models/program');

exports.getAllPrograms = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId wajib disertakan' });
    }

    const programs = await Program.findAll({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: programs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProgram = async (req, res) => {
  try {
    const { mainTitle, mainDescription, items, schoolId } = req.body;

    if (!mainTitle || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'mainTitle dan schoolId wajib diisi' 
      });
    }

    if (items && !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items harus berupa array' });
    }

    // Optional: validasi struktur setiap item
    if (items) {
      for (const item of items) {
        if (!item.title || typeof item.description !== 'string') {
          return res.status(400).json({ 
            success: false, 
            message: 'Setiap item harus memiliki title (string) dan description (string)' 
          });
        }
      }
    }

    const program = await Program.create({
      mainTitle,
      mainDescription: mainDescription || null,
      items: items || [],
      schoolId: parseInt(schoolId),
    });

    res.status(201).json({ success: true, data: program });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { mainTitle, mainDescription, items } = req.body;

    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program tidak ditemukan' });
    }

    if (mainTitle !== undefined) program.mainTitle = mainTitle;
    if (mainDescription !== undefined) program.mainDescription = mainDescription;

    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'items harus array' });
      }

      // Optional: validasi struktur
      for (const item of items) {
        if (!item.title || typeof item.description !== 'string') {
          return res.status(400).json({ 
            success: false, 
            message: 'Setiap item harus memiliki title dan description (string)' 
          });
        }
      }

      program.items = items;
    }

    await program.save();
    res.json({ success: true, data: program });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findByPk(id);

    if (!program) {
      return res.status(404).json({ success: false, message: 'Program tidak ditemukan' });
    }

    program.isActive = false;
    await program.save();

    res.json({ success: true, message: 'Program berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};