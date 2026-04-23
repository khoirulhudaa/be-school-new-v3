// const jwt = require('jsonwebtoken');
// const Student = require('../models/siswa');
// const GuruTendik = require('../models/guruTendik');

// const protectMultiRole = async (req, res, next) => {
//   try {
//     let token;

//     // =========================
//     // 1. AMBIL TOKEN
//     // =========================
//     if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith('Bearer')
//     ) {
//       token = req.headers.authorization.split(' ')[1];
//     }

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'Token tidak ditemukan'
//       });
//     }

//     // =========================
//     // 2. VERIFY TOKEN
//     // =========================
//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(401).json({
//         success: false,
//         message:
//           err.name === 'TokenExpiredError'
//             ? 'Token sudah kadaluarsa'
//             : 'Token tidak valid'
//       });
//     }

//     // =========================
//     // 3. AMBIL PROFILE
//     // =========================
//     const profile = decoded.profile || decoded;

//     if (!profile?.id || !profile?.role) {
//       return res.status(401).json({
//         success: false,
//         message: 'Token tidak valid (profile tidak lengkap)'
//       });
//     }

//     let user;

//     // =========================
//     // 4. LOGIKA ROLE SEDERHANA
//     // =========================
//     if (profile.role === 'siswa') {
//       user = await Student.findByPk(profile.id, {
//         attributes: { exclude: ['password'] }
//       });
//     } else {
//       // SELAIN SISWA = GURU/TENDIK
//       user = await GuruTendik.findByPk(profile.id, {
//         attributes: { exclude: ['password'] }
//       });
//     }

//     // =========================
//     // 5. VALIDASI USER
//     // =========================
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'User tidak ditemukan'
//       });
//     }

//     if (!user.isActive) {
//       return res.status(403).json({
//         success: false,
//         message: 'Akun tidak aktif'
//       });
//     }

//     // =========================
//     // 6. SIMPAN KE REQUEST
//     // =========================
//     req.user = {
//       ...user.toJSON(),
//       role: profile.role // tetap simpan role asli (admin/guru/dll)
//     };

//     next();
//   } catch (err) {
//     console.error('Middleware Error:', err);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// module.exports = { protectMultiRole };


const jwt = require('jsonwebtoken');
const Student = require('../models/siswa');
const GuruTendik = require('../models/guruTendik');

const protectMultiRole = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError' ? 'Sesi berakhir' : 'Token tidak valid'
      });
    }

    // Ambil profile dari token (sesuai payload saat login)
    const profile = decoded.profile || decoded;
    const currentRole = profile.role ? profile.role.toLowerCase() : '';

    let user;

    if (currentRole === 'siswa') {
      user = await Student.findByPk(profile.id, {
        attributes: { exclude: ['password'] }
      });
    } else if (currentRole === 'guru' || currentRole === 'teacher' || currentRole === 'tendik') {
      user = await GuruTendik.findByPk(profile.id, {
        attributes: { exclude: ['password'] }
      });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User sudah tidak terdaftar' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Akun Anda dinonaktifkan' });
    }

    // Simpan data lengkap ke request
    req.user = user.toJSON();
    req.userRole = currentRole; 
    
    next();
  } catch (err) {
    console.error('Middleware Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { protectMultiRole };