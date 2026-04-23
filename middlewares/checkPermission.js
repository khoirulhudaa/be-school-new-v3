const Role = require('../models/role');
const RolePermission = require('../models/rolePermission');
const Permission = require('../models/permission');
const UserRole = require('../models/userRole');
const { Op } = require('sequelize');

/**
 * Get all permissions for a user (including inherited from parent roles)
 */
async function getUserPermissions(userId, schoolId = null) {
  // Get all user roles
  const userRoles = await UserRole.findAll({
    where: { userId, isActive: 1 },
    include: [{
      model: Role,
      where: schoolId ? { [Op.or]: [{ schoolId }, { schoolId: null }] } : {},
    }],
  });

  const permissionIds = new Set();

  for (const ur of userRoles) {
    // Get direct permissions
    const directPermissions = await RolePermission.findAll({
      where: { roleId: ur.roleId },
      include: [{ model: Permission, where: { isActive: 1 } }],
    });

    for (const rp of directPermissions) {
      permissionIds.add(rp.Permission.name);
    }

    // Get inherited permissions from parent role
    let parentRole = ur.Role;
    while (parentRole && parentRole.parentRoleId) {
      const parent = await Role.findByPk(parentRole.parentRoleId);
      if (parent) {
        const parentPermissions = await RolePermission.findAll({
          where: { roleId: parent.id },
          include: [{ model: Permission, where: { isActive: 1 } }],
        });
        for (const pp of parentPermissions) {
          permissionIds.add(pp.Permission.name);
        }
        parentRole = parent;
      } else {
        break;
      }
    }
  }

  return Array.from(permissionIds);
}

/**
 * Check if user has specific permission
 */
async function hasPermission(userId, permissionName, schoolId = null) {
  const permissions = await getUserPermissions(userId, schoolId);
  return permissions.includes(permissionName);
}

/**
 * Middleware: Check if user has specific permission(s)
 * Usage: checkPermission('siswa.read') or checkPermission(['siswa.read', 'siswa.write'])
 */
function checkPermission(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      // Skip for superAdmin
      if (req.user.role === 'superAdmin') {
        return next();
      }

      const userId = req.user.id;
      const schoolId = req.user.schoolId || req.body.schoolId || req.query.schoolId;

      const userPermissions = await getUserPermissions(userId, schoolId);

      // Check if user has ALL required permissions
      const hasAll = requiredPermissions.every(p => userPermissions.includes(p));

      if (!hasAll) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses untuk operasi ini',
          required: requiredPermissions,
        });
      }

      next();
    } catch (err) {
      console.error('Permission check error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  };
}

/**
 * Middleware: Check if user has any of the specified permissions
 * Usage: checkAnyPermission('siswa.read', 'admin.read')
 */
function checkAnyPermission(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'superAdmin') {
        return next();
      }

      const userId = req.user.id;
      const schoolId = req.user.schoolId || req.body.schoolId || req.query.schoolId;

      const userPermissions = await getUserPermissions(userId, schoolId);

      const hasAny = requiredPermissions.some(p => userPermissions.includes(p));

      if (!hasAny) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses untuk operasi ini',
        });
      }

      next();
    } catch (err) {
      console.error('Permission check error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  };
}

/**
 * Middleware: Check if user has role
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (req.user.role === 'superAdmin' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Anda tidak memiliki role yang sesuai',
    });
  };
}

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkRole,
  hasPermission,
  getUserPermissions,
};