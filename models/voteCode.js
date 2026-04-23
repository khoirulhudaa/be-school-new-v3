const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VoteCode = sequelize.define('VoteCode', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(4),
    unique: true,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Jika false, kode sudah tidak bisa digunakan',
  },
}, {
  timestamps: true,
  tableName: 'kodeVoting',
});

module.exports = VoteCode;