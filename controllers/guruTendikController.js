const { Op, fn, col, where: sequelizeWhere } = require('sequelize');
const GuruTendik = require('../models/guruTendik');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const jwt = require('jsonwebtoken');
const SchoolProfile = require('../models/profileSekolah');
const bcrypt = require('bcrypt');
const redisClient = require('../config/redis');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const invalidateGuruTendikCache = async (schoolId) => {
  if (!schoolId) return;
  try {
    const pattern = `cache:/guruTendik*schoolId=${schoolId}*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys); // ← spread operator
      console.log(`✅ Cache invalidated: ${keys.length} keys for schoolId ${schoolId}`);
    }
  } catch (err) {
    console.error('❌ Invalidate cache error:', err.message);
  }
};

const ROLE_PERMISSIONS = {
  super_admin: {
    canManageUsers: true,
    canViewStatistik: true,
    canViewHasilDetail: false, // privasi — super admin tidak boleh baca detail konseling
    canManageKuis: false,
    canManageJadwal: false,
    canViewHasilSummary: false,
  },
  koordinator_bk: {
    canManageUsers: true,
    canViewStatistik: true,
    canViewHasilDetail: true,
    canManageKuis: true,
    canManageJadwal: true,
    canViewHasilSummary: true,
  },
  guru_bk: {
    canManageUsers: false,
    canViewStatistik: false,    // hanya statistik siswa sendiri
    canViewHasilDetail: true,
    canManageKuis: true,
    canManageJadwal: true,
    canViewHasilSummary: true,
  },
  wali_kelas: {
    canManageUsers: false,
    canViewStatistik: false,
    canViewHasilDetail: false,  // DILARANG — hanya rekomendasi akhir
    canManageKuis: false,
    canManageJadwal: false,
    canViewHasilSummary: true,  // hanya ringkasan
  },
  Guru: {
    canManageUsers: false,
    canViewStatistik: true,
    canViewHasilDetail: false,  // DILARANG — hanya rekomendasi akhir
    canManageKuis: true,
    canManageJadwal: true,
    canViewHasilSummary: true,  // hanya ringkasan
  },
};

exports.checkGuruAuth = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Cari Guru berdasarkan email
    const guru = await GuruTendik.findOne({
      where: { email, isActive: true }
    });

    if (!guru) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email Guru/Tendik tidak ditemukan.' 
      });
    }

    // 2. Verifikasi Password
    if (!guru.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password belum diatur. Silakan hubungi operator.' 
      });
    }

    const isMatch = await bcrypt.compare(password, guru.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Password salah.' 
      });
    }

    // 3. Ambil Logo Sekolah
    const dataSekolah = await SchoolProfile.findOne({
      where: { schoolId: guru.schoolId },
      attributes: ["logoUrl"]
    });

    // 4. Susun Profile
    const profile = guru.toJSON();
    profile.schoolLogo = dataSekolah ? dataSekolah.logoUrl : null;
    const normalizedRole = (guru.role || "").toLowerCase().replace(/\s+/g, '_'); 

    // Sekarang "Guru BK" akan menjadi "guru_bk"
    profile.permissions = ROLE_PERMISSIONS[normalizedRole] ?? {
      canManageUsers: false,
      canViewStatistik: false,
      canViewHasilDetail: false,
      canManageKuis: false,
      canManageJadwal: false,
      canViewHasilSummary: false,
    };

    delete profile.password; 
    delete profile.createdAt;
    delete profile.updatedAt;
    

    // 5. Generate JWT
    const token = jwt.sign(
      { profile },
      process.env.JWT_SECRET || 'secret_key_anda',
      { expiresIn: '365d' }
    );

    res.json({ 
      success: true, 
      token,  
      data: profile 
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllGuruTendik = async (req, res) => {
  try {
    const {
      schoolId,
      name,
      isDuplicateOnly,
      page = 1,
      limit = 20,        
    } = req.query;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId wajib disertakan' });
    }

    const sId = parseInt(schoolId);
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);

    if (isNaN(currentPage) || currentPage < 1) {
      return res.status(400).json({ success: false, message: 'Parameter page tidak valid' });
    }
    if (isNaN(itemsPerPage) || itemsPerPage < 1) {
      return res.status(400).json({ success: false, message: 'Parameter limit tidak valid' });
    }

    const dupNipRows = await GuruTendik.findAll({
      where: { schoolId: sId, isActive: true, nip: { [Op.ne]: null, [Op.ne]: '' } },
      attributes: ['nip'],
      group: ['nip'],
      having: sequelizeWhere(fn('COUNT', col('nip')), '>', 1),
      raw: true
    });

    // Cari Email duplikat di sekolah yang sama (bukan global)
    const dupEmailRows = await GuruTendik.findAll({
      where: { 
        schoolId: sId,                    
        isActive: true, 
        email: { [Op.ne]: null, [Op.ne]: '' } 
      },
      attributes: ['email'],
      group: ['email'],
      having: sequelizeWhere(fn('COUNT', col('email')), '>', 1),
      raw: true
    });

    const duplicateNipList = dupNipRows.map(d => d.nip);
    const duplicateEmailList = dupEmailRows.map(d => d.email);

    let whereCondition = { 
      schoolId: sId, 
      isActive: true 
    };

    if (name) {
      whereCondition.nama = { [Op.like]: `%${name}%` };
    }

    // Jika filter duplikat aktif
    if (isDuplicateOnly === 'true') {
      whereCondition[Op.or] = [
        { nip: { [Op.in]: duplicateNipList } },
        { email: { [Op.in]: duplicateEmailList } },
        { nip: { [Op.like]: '%-DUP-%' } },
        { email: { [Op.like]: '%-DUP-%' } }
      ];
    }

    const offset = (currentPage - 1) * itemsPerPage;

    const { count, rows: guruTendik } = await GuruTendik.findAndCountAll({
      where: whereCondition,
      limit: itemsPerPage,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    const dataWithStatus = guruTendik.map(g => {
      const item = g.toJSON();
      item.isNipDuplicate = duplicateNipList.includes(item.nip) || (item.nip && item.nip.includes('-DUP-'));
      item.isEmailDuplicate = duplicateEmailList.includes(item.email) || (item.email && item.email.includes('-DUP-'));
      return item;
    });

    res.json({ 
      success: true, 
      summary: {
        totalNipIssues: duplicateNipList.length,
        totalEmailIssues: duplicateEmailList.length,
        hasIssues: duplicateNipList.length > 0 || duplicateEmailList.length > 0
      },
      data: dataWithStatus,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / itemsPerPage),
        currentPage: currentPage,
        perPage: itemsPerPage
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createGuruTendik = async (req, res) => {
  try {
    const { nama, mapel, email, role, jurusan, jenisKelamin, schoolId, nip } = req.body;

    if (!nama || !role || !jenisKelamin || !schoolId) {
      return res.status(400).json({ success: false, message: 'Data wajib diisi belum lengkap' });
    }

    const sId = parseInt(schoolId);

    // --- VALIDASI NIP (Per Sekolah) ---
    if (nip) {
      const existingNip = await GuruTendik.findOne({ where: { schoolId: sId, nip } });
      if (existingNip) {
        return res.status(400).json({ 
          success: false, 
          message: `NIP ${nip} sudah digunakan oleh ${existingNip.nama}`,
          conflictData: existingNip 
        });
      }
    }

    // --- VALIDASI EMAIL (Global) ---
    if (email) {
      const existingEmail = await GuruTendik.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: `Email ${email} sudah terdaftar atas nama ${existingEmail.nama}`,
          conflictData: existingEmail 
        });
      }
    }

    // Prosedur Upload Foto (Cloudinary)
    let photoUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: `school_${sId}/staff` },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
      photoUrl = result.secure_url;
    }

    const generatedQR = `QR-STAFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const defaultPassword = 'sekolah123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    const newGuruTendik = await GuruTendik.create({ 
      nama, mapel, email, role, jurusan, jenisKelamin, photoUrl,
      schoolId: sId,
      qrCodeData: generatedQR,
      password: hashedPassword,
      nip
    });

    await invalidateGuruTendikCache(schoolId)

    res.json({ success: true, message: 'Berhasil menambahkan Staff', data: newGuruTendik });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'NIP atau Email sudah terdaftar.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateGuruTendik = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, mapel, email, role, jurusan, jenisKelamin, nip } = req.body;

    // 1. Cari record guru yang akan di-update
    const guru = await GuruTendik.findByPk(id);
    if (!guru) {
      return res.status(404).json({ success: false, message: 'Guru/Tendik tidak ditemukan' });
    }

    const schoolId = guru.schoolId; // Ambil schoolId dari record existing (aman)
    const oldPhotoUrl = guru.photoUrl;

    // 2. Validasi duplikat NIP (jika nip baru diisi)
    if (nip !== undefined && nip !== guru.nip) {
      const existingNip = await GuruTendik.findOne({
        where: {
          schoolId,
          nip,
          id: { [Op.ne]: id }, // kecuali dirinya sendiri
          isActive: true,
        },
      });

      if (existingNip) {
        return res.status(409).json({
          success: false,
          message: `NIP "${nip}" sudah terdaftar atas nama "${existingNip.nama}" di sekolah ini`,
        });
      }
    }

    // 3. Validasi duplikat Email (jika email baru diisi)
    if (email !== undefined && email !== guru.email) {
      const existingEmail = await GuruTendik.findOne({
        where: {
          schoolId,
          email,
          id: { [Op.ne]: id }, // kecuali dirinya sendiri
          isActive: true,
        },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: `Email "${email}" sudah digunakan oleh "${existingEmail.nama}" di sekolah ini`,
        });
      }
    }

    // 4. Update fields
    if (nama) guru.nama = nama;
    if (mapel !== undefined) guru.mapel = mapel;
    if (email !== undefined) guru.email = email;
    if (nip !== undefined) guru.nip = nip;
    if (role) guru.role = role;
    if (jurusan !== undefined) guru.jurusan = jurusan;
    if (jenisKelamin) guru.jenisKelamin = jenisKelamin;

    // 5. Handle photo baru (jika ada upload)
    if (req.file) {
      // Hapus foto lama jika ada
      if (oldPhotoUrl) {
        const publicId = oldPhotoUrl.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Foto lama dihapus: ${publicId}`);
        } catch (err) {
          console.log(`Gagal hapus foto lama: ${err.message}`);
        }
      }

      // Upload foto baru
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

      guru.photoUrl = result.secure_url;
    }

    if (req.body.password) {
      const bcrypt = require('bcrypt'); // sudah ada di file
      guru.password = await bcrypt.hash(req.body.password, 10);
    }

    // 6. Simpan perubahan
    await guru.save();

    await invalidateGuruTendikCache(guru.schoolId);

    res.json({ success: true, data: guru });
  } catch (err) {
    console.error('Error update guru/tendik:', err);
    res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan server' });
  }
};

exports.deleteGuruTendik = async (req, res) => {
  try {
    const { id } = req.params;

    const guru = await GuruTendik.findByPk(id);
    if (!guru) {
      return res.status(404).json({ success: false, message: 'Guru/Tendik tidak ditemukan' });
    }

    // Hapus foto dari Cloudinary jika ada
    if (guru.photoUrl) {
      const publicId = guru.photoUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Foto dihapus: ${publicId}`);
      } catch (err) {
        console.log(`Gagal hapus foto: ${err.message}`);
      }
    }

    // Soft delete
    guru.isActive = false;
    await guru.save();

    await invalidateGuruTendikCache(guru.schoolId);

    res.json({ success: true, message: 'Guru/Tendik berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};