// models/SukuDinas.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SukuDinas = sequelize.define('SukuDinas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  kodeSudin: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  namaSudin: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  dinasProvId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'dinasProvinsi',
      key: 'id'
    }
  },
  alamat: DataTypes.STRING(255),
  telepon: DataTypes.STRING(30),
  email: DataTypes.STRING(100),
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'sukuDinas',
  timestamps: true,
});

// Relasi
SukuDinas.belongsTo(require('./dinasProvinsi'), {
  foreignKey: 'dinasProvId',
  as: 'dinasProvinsi'
});

module.exports = SukuDinas;