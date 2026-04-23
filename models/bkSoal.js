const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BkSoal = sequelize.define('BkSoal', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  kuisId: { type: DataTypes.INTEGER, allowNull: false },
  tipe: {
    type: DataTypes.ENUM('likert', 'essay'),
    allowNull: false,
    defaultValue: 'likert',
  },
  
  pertanyaan: { type: DataTypes.TEXT, allowNull: false },
  urutan: { type: DataTypes.INTEGER, defaultValue: 0 },
  // For likert: bobot per opsi (0,1,2)
  // label_0: e.g. "Tidak Pernah", label_1: "Kadang-kadang", label_2: "Sering"
  labelOpsi0: { type: DataTypes.STRING, defaultValue: 'Tidak Pernah' },
  labelOpsi1: { type: DataTypes.STRING, defaultValue: 'Kadang-Kadang' },
  labelOpsi2: { type: DataTypes.STRING, defaultValue: 'Sering' },
}, {
  timestamps: true,
  tableName: 'bk_soal',
});

module.exports = BkSoal;