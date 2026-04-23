const Kehadiran = require('../models/kehadiran');
const Siswa = require('../models/siswa');
const { Op } = require('sequelize');

class SiswaStatsController {
  // Helper: verify siswa belongs to school
  async _verifySiswaSchool(siswaId, schoolId) {
    const siswa = await Siswa.findByPk(siswaId, { attributes: ['id', 'schoolId'] });
    return siswa && siswa.schoolId === parseInt(schoolId);
  }

  // Get student streak (consecutive days present)
  async getStreak(req, res) {
    try {
      const { siswaId, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

      // Security: verify siswa belongs to school
      if (enforcedSchoolId) {
        const isValid = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendances = await Kehadiran.findAll({
        where: {
          siswaId: parseInt(siswaId),
          tanggal: { [Op.gte]: thirtyDaysAgo },
        },
        order: [['tanggal', 'DESC']],
      });

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < attendances.length; i++) {
        const attDate = new Date(attendances[i].tanggal);
        attDate.setHours(0, 0, 0, 0);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        if (attDate.getTime() === expectedDate.getTime() && attendances[i].status === 'hadir') {
          streak++;
        } else {
          break;
        }
      }

      return res.json({ success: true, data: { streak } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get on-time statistics
  async getTepatWaktu(req, res) {
    try {
      const { siswaId, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

      if (enforcedSchoolId) {
        const isValid = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const attendances = await Kehadiran.findAll({
        where: { siswaId: parseInt(siswaId) },
        limit: 30,
        order: [['tanggal', 'DESC']],
      });

      const total = attendances.length;
      const tepatWaktu = attendances.filter(a => a.status === 'hadir' && !a.terlambat).length;
      const persentase = total > 0 ? Math.round((tepatWaktu / total) * 100) : 0;

      return res.json({ success: true, data: { tepatWaktu, total, persentase } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get exemplary student data - MUST provide schoolId
  async getTeladan(req, res) {
    try {
      const { siswaId, limit = 10, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
      }

      // Get all siswa from this school
      const siswas = await Siswa.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id']
      });
      const siswaIds = siswas.map(s => s.id);

      const students = await Kehadiran.findAll({
        attributes: ['siswaId'],
        where: { siswaId: { [Op.in]: siswaIds }, status: 'hadir' },
        group: ['siswaId'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
        limit: parseInt(limit),
      });

      const siswaIdsResult = students.map(s => s.siswaId);

      const studentStats = await Promise.all(
        siswaIdsResult.map(async (id) => {
          const total = await Kehadiran.count({ where: { siswaId: id, status: 'hadir' } });
          return { siswaId: id, totalHadir: total };
        })
      );

      studentStats.sort((a, b) => b.totalHadir - a.totalHadir);

      return res.json({ success: true, data: studentStats.slice(0, parseInt(limit)) });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get today's statistics
  async getTodayStats(req, res) {
    try {
      const { siswaId, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

      if (enforcedSchoolId) {
        const isValid = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAttendance = await Kehadiran.findOne({
        where: {
          siswaId: parseInt(siswaId),
          tanggal: { [Op.gte]: today, [Op.lt]: tomorrow },
        },
      });

      return res.json({
        success: true,
        data: {
          tanggal: today,
          status: todayAttendance?.status || 'alpha',
          jamMasuk: todayAttendance?.jamMasuk || null,
          jamPulang: todayAttendance?.jamPulang || null,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get recap/summary for student
  async getRekapSaya(req, res) {
    try {
      const { siswaId, bulan, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

      if (enforcedSchoolId) {
        const isValid = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const whereClause = { siswaId: parseInt(siswaId) };
      if (bulan) {
        const [year, month] = bulan.split('-');
        const startDate = new Date(year, parseInt(month) - 1, 1);
        const endDate = new Date(year, parseInt(month), 0);
        whereClause.tanggal = { [Op.gte]: startDate, [Op.lte]: endDate };
      }

      const attendances = await Kehadiran.findAll({
        where: whereClause,
        order: [['tanggal', 'DESC']],
      });

      const stats = {
        hadir: attendances.filter(a => a.status === 'hadir').length,
        sakit: attendances.filter(a => a.status === 'sakit').length,
        izin: attendances.filter(a => a.status === 'izin').length,
        alpha: attendances.filter(a => a.status === 'alpha').length,
        total: attendances.length,
      };

      return res.json({ success: true, data: stats, attendances });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get all attendances for student
  async getAttendances(req, res) {
    try {
      const { siswaId, page = 1, limit = 30, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

      if (enforcedSchoolId) {
        const isValid = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
        if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await Kehadiran.findAndCountAll({
        where: { siswaId: parseInt(siswaId) },
        order: [['tanggal', 'DESC']],
        limit: parseInt(limit),
        offset,
      });

      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get attendance report for admin dashboard
  async getAttendanceReport(req, res) {
    try {
      const { schoolId, class: kelas, month, year, page = 1, limit = 50 } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId required' });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      if (month) whereClause.month = month;
      if (year) whereClause.year = year;

      const { count, rows } = await Kehadiran.findAndCountAll({
        where: whereClause,
        include: [{
          model: Siswa,
          where: { schoolId: parseInt(enforcedSchoolId) },
          required: true
        }],
        order: [['tanggal', 'DESC']],
        limit: parseInt(limit),
        offset,
      });

      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get early warning for students with low attendance
  async getEarlyWarning(req, res) {
    try {
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId required' });
      }

      // Get attendance stats per student
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const students = await Siswa.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id', 'name', 'nisn'],
        include: [{
          model: Kehadiran,
          as: 'studentAttendances',
          where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
          required: false
        }]
      });

      const warnings = students.map(student => {
        const totalDays = student.kehadirans?.length || 0;
        const hadir = student.studentAttendances?.filter(k => k.status === 'hadir').length || 0;
        const presentRate = totalDays > 0 ? (hadir / totalDays) * 100 : 0;

        return {
          siswaId: student.id,
          name: student.name,
          nisn: student.nisn,
          totalDays,
          hadirDays: hadir,
          presentRate: Math.round(presentRate),
          status: presentRate < 75 ? 'danger' : presentRate < 90 ? 'warning' : 'good'
        };
      }).filter(s => s.presentRate < 90);

      return res.json({ success: true, data: warnings });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get students with consecutive absent days
  async getConsecutiveAbsent(req, res) {
    try {
      const { schoolId, minDays = 3, page = 1, limit = 20 } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId required' });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - parseInt(minDays));

      const students = await Siswa.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id', 'name', 'nisn'],
        include: [{
          model: Kehadiran,
          as: 'studentAttendances',
          where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
          required: false
        }]
      });

      const absentStudents = students
        .map(student => {
          const absentDays = student.studentAttendances?.filter(k => k.status !== 'hadir').length || 0;
          return { ...student.toJSON(), absentDays };
        })
        .filter(s => s.absentDays >= parseInt(minDays))
        .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

      return res.json({ success: true, data: absentStudents });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get students with low attendance rate
  async getLowAttendance(req, res) {
    try {
      const { schoolId, threshold = 75, page = 1, limit = 20 } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId required' });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const students = await Siswa.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id', 'name', 'nisn'],
        include: [{
          model: Kehadiran,
          as: 'studentAttendances',
          where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
          required: false
        }]
      });

      const lowAttendance = students
        .map(student => {
          const totalDays = student.kehadirans?.length || 0;
          const hadir = student.studentAttendances?.filter(k => k.status === 'hadir').length || 0;
          const presentRate = totalDays > 0 ? (hadir / totalDays) * 100 : 0;
          return { ...student.toJSON(), totalDays, hadir, presentRate: Math.round(presentRate) };
        })
        .filter(s => s.presentRate < parseInt(threshold))
        .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

      return res.json({ success: true, data: lowAttendance });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get students with frequent late arrivals
  async getFrequentLate(req, res) {
    try {
      const { schoolId, minPerWeek = 2, page = 1, limit = 20 } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId required' });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const students = await Siswa.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id', 'name', 'nisn'],
        include: [{
          model: Kehadiran,
          as: 'studentAttendances',
          where: { tanggal: { [Op.gte]: thirtyDaysAgo }, status: 'terlambat' },
          required: false
        }]
      });

      const frequentLate = students
        .map(student => {
          const lateCount = student.kehadirans?.length || 0;
          return { ...student.toJSON(), lateCount };
        })
        .filter(s => s.lateCount >= parseInt(minPerWeek))
        .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

      return res.json({ success: true, data: frequentLate });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get recap per class
  async getRecapKelas(req, res) {
    try {
      const { schoolId, date } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId required' });
      }

      const { Op } = require('sequelize');
      const Kelas = require('../models/kelas');

      const whereClause = { schoolId: parseInt(enforcedSchoolId) };
      if (date) {
        whereClause.tanggal = date;
      }

      const kelasList = await Kelas.findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id', 'className']
      });

      const recap = await Promise.all(kelasList.map(async (kelas) => {
        const students = await Siswa.findAll({
          where: { kelasId: kelas.id },
          attributes: ['id']
        });
        const studentIds = students.map(s => s.id);

        const attendances = await Kehadiran.findAll({
          where: {
            siswaId: { [Op.in]: studentIds },
            ...(date ? { tanggal: date } : {})
          }
        });

        const hadir = attendances.filter(a => a.status === 'hadir').length;
        const izin = attendances.filter(a => a.status === 'izin').length;
        const sakit = attendances.filter(a => a.status === 'sakit').length;
        const alpha = attendances.filter(a => a.status === 'alpha').length;
        const terlambat = attendances.filter(a => a.status === 'terlambat').length;

        return {
          kelasId: kelas.id,
          namaKelas: kelas.namaKelas,
          totalSiswa: studentIds.length,
          hadir,
          izin,
          sakit,
          alpha,
          terlambat,
          presentRate: studentIds.length > 0 ? Math.round((hadir / studentIds.length) * 100) : 0
        };
      }));

      return res.json({ success: true, data: recap });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get global statistics
  async getGlobalStats(req, res) {
    try {
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId required' });
      }

      const { Op } = require('sequelize');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const totalSiswa = await Siswa.count({
        where: { schoolId: parseInt(enforcedSchoolId) }
      });

      const attendances = await Kehadiran.findAll({
        where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
        include: [{
          model: Siswa,
          where: { schoolId: parseInt(enforcedSchoolId) },
          required: true
        }]
      });

      const totalAttendances = attendances.length;
      const hadir = attendances.filter(a => a.status === 'hadir').length;
      const izin = attendances.filter(a => a.status === 'izin').length;
      const sakit = attendances.filter(a => a.status === 'sakit').length;
      const alpha = attendances.filter(a => a.status === 'alpha').length;
      const terlambat = attendances.filter(a => a.status === 'terlambat').length;

      return res.json({
        success: true,
        data: {
          totalSiswa,
          totalAttendances,
          hadir,
          izin,
          sakit,
          alpha,
          terlambat,
          presentRate: totalAttendances > 0 ? Math.round((hadir / totalAttendances) * 100) : 0,
          period: '30 days'
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Search siswa by name or nisn
  async searchSiswa(req, res) {
    try {
      const { schoolId, q } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId required' });
      }

      if (!q || q.length < 2) {
        return res.status(400).json({ success: false, message: 'Search query min 2 characters' });
      }

      const students = await Siswa.findAll({
        where: {
          schoolId: parseInt(enforcedSchoolId),
          [Op.or]: [
            { name: { [Op.like]: `%${q}%` } },
            { nisn: { [Op.like]: `%${q}%` } }
          ]
        },
        attributes: ['id', 'name', 'nisn', 'photoUrl'],
        limit: 20
      });

      return res.json({ success: true, data: students });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Share recap progress via WhatsApp
  async shareRekapProgress(req, res) {
    try {
      const { schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId required' });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const totalSiswa = await Siswa.count({
        where: { schoolId: parseInt(enforcedSchoolId) }
      });

      const attendances = await Kehadiran.findAll({
        where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
        include: [{
          model: Siswa,
          where: { schoolId: parseInt(enforcedSchoolId) },
          required: true
        }]
      });

      const hadir = attendances.filter(a => a.status === 'hadir').length;
      const presentRate = attendances.length > 0 ? Math.round((hadir / attendances.length) * 100) : 0;

      const recapText = `📊 *Rekap Kehadiran 30 Hari*\n\n` +
        `🏫 Total Siswa: ${totalSiswa}\n` +
        `✅ Hadir: ${hadir}\n` +
        `📈 Kehadiran: ${presentRate}%\n\n` +
        `_Dikirim dari Xpresensi_`;

      return res.json({ success: true, data: { text: recapText } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Share recap via specific channel (WA/sms/email)
  async shareRekap(req, res) {
    try {
      const { schoolId, date, via } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!enforcedSchoolId) {
        return res.status(400).json({ success: false, message: 'schoolId required' });
      }

      const { Op } = require('sequelize');

      const kelasList = await require('../models/kelas').findAll({
        where: { schoolId: parseInt(enforcedSchoolId) },
        attributes: ['id', 'className']
      });

      const recap = await Promise.all(kelasList.map(async (kelas) => {
        const students = await Siswa.findAll({
          where: { kelasId: kelas.id },
          attributes: ['id']
        });
        const studentIds = students.map(s => s.id);

        const whereClause = {
          siswaId: { [Op.in]: studentIds },
          ...(date ? { tanggal: date } : {})
        };

        const attendances = await Kehadiran.findAll({ where: whereClause });

        const hadir = attendances.filter(a => a.status === 'hadir').length;

        return {
          kelas: kelas.namaKelas,
          hadir,
          total: studentIds.length,
          rate: studentIds.length > 0 ? Math.round((hadir / studentIds.length) * 100) : 0
        };
      }));

      return res.json({ success: true, data: { recap, via: via || 'wa' } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new SiswaStatsController();
