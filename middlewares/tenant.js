// const SchoolProfile = require('../models/profileSekolah');

// // Middleware untuk resolve domain → schoolId
// const tenantMiddleware = async (req, res, next) => {
//   try {
//     let host = req.get('Host') || '';
//     host = host.split(':')[0];
//     const domain = host.replace(/^www\./, '');

//     const school = await SchoolProfile.findOne({ where: { domain } });
//     if (school) {
//       req.schoolId = school.schoolId || school.id;
//       req.schoolDomain = domain;
//     }
//     next();
//   } catch (err) {
//     next(err);
//   }
// };

// // Middleware untuk enforce tenant (paksa schoolId dari query/body/header)
// const enforceTenant = (req, res, next) => {
//   const schoolId = req.query.schoolId || req.body.schoolId || req.headers['x-school-id'];
//   if (schoolId) {
//     req.enforcedSchoolId = schoolId;
//   }
//   next();
// };

// module.exports = { tenantMiddleware, enforceTenant };

const SchoolProfile = require('../models/profileSekolah');

const tenantMiddleware = async (req, res, next) => {
  // Bypass untuk route WA
  if (req.path.startsWith('/wa')) {
    req.school = null; // Pastikan objek ada tapi null
    return next();
  }

  try {
    let host = req.get('Host') || '';
    host = host.split(':')[0];
    const domain = host.replace(/^www\./, '');

    const school = await SchoolProfile.findOne({ where: { domain } });
    
    req.school = school ? {
      id: school.schoolId || school.id,
      domain: domain
    } : null;

    next();
  } catch (err) {
    next(err);
  }
};

const enforceTenant = (req, res, next) => {
  if (req.path.startsWith('/wa')) {
    return next();
  }

  // Gunakan pengecekan manual yang lebih aman daripada langsung akses properti
  const headerId = req.headers['x-school-id'];
  const queryId = req.query.schoolId;
  const bodyId = req.body ? req.body.schoolId : null;
  const domainId = req.school ? req.school.id : null;

  const schoolId = headerId || queryId || bodyId || domainId;

  if (!schoolId) {
    return res.status(403).json({
      success: false,
      message: "Identitas sekolah tidak ditemukan."
    });
  }

  req.schoolId = schoolId;
  next();
};

module.exports = { tenantMiddleware, enforceTenant };