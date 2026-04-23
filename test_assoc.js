require('dotenv').config();
const Student = require('./models/siswa');
const Parent = require('./models/orangTua');
const Izin = require('./models/izin');

console.log('Student:', typeof Student, Student.name);
console.log('Izin:', typeof Izin, Izin.name);
console.log('Student is Model:', Student.prototype && Student.prototype.isInitialized !== undefined);

try {
  Parent.hasMany(Student, { foreignKey: 'parentId', as: 'children' });
  Student.belongsTo(Parent, { foreignKey: 'parentId', as: 'parent' });
  console.log('Parent-Student association OK');
} catch(e) {
  console.log('Parent-Student error:', e.message);
}

try {
  Student.hasMany(Izin, { foreignKey: 'siswaId', as: 'izins' });
  Izin.belongsTo(Student, { foreignKey: 'siswaId', as: 'Siswa' });
  console.log('Student-Izin association OK');
} catch(e) {
  console.log('Student-Izin error:', e.message);
}