const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/protect');
const { Op } = require('sequelize');

// Import models
const Role = require('../models/role');
const Permission = require('../models/permission');
const PermissionGroup = require('../models/permissionGroup');
const RolePermission = require('../models/rolePermission');
const UserRole = require('../models/userRole');

// Get all roles
router.get('/', protect, async (req, res) => {
  try {
    const { schoolId, includePermissions } = req.query;
    const where = { isActive: 1 };
    if (schoolId) where.schoolId = schoolId || null;

    const roles = await Role.findAll({
      where,
      include: includePermissions ? [{
        model: RolePermission,
        include: [{ model: Permission }]
      }] : [],
      order: [['level', 'ASC'], ['name', 'ASC']],
    });

    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single role
router.get('/:id', protect, async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [{
        model: RolePermission,
        include: [{ model: Permission, include: [PermissionGroup] }]
      }],
    });

    if (!role) return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });

    res.json({ success: true, data: role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create role
router.post('/', protect, restrictTo('superAdmin'), async (req, res) => {
  try {
    const { name, displayName, description, schoolId, parentRoleId, level = 1 } = req.body;

    const existing = await Role.findOne({ where: { name } });
    if (existing) return res.status(400).json({ success: false, message: 'Role sudah ada' });

    const role = await Role.create({
      name,
      displayName,
      description,
      schoolId: schoolId || null,
      parentRoleId: parentRoleId || null,
      level,
    });

    res.json({ success: true, data: role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update role
router.put('/:id', protect, restrictTo('superAdmin'), async (req, res) => {
  try {
    const { displayName, description, level, isActive } = req.body;
    const role = await Role.findByPk(req.params.id);

    if (!role) return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });

    await role.update({
      displayName: displayName || role.displayName,
      description: description !== undefined ? description : role.description,
      level: level || role.level,
      isActive: isActive !== undefined ? isActive : role.isActive,
    });

    res.json({ success: true, data: role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete role (soft delete)
router.delete('/:id', protect, restrictTo('superAdmin'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });

    await role.update({ isActive: 0 });
    res.json({ success: true, message: 'Role berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Assign permissions to role
router.post('/:id/permissions', protect, restrictTo('superAdmin'), async (req, res) => {
  try {
    const { permissionIds } = req.body;
    const roleId = req.params.id;

    // Remove existing permissions
    await RolePermission.destroy({ where: { roleId } });

    // Add new permissions
    if (permissionIds && permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(pid => ({
        roleId,
        permissionId: pid,
      }));
      await RolePermission.bulkCreate(rolePermissions);
    }

    res.json({ success: true, message: 'Permissions berhasil diassign' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all permissions (grouped)
router.get('/permissions/all', protect, async (req, res) => {
  try {
    const groups = await PermissionGroup.findAll({
      where: { isActive: 1 },
      include: [{
        model: Permission,
        where: { isActive: 1 },
        required: false,
      }],
      order: [['sortOrder', 'ASC']],
    });

    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Assign role to user
router.post('/assign', protect, async (req, res) => {
  try {
    const { userId, roleId, schoolId } = req.body;

    const existing = await UserRole.findOne({ where: { userId, roleId } });
    if (existing) return res.status(400).json({ success: false, message: 'User sudah punya role ini' });

    const userRole = await UserRole.create({
      userId,
      roleId,
      schoolId: schoolId || null,
      assignedBy: req.user.id,
      assignedAt: new Date(),
    });

    res.json({ success: true, data: userRole });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove role from user
router.delete('/remove', protect, async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    await UserRole.destroy({ where: { userId, roleId } });
    res.json({ success: true, message: 'Role berhasil dilepas' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user's roles
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const userRoles = await UserRole.findAll({
      where: { userId: req.params.userId, isActive: 1 },
      include: [{ model: Role }],
    });

    res.json({ success: true, data: userRoles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;