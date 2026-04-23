// models/osis.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Osis = sequelize.define('Osis', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },

  // Periode saat ini
  periodeSaatIni: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },

  // Pengurus OSIS periode saat ini
  ketuaNama: { type: DataTypes.STRING(150), allowNull: true },
  ketuaNipNuptk: { type: DataTypes.STRING(50), allowNull: true },
  ketuaFotoUrl: { type: DataTypes.STRING(255), allowNull: true },

  wakilNama: { type: DataTypes.STRING(150), allowNull: true },
  wakilNipNuptk: { type: DataTypes.STRING(50), allowNull: true },
  wakilFotoUrl: { type: DataTypes.STRING(255), allowNull: true },

  bendaharaNama: { type: DataTypes.STRING(150), allowNull: true },
  bendaharaNipNuptk: { type: DataTypes.STRING(50), allowNull: true },
  bendaharaFotoUrl: { type: DataTypes.STRING(255), allowNull: true },

  sekretarisNama: { type: DataTypes.STRING(150), allowNull: true },
  sekretarisNipNuptk: { type: DataTypes.STRING(50), allowNull: true },
  sekretarisFotoUrl: { type: DataTypes.STRING(255), allowNull: true },

  // Visi & Misi OSIS (umum, tidak berubah per periode)
  visi: { type: DataTypes.STRING(350), allowNull: true },
  misi: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

  // Riwayat kepemimpinan periode sebelumnya (hanya ketua + wakil)
  riwayatKepemimpinan: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },

  // Prestasi OSIS hanya untuk periode saat ini (array JSON)
  prestasiSaatIni: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'osis',
});

module.exports = Osis;