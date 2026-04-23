const News = require('../models/berita');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAllNews = async (req, res) => {
  try {
    // Support both tenant middleware (req.schoolId) and query param
    const schoolId = req.schoolId || req.query.schoolId;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId wajib disertakan' });
    }

    const news = await News.findAll({
      where: { schoolId: parseInt(schoolId), isActive: true },
      order: [['publishDate', 'DESC']],
    });
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, content, schoolId, publishDate, category, source } = req.body;
    if (!title || !content || !schoolId) {
      return res.status(400).json({ success: false, message: 'title, content, dan schoolId wajib diisi' });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
      imageUrl = result.secure_url;
    }

    const newNews = await News.create({ 
      title, 
      content, 
      imageUrl,
      schoolId: parseInt(schoolId),
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      category: category || 'Umum',
      source: source || 'Sekolah',
    });

    res.json({ success: true, data: newNews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, publishDate, category, source } = req.body;

    const news = await News.findByPk(id);
    if (!news) return res.status(200).json({ success: false, message: [] });

    if (title) news.title = title;
    if (content) news.content = content;
    if (publishDate) news.publishDate = new Date(publishDate);
    if (category) news.category = category;
    if (source) news.source = source;

    if (req.file) {
      if (news.imageUrl) {
        const publicId = news.imageUrl.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.log(`Gagal hapus gambar lama: ${err.message}`);
        }
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
      news.imageUrl = result.secure_url;
    }

    await news.save();
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);
    if (!news) return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });

    // Hapus gambar dari Cloudinary jika ada sebelum soft delete
    if (news.imageUrl) {
      const publicId = news.imageUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log(`Gagal hapus gambar: ${err.message}`);
      }
    }

    news.isActive = false;
    await news.save();
    res.json({ success: true, message: 'Berita berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};