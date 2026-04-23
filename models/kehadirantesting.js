const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttendanceTesting = sequelize.define('AttendanceTesting', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // Tidak pakai references ke tabel siswa asli agar INSERT lebih ngebut
  },
  guruId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userRole: {
    type: DataTypes.ENUM('student', 'teacher'),
    allowNull: false,
    defaultValue: 'student',
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Hadir',
  },
  currentClass: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
}, {
  tableName: 'kehadirantesting', // Nama tabel baru
  timestamps: true, // Otomatis mengelola createdAt & updatedAt
  indexes: [
    { name: 'idx_test_school_role_date', fields: ['schoolId', 'userRole', 'createdAt'] },
    { name: 'idx_test_student_daily', fields: ['studentId', 'createdAt'] }
  ]
});

module.exports = AttendanceTesting;