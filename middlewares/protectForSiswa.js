const jwt = require('jsonwebtoken');
const Student = require('../models/siswa'); // Pastikan path ke model Student benar

const protectForSiswa = async (req, res, next) => {
  try {
    let token;
    
    // 1. Cek apakah ada token di header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Akses ditolak, token tidak ditemukan' });
    }

    if (token.split('.').length !== 3) {
      return res.status(401).json({ message: 'Format token tidak valid' });
    }

    // 2. Verifikasi Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const studentId = decoded.id || (decoded.profile ? decoded.profile.id : null);

    // 3. Cari Siswa di database berdasarkan ID dari token
    // Kita ambil field yang diperlukan saja (kecuali password)
    const student = await Student.findByPk(studentId, {
      attributes: { exclude: ['password'] }
    });

    if (!student) {
      return res.status(401).json({ success: false, message: 'Siswa sudah tidak terdaftar' });
    }

    if (!student.isActive) {
      return res.status(401).json({ success: false, message: 'Akun siswa tidak aktif' });
    }

    // 4. Simpan data siswa ke object req
    req.user = student; 
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({ success: false, message: 'Sesi berakhir, silakan login kembali' });
  }
};

module.exports = { protectForSiswa };