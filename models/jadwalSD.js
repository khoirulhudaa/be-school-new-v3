const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JadwalPelajaran = sequelize.define('JadwalPelajaran', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  kelas: {
    type: DataTypes.INTEGER,
    allowNull: false,           // 1 sampai 6 (sesuai button K1–K6)
    validate: { min: 1, max: 6 }
  },
  shift: {
    type: DataTypes.ENUM('pagi', 'siang'),
    allowNull: false,
  },
  seragam: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  hari: {
    type: DataTypes.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'),
    allowNull: false,
  },
  // Format JSON array string, contoh: ["07:30 - Matematika", "08:20 - Bahasa Indonesia", ...]
  jadwal: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  // Opsional: bisa ditambah field catatan/administratif
  catatan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'jadwal_sd',
  indexes: [
    {
      unique: true,
      fields: ['schoolId', 'kelas', 'shift', 'hari']
    }
  ]
});

module.exports = JadwalPelajaran;