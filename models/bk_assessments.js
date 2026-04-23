const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BkAssessments = sequelize.define('BkAssessments', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  siswaId: { type: DataTypes.INTEGER, allowNull: false },
  guruId: { type: DataTypes.INTEGER },
  kategori: { type: DataTypes.ENUM('akademik', 'karir', 'pribadi', 'sosial'), defaultValue: 'akademik' },
  hasil: { type: DataTypes.TEXT },
  rekomendasi: { type: DataTypes.TEXT },
  tanggal: { type: DataTypes.DATEONLY, allowNull: false },
}, { timestamps: true, updatedAt: 'updatedAt' });

module.exports = BkAssessments;
