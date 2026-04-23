const SOS = require('../models/sos');
const Siswa = require('../models/siswa');
const GuruTendik = require('../models/guruTendik');
const OrangTua = require('../models/orangTua');
const { Op } = require('sequelize');

// Reason options for validation
const REASON_OPTIONS_SISWA = [
  'merasa_tidak_aman',
  'ada_ancaman',
  'dibully',
  'hazard_di_sekolah',
  'darurat_lain'
];

const REASON_OPTIONS_GURU = [
  'darurat_kesehatan',
  'ada_ancaman',
  'bencana_alam',
  'darurat_lain'
];

const REASON_OPTIONS_ORTU = [
  'emergency_kesehatan',
  'butuh_jemput_anak',
  'anak_tidak_bisa_dihubungi',
  'darurat_lain'
];

class SOSController {
  // Student/Guru panic SOS
  async panic(req, res) {
    try {
      const { userId, userType, reason, description, latitude, longitude } = req.body;

      // Validate required fields
      if (!userId || !userType || !reason) {
        return res.status(400).json({
          success: false,
          message: 'userId, userType, dan reason wajib diisi'
        });
      }

      // Validate reason based on userType
      const validReasons = {
        siswa: REASON_OPTIONS_SISWA,
        guru: REASON_OPTIONS_GURU,
        ortu: REASON_OPTIONS_ORTU
      };

      if (!validReasons[userType]?.includes(reason)) {
        return res.status(400).json({
          success: false,
          message: 'Reason tidak valid untuk tipe user ini'
        });
      }

      const sos = await SOS.create({
        userId: parseInt(userId),
        userType,
        reason,
        description: description || null,
        latitude: latitude || null,
        longitude: longitude || null,
        status: 'pending',
      });

      return res.json({ success: true, data: sos, message: 'SOS berhasil dikirim' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Parent SOS - trigger to notify their children
  async parentPanic(req, res) {
    try {
      const { ortuId, reason, description, latitude, longitude } = req.body;

      if (!ortuId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'ortuId dan reason wajib diisi'
        });
      }

      // Find all children of this parent
      const children = await Siswa.findAll({
        where: { parentId: parseInt(ortuId) }
      });

      if (children.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tidak ada anak yang terdaftar untuk orang tua ini'
        });
      }

      // Create parent SOS first
      const parentSos = await SOS.create({
        userId: parseInt(ortuId),
        userType: 'ortu',
        reason,
        description: description || null,
        latitude: latitude || null,
        longitude: longitude || null,
        status: 'pending',
      });

      // Create child SOS alerts for each child
      const childSosList = await Promise.all(
        children.map(async (child) => {
          return await SOS.create({
            userId: child.id,
            userType: 'siswa',
            reason: 'ortu_darurat',
            description: `Orang tua memicu SOS: ${description || reason}`,
            latitude: latitude || null,
            longitude: longitude || null,
            parentSosId: parentSos.id,
            status: 'pending',
          });
        })
      );

      return res.json({
        success: true,
        data: {
          parentSos,
          childrenNotified: childSosList.length,
          childSos: childSosList
        },
        message: `SOS orang tua dikirim, ${childSosList.length} anak notified`
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Check if user has active SOS (for polling)
  async checkStatus(req, res) {
    try {
      const { userId, userType } = req.params;

      const sos = await SOS.findOne({
        where: {
          userId: parseInt(userId),
          userType,
          status: { [Op.in]: ['pending', 'acknowledged'] }
        },
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: { isActive: !!sos, lastSos: sos } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Check if student has parent SOS (for polling)
  async checkParentSOS(req, res) {
    try {
      const { studentId } = req.params;

      // Find parent SOS that triggered this student
      const parentSos = await SOS.findOne({
        where: {
          userId: parseInt(studentId),
          userType: 'siswa',
          reason: 'ortu_darurat',
          status: { [Op.in]: ['pending', 'acknowledged'] }
        },
        order: [['createdAt', 'DESC']],
        include: [{
          model: SOS,
          as: 'parentSos',
          where: { userType: 'ortu' }
        }]
      });

      // Also get parent info
      let ortuInfo = null;
      if (parentSos?.parentSosId) {
        const parentSosRecord = await SOS.findByPk(parentSos.parentSosId);
        if (parentSosRecord) {
          const ortu = await OrangTua.findByPk(parentSosRecord.userId, {
            attributes: ['id', 'name', 'phone']
          });
          ortuInfo = ortu;
        }
      }

      return res.json({
        success: true,
        data: {
          hasParentSOS: !!parentSos,
          parentSOS: parentSos,
          ortuInfo
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get history for a user
  async getHistory(req, res) {
    try {
      const { userId, userType } = req.params;
      const { limit = 20 } = req.query;

      const history = await SOS.findAll({
        where: {
          userId: parseInt(userId),
          userType
        },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
      });

      return res.json({ success: true, data: history });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Admin: Get ALL SOS history for a school
  async getAllHistory(req, res) {
    try {
      const { schoolId, status, userType, startDate, endDate, limit = 100 } = req.query;

      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      const where = {};

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Filter by date range
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      // Get SOS for each user type
      const sosConditions = { ...where };
      const allSOS = [];

      if (!userType || userType === 'siswa') {
        const students = await Siswa.findAll({
          where: { schoolId: parseInt(schoolId) },
          attributes: ['id', 'name', 'nis', 'classId']
        });
        const studentIds = students.map(s => s.id);
        const studentSOS = await SOS.findAll({
          where: {
            userId: { [Op.in]: studentIds },
            userType: 'siswa',
            ...sosConditions
          },
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit)
        });
        allSOS.push(...studentSOS.map(s => ({ ...s.toJSON(), student: students.find(st => st.id === s.userId) })));
      }

      if (!userType || userType === 'guru') {
        const teachers = await GuruTendik.findAll({
          where: { schoolId: parseInt(schoolId) },
          attributes: ['id', 'name', 'position']
        });
        const teacherIds = teachers.map(t => t.id);
        const teacherSOS = await SOS.findAll({
          where: {
            userId: { [Op.in]: teacherIds },
            userType: 'guru',
            ...sosConditions
          },
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit)
        });
        allSOS.push(...teacherSOS.map(s => ({ ...s.toJSON(), teacher: teachers.find(t => t.id === s.userId) })));
      }

      if (!userType || userType === 'ortu') {
        const parents = await OrangTua.findAll({
          where: { schoolId: parseInt(schoolId) },
          attributes: ['id', 'name', 'phone']
        });
        const parentIds = parents.map(p => p.id);
        const parentSOS = await SOS.findAll({
          where: {
            userId: { [Op.in]: parentIds },
            userType: 'ortu',
            ...sosConditions
          },
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit)
        });
        allSOS.push(...parentSOS.map(s => ({ ...s.toJSON(), parent: parents.find(p => p.id === s.userId) })));
      }

      // Sort by createdAt DESC
      allSOS.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.json({ success: true, data: allSOS.slice(0, parseInt(limit)) });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Admin: Resolve SOS with notes
  async resolve(req, res) {
    try {
      const { sosId } = req.params;
      const { resolvedBy, resolutionNotes } = req.body;

      if (!resolvedBy || !resolutionNotes) {
        return res.status(400).json({
          success: false,
          message: 'resolvedBy dan resolutionNotes wajib diisi'
        });
      }

      const sos = await SOS.findByPk(sosId);
      if (!sos) {
        return res.status(404).json({ success: false, message: 'SOS tidak ditemukan' });
      }

      await sos.update({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: parseInt(resolvedBy),
        resolutionNotes
      });

      // If parent SOS, also resolve all child SOS
      if (sos.parentSosId) {
        await SOS.update(
          {
            status: 'resolved',
            resolvedAt: new Date(),
            resolvedBy: parseInt(resolvedBy),
            resolutionNotes: `Resolved with parent SOS: ${resolutionNotes}`
          },
          {
            where: { parentSosId: sos.parentSosId }
          }
        );
      }

      return res.json({ success: true, message: 'SOS berhasil diresolve' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Acknowledge SOS
  async acknowledge(req, res) {
    try {
      const { sosId } = req.params;
      const { acknowledgedBy } = req.body;

      const sos = await SOS.findByPk(sosId);
      if (!sos) {
        return res.status(404).json({ success: false, message: 'SOS tidak ditemukan' });
      }

      await sos.update({
        status: 'acknowledged',
        acknowledgedBy: acknowledgedBy ? parseInt(acknowledgedBy) : null,
        acknowledgedAt: new Date()
      });

      return res.json({ success: true, message: 'SOS berhasil diacknowledged' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new SOSController();