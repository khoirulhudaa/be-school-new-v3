/**
 * RBAC & Audit Log Migration Script
 * Run: node migrations/runRbacMigration.js
 *
 * Creates tables:
 * - permission_groups
 * - permissions
 * - roles
 * - role_permissions
 * - user_roles
 * - audit_logs
 */

const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/database');

async function migrate() {
  console.log('🚀 Starting RBAC & Audit migration...\n');

  try {
    // Sync PermissionGroup
    console.log('📋 Creating permission_groups table...');
    await db.define('PermissionGroup', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      displayName: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.STRING(255), defaultValue: '' },
      icon: { type: DataTypes.STRING(50), defaultValue: 'Shield' },
      sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
      isActive: { type: DataTypes.TINYINT, defaultValue: 1 },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { tableName: 'permission_groups', timestamps: false, underscored: true }).sync({ alter: true });
    console.log('  ✅ permission_groups created');

    // Sync Permission
    console.log('📋 Creating permissions table...');
    await db.define('Permission', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      displayName: { type: DataTypes.STRING(150), allowNull: false },
      groupId: { type: DataTypes.INTEGER, allowNull: true },
      groupName: { type: DataTypes.STRING(50), allowNull: false },
      description: { type: DataTypes.STRING(255), defaultValue: '' },
      isActive: { type: DataTypes.TINYINT, defaultValue: 1 },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { tableName: 'permissions', timestamps: false, underscored: true }).sync({ alter: true });
    console.log('  ✅ permissions created');

    // Sync Role
    console.log('📋 Creating roles table...');
    await db.define('Role', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      displayName: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.STRING(255), defaultValue: '' },
      schoolId: { type: DataTypes.INTEGER, allowNull: true },
      parentRoleId: { type: DataTypes.INTEGER, allowNull: true },
      isActive: { type: DataTypes.TINYINT, defaultValue: 1 },
      level: { type: DataTypes.INTEGER, defaultValue: 1 },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { tableName: 'roles', timestamps: false, underscored: true }).sync({ alter: true });
    console.log('  ✅ roles created');

    // Sync RolePermission
    console.log('📋 Creating role_permissions table...');
    await db.define('RolePermission', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      roleId: { type: DataTypes.INTEGER, allowNull: false },
      permissionId: { type: DataTypes.INTEGER, allowNull: false },
    }, { tableName: 'role_permissions', timestamps: false, underscored: true }).sync({ alter: true });
    console.log('  ✅ role_permissions created');

    // Sync UserRole
    console.log('📋 Creating user_roles table...');
    await db.define('UserRole', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      roleId: { type: DataTypes.INTEGER, allowNull: false },
      schoolId: { type: DataTypes.INTEGER, allowNull: true },
      isActive: { type: DataTypes.TINYINT, defaultValue: 1 },
      assignedBy: { type: DataTypes.INTEGER, allowNull: true },
      assignedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { tableName: 'user_roles', timestamps: false, underscored: true }).sync({ alter: true });
    console.log('  ✅ user_roles created');

    // Sync AuditLog
    console.log('📋 Creating audit_logs table...');
    await db.define('AuditLog', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      schoolId: { type: DataTypes.INTEGER, allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      username: { type: DataTypes.STRING(100), allowNull: true },
      action: { type: DataTypes.STRING(50), allowNull: false },
      entityType: { type: DataTypes.STRING(50), allowNull: false },
      entityId: { type: DataTypes.INTEGER, allowNull: true },
      oldData: { type: DataTypes.JSON, allowNull: true },
      newData: { type: DataTypes.JSON, allowNull: true },
      ipAddress: { type: DataTypes.STRING(45), allowNull: true },
      userAgent: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.STRING(255), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { tableName: 'audit_logs', timestamps: false, underscored: true }).sync({ alter: true });
    console.log('  ✅ audit_logs created');

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Run RBAC seeder: node seeders/runRbacSeeder.js');
    console.log('   2. Test the API endpoints');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();