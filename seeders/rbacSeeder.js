const { Permission, PermissionGroup, Role, RolePermission } = require('../models');

// Default permissions
const PERMISSIONS = [
  // Siswa
  { name: 'siswa.read', displayName: 'Lihat Siswa', groupName: 'Siswa' },
  { name: 'siswa.create', displayName: 'Tambah Siswa', groupName: 'Siswa' },
  { name: 'siswa.update', displayName: 'Edit Siswa', groupName: 'Siswa' },
  { name: 'siswa.delete', displayName: 'Hapus Siswa', groupName: 'Siswa' },
  { name: 'siswa.export', displayName: 'Export Data Siswa', groupName: 'Siswa' },

  // Guru
  { name: 'guru.read', displayName: 'Lihat Guru', groupName: 'Guru & Staff' },
  { name: 'guru.create', displayName: 'Tambah Guru', groupName: 'Guru & Staff' },
  { name: 'guru.update', displayName: 'Edit Guru', groupName: 'Guru & Staff' },
  { name: 'guru.delete', displayName: 'Hapus Guru', groupName: 'Guru & Staff' },

  // Kehadiran
  { name: 'attendance.read', displayName: 'Lihat Kehadiran', groupName: 'Kehadiran' },
  { name: 'attendance.create', displayName: 'Input Kehadiran', groupName: 'Kehadiran' },
  { name: 'attendance.approve', displayName: 'Approve Kehadiran', groupName: 'Kehadiran' },

  // Izin
  { name: 'izin.read', displayName: 'Lihat Izin', groupName: 'Izin' },
  { name: 'izin.create', displayName: 'Ajukan Izin', groupName: 'Izin' },
  { name: 'izin.approve', displayName: 'Approve Izin', groupName: 'Izin' },
  { name: 'izin.reject', displayName: 'Tolak Izin', groupName: 'Izin' },

  // Website
  { name: 'berita.read', displayName: 'Lihat Berita', groupName: 'Website' },
  { name: 'berita.create', displayName: 'Buat Berita', groupName: 'Website' },
  { name: 'berita.update', displayName: 'Edit Berita', groupName: 'Website' },
  { name: 'berita.delete', displayName: 'Hapus Berita', groupName: 'Website' },
  { name: 'pengumuman.read', displayName: 'Lihat Pengumuman', groupName: 'Website' },
  { name: 'pengumuman.create', displayName: 'Buat Pengumuman', groupName: 'Website' },

  // Admin
  { name: 'admin.read', displayName: 'Lihat Admin', groupName: 'Manajemen' },
  { name: 'admin.create', displayName: 'Tambah Admin', groupName: 'Manajemen' },
  { name: 'admin.update', displayName: 'Edit Admin', groupName: 'Manajemen' },
  { name: 'admin.delete', displayName: 'Hapus Admin', groupName: 'Manajemen' },

  // Roles
  { name: 'role.read', displayName: 'Lihat Role', groupName: 'Manajemen' },
  { name: 'role.create', displayName: 'Buat Role', groupName: 'Manajemen' },
  { name: 'role.update', displayName: 'Edit Role', groupName: 'Manajemen' },
  { name: 'role.delete', displayName: 'Hapus Role', groupName: 'Manajemen' },

  // Kelas
  { name: 'kelas.read', displayName: 'Lihat Kelas', groupName: 'Akademik' },
  { name: 'kelas.create', displayName: 'Buat Kelas', groupName: 'Akademik' },
  { name: 'kelas.update', displayName: 'Edit Kelas', groupName: 'Akademik' },

  // Jadwal
  { name: 'jadwal.read', displayName: 'Lihat Jadwal', groupName: 'Akademik' },
  { name: 'jadwal.create', displayName: 'Buat Jadwal', groupName: 'Akademik' },
  { name: 'jadwal.update', displayName: 'Edit Jadwal', groupName: 'Akademik' },
];

// Default roles
const ROLES = [
  {
    name: 'superAdmin',
    displayName: 'Super Admin',
    description: 'Akses penuh ke semua fitur',
    schoolId: null,
    level: 0,
  },
  {
    name: 'adminSekolah',
    displayName: 'Admin Sekolah',
    description: 'Admin yang mengelola satu sekolah',
    schoolId: null,
    level: 1,
  },
  {
    name: 'waliKelas',
    displayName: 'Wali Kelas',
    description: 'Guru yang menjadi wali kelas',
    schoolId: null,
    level: 2,
  },
  {
    name: 'guruBk',
    displayName: 'Guru BK',
    description: 'Guru Bimbingan Konseling',
    schoolId: null,
    level: 2,
  },
  {
    name: 'bendahara',
    displayName: 'Bendahara',
    description: 'Mengelola keuangan sekolah',
    schoolId: null,
    level: 2,
  },
];

async function seedPermissionsAndRoles() {
  try {
    console.log('🔄 Seeding permissions and roles...');

    // Create permission groups
    const groupNames = [...new Set(PERMISSIONS.map(p => p.groupName))];
    const groupMap = {};

    for (const groupName of groupNames) {
      const [group, created] = await PermissionGroup.findOrCreate({
        where: { name: groupName.toLowerCase().replace(/\s+/g, '_') },
        defaults: {
          name: groupName.toLowerCase().replace(/\s+/g, '_'),
          displayName: groupName,
          sortOrder: PERMISSIONS.filter(p => p.groupName === groupName).length,
        },
      });
      groupMap[groupName] = group.id;
    }

    // Create permissions
    for (const perm of PERMISSIONS) {
      await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: {
          name: perm.name,
          displayName: perm.displayName,
          groupId: groupMap[perm.groupName],
          groupName: perm.groupName,
        },
      });
    }

    // Create roles
    for (const roleData of ROLES) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData,
      });

      if (created) {
        console.log(`  ✅ Created role: ${roleData.displayName}`);
      }
    }

    // Assign all permissions to superAdmin
    const superAdmin = await Role.findOne({ where: { name: 'superAdmin' } });
    const allPermissions = await Permission.findAll();
    const rolePerms = allPermissions.map(p => ({ roleId: superAdmin.id, permissionId: p.id }));

    await RolePermission.bulkCreate(rolePerms, { ignoreDuplicates: true });
    console.log(`  ✅ Assigned all permissions to Super Admin`);

    console.log('✅ Seeding completed!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

module.exports = { seedPermissionsAndRoles };