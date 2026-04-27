require('dotenv').config();
const sequelize = require('./config/database');
const Apresiasi = require('./models/apresiasi');

console.log('Model loaded');
console.log('tableName:', Apresiasi.tableName);
console.log('Has findAndCountAll:', typeof Apresiasi.findAndCountAll);
console.log('Model name:', Apresiasi.name);
