const Comment = require('../models/komentar');

exports.getAllComments = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

   const comments = await Comment.findAll({
      where: { 
        schoolId: parseInt(schoolId),
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { email, name, comment, rating, schoolId } = req.body;

    // Validasi semua field yang dibutuhkan
    if (!schoolId || !email || !name || !comment || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId, email, name, comment, dan rating wajib diisi' 
      });
    }

    const newComment = await Comment.create({ 
      schoolId: parseInt(schoolId),     // <-- WAJIB ditambahkan
      email: String(email).trim().toLowerCase(), // Pastikan string dan lower case
      name: name.trim(),
      comment: comment.trim(),
      rating: parseInt(rating),
    });

    res.json({ success: true, data: newComment });
  } catch (err) {
    console.error(err);  // untuk debug di server
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan' });

    await comment.destroy();
    res.json({ success: true, message: 'Komentar berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};