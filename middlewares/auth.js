const jwt = require('jsonwebtoken');

// module.exports = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ success: false, message: 'Unauthorized' });
//   }

//   const token = authHeader.split(' ')[1];
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log('descode protect', decoded)
//     req.user = decoded; // Berisi { id, schoolId } sesuai saat login
//     console.log('descode protect', req.user)
//     next();
//   } catch (err) {
//     return res.status(401).json({ success: false, message: 'Token invalid' });
//   }
// };


module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('[decode]', decoded)
    // console.log('[decode profile]', decoded.profile)
    
    // Normalisasi: Jika data ada di dalam 'profile', naikkan ke root req.user
    if (decoded.profile) {
      req.user = {
        ...decoded,
        id: decoded.profile.id,
        schoolId: decoded.profile.schoolId,
        role: decoded.profile.role
      };
    } else {
      req.user = decoded;
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid' });
  }
};