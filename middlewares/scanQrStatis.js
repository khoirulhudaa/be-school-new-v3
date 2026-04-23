const jwt = require('jsonwebtoken');

const scanQrMiddleware = (req, res, next) => {
  // 1. Ambil token dari header Authorization (Bearer <token>)
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Akses ditolak. Token tidak ditemukan.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verifikasi token
    // Pastikan JWT_SECRET sama dengan yang digunakan saat login/sign-up
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Masukkan data hasil decode ke req.user
    // Jika di token ada { id, role, schoolId }, maka req.user akan berisi itu.
    req.user = decoded; 

    next(); // Lanjut ke controller
  } catch (err) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token tidak valid atau telah kadaluwarsa.' 
    });
  }
};

module.exports = scanQrMiddleware;



// const jwt = require('jsonwebtoken');

// const scanQrMiddleware = (req, res, next) => {
//   // 🔥 MODE STRESS TEST
//   if (process.env.STRESS_TEST === 'true') {
//     req.user = {
//       id: req.body.userId,
//       schoolId: 1
//     };
//   }

//   // 🔒 MODE NORMAL
//   const authHeader = req.headers.authorization;
  
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ 
//       success: false, 
//       message: 'Akses ditolak. Token tidak ditemukan.' 
//     });
//   }

//   const token = authHeader.split(' ')[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     return res.status(403).json({ 
//       success: false, 
//       message: 'Token tidak valid atau telah kadaluwarsa.' 
//     });
//   }
// };

// module.exports = scanQrMiddleware;