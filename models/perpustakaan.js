const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Perpustakaan = sequelize.define('Perpustakaan', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  schoolId: { type: DataTypes.INTEGER, allowNull: false },
  judul: { type: DataTypes.STRING(255), allowNull: false },
  penulis: { type: DataTypes.STRING(255) },
  penerbit: { type: DataTypes.STRING(255) },
  tahun: { type: DataTypes.INTEGER },
  isbn: { type: DataTypes.STRING(20) },
  kategori: { type: DataTypes.STRING(100) },
  jumlah: { type: DataTypes.INTEGER, defaultValue: 1 },
  tersedia: { type: DataTypes.INTEGER, defaultValue: 1 },
  coverUrl: { type: DataTypes.STRING(500) },
  sinopsis: { type: DataTypes.TEXT },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { timestamps: true, updatedAt: 'updatedAt' });

const Peminjaman = sequelize.define('Peminjaman', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  perpustakaanId: { type: DataTypes.INTEGER, allowNull: false },
  siswaId: { type: DataTypes.INTEGER, allowNull: false },
  tanggalPinjam: { type: DataTypes.DATEONLY, allowNull: false },
  tanggalKembali: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('dipinjam', 'dikembalikan', 'terlambat'), defaultValue: 'dipinjam' },
}, { timestamps: true, updatedAt: 'updatedAt' });

module.exports = { Perpustakaan, Peminjaman };
