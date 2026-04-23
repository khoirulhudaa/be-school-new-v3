const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tindak lanjut rules ditentukan dari total skor likert
// 0-30%: Baik (Tindak Lanjut: Pemberian Apresiasi)
// 31-60%: Perlu Perhatian (Tindak Lanjut: Konseling Individu)
// 61-100%: Perlu Intervensi (Tindak Lanjut: Konseling Intensif + Orang Tua)

const BkHasil = sequelize.define('BkHasil', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  kuisId: { type: DataTypes.INTEGER, allowNull: false },
  siswaId: { type: DataTypes.INTEGER, allowNull: false },
  schoolId: { type: DataTypes.INTEGER, allowNull: false },
  namaSiswa: { type: DataTypes.STRING, allowNull: false },
  kelasSiswa: { type: DataTypes.STRING, allowNull: true },
  totalSkorLikert: { type: DataTypes.INTEGER, defaultValue: 0 },
  maxSkorLikert: { type: DataTypes.INTEGER, defaultValue: 0 },
  persentaseSkor: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  levelMasalah: {
    type: DataTypes.ENUM('baik', 'perlu_perhatian', 'perlu_intervensi'),
    defaultValue: 'baik',
  },
  // di model BkHasil.js
  skorEssay: {
    type: DataTypes.JSON,        // contoh: { "45": 85, "46": 70 }
    allowNull: true,
    defaultValue: {}
  },
  totalSkorEssay: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxSkorEssay: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  catatanEssay: {           // ← tambahan baru (opsional)
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  tindakLanjut: {
    type: DataTypes.ENUM('apresiasi', 'konseling_individu', 'konseling_intensif'),
    defaultValue: 'apresiasi',
  },
  jawabanEssay: { type: DataTypes.JSON, allowNull: true },
  jawabanLikert: { type: DataTypes.JSON, allowNull: true },
  catatanGuru: { type: DataTypes.TEXT, allowNull: true },
  sudahDitindaklanjuti: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: true,
  tableName: 'bk_hasil',
});

module.exports = BkHasil;