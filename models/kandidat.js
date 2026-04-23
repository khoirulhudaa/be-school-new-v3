const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Candidate = sequelize.define('Candidate', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  schoolId: { type: DataTypes.INTEGER, allowNull: false },
  
  // Data Ketua
  chairmanName: { type: DataTypes.STRING, allowNull: false },
  chairmanNik: { type: DataTypes.STRING, allowNull: false },
  chairmanClass: { type: DataTypes.STRING, allowNull: false },
  chairmanMajor: { type: DataTypes.STRING, allowNull: false },
  chairmanBatch: { type: DataTypes.STRING, allowNull: false },
  chairmanImageUrl: { type: DataTypes.STRING, allowNull: true },

  // Data Wakil Ketua
  viceChairmanName: { type: DataTypes.STRING, allowNull: false },
  viceChairmanNik: { type: DataTypes.STRING, allowNull: false },
  viceChairmanClass: { type: DataTypes.STRING, allowNull: false },
  viceChairmanMajor: { type: DataTypes.STRING, allowNull: false },
  viceChairmanBatch: { type: DataTypes.STRING, allowNull: false },
  viceChairmanImageUrl: { type: DataTypes.STRING, allowNull: true },

  // Data Pasangan (Satu untuk berdua)
  vision: { type: DataTypes.TEXT, allowNull: false },
  mission: {  
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [], 
    },
  motto: { type: DataTypes.STRING, allowNull: true },
  
  votes: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: true,
  tableName: 'kandidat',
});

module.exports = Candidate