const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Materi = sequelize.define('Materi', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  schoolId: { type: DataTypes.INTEGER, allowNull: false, field: 'schoolId' },
  mapel: { type: DataTypes.STRING(255), allowNull: false, field: 'mapel' },
  kelas: { type: DataTypes.STRING(255), allowNull: false, field: 'kelas' },
  bab: { type: DataTypes.STRING(255), field: 'bab' },
  title: { type: DataTypes.STRING(255), allowNull: false, field: 'title' },
  contentType: { type: DataTypes.ENUM('video', 'doc', 'link', 'text'), defaultValue: 'text', field: 'contentType' },
  youtubeUrl: { type: DataTypes.STRING(255), field: 'youtubeUrl' },
  documentUrl: { type: DataTypes.STRING(255), field: 'documentUrl' },
  linkUrl: { type: DataTypes.STRING(255), field: 'linkUrl' },
  namaGuru: { type: DataTypes.STRING(255), allowNull: false, field: 'namaGuru' },
  emailGuru: { type: DataTypes.STRING(255), allowNull: false, field: 'emailGuru' },
  description: { type: DataTypes.TEXT, field: 'description' },
  duration: { type: DataTypes.STRING(255), field: 'duration' },
  rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0, field: 'rating' },
  reviewCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'reviewCount' },
  teacherPhoto: { type: DataTypes.STRING(500), field: 'teacherPhoto' },
}, { timestamps: true, updatedAt: 'updatedAt', createdAt: 'createdAt' });

module.exports = Materi;
