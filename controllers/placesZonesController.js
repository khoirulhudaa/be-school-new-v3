const { SchoolZones, SafeZones, ZoneAlerts } = require('../models/zones');
const { Op } = require('sequelize');

class PlacesZonesController {
  // Get all places
  async getAllPlaces(req, res) {
    try {
      const { schoolId, category } = req.query;
      const where = { isActive: true };
      if (schoolId) where.schoolId = parseInt(schoolId);
      if (category) where.category = category;

      const Places = require('../models/places');
      const places = await Places.findAll({ where, order: [['name', 'ASC']] });
      return res.json({ success: true, data: places });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get nearby places
  async getNearbyPlaces(req, res) {
    try {
      const { lat, lng, radius = 500 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'lat and lng required' });
      }

      const latVal = parseFloat(lat);
      const lngVal = parseFloat(lng);

      const Places = require('../models/places');
      const places = await Places.findAll({
        where: {
          isActive: true,
          latitude: { [Op.between]: [latVal - 0.01, latVal + 0.01] },
          longitude: { [Op.between]: [lngVal - 0.01, lngVal + 0.01] },
        },
      });

      return res.json({ success: true, data: places });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get place density
  async getPlaceDensity(req, res) {
    try {
      const { placeId } = req.params;

      const Places = require('../models/places');
      const place = await Places.findByPk(placeId);
      if (!place) return res.status(404).json({ success: false, message: 'Place not found' });

      const Presence = require('../models/presence');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const count = await Presence.count({
        where: {
          placeId: parseInt(placeId),
          type: 'checkin',
          createdAt: { [Op.gte]: today },
        },
      });

      let density = 'sepi';
      if (count > 10) density = 'sedang';
      if (count > 30) density = 'ramai';

      return res.json({ success: true, data: { placeId, name: place.name, density, count } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get safe zones for ortu
  async getSafeZones(req, res) {
    try {
      const { ortuId } = req.query;
      const where = { isActive: true };
      if (ortuId) where.parentId = parseInt(ortuId);

      const zones = await SafeZones.findAll({ where });
      return res.json({ success: true, data: zones });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Create safe zone
  async createSafeZone(req, res) {
    try {
      const { ortuId, siswaId, name, latitude, longitude, radiusM = 200 } = req.body;

      const zone = await SafeZones.create({
        parentId: parseInt(ortuId),
        siswaId: parseInt(siswaId),
        name: name || 'Rumah',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radiusM),
      });

      return res.json({ success: true, data: zone });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get zone alerts
  async getZoneAlerts(req, res) {
    try {
      const { ortuId } = req.query;

      // Get all siswa children for this ortu
      const Student = require('../models/siswa');
      const children = await Student.findAll({ where: { parentId: parseInt(ortuId) } });
      const siswaIds = children.map(c => c.id);

      const alerts = await ZoneAlerts.findAll({
        where: { siswaId: { [Op.in]: siswaIds } },
        include: [{ model: SafeZones, as: 'zone' }],
        order: [['createdAt', 'DESC']],
        limit: 50,
      });

      return res.json({ success: true, data: alerts });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get all school locations for map
  async getSchoolLocations(req, res) {
    try {
      const { schoolId, province, city } = req.query;
      const SchoolProfile = require('../models/profileSekolah');

      const where = { isActive: true };
      if (schoolId) where.id = parseInt(schoolId);
      if (province) where.province = province;
      if (city) where.city = city;

      const schools = await SchoolProfile.findAll({
        where,
        attributes: ['id', 'name', 'latitude', 'longitude', 'address', 'province', 'city'],
        order: [['name', 'ASC']],
      });

      return res.json({ success: true, data: schools });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Read single alert
  async readAlert(req, res) {
    try {
      const { alertId } = req.params;

      await ZoneAlerts.update(
        { isRead: 1, readAt: new Date() },
        { where: { id: parseInt(alertId) } }
      );

      return res.json({ success: true, message: 'Alert marked as read' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Read all alerts for ortu's children
  async readAllAlerts(req, res) {
    try {
      const { ortuId } = req.query;

      const Student = require('../models/siswa');
      const children = await Student.findAll({ where: { parentId: parseInt(ortuId) } });
      const siswaIds = children.map(c => c.id);

      await ZoneAlerts.update(
        { isRead: 1, readAt: new Date() },
        { where: { siswaId: { [Op.in]: siswaIds }, isRead: 0 } }
      );

      return res.json({ success: true, message: 'All alerts marked as read' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Check if location is safe, alert ortu if dangerous
  async checkAndAlert(req, res) {
    try {
      const { siswaId, latitude, longitude, placeId } = req.body;

      if (!siswaId || !latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'siswaId, latitude, longitude wajib diisi' });
      }

      // Get student's parent
      const Student = require('../models/siswa');
      const siswa = await Student.findByPk(siswaId);
      if (!siswa) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });

      // Get safe zones for this student
      const safeZones = await SafeZones.findAll({ where: { siswaId: parseInt(siswaId), isActive: true } });

      let isSafe = true;
      let alertMessage = null;
      let nearestZone = null;
      let nearestDistance = null;

      // Calculate distance to nearest safe zone
      for (const zone of safeZones) {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(zone.latitude),
          parseFloat(zone.longitude)
        );

        if (distance > zone.radius) {
          // Outside this safe zone
          if (nearestDistance === null || distance < nearestDistance) {
            nearestDistance = distance;
            nearestZone = zone;
          }
          isSafe = false;
        }
      }

      if (!isSafe && nearestZone) {
        // Alert ortu
        const alert = await ZoneAlerts.create({
          siswaId: parseInt(siswaId),
          zoneId: nearestZone.id,
          type: 'danger',
          message: `Siswa berada di luar zona aman (${Math.round(nearestDistance)}m dari ${nearestZone.name})`,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          isRead: 0,
        });

        alertMessage = alert.message;
      }

      return res.json({
        success: true,
        data: {
          isSafe,
          alertMessage,
          nearestZone: nearestZone ? {
            name: nearestZone.name,
            distance: Math.round(nearestDistance),
            radius: nearestZone.radius,
          } : null,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

// Haversine helper
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = new PlacesZonesController();
