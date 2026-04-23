const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Makanan = sequelize.define('Makanan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  schoolId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  barcode: { type: DataTypes.STRING(50), allowNull: true },
  nama: { type: DataTypes.STRING(255), allowNull: false },
  kategori: { 
    type: DataTypes.ENUM('karbo','protein','sayur','buah','susu','snack'),
    allowNull: false 
  },
  sub_kategori: { type: DataTypes.STRING(50), allowNull: true },
  kalori: { type: DataTypes.INTEGER, defaultValue: 0 },
  protein_g: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  lemak_g: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  karbo_g: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  fiber_g: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  serving_size: { type: DataTypes.STRING(50), defaultValue: '1 porsi' },
  foto_url: { type: DataTypes.STRING(500), allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  is_approved: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'makanan',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['schoolId', 'kategori'] },
    { fields: ['barcode'] },
    { fields: ['schoolId', 'nama'] },
  ]
});

module.exports = Makanan;
