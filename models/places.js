module.exports = (sequelize, DataTypes) => {
  const Places = sequelize.define('Places', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    schoolId: { type: DataTypes.INTEGER, allowNull: false, field: 'school_id' },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(255) },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
    radius: { type: DataTypes.INTEGER, defaultValue: 50, field: 'radius_m' },
    category: { type: DataTypes.ENUM('kantin', 'perpustakaan', 'lab', 'lapangan', 'kelas', 'toilet', 'lainnya'), defaultValue: 'lainnya' },
    icon: { type: DataTypes.STRING(50), defaultValue: 'place' },
    color: { type: DataTypes.STRING(20), defaultValue: '#FF8A00' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  }, { tableName: 'places', timestamps: true, updatedAt: 'updated_at', createdAt: 'created_at' });

  return Places;
};