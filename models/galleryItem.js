const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Album = require('./album');

const GalleryItem = sequelize.define('GalleryItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  albumId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
});

// Relasi (opsional tapi bagus)
GalleryItem.belongsTo(Album, { foreignKey: 'albumId' });
Album.hasMany(GalleryItem, { foreignKey: 'albumId' });

module.exports = GalleryItem;