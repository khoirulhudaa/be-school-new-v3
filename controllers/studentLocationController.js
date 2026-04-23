const { Op } = require('sequelize');
const StudentLocation = require('../models/studentLocation');
const Student = require('../models/siswa');
const sequelize = require('../config/database');

// Get all locations for a school (admin view)
exports.getAllLocations = async (req, res) => {
  try {
    const { schoolId, date } = req.query;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId diperlukan' });
    }

    const where = { schoolId: parseInt(schoolId) };
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    const locations = await StudentLocation.findAll({
      where,
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'nis', 'class']
      }],
      order: [['createdAt', 'DESC']],
      limit: 500
    });

    res.json({ success: true, data: locations });
  } catch (err) {
    console.error('getAllLocations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get latest location for each student (for map view)
exports.getLatestLocations = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId diperlukan' });
    }

    // Get latest location per student using subquery
    const [results] = await sequelize.query(`
      SELECT sl1.*
      FROM student_locations sl1
      INNER JOIN (
        SELECT student_id, MAX(created_at) as max_date
        FROM student_locations
        WHERE school_id = ?
        GROUP BY student_id
      ) sl2 ON sl1.student_id = sl2.student_id AND sl1.created_at = sl2.max_date
      WHERE sl1.school_id = ?
      ORDER BY sl1.created_at DESC
    `, { replacements: [parseInt(schoolId), parseInt(schoolId)] });

    // Get student details
    const studentIds = results.map(r => r.student_id);
    const students = await Student.findAll({
      where: { id: studentIds },
      attributes: ['id', 'name', 'nis', 'class']
    });

    const studentMap = {};
    students.forEach(s => studentMap[s.id] = s);

    const locationsWithStudents = results.map(r => ({
      ...r,
      student: studentMap[r.student_id]
    }));

    res.json({ success: true, data: locationsWithStudents });
  } catch (err) {
    console.error('getLatestLocations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Record student location
exports.recordLocation = async (req, res) => {
  try {
    const { studentId, schoolId, latitude, longitude, accuracy, status, source, notes } = req.body;

    if (!studentId || !schoolId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'studentId, schoolId, latitude, longitude wajib diisi'
      });
    }

    // Check if student has parent consent
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }

    // If no consent, auto-set consent to false but still record
    const location = await StudentLocation.create({
      studentId: parseInt(studentId),
      schoolId: parseInt(schoolId),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      status: status || 'arrived',
      source: source || 'app',
      notes: notes || null,
      parentConsent: student.parentConsent || false,
      consentTimestamp: student.consentTimestamp || null,
      consentIp: student.consentIp || null
    });

    res.json({ success: true, data: location, message: 'Lokasi berhasil direkam' });
  } catch (err) {
    console.error('recordLocation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Record parent consent
exports.recordConsent = async (req, res) => {
  try {
    const { studentId, consent, ipAddress } = req.body;

    if (!studentId || consent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'studentId dan consent wajib diisi'
      });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }

    await student.update({
      parentConsent: consent,
      consentTimestamp: consent ? new Date() : null,
      consentIp: consent ? ipAddress : null
    });

    res.json({
      success: true,
      message: consent ? 'Persetujuan berhasil disimpan' : 'Persetujuan berhasil dicabut'
    });
  } catch (err) {
    console.error('recordConsent error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete old locations (cleanup)
exports.cleanupOldLocations = async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

    const deleted = await StudentLocation.destroy({
      where: {
        createdAt: { [Op.lt]: cutoffDate }
      }
    });

    res.json({
      success: true,
      message: `${deleted} lokasi berhasil dihapus`
    });
  } catch (err) {
    console.error('cleanupOldLocations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};