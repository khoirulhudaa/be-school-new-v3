const { Op } = require('sequelize');
const HealthRecord = require('../models/healthRecord');
const HealthScreening = require('../models/healthScreening');
const Siswa = require('../models/siswa');

class HealthBridgeController {
  // Get all health records for school
  async getRecords(req, res) {
    try {
      const { schoolId, studentId, limit = 50, page = 1 } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (enforcedSchoolId) where.schoolId = parseInt(enforcedSchoolId);
      if (studentId) where.studentId = parseInt(studentId);

      const { count, rows } = await HealthRecord.findAndCountAll({
        where,
        include: [{
          model: Siswa,
          as: 'student',
          attributes: ['id', 'name', 'nis', 'classId'],
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
      });

      return res.json({
        success: true,
        data: rows,
        meta: { total: count, page: parseInt(page), limit: parseInt(limit) },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get single health record
  async getRecordById(req, res) {
    try {
      const { id } = req.params;
      const record = await HealthRecord.findByPk(id, {
        include: [{ model: Siswa, as: 'student', attributes: ['id', 'name', 'nis', 'classId'] }],
      });

      if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

      return res.json({ success: true, data: record });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Create health record
  async createRecord(req, res) {
    try {
      const { studentId, schoolId, height, weight, bloodType, healthNotes } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      const record = await HealthRecord.create({
        studentId: parseInt(studentId),
        schoolId: parseInt(enforcedSchoolId),
        height: parseFloat(height),
        weight: parseFloat(weight),
        bloodType,
        healthNotes,
      });

      return res.json({ success: true, data: record });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update health record
  async updateRecord(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const record = await HealthRecord.findByPk(id);
      if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) record[key] = updates[key];
      });
      await record.save();

      return res.json({ success: true, data: record });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get screenings
  async getScreenings(req, res) {
    try {
      const { schoolId, startDate, endDate, limit = 50 } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      const where = {};
      if (enforcedSchoolId) where.schoolId = parseInt(enforcedSchoolId);
      if (startDate || endDate) {
        where.screeningDate = {};
        if (startDate) where.screeningDate[Op.gte] = new Date(startDate);
        if (endDate) where.screeningDate[Op.lte] = new Date(endDate);
      }

      const screenings = await HealthScreening.findAll({
        where,
        include: [{
          model: Siswa,
          as: 'student',
          attributes: ['id', 'name', 'nis'],
        }],
        order: [['screeningDate', 'DESC']],
        limit: parseInt(limit),
      });

      return res.json({ success: true, data: screenings });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Create screening
  async createScreening(req, res) {
    try {
      const { studentId, schoolId, screeningDate, result, notes } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      const screening = await HealthScreening.create({
        studentId: parseInt(studentId),
        schoolId: parseInt(enforcedSchoolId),
        screeningDate: new Date(screeningDate),
        result,
        notes,
      });

      return res.json({ success: true, data: screening });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get health stats
  async getStats(req, res) {
    try {
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      const where = enforcedSchoolId ? { schoolId: parseInt(enforcedSchoolId) } : {};

      const [totalStudents, withHealthRecords, recentScreenings] = await Promise.all([
        Siswa.count({ where: enforcedSchoolId ? { schoolId: parseInt(enforcedSchoolId) } : {} }),
        HealthRecord.count({ where }),
        HealthScreening.count({
          where: {
            ...where,
            screeningDate: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      return res.json({
        success: true,
        data: {
          totalStudents,
          withHealthRecords,
          recentScreenings,
          coverage: totalStudents > 0 ? Math.round((withHealthRecords / totalStudents) * 100) : 0,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get summary for dashboard
  async getSummary(req, res) {
    try {
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      const where = enforcedSchoolId ? { schoolId: parseInt(enforcedSchoolId) } : {};

      const [normal, needAttention, critical] = await Promise.all([
        HealthRecord.count({ where: { ...where, status: 'normal' } }),
        HealthRecord.count({ where: { ...where, status: 'need_attention' } }),
        HealthRecord.count({ where: { ...where, status: 'critical' } }),
      ]);

      return res.json({
        success: true,
        data: { normal, needAttention, critical, total: normal + needAttention + critical },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new HealthBridgeController();