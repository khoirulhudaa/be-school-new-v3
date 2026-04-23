const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SukuDinas = require('./SukuDinas');  // sesuaikan path
// Jika createdBy merujuk ke UserSudin
const UserSudin = require('./userSudin');  // sesuaikan path

const AnnouncementSudin = sequelize.define('AnnouncementSudin', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: 'Umum',
  },
  source: {
    type: DataTypes.STRING(50),
    defaultValue: 'Suku Dinas',
  },
  publishDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'userSudin',  // asumsi table user_sudin
      key: 'id'
    }
  },
  sukuDinasId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sukuDinas',
      key: 'id'
    }
  },
}, {
  tableName: 'pengumumanSudin',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

// === Tambahkan relasi (sangat disarankan) ===
AnnouncementSudin.belongsTo(SukuDinas, {
  foreignKey: 'sukuDinasId',
  as: 'sukuDinas'
});

AnnouncementSudin.belongsTo(UserSudin, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// Opsional: relasi balik
SukuDinas.hasMany(AnnouncementSudin, {
  foreignKey: 'sukuDinasId',
  as: 'announcements'
});

UserSudin.hasMany(AnnouncementSudin, {
  foreignKey: 'createdBy',
  as: 'createdAnnouncements'
});

module.exports = AnnouncementSudin;