const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Layanan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  noTelephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Nomor telepon/WhatsApp kontak layanan',
  },
  atasNama: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nama PIC / penanggung jawab layanan',
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true,  // hanya validasi jika diisi
    },
    comment: 'Email resmi untuk layanan ini',
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tableName: 'layanan',
});

module.exports = Service;