// models/BkAdmin.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Model khusus Admin Web Bimbingan Konseling
 * Terpisah dari GuruTendik agar privilege tidak tercampur
 *
 * Role hierarchy:
 *  - super_admin     : IT/System Admin — kelola user, tidak bisa lihat detail konseling
 *  - koordinator_bk  : Kepala Guru BK — statistik, pembagian tugas, laporan
 *  - guru_bk         : Konselor utama — akses penuh ke kuis, hasil, jadwal miliknya
 *  - wali_kelas      : Viewer — hanya hasil akhir/rekomendasi, tanpa detail chat/catatan
 */
const BkAdmin = sequelize.define('BkAdmin', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID sekolah yang dikelola admin ini',
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Bcrypt hash',
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'koordinator_bk', 'guru_bk', 'wali_kelas'),
    allowNull: false,
    defaultValue: 'guru_bk',
  },
  /**
   * Untuk guru_bk: hanya boleh akses siswa yang assigned ke dia.
   * Stored sebagai JSON array of siswaId, null = akses semua (koordinator ke atas).
   */
  assignedSiswaIds: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: 'Array siswaId yang menjadi tanggungjawab guru_bk ini. null = semua.',
  },
  nip: {
    type: DataTypes.STRING(18),
    allowNull: true,
    unique: true,
  },
  photoUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'bk_admins',
});

module.exports = BkAdmin;