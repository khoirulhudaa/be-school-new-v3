const PpidDocument = require('../models/ppid');

exports.getAllPpidDocuments = async (req, res) => {
  try {
    const { schoolId, category } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const whereClause = { 
      schoolId: parseInt(schoolId),
      isActive: true 
    };

    if (category) {
      whereClause.category = category;
    }

    const documents = await PpidDocument.findAll({
      where: whereClause,
      order: [['publishedDate', 'DESC'], ['createdAt', 'DESC']],
    });

    res.json({ success: true, data: documents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPpidDocument = async (req, res) => {
  try {
    const { title, category, description, documentUrl, publishedDate, schoolId } = req.body;

    if (!title || !category || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'title, category, dan schoolId wajib diisi' 
      });
    }

    const newDoc = await PpidDocument.create({ 
      title, 
      category,
      description: description || null,
      documentUrl: documentUrl || null,
      publishedDate: publishedDate ? new Date(publishedDate) : null,
      schoolId: parseInt(schoolId)
    });

    res.status(201).json({ success: true, data: newDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePpidDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, documentUrl, publishedDate } = req.body;

    const doc = await PpidDocument.findByPk(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Dokumen PPID tidak ditemukan' });
    }

    if (title) doc.title = title;
    if (category) doc.category = category;
    if (description !== undefined) doc.description = description;
    if (documentUrl !== undefined) doc.documentUrl = documentUrl;
    if (publishedDate !== undefined) {
      doc.publishedDate = publishedDate ? new Date(publishedDate) : null;
    }

    await doc.save();

    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePpidDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await PpidDocument.findByPk(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Dokumen PPID tidak ditemukan' });
    }

    doc.isActive = false;
    await doc.save();

    res.json({ success: true, message: 'Dokumen PPID berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};