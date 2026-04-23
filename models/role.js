const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Role = db.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  displayName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    defaultValue: '',
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = global/system role
  },
  parentRoleId: {
    type: DataTypes.INTEGER,
    allowNull: true, // for permission inheritance
  },
  isActive: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // hierarchy level (1=highest)
  },
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true,
});

module.exports = Role;