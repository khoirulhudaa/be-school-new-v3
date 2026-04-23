const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alumni = sequelize.define('Alumni', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nis: {
    type: DataTypes.STRING(20),
    allowNull: false, // Wajib diisi
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  graduationYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  photoUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  batch: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Jejak Alumni fields
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  hasStory: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  university: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  currentJob: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  story: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contact: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      name: 'idx_school_verified_active',
      fields: ['schoolId', 'isVerified', 'isActive']
    },
    {
      name: 'idx_graduation_year',
      fields: ['graduationYear']
    },
    {
      name: 'idx_created_at',
      fields: ['createdAt']
    },
    {
      name: 'idx_school_nis_unique',
      unique: true,
      fields: ['schoolId', 'nis']
    },
    { name: 'idx_batch', fields: ['batch'] },
  ]
});

module.exports = Alumni;