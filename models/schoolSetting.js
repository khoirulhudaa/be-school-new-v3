// models/schoolSetting.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SchoolSetting = sequelize.define('SchoolSetting', {
  schoolId: {
    type: DataTypes.INTEGER,
    primaryKey: true, // Satu setting per sekolah
  },
  displayAlumniYear: {
    type: DataTypes.INTEGER,
    allowNull: true, // Contoh: 2024
  },
  displayAlumniBatch: {
    type: DataTypes.STRING,
    allowNull: true, // Contoh: "2021"
  },
  announcementDate: {
    type: DataTypes.STRING, // Menyimpan timestamp (tanggal & jam)
    allowNull: true,
 }
});

module.exports = SchoolSetting;