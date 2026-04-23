const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const GuruTendik = require('./guruTendik');

const KehadiranGuru = sequelize.define('KehadiranGuru', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    guruId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'guruTendik', key: 'id' },
    },
    userRole: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'teacher',
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Hadir',
    },
    currentClass: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    latitude:  { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    method: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'qr | face | rfid',
    },
    updatedAt: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'kehadiran_guru',
    timestamps: true,
    hooks: {
    beforeCreate: (instance) => {
        // Mengambil waktu saat ini di server Node.js (pastikan jam server sudah WIB)
        const sekarang = new Date();
        instance.createdAt = sekarang;
        instance.updatedAt = sekarang;
        }
    },
    indexes: [
        { name: 'idx_guru_school_date', fields: ['schoolId', 'createdAt'] },
        { name: 'idx_guru_daily',       fields: ['guruId', 'createdAt']   },
    ],
});

// Relasi
KehadiranGuru.belongsTo(GuruTendik, {
    foreignKey: { name: 'guruId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    as: 'guru',
});
GuruTendik.hasMany(KehadiranGuru, {
    foreignKey: 'guruId',
    as: 'guruKehadiran',
});

module.exports = KehadiranGuru;