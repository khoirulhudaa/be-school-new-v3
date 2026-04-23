const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./siswa');
const Makanan = require('./makanan');

const NutrisiLog = sequelize.define('NutrisiLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  siswa_id: { type: DataTypes.INTEGER, allowNull: false },
  makanan_id: { type: DataTypes.INTEGER, allowNull: false },
  tanggal: { type: DataTypes.DATEONLY, allowNull: false },
  waktu_makan: {
    type: DataTypes.ENUM('sarapan','makan_siang','makan_malam','snack'),
    allowNull: false
  },
  porsi: { type: DataTypes.DECIMAL(3,2), defaultValue: 1 },
  source: { type: DataTypes.ENUM('manual','barcode','ai_analyze'), defaultValue: 'manual' },
  foto_bukti: { type: DataTypes.STRING(500), allowNull: true },
}, {
  tableName: 'nutrisi_log',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['siswa_id', 'tanggal'] },
    { fields: ['tanggal'] },
  ]
});

// Associations
NutrisiLog.belongsTo(Student, { foreignKey: 'siswa_id', as: 'Siswa' });
NutrisiLog.belongsTo(Makanan, { foreignKey: 'makanan_id', as: 'Makanan' });

module.exports = NutrisiLog;
