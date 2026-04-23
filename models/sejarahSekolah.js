// models/sejarahSekolah.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SejarahSekolah = sequelize.define('SejarahSekolah', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // Asumsi satu sejarah per schoolId
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tahunBerdiri: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  jumlahKepalaSekolah: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  jumlahKompetensiKeahlian: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  timeline: {
    type: DataTypes.JSON, // Array of {year: number, title: string, deskripsi: string}
    allowNull: true,
  },
  daftarKepalaSekolah: {
    type: DataTypes.JSON, // Array of {nama: string, tahunKerja: string, fotoUrl: string | null}
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tableName: 'sejarahSekolah'
});

module.exports = SejarahSekolah;