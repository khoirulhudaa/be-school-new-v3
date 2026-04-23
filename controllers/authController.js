const SchoolAccount = require('../models/auth');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Op } = require('sequelize');
const Siswa = require('../models/siswa'); 
const GuruTendik = require('../models/guruTendik'); 
const ExcelJS = require('exceljs');
const SchoolProfile = require('../models/profileSekolah');
const VisionMission = require('../models/visiMisi'); // pastikan import
const InstagramPost = require('../models/feed');
const KegiatanPramuka = require('../models/kegiatanPramuka');
const News = require('../models/berita');
const FAQ = require('../models/faq');
const PpidDocument = require('../models/ppid');
const Announcement = require('../models/pengumuman');
const Partner = require('../models/partner');
const Ppdb = require('../models/ppdb');
const SejarahSekolah = require('../models/sejarahSekolah');
const Service = require('../models/layanan');
const Parent = require('../models/orangTua');
const Facility = require('../models/fasilitas');
const CalendarEvent = require('../models/kalender');
const Osis = require('../models/osis');
const Achievement = require('../models/prestasi');
const GalleryItem = require('../models/galleryItem');
const SchoolOrganization = require('../models/organisasi');
const Alumni = require('../models/alumni');
const Student = require('../models/siswa');

// --- CONFIGURATIONS ---

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Nodemailer Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper: Kirim Email
const sendEmail = async (to, subject, htmlContent) => {
  await transporter.sendMail({
    from: `"Sistem Admin Sekolah" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  });
};

// --- CONTROLLERS ---

// 1. REGISTER SEKOLAH + KIRIM PIN
exports.registerSchool = async (req, res) => {
  try {
    const { npsn, schoolName, address, email, password, adminName, latitude, longitude } = req.body;

    // Cek duplikasi
    const existing = await SchoolAccount.findOne({ where: { [Op.or]: [{ email }, { npsn }] } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email atau NPSN sudah terdaftar' });
    }

    // Upload Logo ke Cloudinary jika ada
    let logoUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'school_logos', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
      logoUrl = result.secure_url;
    }

    // Generate 6 Digit PIN
    const verificationPin = Math.floor(100000 + Math.random() * 900000).toString();

    const newSchool = await SchoolAccount.create({
      npsn,
      schoolName,
      address,
      latitude,
      longitude,
      email,
      password,
      adminName,
      logoUrl,
      verificationPin,
      isVerified: false,
      isActive: true,
      role: 'admin'
    });

    // Kirim PIN ke Email
    const emailTemplate = `
    <div style="background-color: #f4f7f6; padding: 40px 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        
        <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Verifikasi Akun</h1>
        </div>

        <div style="padding: 40px 30px; text-align: center;">
          <p style="font-size: 16px; color: #666; margin-bottom: 10px;">Halo, <strong style="color: #1e3c72;">${adminName}</strong></p>
          <p style="font-size: 15px; color: #888; line-height: 1.6;">Terima kasih telah bergabung. Gunakan kode PIN di bawah ini untuk menyelesaikan pendaftaran akun sekolah Anda.</p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f8fafd; border: 2px dashed #cbd5e0; border-radius: 8px;">
            <span style="font-size: 36px; font-weight: bold; color: #1e3c72; letter-spacing: 10px; font-family: monospace;">${verificationPin}</span>
          </div>

          <p style="font-size: 13px; color: #a0aec0; margin-top: 20px;">*Kode bersifat rahasi. Mohon tidak membagikan kode ini kepada siapa pun!</p>
        </div>

        <div style="background-color: #fcfcfc; padding: 20px; text-align: center; border-top: 1px solid #f0f0f0;">
          <p style="font-size: 12px; color: #999; margin: 0;">© 2026 Sistem Admin Sekolah. All rights reserved.</p>
        </div>
      </div>
    </div>
    `;

    // Kirim Email
    await sendEmail(email, 'Konfirmasi PIN Verifikasi Sekolah', emailTemplate);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Silakan cek email Anda untuk kode verifikasi PIN.',
      data: { id: newSchool.id, email: newSchool.email }
    });
  } catch (err) {
    // Cek jika error berasal dari Validasi Sequelize
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map((e) => {
        if (e.path === 'npsn') return 'NPSN harus berjumlah antara 8 hingga 16 karakter angka';
        return e.message;
      });
      return res.status(400).json({ success: false, message: messages[0] });
    }

    // Cek jika error duplikasi (Unique Constraint)
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'NPSN atau Email sudah terdaftar' });
    }

    res.status(500).json({ success: false, message: err });
  }
};

exports.getAllSchools = async (req, res) => {
  try {
    const { status, name } = req.query; 
    let whereCondition = {};

    if (status === 'active') {
      whereCondition.isActive = true;
    } else if (status === 'inactive') {
      whereCondition.isActive = false;
    }

    // Filter pencarian berdasarkan nama sekolah (Search)
    if (name) {
      whereCondition.schoolName = {
        [Op.iLike]: `%${name}%` // iLike untuk case-insensitive (PostgreSQL)
        // Jika menggunakan MySQL, gunakan [Op.like]: `%${name}%`
      };
    }

    const schools = await SchoolAccount.findAll({
      where: whereCondition,
      attributes: [
        ['id', 'id'], 
        ['schoolName', 'namaSekolah'], 
        ['address', 'alamat'], 
        'npsn', 
        ['logoUrl', 'logo'], 
        ['email', 'email'], 
        ['latitude', 'lat'], 
        ['role', 'role'], 
        ['longitude', 'long'],
        'isActive'
      ],
      order: [['schoolName', 'ASC']]
    });

    res.json({
      success: true,
      count: schools.length,
      filters: {
        status: status || 'all',
        searchName: name || null
      },
      data: schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data sekolah: ' + err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let user;
    let schoolData = null;

    // 1. Ambil data user berdasarkan role
    if (role === 'Kepala Sekolah' || role === 'guru' || role === 'Guru') {
      user = await GuruTendik.findByPk(userId);
    } else if (role === 'Siswa') {
      user = await Student.findByPk(userId);
    } else {
      // Jika rolenya admin sekolah, user itu sendiri adalah SchoolAccount
      user = await SchoolAccount.findByPk(userId);
    }

    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const userData = user.get({ plain: true });

    // 2. Ambil data sekolah secara dinamis
    if (role === 'Kepala Sekolah' || role === 'guru' || role === 'Guru' || role === 'Siswa') {
      // Cari di tabel SchoolAccount berdasarkan schoolId yang ada di profile guru/siswa
      schoolData = await SchoolAccount.findByPk(userData.schoolId);
    } else {
      // Jika rolenya admin sekolah, datanya ya dari userData itu sendiri
      schoolData = user;
    }

    const schoolId = schoolData?.id;

    const visionMission = schoolId
    ? await VisionMission.findOne({
        where: { schoolId, isActive: true },
        attributes: ['vision', 'missions'],
      })
    : null;

    // 3. Susun Response
    res.json({
      success: true,
      data: {
        id: userData.id, // ID asli user (Guru/Siswa/Sekolah)
        name: userData.nama || userData.adminName,
        email: userData.email,
        role: role,
        // Data Sekolah diambil dari instance schoolData
        sekolah: schoolData ? {
          id: schoolData.id,
          namaSekolah: schoolData.schoolName,
          npsn: schoolData.npsn,
          address: schoolData.address,
          nameProvince: 'DKI Jakarta', // Bisa kamu tambahkan kolom province di model jika perlu
          file: schoolData.logoUrl // Logo konsisten dari tabel akunSekolah
        } : null,
        visionMission: visionMission || null, // ← tambahkan di sini
      }
    });

  } catch (err) {
    console.error("Error Get Profile:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- LOGIN ---
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
//     }

//     const user = await SchoolAccount.findOne({ where: { email } });
    
//     // Gunakan method validPassword dari model
//     if (!user || !(await user.validPassword(password))) {
//       return res.status(401).json({ success: false, message: 'Email atau password salah' });
//     }

//     if (!user.isActive) {
//       return res.status(403).json({ success: false, message: 'Akun dinonaktifkan' });
//     }

//     // Update lastLogin
//     user.lastLogin = new Date();
//     await user.save();

//     const token = jwt.sign(
//       { id: user.id, schoolId: user.id },
//       process.env.JWT_SECRET,
//       { expiresIn: '365d' }
//     );

//     res.json({
//       success: true,
//       message: 'Login berhasil',
//       token,
//       user: {
//         id: user.id,
//         username: user.adminName,
//         email: user.email,
//         schoolName: user.schoolName,
//         logoUrl: user.logoUrl,
//         lat: user.latitude,
//         long: user.longitude,
//         role: user.role
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    const user = await SchoolAccount.findOne({ where: { email } });
    
    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Akun dinonaktifkan' });
    }

    user.lastLogin = new Date();
    await user.save();

    // Ambil visi misi aktif sekolah ini
    const visionMission = await VisionMission.findOne({
      where: { schoolId: user.id, isActive: true },
      attributes: ['vision', 'missions'],
    });

    const token = jwt.sign(
      { id: user.id, schoolId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        username: user.adminName,
        email: user.email,
        schoolName: user.schoolName,
        logoUrl: user.logoUrl,
        lat: user.latitude,
        long: user.longitude,
        role: user.role,
        visionMission: visionMission || null, // null jika belum diisi
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- FORGOT PASSWORD ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await SchoolAccount.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email tidak ditemukan' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 Jam
    await user.save();

    // Sesuaikan dengan URL Frontend Anda
    const resetUrl = `https://admin.kiraproject.id/auth/reset-password/${resetToken}`;

    // Template Email Premium
    const emailHtml = `
      <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: white; padding: 40px 0; color: #1f2937;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 24px 20px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; color: #111827;">Atur Ulang Password</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 30px 24px; text-align: center;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                Halo, kami menerima permintaan untuk mengatur ulang password akun <strong>Dashboard</strong> Anda.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 40px 24px; text-align: center;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                Reset Password Sekarang
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 30px 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #9ca3af;">
                Link ini hanya berlaku selama 60 menit
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 24px; background-color: #f3f4f6; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; 2026 Vokadash Team. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `;

    await sendEmail(email, 'Reset Kata Sandi', emailHtml);

    res.json({ success: true, message: 'Instruksi reset password telah dikirim ke email' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await SchoolAccount.findOne({ 
      where: { 
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() } 
      } 
    });

    if (!user) return res.status(400).json({ success: false, message: 'Token tidak valid atau kadaluarsa' });

    user.password = newPassword; // Hook beforeUpdate akan otomatis menghash ini
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- UPDATE PROFILE (HANYA NAMA & EMAIL) ---
exports.updateProfile = async (req, res) => {
  try {
    const { adminName, email } = req.body;
    
    // 1. Cari user berdasarkan ID dari token (req.user.id dari middleware protect)
    const user = await SchoolAccount.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
    }

    // 2. Validasi Email (Cek jika email baru sudah dipakai akun lain)
    if (email && email !== user.email) {
      const emailExists = await SchoolAccount.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email sudah digunakan oleh akun lain' });
      }
      user.email = email;
    }

    // 3. Update Nama Admin
    if (adminName) {
      user.adminName = adminName;
    }

    // Simpan perubahan
    await user.save();

    res.json({
      success: true,
      message: 'Profil administrator berhasil diperbarui',
      data: {
        adminName: user.adminName,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui profil: ' + err.message });
  }
};

// 2. VERIFIKASI PIN
exports.verifyPin = async (req, res) => {
  try {
    const { email, pin } = req.body;

    const user = await SchoolAccount.findOne({ where: { email, verificationPin: pin } });

    if (!user) {
      return res.status(400).json({ success: false, message: 'PIN salah atau email tidak ditemukan' });
    }

    user.isVerified = true;
    user.verificationPin = null; // Hapus PIN setelah verifikasi
    await user.save();

    res.json({ success: true, message: 'Akun berhasil diverifikasi. Silakan login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Menghitung data secara paralel untuk efisiensi
    const [totalSekolah, totalGuru, totalSiswa] = await Promise.all([
      SchoolAccount.count({ where: { isActive: true } }),
      GuruTendik.count(),
      Siswa.count()
    ]);

    res.json({
      success: true,
      data: {
        totalSekolah,
        totalGuru,
        totalSiswa,
        lastUpdated: new Date()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat statistik: ' + err.message });
  }
};

exports.getAllSchoolsPaginated = async (req, res) => {
  try {
    // Ambil query params dengan nilai default
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, name } = req.query;

    let whereCondition = {};

    // Filter Status
    if (status === 'active') {
      whereCondition.isActive = true;
    } else if (status === 'inactive') {
      whereCondition.isActive = false;
    }

    // Filter Search Name
    if (name) {
      whereCondition.schoolName = {
        [Op.like]: `%${name}%` // Gunakan Op.like jika menggunakan MySQL
      };
    }

    // Query findAndCountAll untuk mendapatkan data sekaligus total row
    const { count, rows } = await SchoolAccount.findAndCountAll({
      where: whereCondition,
      attributes: [
        ['id', 'id'], 
        ['schoolName', 'namaSekolah'], 
        ['address', 'alamat'], 
        'npsn', 
        ['logoUrl', 'logo'], 
        ['email', 'email'], 
        ['latitude', 'lat'], 
        ['longitude', 'long'],
        'isActive'
      ],
      order: [['schoolName', 'ASC']],
      limit: limit,
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil data sekolah terpaginasi: ' + err.message 
    });
  }
};

exports.updateSchoolStatus = async (req, res) => {
  try {
    // ids: [1, 2, 3], status: true/false
    const { ids, status } = req.body; 

    // 1. Validasi Input
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Daftar ID sekolah harus berupa array dan tidak boleh kosong' });
    }

    if (typeof status !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Status harus berupa boolean (true atau false)' });
    }

    // 2. Update status sekolah di database
    const [updatedCount] = await SchoolAccount.update(
      { isActive: status },
      { 
        where: { 
          id: { [Op.in]: ids } 
        } 
      }
    );

    // 3. Response
    const statusMsg = status ? 'diaktifkan' : 'dinonaktifkan';
    res.json({
      success: true,
      message: `${updatedCount} sekolah berhasil ${statusMsg}`,
      data: {
        updatedCount,
        newStatus: status
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui status sekolah: ' + err.message });
  }
};

exports.exportAllSchoolsExcel = async (req, res) => {
  try {
    const schools = await SchoolAccount.findAll({
      attributes: ['npsn', 'schoolName', 'address', 'email', 'adminName', 'isActive', 'createdAt'],
      order: [['schoolName', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Daftar Sekolah');

    worksheet.columns = [
      { header: 'NPSN', key: 'npsn', width: 15 },
      { header: 'Nama Sekolah', key: 'schoolName', width: 30 },
      { header: 'Alamat', key: 'address', width: 40 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Admin', key: 'adminName', width: 20 },
      { header: 'Status', key: 'isActive', width: 12 },
      { header: 'Tanggal Daftar', key: 'createdAt', width: 20 },
    ];

    schools.forEach(s => {
      worksheet.addRow({
        ...s.toJSON(),
        isActive: s.isActive ? 'Aktif' : 'Non-Aktif',
        createdAt: s.createdAt.toISOString().split('T')[0]
      });
    });

    // Formatting header
    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Daftar_Sekolah.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Export Semua Siswa berdasarkan schoolId
exports.exportSiswaBySchoolExcel = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    const school = await SchoolAccount.findByPk(schoolId);
    if (!school) return res.status(404).json({ message: 'Sekolah tidak ditemukan' });

    const siswa = await Siswa.findAll({
      where: { schoolId, isActive: 1 }, // Pastikan kolom di model Siswa adalah schoolId
      attributes: ['nisn', 'name', 'class', 'batch', 'nis'],
      order: [['name', 'ASC']] // Sesuai model
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Siswa');

    worksheet.columns = [
        { header: 'NISN', key: 'nisn', width: 15 },
        { header: 'NIS', key: 'nis', width: 15 },
        { header: 'Nama Lengkap', key: 'name', width: 30 },
        { header: 'Kelas', key: 'class', width: 10 },
        { header: 'Angkatan', key: 'batch', width: 15 }
      ];

    siswa.forEach(item => worksheet.addRow(item.toJSON()));
    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Siswa_${school.schoolName.replace(/ /g, '_')}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Export Semua Guru/Tendik berdasarkan schoolId
exports.exportGuruBySchoolExcel = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const school = await SchoolAccount.findByPk(schoolId);
    if (!school) return res.status(404).json({ message: 'Sekolah tidak ditemukan' });

    const guru = await GuruTendik.findAll({
      where: { schoolId, isActive: 1 },
      order: [['nama', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Guru Tendik');

    worksheet.columns = [
      { header: 'NIP', key: 'nip', width: 20 },
      { header: 'Nama Guru', key: 'nama', width: 30 },
      { header: 'Mapel', key: 'mapel', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Jenis Kelamin', key: 'jenisKelamin', width: 15 }
    ];

    guru.forEach(item => worksheet.addRow(item.toJSON()));
    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Guru_${school.schoolName.replace(/ /g, '_')}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deactivateAllSchools = async (req, res) => {
  const { passcode } = req.body;
  if (passcode !== 'HIDDENSCHOOL') {
    return res.status(403).json({ success: false, message: 'Passcode salah!' });
  }

  try {
    // Menjalankan update besar-besaran untuk menonaktifkan seluruh sistem
    await Promise.all([
      // 1. Akun Utama (Dengan Sensor Nama)
      SchoolAccount.update({ isActive: false, schoolName: '********' }, { where: {} }),
      
      // 2. Profil & Konten (Hanya Matikan Status)
      SchoolProfile.update({ isActive: false }, { where: {} }),
      InstagramPost.update({ isActive: false }, { where: {} }),
      KegiatanPramuka.update({ isActive: false }, { where: {} }),
      News.update({ isActive: false }, { where: {} }),
      FAQ.update({ isActive: false }, { where: {} }),
      PpidDocument.update({ isActive: false }, { where: {} }),
      Announcement.update({ isActive: false }, { where: {} }),
      Partner.update({ isActive: false }, { where: {} }),
      Ppdb.update({ isActive: false }, { where: {} }),
      VisionMission.update({ isActive: false }, { where: {} }),
      SejarahSekolah.update({ isActive: false }, { where: {} }),
      Service.update({ isActive: false }, { where: {} }),
      Parent.update({ isActive: false }, { where: {} }),
      Facility.update({ isActive: false }, { where: {} }),
      CalendarEvent.update({ isActive: false }, { where: {} }),
      Osis.update({ isActive: false }, { where: {} }),
      Achievement.update({ isActive: false }, { where: {} }),
      GalleryItem.update({ isActive: false }, { where: {} }),
      SchoolOrganization.update({ isActive: false }, { where: {} }),
      Alumni.update({ isActive: false }, { where: {} }),
    ]);
    
    res.json({ 
      success: true, 
      message: 'Sistem Berhasil Dimatikan: Seluruh sekolah dan modul terkait kini tidak aktif.' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.activateAllSchools = async (req, res) => {
  const { passcode } = req.body;
  if (passcode !== 'HIDDENSCHOOL') {
    return res.status(403).json({ success: false, message: 'Passcode salah!' });
  }
  
  try {
    // Memulihkan seluruh modul sistem
    await Promise.all([
      SchoolAccount.update({ isActive: true }, { where: {} }),
      SchoolProfile.update({ isActive: true }, { where: {} }),
      InstagramPost.update({ isActive: true }, { where: {} }),
      KegiatanPramuka.update({ isActive: true }, { where: {} }),
      News.update({ isActive: true }, { where: {} }),
      FAQ.update({ isActive: true }, { where: {} }),
      PpidDocument.update({ isActive: true }, { where: {} }),
      Announcement.update({ isActive: true }, { where: {} }),
      Partner.update({ isActive: true }, { where: {} }),
      Ppdb.update({ isActive: true }, { where: {} }),
      VisionMission.update({ isActive: true }, { where: {} }),
      SejarahSekolah.update({ isActive: true }, { where: {} }),
      Service.update({ isActive: true }, { where: {} }),
      Parent.update({ isActive: true }, { where: {} }),
      Facility.update({ isActive: true }, { where: {} }),
      CalendarEvent.update({ isActive: true }, { where: {} }),
      Osis.update({ isActive: true }, { where: {} }),
      Achievement.update({ isActive: true }, { where: {} }),
      GalleryItem.update({ isActive: true }, { where: {} }),
      SchoolOrganization.update({ isActive: true }, { where: {} }),
      Alumni.update({ isActive: true }, { where: {} }),

    ]);

    res.json({ 
      success: true, 
      message: 'Sistem Berhasil Dipulihkan: Seluruh sekolah dan modul kembali aktif.' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};