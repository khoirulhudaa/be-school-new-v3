/**
 * RBAC Seeder Runner
 * Run this once to seed permissions and roles
 * Usage: node seeders/runRbacSeeder.js
 */

const { seedPermissionsAndRoles } = require('./rbacSeeder');

async function run() {
  console.log('🚀 Starting RBAC seeder...\n');
  await seedPermissionsAndRoles();
  console.log('\n✨ Done!');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});