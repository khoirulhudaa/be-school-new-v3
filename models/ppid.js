const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PpidDocument = sequelize.define('PpidDocument', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,  // Contoh: "Laporan Keuangan BOS Tahun 2025", "Profil Sekolah 2025/2026"
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,  // Contoh: 'berkala', 'serta-merta', 'setiap-saat', 'keuangan', 'kegiatan', 'profil', 'ppdb', dll.
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: true,   // Link PDF/Dokumen (Google Drive, lokal, atau cloud)
  },
  publishedDate: {
    type: DataTypes.DATE,
    allowNull: true,   // Tanggal pengumuman resmi
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tableName: 'ppid',
});

module.exports = PpidDocument;