const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kuis = sequelize.define('Kuis', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  materiId: { type: DataTypes.BIGINT, allowNull: false, field: 'materiId' },
  judul: { type: DataTypes.STRING(255), allowNull: false, field: 'judul' },
  deskripsi: { type: DataTypes.TEXT, field: 'deskripsi' },
  waktuMenit: { type: DataTypes.INTEGER, defaultValue: 30, field: 'waktuMenit' },
  aktif: { type: DataTypes.TINYINT, defaultValue: 1, field: 'aktif' },
}, { timestamps: true, updatedAt: 'updatedAt', createdAt: 'createdAt' });

const Soal = sequelize.define('Soal', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  kuisId: { type: DataTypes.BIGINT, allowNull: false, field: 'kuisId' },
  teksSoal: { type: DataTypes.TEXT, allowNull: false, field: 'teksSoal' },
  tipeSoal: { type: DataTypes.ENUM('pg', 'essay'), defaultValue: 'pg', field: 'tipeSoal' },
  options: { type: DataTypes.JSON, field: 'options' },
  jawabanBenar: { type: DataTypes.STRING(255), field: 'jawabanBenar' },
  urutan: { type: DataTypes.INTEGER, defaultValue: 0, field: 'urutan' },
}, { timestamps: true, updatedAt: 'updatedAt', createdAt: 'createdAt' });

const HasilKuis = sequelize.define('HasilKuis', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  kuisId: { type: DataTypes.BIGINT, allowNull: false, field: 'kuisId' },
  siswaId: { type: DataTypes.INTEGER, allowNull: false, field: 'siswaId' },
  score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, field: 'score' },
  jawabanUser: { type: DataTypes.JSON, field: 'jawabanUser' },
  benar: { type: DataTypes.INTEGER, defaultValue: 0, field: 'benar' },
  salah: { type: DataTypes.INTEGER, defaultValue: 0, field: 'salah' },
}, { timestamps: true, updatedAt: 'updatedAt', createdAt: 'createdAt' });

module.exports = { Kuis, Soal, HasilKuis };
