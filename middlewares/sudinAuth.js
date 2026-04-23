const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// Sesuaikan dengan nama model Anda
const SukuDinas = require('../models/SukuDinas'); // model suku dinas
const User = require('../models/auth');           // model user/admin (jika pakai)

// =======================
//         Versi 1
//   (paling sering dipakai)
// =======================
exports.protectSudin = async (req, res, next) => {
  try {
    // 1. Ambil token dari header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Anda belum login. Silahkan login terlebih dahulu.',
      });
    }

    // 2. Verifikasi token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Cek apakah user ini benar-benar role SUKU DINAS
    // ──────────────────────────────────────────────────────────────
    // Cara paling umum (tergantung struktur payload token Anda)
    // ──────────────────────────────────────────────────────────────

    // Cara A → pakai field role di payload
    if (decoded.role !== 'SUDIN' && decoded.role !== 'sudin') {
      return res.status(403).json({
        success: false,
        message: 'Akses hanya untuk akun Suku Dinas',
      });
    }

    // Cara B → pakai field khusus suku dinas
    // if (!decoded.sudinId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Token tidak memiliki informasi Suku Dinas',
    //   });
    // }

    // 4. Ambil data user (opsional tapi sangat disarankan)
    const currentUser = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role'],
    });

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'User yang terkait dengan token tidak ditemukan',
      });
    }

    // 5. Ambil data suku dinas yang terkait dengan user ini
    //    (tergantung relasi di database Anda)

    // Contoh paling umum (asumsi 1 user = 1 suku dinas)
    let sukuDinas;

    // Jika di tabel User ada kolom sukuDinasId
    if (currentUser.sukuDinasId) {
      sukuDinas = await SukuDinas.findByPk(currentUser.sukuDinasId);
    }
    // Atau jika pakai relasi many-to-one
    // else {
    //   sukuDinas = await currentUser.getSukuDinas();
    // }

    if (!sukuDinas) {
      return res.status(403).json({
        success: false,
        message: 'Data Suku Dinas tidak ditemukan untuk akun ini',
      });
    }

    // 6. Simpan ke request agar controller bisa langsung pakai
    req.user = currentUser;
    req.sudin = sukuDinas;

    next();
  } catch (err) {
    console.error('Middleware sudinAuth error:', err);

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid',
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesi telah kadaluarsa. Silahkan login kembali',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada autentikasi',
    });
  }
};