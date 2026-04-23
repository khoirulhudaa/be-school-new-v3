const Presence = require('../models/presence');
const Places = require('../models/places');
const Siswa = require('../models/siswa');
const GuruTendik = require('../models/guruTendik');
const { Op } = require('sequelize');

class PresenceController {
  // Helper: verify user belongs to school
  async _verifyUserSchool(userId, userType, schoolId) {
    if (userType === 'siswa') {
      const siswa = await Siswa.findByPk(userId, { attributes: ['id', 'schoolId'] });
      return siswa && siswa.schoolId === parseInt(schoolId);
    } else if (userType === 'guru') {
      const guru = await GuruTendik.findByPk(userId, { attributes: ['id', 'schoolId'] });
      return guru && guru.schoolId === parseInt(schoolId);
    }
    return false;
  }

  // Helper: get schoolId from user
  async _getSchoolIdFromUser(userId, userType) {
    if (userType === 'siswa') {
      const siswa = await Siswa.findByPk(userId, { attributes: ['schoolId'] });
      return siswa ? siswa.schoolId : null;
    } else if (userType === 'guru') {
      const guru = await GuruTendik.findByPk(userId, { attributes: ['schoolId'] });
      return guru ? guru.schoolId : null;
    }
    return null;
  }

  // Check in
  async checkin(req, res) {
    try {
      const { userId, userType, latitude, longitude, placeId, zoneId, qrCode, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Security: verify user belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyUserSchool(userId, userType, enforcedSchoolId);
        if (!isValid) {
          return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }
      }

      const presence = await Presence.create({
        userId: parseInt(userId),
        userType,
        type: 'checkin',
        latitude,
        longitude,
        placeId,
        zoneId,
        qrCode,
      });

      return res.json({ success: true, data: presence });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Check out
  async checkout(req, res) {
    try {
      const { userId, userType, latitude, longitude, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Security: verify user belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyUserSchool(userId, userType, enforcedSchoolId);
        if (!isValid) {
          return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const presence = await Presence.findOne({
        where: {
          userId: parseInt(userId),
          userType,
          type: 'checkin',
          createdAt: { [Op.gte]: today },
        },
        order: [['createdAt', 'DESC']],
      });

      if (presence) {
        presence.type = 'checkout';
        presence.latitude = latitude;
        presence.longitude = longitude;
        await presence.save();
      }

      return res.json({ success: true, data: presence });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get active presence - MUST provide schoolId
  async getActive(req, res) {
    try {
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all siswa from this school
      const siswas = await Siswa.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id']
      });
      const siswaIds = siswas.map(s => s.id);

      // Get all guru from this school
      const gurus = await GuruTendik.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id']
      });
      const guruIds = gurus.map(g => g.id);

      const presences = await Presence.findAll({
        where: {
          userId: { [Op.in]: [...siswaIds, ...guruIds] },
          createdAt: { [Op.gte]: today },
        },
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: presences });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get my check-in history - verify user ownership
  async getMyCheckin(req, res) {
    try {
      const { userId, userType, date, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Security: verify user belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyUserSchool(userId, userType, enforcedSchoolId);
        if (!isValid) {
          return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }
      }

      const where = { userId: parseInt(userId), userType };
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt = { [Op.gte]: startDate, [Op.lt]: endDate };
      }

      const presences = await Presence.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: presences });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update location
  async updateLocation(req, res) {
    try {
      const { userId, latitude, longitude, userType, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Security: verify user belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifyUserSchool(userId, userType, enforcedSchoolId);
        if (!isValid) {
          return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }
      }

      return res.json({ success: true, message: 'Location updated' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new PresenceController();
