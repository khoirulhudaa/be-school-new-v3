const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notifications = sequelize.define('Notifications', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: true, field: 'user_id' },
  userType: { type: DataTypes.ENUM('admin', 'siswa', 'ortu'), allowNull: true, field: 'user_type' },
  schoolId: { type: DataTypes.INTEGER, field: 'school_id' },
  title: { type: DataTypes.STRING(255), allowNull: false },
  body: { type: DataTypes.TEXT },
  type: { type: DataTypes.ENUM('nilai', 'tugas', 'absen', 'izin', 'pengumuman', 'kuis', 'chat', 'info', 'broadcast'), defaultValue: 'info' },
  data: { type: DataTypes.JSON },
  isRead: { type: DataTypes.TINYINT, defaultValue: 0, field: 'is_read' },
}, { 
  timestamps: true, 
  updatedAt: false, 
  createdAt: 'created_at', 
  underscored: true  // ✅ 
 });

module.exports = Notifications;
