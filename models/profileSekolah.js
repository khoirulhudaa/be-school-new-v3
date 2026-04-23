const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SchoolProfile = sequelize.define('SchoolProfile', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  schoolId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  domain: { type: DataTypes.STRING(255) },

  // Basic Info
  schoolName: { type: DataTypes.STRING(255), allowNull: false },
  headmasterName: { type: DataTypes.STRING(255), allowNull: false },
  kepalaSekolahPhone: { type: DataTypes.STRING(20) },
  kepalaSekolahEmail: { type: DataTypes.STRING(100) },
  headmasterWelcome: { type: DataTypes.TEXT, allowNull: false },

  // Hero Section
  heroTitle: { type: DataTypes.STRING(255), allowNull: false },
  heroSubTitle: { type: DataTypes.STRING(255) },
  heroImageUrl: { type: DataTypes.STRING(500) },

  // Links
  linkYoutube: { type: DataTypes.STRING(255) },
  youtubeUrls: { type: DataTypes.TEXT }, // JSON array unlimited YouTube URLs

  // Media
  photoHeadmasterUrl: { type: DataTypes.STRING(500) },
  logoUrl: { type: DataTypes.STRING(500) },

  // Contact
  address: { type: DataTypes.STRING(500) },
  phoneNumber: { type: DataTypes.STRING(50) },
  email: { type: DataTypes.STRING(100) },

  // Stats
  studentCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  teacherCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  roomCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  achievementCount: { type: DataTypes.INTEGER, defaultValue: 0 },

  // Location
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },

  // Theme Colors (NEW - for multi-tenant customization)
  themePrimary: { type: DataTypes.STRING(20), defaultValue: '#1B5E20' },
  themeAccent: { type: DataTypes.STRING(20), defaultValue: '#FFFFEB3B' },
  themeBg: { type: DataTypes.STRING(20), defaultValue: '#FFFFFF' },
  themeSurface: { type: DataTypes.STRING(20), defaultValue: '#F5F5F5' },
  themeSurfaceText: { type: DataTypes.STRING(20), defaultValue: '#212121' },
  themeSubtle: { type: DataTypes.STRING(20), defaultValue: '#757575' },
  themePop: { type: DataTypes.STRING(20), defaultValue: '#FF8A00' },

  // Social Media Links (NEW)
  socialInstagram: { type: DataTypes.STRING(255) },
  socialFacebook: { type: DataTypes.STRING(255) },
  socialTwitter: { type: DataTypes.STRING(255) },

  // SEO Fields (NEW)
  seoTitle: { type: DataTypes.STRING(255) },
  seoDescription: { type: DataTypes.STRING(500) },
  seoKeywords: { type: DataTypes.STRING(500) },
  ogTitle: { type: DataTypes.STRING(255) },
  ogDescription: { type: DataTypes.STRING(500) },
  ogImage: { type: DataTypes.STRING(500) },

  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

module.exports = SchoolProfile;
