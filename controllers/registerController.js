const SchoolAccount = require('../models/register');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { Op } = require('sequelize');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.registerSchool = async (req, res) => {
  try {
    const {
      npsn,
      schoolName,
      address,
      latitude,
      longitude,
      email,
      password,
      adminName,
    } = req.body;

    // Validasi wajib
    if (!npsn || !schoolName || !address || !email || !password || !adminName) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi: npsn, schoolName, address, email, password, adminName',
      });
    }

    // Cek duplikat NPSN atau email
    const existing = await SchoolAccount.findOne({
      where: {
        [Op.or]: [
          { npsn },
          { email },
        ],
      },
    });

    if (existing) {
      if (existing.npsn === npsn) {
        return res.status(400).json({ success: false, message: 'NPSN sudah terdaftar' });
      }
      if (existing.email === email) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
      }
    }

    let logoUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'school_logos' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
      logoUrl = result.secure_url;
    }

    const newSchool = await SchoolAccount.create({
      npsn,
      schoolName,
      address,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      email,
      password, // akan di-hash oleh hook
      adminName,
      logoUrl,
    });

    // Optional: auto-create SchoolProfile kosong
    // const SchoolProfile = require('../models/profileSekolah');
    // await SchoolProfile.create({
    //   schoolId: newSchool.id,
    //   schoolName,
    //   address,
    //   latitude: newSchool.latitude,
    //   longitude: newSchool.longitude,
    //   // field lain bisa diisi default / null
    // });

    res.status(201).json({
      success: true,
      message: 'Akun sekolah berhasil didaftarkan',
      data: {
        id: newSchool.id,
        npsn: newSchool.npsn,
        schoolName: newSchool.schoolName,
        email: newSchool.email,
        adminName: newSchool.adminName,
        logoUrl: newSchool.logoUrl,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: err.message,
    });
  }
};