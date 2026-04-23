const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const BkAdmin = require('../models/BkAdmin');
const SchoolProfile = require('../models/profileSekolah'); // sesuaikan path

const JWT_SECRET = process.env.JWT_SECRET;

// ─────────────────────────────────────────────────────────────
// HELPER: hak akses per role
// ─────────────────────────────────────────────────────────────
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
    canManageUsers: false,
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
};

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: verifikasi JWT token BK Admin
// ─────────────────────────────────────────────────────────────
exports.verifyBkAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded.profile; // { id, schoolId, nama, email, role, permissions }
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
};

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: cek permission spesifik
// Usage: requirePermission('canManageUsers')
// ─────────────────────────────────────────────────────────────
exports.requirePermission = (permKey) => (req, res, next) => {
  const role = req.admin?.role;
  if (!role || !ROLE_PERMISSIONS[role]?.[permKey]) {
    return res.status(403).json({
      success: false,
      message: `Akses ditolak. Role '${role}' tidak memiliki izin untuk tindakan ini.`,
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// LOGIN BK ADMIN
// POST /bk-admin/login
// ─────────────────────────────────────────────────────────────
exports.loginBkAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    // 1. Cari admin
    const admin = await BkAdmin.findOne({ where: { email: email.toLowerCase(), isActive: true } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Email tidak ditemukan atau akun tidak aktif.' });
    }

    // 2. Verifikasi password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password salah.' });
    }

    // 3. Ambil logo sekolah
    const dataSekolah = await SchoolProfile.findOne({
      where: { schoolId: admin.schoolId },
      attributes: ['logoUrl', 'schoolName'],
    });

    // 4. Update lastLoginAt
    admin.lastLoginAt = new Date();
    await admin.save();

    // 5. Susun profile (tanpa password)
    const profile = {
      id: admin.id,
      schoolId: admin.schoolId,
      nama: admin.nama,
      email: admin.email,
      role: admin.role,
      nip: admin.nip,
      photoUrl: admin.photoUrl,
      assignedSiswaIds: admin.assignedSiswaIds,
      permissions: ROLE_PERMISSIONS[admin.role],
      schoolLogo: dataSekolah?.logoUrl || null,
      namaSekolah: dataSekolah?.namaSekolah || null,
    };

    // 6. Generate JWT
    const token = jwt.sign({ profile }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ success: true, token, data: profile });

  } catch (err) {
    console.error('loginBkAdmin error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET PROFIL SENDIRI (untuk validasi token di frontend)
// GET /bk-admin/me
// ─────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const admin = await BkAdmin.findByPk(req.admin.id, {
      attributes: { exclude: ['password'] },
    });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin tidak ditemukan.' });

    res.json({
      success: true,
      data: {
        ...admin.toJSON(),
        permissions: ROLE_PERMISSIONS[admin.role],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// CRUD ADMIN (super_admin only)
// ─────────────────────────────────────────────────────────────

// GET /bk-admin?schoolId=x
exports.getAdmins = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId wajib.' });

    const admins = await BkAdmin.findAll({
      where: { schoolId: parseInt(schoolId), isActive: true },
      attributes: { exclude: ['password'] },
      order: [['role', 'ASC'], ['nama', 'ASC']],
    });

    res.json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /bk-admin
exports.createAdmin = async (req, res) => {
  try {
    const { schoolId, nama, email, password, role, nip } = req.body;
    if (!schoolId || !nama || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'schoolId, nama, email, password, role wajib.' });
    }

    const validRoles = ['super_admin', 'koordinator_bk', 'guru_bk', 'wali_kelas'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Role tidak valid. Pilih: ${validRoles.join(', ')}` });
    }

    const existing = await BkAdmin.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await BkAdmin.create({
      schoolId,
      nama,
      email: email.toLowerCase(),
      password: hashed,
      role,
      nip: nip || null,
    });

    const result = admin.toJSON();
    delete result.password;

    res.status(201).json({ success: true, data: { ...result, permissions: ROLE_PERMISSIONS[role] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /bk-admin/:id
exports.updateAdmin = async (req, res) => {
  try {
    const admin = await BkAdmin.findByPk(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin tidak ditemukan.' });

    const { nama, role, nip, assignedSiswaIds, isActive } = req.body;
    if (nama !== undefined) admin.nama = nama;
    if (role !== undefined) admin.role = role;
    if (nip !== undefined) admin.nip = nip;
    if (assignedSiswaIds !== undefined) admin.assignedSiswaIds = assignedSiswaIds;
    if (isActive !== undefined) admin.isActive = isActive;

    // Update password jika dikirim
    if (req.body.password) {
      admin.password = await bcrypt.hash(req.body.password, 12);
    }

    await admin.save();
    const result = admin.toJSON();
    delete result.password;

    res.json({ success: true, data: { ...result, permissions: ROLE_PERMISSIONS[admin.role] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /bk-admin/:id (soft delete)
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await BkAdmin.findByPk(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin tidak ditemukan.' });

    admin.isActive = false;
    await admin.save();

    res.json({ success: true, message: 'Admin berhasil dinonaktifkan.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const admin = await BkAdmin.findByPk(req.admin.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin tidak ditemukan' });
    }

    const { nama, email } = req.body; // Hapus photoUrl dari destructuring

    // Hanya update nama dan email
    if (nama) admin.nama = nama;
    if (email) admin.email = email.toLowerCase();

    await admin.save();

    res.json({
      success: true,
      data: {
        ...admin.toJSON(),
        permissions: ROLE_PERMISSIONS[admin.role],
      },
    });

  } catch (err) {
    console.error('updateMyProfile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changeMyPassword = async (req, res) => {
  try {
    const admin = await BkAdmin.findByPk(req.admin.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin tidak ditemukan' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Password wajib diisi' });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password lama salah' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();

    res.json({ success: true, message: 'Password berhasil diubah' });

  } catch (err) {
    console.error('changeMyPassword error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// EXPORT PERMISSIONS MAP (untuk dipakai di frontend juga)
// ─────────────────────────────────────────────────────────────
exports.ROLE_PERMISSIONS = ROLE_PERMISSIONS;