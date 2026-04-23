const Announcement = require('../models/pengumuman');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAllAnnouncements = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId wajib disertakan' });

    const announcements = await Announcement.findAll({
      where: { schoolId: parseInt(schoolId), isActive: true },
      order: [['publishDate', 'DESC']],
    });
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAnnouncement = async (req, res) => {
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

    const newAnnouncement = await Announcement.create({ 
      title, 
      content, 
      imageUrl,
      schoolId: parseInt(schoolId),
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      category: category || 'Umum',      // ambil dari body atau default
      source: source || 'Sekolah',
    });

    res.json({ success: true, data: newAnnouncement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, publishDate, category, source } = req.body;

    const announcement = await Announcement.findByPk(id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (publishDate) announcement.publishDate = new Date(publishDate);
    if (category) announcement.category = category;      // update jika dikirim
    if (source) announcement.source = source;

    if (req.file) {
      if (announcement.imageUrl) {
        const publicId = announcement.imageUrl.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) { console.log(err.message); }
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
      announcement.imageUrl = result.secure_url;
    }

    await announcement.save();
    res.json({ success: true, data: announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });

    if (announcement.imageUrl) {
      const publicId = announcement.imageUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) { console.log(err.message); }
    }

    announcement.isActive = false;
    await announcement.save();
    res.json({ success: true, message: 'Pengumuman berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};