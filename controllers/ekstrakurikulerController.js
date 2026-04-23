const Ekstrakurikuler = require('../models/ekstrakurikuler');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAllEkstrakurikuler = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'schoolId wajib disertakan di query',
      });
    }

    const ekstrakurikuler = await Ekstrakurikuler.findAll({
      where: {
        schoolId: parseInt(schoolId),
        isActive: true,
      },
      order: [['name', 'ASC'], ['createdAt', 'DESC']],
    });

    res.json({ success: true, data: ekstrakurikuler });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createEkstrakurikuler = async (req, res) => {
  try {
    const { name, description, schedule, mentor, category, schoolId } = req.body;

    if (!name || !description || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'name, description, dan schoolId wajib diisi',
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

    const newEkstrakurikuler = await Ekstrakurikuler.create({
      name,
      description,
      schedule: schedule || null,
      mentor: mentor || null,
      category: category || 'Lainnya',
      imageUrl,
      schoolId: parseInt(schoolId),
    });

    res.status(201).json({ success: true, data: newEkstrakurikuler });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateEkstrakurikuler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, schedule, mentor, category } = req.body;

    const ekstrakurikuler = await Ekstrakurikuler.findByPk(id);
    if (!ekstrakurikuler) {
      return res.status(404).json({
        success: false,
        message: 'Ekstrakurikuler tidak ditemukan',
      });
    }

    if (name) ekstrakurikuler.name = name;
    if (description) ekstrakurikuler.description = description;
    if (schedule !== undefined) ekstrakurikuler.schedule = schedule;
    if (mentor !== undefined) ekstrakurikuler.mentor = mentor;
    if (category) ekstrakurikuler.category = category;

    if (req.file) {
      // Hapus gambar lama jika ada
      if (ekstrakurikuler.imageUrl) {
        const publicId = ekstrakurikuler.imageUrl.split('/').pop().split('.')[0];
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
      ekstrakurikuler.imageUrl = result.secure_url;
    }

    await ekstrakurikuler.save();
    res.json({ success: true, data: ekstrakurikuler });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteEkstrakurikuler = async (req, res) => {
  try {
    const { id } = req.params;

    const ekstrakurikuler = await Ekstrakurikuler.findByPk(id);
    if (!ekstrakurikuler) {
      return res.status(404).json({
        success: false,
        message: 'Ekstrakurikuler tidak ditemukan',
      });
    }

    if (ekstrakurikuler.imageUrl) {
      const publicId = ekstrakurikuler.imageUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log(`Gagal hapus foto: ${err.message}`);
      }
    }

    ekstrakurikuler.isActive = false;
    await ekstrakurikuler.save();

    res.json({ success: true, message: 'Ekstrakurikuler berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};