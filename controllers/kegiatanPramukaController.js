const KegiatanPramuka = require('../models/kegiatanPramuka');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAllKegiatan = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'schoolId wajib disertakan di query',
      });
    }

    const kegiatan = await KegiatanPramuka.findAll({
      where: {
        schoolId: parseInt(schoolId),
        isActive: true,
      },
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
    });

    res.json({ success: true, data: kegiatan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createKegiatan = async (req, res) => {
  try {
    const { title, description, date, location, category, schoolId } = req.body;

    if (!title || !description || !date || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'title, description, date, dan schoolId wajib diisi',
      });
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

    const newKegiatan = await KegiatanPramuka.create({
      title,
      description,
      date,
      location: location || null,
      category: category || 'Kegiatan Rutin',
      imageUrl,
      schoolId: parseInt(schoolId),
    });

    res.status(201).json({ success: true, data: newKegiatan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, category } = req.body;

    const kegiatan = await KegiatanPramuka.findByPk(id);
    if (!kegiatan) {
      return res.status(404).json({
        success: false,
        message: 'Kegiatan Pramuka tidak ditemukan',
      });
    }

    if (title) kegiatan.title = title;
    if (description) kegiatan.description = description;
    if (date) kegiatan.date = date;
    if (location !== undefined) kegiatan.location = location;
    if (category) kegiatan.category = category;

    if (req.file) {
      // Hapus gambar lama jika ada
      if (kegiatan.imageUrl) {
        const publicId = kegiatan.imageUrl.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.log(`Gagal hapus foto lama: ${err.message}`);
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
      kegiatan.imageUrl = result.secure_url;
    }

    await kegiatan.save();
    res.json({ success: true, data: kegiatan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteKegiatan = async (req, res) => {
  try {
    const { id } = req.params;

    const kegiatan = await KegiatanPramuka.findByPk(id);
    if (!kegiatan) {
      return res.status(404).json({
        success: false,
        message: 'Kegiatan Pramuka tidak ditemukan',
      });
    }

    if (kegiatan.imageUrl) {
      const publicId = kegiatan.imageUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log(`Gagal hapus foto: ${err.message}`);
      }
    }

    kegiatan.isActive = false;
    await kegiatan.save();

    res.json({ success: true, message: 'Kegiatan Pramuka berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};