const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Parent = sequelize.define('Parent', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  schoolId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  gender: { type: DataTypes.ENUM('Laki-laki', 'Perempuan'), allowNull: false },
  relationStatus: { type: DataTypes.ENUM('Ayah', 'Ibu'), allowNull: false },
  type: { type: DataTypes.ENUM('Kandung', 'Tiri'), defaultValue: 'Kandung' },
  phoneNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'orangTua'
});


module.exports = Parent;