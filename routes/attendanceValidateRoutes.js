const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');
const SchoolProfile = require('../models/profileSekolah');

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// Validate if user is within school zone for attendance
router.post('/validate-location', optionalAuth, async (req, res) => {
  try {
    const { schoolId, latitude, longitude, radius = 100 } = req.body;

    if (!schoolId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'schoolId, latitude, longitude wajib diisi'
      });
    }

    // Get school coordinates
    const school = await SchoolProfile.findOne({
      where: { schoolId: parseInt(schoolId) }
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Sekolah tidak ditemukan'
      });
    }

    // Check if school has coordinates
    if (!school.latitude || !school.longitude) {
      return res.json({
        success: true,
        data: {
          valid: true,
          message: 'Zona sekolah belum diatur',
          distance: null,
          radius: parseInt(radius)
        }
      });
    }

    // Calculate distance from school
    const distance = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(school.latitude),
      parseFloat(school.longitude)
    );

    const maxRadius = parseInt(radius);
    const isValid = distance <= maxRadius;

    res.json({
      success: true,
      data: {
        valid: isValid,
        message: isValid
          ? 'Kamu berada di dalam zona sekolah'
          : 'Kamu harus berada di area sekolah untuk absen',
        distance: Math.round(distance),
        radius: maxRadius,
        schoolLocation: {
          latitude: school.latitude,
          longitude: school.longitude
        }
      }
    });
  } catch (err) {
    console.error('Validate location error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;