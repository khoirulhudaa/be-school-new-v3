const Notifications = require('../models/notifications');
const Siswa = require('../models/siswa');
const GuruTendik = require('../models/guruTendik');
const OrangTua = require('../models/orangTua');
const { Op } = require('sequelize');

class NotificationsController {
  // Helper: verify user belongs to school
  async _verifyUserSchool(userId, userType, schoolId) {
    if (userType === 'siswa') {
      const siswa = await Siswa.findByPk(userId, { attributes: ['id', 'schoolId'] });
      return siswa && siswa.schoolId === parseInt(schoolId);
    } else if (userType === 'guru') {
      const guru = await GuruTendik.findByPk(userId, { attributes: ['id', 'schoolId'] });
      return guru && guru.schoolId === parseInt(schoolId);
    } else if (userType === 'ortu') {
      const ortu = await OrangTua.findByPk(userId, { attributes: ['id', 'schoolId'] });
      return ortu && ortu.schoolId === parseInt(schoolId);
    }
    return false;
  }

  async getByUser(req, res) {
    try {
      const { userId, userType } = req.params;
      const { limit = 50, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Security: verify user belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyUserSchool(userId, userType, enforcedSchoolId);
        if (!isValid) {
          return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }
      }

      const notifications = await Notifications.findAll({
        where: { userId: parseInt(userId), userType },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
      });

      return res.json({ success: true, data: notifications });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getUnread(req, res) {
    try {
      const { userId, userType } = req.params;
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Security: verify user belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyUserSchool(userId, userType, enforcedSchoolId);
        if (!isValid) {
          return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }
      }

      const notifications = await Notifications.findAll({
        where: {
          userId: parseInt(userId),
          userType,
          isRead: false,
        },
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: notifications, count: notifications.length });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async markRead(req, res) {
    try {
      const { id } = req.params;
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Find notification first
      const notif = await Notifications.findByPk(id);
      if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

      // Security: verify school match if enforced
      if (enforcedSchoolId && notif.schoolId && notif.schoolId !== parseInt(enforcedSchoolId)) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      await Notifications.update({ isRead: 1 }, { where: { id: parseInt(id) } });

      return res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async markAllRead(req, res) {
    try {
      const { userId, userType } = req.params;
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Security: verify user belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyUserSchool(userId, userType, enforcedSchoolId);
        if (!isValid) {
          return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }
      }

      await Notifications.update(
        { isRead: 1 },
        { where: { userId: parseInt(userId), userType } }
      );

      return res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async send(req, res) {
    try {
      const { userId, userType, title, message, tipo, data, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      // Security: verify user belongs to school
      const isValid = await this._verifyUserSchool(userId, userType, enforcedSchoolId);
      if (!isValid) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const notification = await Notifications.create({
        userId: parseInt(userId),
        userType,
        schoolId: parseInt(enforcedSchoolId),
        title,
        body: message,
        tipo,
        data,
      });

      return res.json({ success: true, data: notification });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Broadcast notification to all users of a type in school
  async broadcast(req, res) {
    try {
      const { targetType, title, message, tipo, data, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }
      if (!title || !message) {
        return res.status(400).json({ success: false, message: 'title dan message wajib diisi' });
      }

      let users = [];
      if (targetType === 'siswa') {
        users = await Siswa.findAll({ where: { schoolId: parseInt(enforcedSchoolId) } });
      } else if (targetType === 'ortu') {
        users = await OrangTua.findAll({ where: { schoolId: parseInt(enforcedSchoolId) } });
      } else if (targetType === 'guru') {
        users = await GuruTendik.findAll({ where: { schoolId: parseInt(enforcedSchoolId) } });
      }

      if (users.length === 0) {
        return res.json({ success: true, data: { created: 0 } });
      }

      const notifications = users.map(user => ({
        userId: user.id,
        userType: targetType,
        schoolId: parseInt(enforcedSchoolId),
        title,
        body: message,
        tipo: tipo || 'broadcast',
        data,
      }));

      await Notifications.bulkCreate(notifications);

      return res.json({ success: true, data: { created: notifications.length } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Send to specific user by ID
  async sendToUser(req, res) {
    try {
      const { userId, userType, title, message, tipo, data, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      const notification = await Notifications.create({
        userId: parseInt(userId),
        userType,
        schoolId: parseInt(enforcedSchoolId),
        title,
        body: message,
        tipo: tipo || 'info',
        data,
      });

      return res.json({ success: true, data: notification });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get notifications for current logged user
  async getMyNotifications(req, res) {
    try {
      const userId = req.user.id;
      const userType = req.user.userType || 'admin';
      const { limit = 50, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId || req.user.schoolId;

      const where = {};

      // Filter by user
      if (userType === 'admin') {
        where.userType = 'admin';
      } else {
        where.userId = userId;
        where.userType = userType;
      }

      if (enforcedSchoolId) {
        where.schoolId = enforcedSchoolId;
      }

      const notifications = await Notifications.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
      });

      return res.json({ success: true, data: notifications });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get unread count for current user
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const userType = req.user.userType || 'admin';
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId || req.user.schoolId;

      const where = {
        isRead: false,
      };

      if (userType === 'admin') {
        where.userType = 'admin';
      } else {
        where.userId = userId;
        where.userType = userType;
      }

      if (enforcedSchoolId) {
        where.schoolId = enforcedSchoolId;
      }

      const count = await Notifications.count({ where });

      return res.json({ success: true, data: { count } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Mark all read for current user
  async markAllReadMine(req, res) {
    try {
      const userId = req.user.id;
      const userType = req.user.userType || 'admin';
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId || req.user.schoolId;

      const where = {};

      if (userType === 'admin') {
        where.userType = 'admin';
      } else {
        where.userId = userId;
        where.userType = userType;
      }

      if (enforcedSchoolId) {
        where.schoolId = enforcedSchoolId;
      }

      await Notifications.update(
        { isRead: 1 },
        { where }
      );

      return res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new NotificationsController();
