const { DataTypes } = require('sequelize');
const db = require('../config/database');

const PermissionGroup = db.define('PermissionGroup', {
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
  icon: {
    type: DataTypes.STRING(50),
    defaultValue: 'Shield',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
  },
}, {
  tableName: 'permission_groups',
  timestamps: true,
  underscored: true,
});

// Associations
PermissionGroup.associate = (models) => {
  PermissionGroup.hasMany(models.Permission, { foreignKey: 'groupId', as: 'permissions' });
};

module.exports = PermissionGroup;