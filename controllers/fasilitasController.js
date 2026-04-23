const Facility = require('../models/fasilitas');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAllFacilities = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const facilities = await Facility.findAll({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: facilities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFacility = async (req, res) => {
  try {
    const { name, description, schoolId } = req.body;

    if (!name || !description || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, description, dan schoolId wajib diisi' 
      });
    }

    let imageUrl = null;
    if (req.file) {
      // Upload ke Cloudinary dari buffer (stream)
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

    const newFacility = await Facility.create({ 
      name, 
      description,
      imageUrl,
      schoolId: parseInt(schoolId)
    });

    res.json({ success: true, data: newFacility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const facility = await Facility.findByPk(id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Fasilitas tidak ditemukan' });
    }

    // Update field teks
    if (name) facility.name = name;
    if (description) facility.description = description;

    // Jika ada file gambar baru
    if (req.file) {
      // Hapus gambar lama dari Cloudinary jika ada
      if (facility.imageUrl) {
        const publicId = facility.imageUrl.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Foto lama dihapus: ${publicId}`);
        } catch (err) {
          console.log(`Gagal hapus foto lama: ${err.message}`);
        }
      }

      // Upload gambar baru
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
      facility.imageUrl = result.secure_url;
    }

    await facility.save();
    res.json({ success: true, data: facility });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFacility = async (req, res) => {
  try {
    const { id } = req.params;

    const facility = await Facility.findByPk(id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Fasilitas tidak ditemukan' });
    }

    // Hapus gambar dari Cloudinary sebelum soft delete
    if (facility.imageUrl) {
      const publicId = facility.imageUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log(`Gagal hapus foto: ${err.message}`);
      }
    }

    // Soft delete
    facility.isActive = false;
    await facility.save();

    res.json({ success: true, message: 'Fasilitas berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};