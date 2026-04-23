const FAQ = require('../models/faq');

exports.getAllFAQs = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.query.schoolId;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'schoolId wajib disertakan di query'
      });
    }

    const faqEntries = await FAQ.findAll({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: faqEntries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFAQ = async (req, res) => {
  try {
    const { faqs, schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib diisi' 
      });
    }

    if (!Array.isArray(faqs)) {
      return res.status(400).json({ success: false, message: 'faqs harus berupa array of objects' });
    }

    // Validasi minimal setiap item
    for (const item of faqs) {
      if (!item.question || !item.answer) {
        return res.status(400).json({ 
          success: false, 
          message: 'Setiap FAQ harus memiliki "question" dan "answer"' 
        });
      }
    }

    const newFAQ = await FAQ.create({ 
      faqs,
      schoolId: parseInt(schoolId)
    });

    res.status(201).json({ success: true, data: newFAQ });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { faqs } = req.body;

    const faqEntry = await FAQ.findByPk(id);
    if (!faqEntry) {
      return res.status(404).json({ success: false, message: 'Data FAQ tidak ditemukan' });
    }

    if (faqs !== undefined) {
      if (!Array.isArray(faqs)) {
        return res.status(400).json({ success: false, message: 'faqs harus array of objects' });
      }

      for (const item of faqs) {
        if (!item.question || !item.answer) {
          return res.status(400).json({ 
            success: false, 
            message: 'Setiap FAQ harus memiliki "question" dan "answer"' 
          });
        }
      }

      faqEntry.faqs = faqs;
    }

    await faqEntry.save();
    res.json({ success: true, data: faqEntry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const faqEntry = await FAQ.findByPk(id);
    if (!faqEntry) {
      return res.status(404).json({ success: false, message: 'Data FAQ tidak ditemukan' });
    }

    faqEntry.isActive = false;
    await faqEntry.save();

    res.json({ success: true, message: 'Data FAQ berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};