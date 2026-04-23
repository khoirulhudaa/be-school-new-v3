const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./siswa');
const GuruTendik = require('./guruTendik');

const Attendance = sequelize.define('Attendance', {
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
    references: { model: 'siswa', key: 'id' },
  },
  guruId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'guruTendik', key: 'id' },
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
  updatedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'kehadiran',
  timestamps: true,
  hooks: {
    beforeCreate: (instance) => {
      // Mengambil waktu saat ini di server Node.js (pastikan jam server sudah WIB)
      const sekarang = new Date();
      instance.createdAt = sekarang;
      instance.updatedAt = sekarang;
    }
  },
  indexes: [
    { name: 'idx_school_role_date', fields: ['schoolId', 'userRole', 'createdAt'] },
    { name: 'idx_school_class_date', fields: ['schoolId', 'currentClass', 'createdAt'] },
    { name: 'idx_unique_student_daily', fields: ['studentId', 'createdAt'] },
    { name: 'idx_unique_guru_daily', fields: ['guruId', 'createdAt'] }
  ]
});

// --- DEFINISI RELASI UNIK ---

// Relasi Siswa
Attendance.belongsTo(Student, { 
  foreignKey: {
    name: 'studentId',
    allowNull: true // Memastikan kolom boleh NULL di level database
  }, 
  onDelete: 'SET NULL', 
  onUpdate: 'CASCADE', as: 'student' 
});
Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'studentAttendances' }); // Alias Unik

// Relasi Guru
Attendance.belongsTo(GuruTendik, { 
  foreignKey: {
    name: 'guruId',
    allowNull: true // Memastikan kolom boleh NULL di level database
  }, 
  onDelete: 'SET NULL', 
  onUpdate: 'CASCADE', as: 'guru' 
});
GuruTendik.hasMany(Attendance, { foreignKey: 'guruId', as: 'guruAttendances' }); // Alias Unik

module.exports = Attendance;