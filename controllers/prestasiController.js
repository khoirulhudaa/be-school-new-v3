    // controllers/achievementController.js
const Achievement = require('../models/prestasi');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Konfigurasi Cloudinary (sama seperti sebelumnya)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAllAchievements = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const achievements = await Achievement.findAll({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
      order: [['year', 'DESC'], ['createdAt', 'DESC']], // urut tahun terbaru dulu
    });

    res.json({ success: true, data: achievements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAchievement = async (req, res) => {
  try {
    const { name, description, year, level, organizer, schoolId } = req.body;

    if (!name || !description || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, description, dan schoolId wajib diisi' 
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

    const newAchievement = await Achievement.create({ 
      name, 
      description,
      year: year ? parseInt(year) : null,
      level: level || null,
      organizer: organizer || null,          // ← ditambahkan
      imageUrl,
      schoolId: parseInt(schoolId)
    });

    res.status(201).json({ success: true, data: newAchievement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, year, level, organizer } = req.body;

    const achievement = await Achievement.findByPk(id);
    if (!achievement) {
      return res.status(404).json({ success: false, message: 'Prestasi tidak ditemukan' });
    }

    if (name) achievement.name = name;
    if (description) achievement.description = description;
    if (year !== undefined) achievement.year = year ? parseInt(year) : null;
    if (level !== undefined) achievement.level = level;
    if (organizer !== undefined) achievement.organizer = organizer;   // ← ditambahkan

   if (req.file) {
      if (achievement.imageUrl) {
        const publicId = achievement.imageUrl.split('/').pop().split('.')[0];
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
      achievement.imageUrl = result.secure_url;
    }

    await achievement.save();
    res.json({ success: true, data: achievement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;

    const achievement = await Achievement.findByPk(id);
    if (!achievement) {
      return res.status(404).json({ success: false, message: 'Prestasi tidak ditemukan' });
    }

    if (achievement.imageUrl) {
      const publicId = achievement.imageUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log(`Gagal hapus foto: ${err.message}`);
      }
    }

    achievement.isActive = false;
    await achievement.save();

    res.json({ success: true, message: 'Prestasi berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};