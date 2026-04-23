const { DataTypes } = require('sequelize');
const db = require('../config/database');

const RolePermission = db.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'role_permissions',
  timestamps: false,
  underscored: true,
});

module.exports = RolePermission;