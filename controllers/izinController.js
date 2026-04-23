const Izin = require('../models/izin');
const Siswa = require('../models/siswa');
const { Op } = require('sequelize');

class IzinController {
  // Helper: get schoolId from siswaId
  async _getSchoolIdFromSiswa(siswaId) {
    const siswa = await Siswa.findByPk(siswaId, { attributes: ['schoolId'] });
    return siswa ? siswa.schoolId : null;
  }

  // Helper: build where clause with schoolId from izin → siswa join
  _buildSchoolWhere = (schoolId, extraWhere = {}) => {
    if (!schoolId) return extraWhere;
    return { ...extraWhere };
  };

  // Helper: generate recurring izin dates
  _generateRecurringDates(startDate, endDate, recurringType, recurringEndDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const limitDate = recurringEndDate ? new Date(recurringEndDate) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);

    let current = new Date(start);
    while (current <= limitDate) {
      dates.push({
        tanggalMulai: current.toISOString().split('T')[0],
        tanggalAkhir: current.toISOString().split('T')[0]
      });

      if (recurringType === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else if (recurringType === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else {
        break;
      }
    }
    return dates;
  }

  // Create izin for siswa
  async createIzinSiswa(req, res) {
    try {
      const { siswaId, jenis, tanggalMulai, tanggalAkhir, deskripsi, isRecurring, recurringType, recurringEndDate } = req.body;

      if (!siswaId || !jenis || !tanggalMulai || !tanggalAkhir) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const recurringGroupId = isRecurring ? `RG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;

      // Create parent izin
      const parentIzin = await Izin.create({
        siswaId: parseInt(siswaId),
        jenis,
        tanggalMulai,
        tanggalAkhir,
        deskripsi,
        status: 'pending',
        isRecurring: isRecurring ? 1 : 0,
        recurringType: recurringType || null,
        recurringEndDate: recurringEndDate || null,
        recurringParentId: null,
        recurringGroupId
      });

      // If recurring, generate child izins
      let childIzin = [];
      if (isRecurring && (recurringType === 'weekly' || recurringType === 'monthly') && recurringEndDate) {
        const dates = this._generateRecurringDates(tanggalMulai, tanggalAkhir, recurringType, recurringEndDate);
        childIzin = await Promise.all(dates.slice(1).map(async (date) => {
          return await Izin.create({
            siswaId: parseInt(siswaId),
            jenis,
            tanggalMulai: date.tanggalMulai,
            tanggalAkhir: date.tanggalAkhir,
            deskripsi,
            status: 'pending',
            isRecurring: 1,
            recurringType,
            recurringEndDate,
            recurringParentId: parentIzin.id,
            recurringGroupId
          });
        }));
      }

      return res.json({ success: true, data: { parent: parentIzin, children: childIzin } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get izin by siswa
  async getIzinBySiswa(req, res) {
    try {
      const { siswaId } = req.params;
      const { status, schoolId, includeChildren } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Security: verify siswa belongs to school
      if (enforcedSchoolId) {
        const siswa = await Siswa.findByPk(siswaId, { attributes: ['id', 'schoolId'] });
        if (!siswa || siswa.schoolId !== parseInt(enforcedSchoolId)) {
          return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }
      }

      const where = { siswaId: parseInt(siswaId) };
      if (status) where.status = status;

      const izins = await Izin.findAll({
        where,
        include: [{ model: Siswa, as: 'siswa', attributes: ['name', 'nis', 'schoolId'] }],
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: izins });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get children izin for recurring
  async getIzinChildren(req, res) {
    try {
      const { id } = req.params;
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      const parentIzin = await Izin.findByPk(id);
      if (!parentIzin) {
        return res.status(404).json({ success: false, message: 'Izin not found' });
      }

      const children = await Izin.findAll({
        where: { recurringParentId: id }
      });

      return res.json({ success: true, data: children });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get all izin (for guru/admin) - MUST provide schoolId
  async getAllIzin(req, res) {
    try {
      const { status, page = 1, limit = 20, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      const where = {};
      if (status) where.status = status;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await Izin.findAndCountAll({
        where,
        include: [{
          model: Siswa,
          as: 'siswa',
          where: { schoolId: parseInt(enforcedSchoolId) },
          attributes: ['name', 'nis', 'schoolId']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
      });

      return res.json({
        success: true,
        data: rows,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit) },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get izin stats - MUST provide schoolId
  async getIzinStats(req, res) {
    try {
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      // Get all siswaIds for this school
      const siswas = await Siswa.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id']
      });
      const siswaIds = siswas.map(s => s.id);

      const where = { siswaId: { [Op.in]: siswaIds } };

      const pending = await Izin.count({ where: { ...where, status: 'pending' } });
      const approved = await Izin.count({ where: { ...where, status: 'approved' } });
      const rejected = await Izin.count({ where: { ...where, status: 'rejected' } });

      return res.json({
        success: true,
        data: { pending, approved, rejected, total: pending + approved + rejected },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get pending izin for dashboard
  async getPendingIzin(req, res) {
    try {
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      // Get all siswaIds for this school
      const siswas = await Siswa.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id', 'name']
      });
      const siswaMap = {};
      siswas.forEach(s => siswaMap[s.id] = s.name);

      const siswaIds = siswas.map(s => s.id);

      const izinList = await Izin.findAll({
        where: {
          siswaId: { [Op.in]: siswaIds },
          status: 'pending'
        },
        order: [['createdAt', 'DESC']],
        limit: 10,
      });

      // Add siswa name to response
      const result = izinList.map(izin => ({
        ...izin.toJSON(),
        siswaName: siswaMap[izin.siswaId] || 'Unknown'
      }));

      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Approve izin - verify schoolId & handle recurring
  async approveIzin(req, res) {
    try {
      const { id } = req.params;
      const { approvedBy, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      const dataIzin = await Izin.findByPk(id, {
        include: [{ model: Siswa, as: 'siswa', attributes: ['schoolId'] }]
      });
      if (!dataIzin) return res.status(404).json({ success: false, message: 'Izin tidak ditemukan' });

      // Security: verify school match
      if (enforcedSchoolId && dataIzin.siswa && dataIzin.siswa.schoolId !== parseInt(enforcedSchoolId)) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      dataIzin.status = 'approved';
      dataIzin.approvedBy = approvedBy;
      dataIzin.approvedAt = new Date();
      await Izin.save();

      // If this is a parent recurring izin, approve all pending children
      if (dataIzin.isRecurring && !dataIzin.recurringParentId) {
        await Izin.update(
          { status: 'approved', approvedBy, approvedAt: new Date() },
          { where: { recurringGroupId: dataIzin.recurringGroupId, status: 'pending' } }
        );
      }

      return res.json({ success: true, data: dataIzin });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Reject izin - verify schoolId
  async rejectIzin(req, res) {
    try {
      const { id } = req.params;
      const { approvedBy, schoolId } = req.body;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      const izin = await Izin.findByPk(id, {
        include: [{ model: Siswa, as: 'siswa', attributes: ['schoolId'] }]
      });
      if (!izin) return res.status(404).json({ success: false, message: 'Izin tidak ditemukan' });

      // Security: verify school match
      if (enforcedSchoolId && izin.siswa && izin.siswa.schoolId !== parseInt(enforcedSchoolId)) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      izin.status = 'rejected';
      izin.approvedBy = approvedBy;
      izin.approvedAt = new Date();
      await Izin.save();

      return res.json({ success: true, data: izin });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Delete izin - cancel parent + all children if recurring
  async deleteIzin(req, res) {
    try {
      const { id } = req.params;
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      const izin = await Izin.findByPk(id, {
        include: [{ model: Siswa, as: 'siswa', attributes: ['schoolId'] }]
      });
      if (!izin) return res.status(404).json({ success: false, message: 'Izin tidak ditemukan' });

      // Security: verify school match
      if (enforcedSchoolId && izin.siswa && izin.siswa.schoolId !== parseInt(enforcedSchoolId)) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      // If parent of recurring, delete all children first
      if (izin.isRecurring && !izin.recurringParentId) {
        await Izin.destroy({ where: { recurringGroupId: izin.recurringGroupId } });
      } else {
        await Izin.destroy();
      }

      return res.json({ success: true, message: 'Izin deleted' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new IzinController();