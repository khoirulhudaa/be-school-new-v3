module.exports = (sequelize, DataTypes) => {
  const Nilai = sequelize.define('Nilai', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'studentId' },
    guruId: { type: DataTypes.INTEGER, allowNull: false, field: 'guruId' },
    mapel: { type: DataTypes.STRING(255), allowNull: false },
    semester: { type: DataTypes.STRING(255), allowNull: false },
    nilai: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    deskripsi: { type: DataTypes.TEXT },
  }, { tableName: 'nilai', timestamps: true });

  Nilai.associate = (models) => {
    Nilai.belongsTo(models.siswa, { foreignKey: 'studentId', as: 'siswa' });
  };

  return Nilai;
};