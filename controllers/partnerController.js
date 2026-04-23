const Sponsor = require('../models/partner');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAllSponsors = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const sponsors = await Sponsor.findAll({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: sponsors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSponsor = async (req, res) => {
  try {
    const { name, schoolId } = req.body;

    if (!name || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'name dan schoolId wajib diisi' 
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

    const newSponsor = await Sponsor.create({ 
      name: name.trim(),
      imageUrl,
      schoolId: parseInt(schoolId)
    });

    res.status(201).json({ success: true, data: newSponsor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const sponsor = await Sponsor.findByPk(id);
    if (!sponsor) {
      return res.status(404).json({ success: false, message: 'Sponsor tidak ditemukan' });
    }

    if (name) sponsor.name = name.trim();

    if (req.file) {
      // Hapus gambar lama jika ada
      if (sponsor.imageUrl) {
        const publicId = sponsor.imageUrl.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Gambar sponsor lama dihapus: ${publicId}`);
        } catch (err) {
          console.log(`Gagal hapus gambar lama: ${err.message}`);
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
      sponsor.imageUrl = result.secure_url;
    }

    await sponsor.save();
    res.json({ success: true, data: sponsor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSponsor = async (req, res) => {
  try {
    const { id } = req.params;

    const sponsor = await Sponsor.findByPk(id);
    if (!sponsor) {
      return res.status(404).json({ success: false, message: 'Sponsor tidak ditemukan' });
    }

    // Hapus gambar dari Cloudinary jika ada
    if (sponsor.imageUrl) {
      const publicId = sponsor.imageUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log(`Gagal hapus gambar sponsor: ${err.message}`);
      }
    }

    // Soft delete
    sponsor.isActive = false;
    await sponsor.save();

    res.json({ success: true, message: 'Sponsor berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};