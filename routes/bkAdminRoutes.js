// routes/bkAdminRoutes.js
const express = require('express');
const router = express.Router();
const {
  loginBkAdmin,
  getMe,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  verifyBkAdminToken,
  requirePermission,
  updateMyProfile,
  changeMyPassword,
} = require('../controllers/bkAdminController');

// Public
router.post('/login', loginBkAdmin);

// Protected — semua route di bawah butuh token
router.use(verifyBkAdminToken);

router.get('/me', getMe);

// Profile sendiri
router.put('/me', updateMyProfile);
router.put('/change-password', changeMyPassword);

// Manajemen admin — hanya super_admin
router.get('/', requirePermission('canManageUsers'), getAdmins);
router.post('/', requirePermission('canManageUsers'), createAdmin);
router.put('/:id', requirePermission('canManageUsers'), updateAdmin);
router.delete('/:id', requirePermission('canManageUsers'), deleteAdmin);

module.exports = router;

// ─────────────────────────────────────────────────────────────
// Daftarkan di app.js / index.js:
//   const bkAdminRoutes = require('./routes/bkAdminRoutes');
//   app.use('/bk-admin', bkAdminRoutes);
// ─────────────────────────────────────────────────────────────