const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  day: {
    type: DataTypes.STRING,
    allowNull: false,  // e.g., "Senin", "Selasa"
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false,  // e.g., "08:00"
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false,  // e.g., "09:00"
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,  // Mata pelajaran
  },
  className: {
    type: DataTypes.STRING,
    allowNull: false,  // e.g., "X IPA 1"
  },
  teacher: {
    type: DataTypes.STRING,
    allowNull: true,   // Nama guru, opsional
  },
  room: {
    type: DataTypes.STRING,
    allowNull: true,   // Ruangan, opsional
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,   // Keterangan tambahan
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tableName: 'jadwal',
});

module.exports = Schedule;