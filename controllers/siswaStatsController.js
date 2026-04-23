const Student = require('../models/siswa');
const Attendance = require('../models/kehadiran');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { fn, col, Op, literal, where: sequelizeWhere } = require('sequelize');
const moment = require('moment');
const moment2 = require('moment-timezone');
const ExcelJS = require('exceljs');
const GuruTendik = require('../models/guruTendik');
const sequelize = require('../config/database');
const jwt = require('jsonwebtoken');
const Alumni = require('../models/alumni');
const Parent = require('../models/orangTua');
const bcrypt = require('bcrypt');
const SchoolProfile = require('../models/profileSekolah');
const KehadiranGuru = require('../models/kehadiranGuru');

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
  // async getConsecutiveAbsent(req, res) {
  //   try {
  //     const { schoolId, minDays = 3, page = 1, limit = 20 } = req.query;
  //     const enforcedSchoolId = schoolId || req.enforcedSchoolId;

  //     if (!enforcedSchoolId) {
  //       return res.status(400).json({ success: false, message: 'schoolId required' });
  //     }

  //     const thirtyDaysAgo = new Date();
  //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - parseInt(minDays));

  //     const students = await Siswa.findAll({
  //       where: { schoolId: parseInt(enforcedSchoolId) },
  //       attributes: ['id', 'name', 'nisn'],
  //       include: [{
  //         model: Kehadiran,
  //         as: 'studentAttendances',
  //         where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
  //         required: false
  //       }]
  //     });

  //     const absentStudents = students
  //       .map(student => {
  //         const absentDays = student.studentAttendances?.filter(k => k.status !== 'hadir').length || 0;
  //         return { ...student.toJSON(), absentDays };
  //       })
  //       .filter(s => s.absentDays >= parseInt(minDays))
  //       .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

  //     return res.json({ success: true, data: absentStudents });
  //   } catch (err) {
  //     return res.status(500).json({ success: false, message: err.message });
  //   }
  // }

  // // Get students with low attendance rate
  // async getLowAttendance(req, res) {
  //   try {
  //     const { schoolId, threshold = 75, page = 1, limit = 20 } = req.query;
  //     const enforcedSchoolId = schoolId || req.enforcedSchoolId;

  //     if (!enforcedSchoolId) {
  //       return res.status(400).json({ success: false, message: 'schoolId required' });
  //     }

  //     const thirtyDaysAgo = new Date();
  //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  //     const students = await Siswa.findAll({
  //       where: { schoolId: parseInt(enforcedSchoolId) },
  //       attributes: ['id', 'name', 'nisn'],
  //       include: [{
  //         model: Kehadiran,
  //         as: 'studentAttendances',
  //         where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
  //         required: false
  //       }]
  //     });

  //     const lowAttendance = students
  //       .map(student => {
  //         const totalDays = student.kehadirans?.length || 0;
  //         const hadir = student.studentAttendances?.filter(k => k.status === 'hadir').length || 0;
  //         const presentRate = totalDays > 0 ? (hadir / totalDays) * 100 : 0;
  //         return { ...student.toJSON(), totalDays, hadir, presentRate: Math.round(presentRate) };
  //       })
  //       .filter(s => s.presentRate < parseInt(threshold))
  //       .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

  //     return res.json({ success: true, data: lowAttendance });
  //   } catch (err) {
  //     return res.status(500).json({ success: false, message: err.message });
  //   }
  // }

  // // Get students with frequent late arrivals
  // async getFrequentLate(req, res) {
  //   try {
  //     const { schoolId, minPerWeek = 2, page = 1, limit = 20 } = req.query;
  //     const enforcedSchoolId = schoolId || req.enforcedSchoolId;

  //     if (!enforcedSchoolId) {
  //       return res.status(400).json({ success: false, message: 'schoolId required' });
  //     }

  //     const thirtyDaysAgo = new Date();
  //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  //     const students = await Siswa.findAll({
  //       where: { schoolId: parseInt(enforcedSchoolId) },
  //       attributes: ['id', 'name', 'nisn'],
  //       include: [{
  //         model: Kehadiran,
  //         as: 'studentAttendances',
  //         where: { tanggal: { [Op.gte]: thirtyDaysAgo }, status: 'terlambat' },
  //         required: false
  //       }]
  //     });

  //     const frequentLate = students
  //       .map(student => {
  //         const lateCount = student.kehadirans?.length || 0;
  //         return { ...student.toJSON(), lateCount };
  //       })
  //       .filter(s => s.lateCount >= parseInt(minPerWeek))
  //       .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

  //     return res.json({ success: true, data: frequentLate });
  //   } catch (err) {
  //     return res.status(500).json({ success: false, message: err.message });
  //   }
  // }

  // // Get recap per class
  // async getRecapKelas(req, res) {
  //   try {
  //     const { schoolId, date } = req.query;
  //     const enforcedSchoolId = schoolId || req.enforcedSchoolId;

  //     if (!enforcedSchoolId) {
  //       return res.status(400).json({ success: false, message: 'schoolId required' });
  //     }

  //     const { Op } = require('sequelize');
  //     const Kelas = require('../models/kelas');

  //     const whereClause = { schoolId: parseInt(enforcedSchoolId) };
  //     if (date) {
  //       whereClause.tanggal = date;
  //     }

  //     const kelasList = await Kelas.findAll({
  //       where: { schoolId: parseInt(enforcedSchoolId) },
  //       attributes: ['id', 'className']
  //     });

  //     const recap = await Promise.all(kelasList.map(async (kelas) => {
  //       const students = await Siswa.findAll({
  //         where: { kelasId: kelas.id },
  //         attributes: ['id']
  //       });
  //       const studentIds = students.map(s => s.id);

  //       const attendances = await Kehadiran.findAll({
  //         where: {
  //           siswaId: { [Op.in]: studentIds },
  //           ...(date ? { tanggal: date } : {})
  //         }
  //       });

  //       const hadir = attendances.filter(a => a.status === 'hadir').length;
  //       const izin = attendances.filter(a => a.status === 'izin').length;
  //       const sakit = attendances.filter(a => a.status === 'sakit').length;
  //       const alpha = attendances.filter(a => a.status === 'alpha').length;
  //       const terlambat = attendances.filter(a => a.status === 'terlambat').length;

  //       return {
  //         kelasId: kelas.id,
  //         namaKelas: kelas.namaKelas,
  //         totalSiswa: studentIds.length,
  //         hadir,
  //         izin,
  //         sakit,
  //         alpha,
  //         terlambat,
  //         presentRate: studentIds.length > 0 ? Math.round((hadir / studentIds.length) * 100) : 0
  //       };
  //     }));

  //     return res.json({ success: true, data: recap });
  //   } catch (err) {
  //     return res.status(500).json({ success: false, message: err.message });
  //   }
  // }


  
async getConsecutiveAbsent(req, res) {
  try {
    const { schoolId, minDays = 3, search = '', kelas = '' } = req.query;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;
 
    // Bangun N hari kerja ke belakang dari hari ini
    const checkDays = [];
    let current = moment2().tz('Asia/Jakarta').startOf('day');
    while (checkDays.length < parseInt(minDays)) {
      if (current.day() !== 0 && current.day() !== 6) {
        checkDays.push(current.format('YYYY-MM-DD'));
      }
      current.subtract(1, 'day');
    }
    const formattedDates = checkDays.map(d => `'${d}'`).join(',');
 
    const andConditions = [
      { schoolId: parseInt(schoolId) },
      { isActive: true },
      { isGraduated: false },
      literal(`NOT EXISTS (
        SELECT 1 FROM kehadiran
        WHERE studentId = Student.id
        AND status = 'Hadir'
        AND DATE(CONVERT_TZ(createdAt, '+00:00', '+07:00')) IN (${formattedDates})
      )`)
    ];

    // Tambahkan filter kelas ke array jika ada
    if (kelas && kelas.trim() !== '') {
      andConditions.push({ class: kelas.trim() });
    }

    // Tambahkan filter search ke array jika ada
    if (search && search.trim() !== '') {
      const keyword = `%${search.trim()}%`;
      andConditions.push({
        [Op.or]: [
          { name: { [Op.like]: keyword } },
          { nis: { [Op.like]: keyword } }
        ]
      });
    }

    // Masukkan ke findAndCountAll
    const { count, rows: students } = await Student.findAndCountAll({
      where: { [Op.and]: andConditions }, // Gunakan array yang sudah dibangun
      logging: (sql) => console.log("CEK SQL DISINI:", sql),
      attributes: ['id', 'name', 'nis', 'class', 'photoUrl'],
      limit,
      offset,
      order: [['name', 'ASC']],
      subQuery: false,
      raw: true
    });
 
    res.json({
      success: true,
      count,
      data: students.map(s => ({ ...s, isAlert: true, absentDates: checkDays })),
      pagination: {
        totalData:   count,
        totalPages:  Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (err) {
    console.error('[getConsecutiveAbsent]', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
 
async getLowAttendance(req, res) {
  try {
    const { schoolId, threshold = 75, search = '', kelas = '' } = req.query;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;
 
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId diperlukan' });
    }
 
    const startDate = moment2().tz('Asia/Jakarta').startOf('month');
    const endDate   = moment2().tz('Asia/Jakarta').endOf('month');
    const today     = moment2().tz('Asia/Jakarta');
 
    // Hitung total hari kerja bulan ini (penuh)
    let totalWorkdaysInMonth = 0;
    let dayCursor = startDate.clone();
    while (dayCursor.isSameOrBefore(endDate, 'day')) {
      if (dayCursor.day() !== 0 && dayCursor.day() !== 6) totalWorkdaysInMonth++;
      dayCursor.add(1, 'day');
    }
 
    // Hitung hari kerja yang sudah berlalu (untuk info UI)
    let passedWorkdays = 0;
    let cursor = startDate.clone();
    while (cursor.isSameOrBefore(today, 'day')) {
      if (cursor.day() !== 0 && cursor.day() !== 6) passedWorkdays++;
      cursor.add(1, 'day');
    }
    passedWorkdays = Math.max(1, passedWorkdays);
 
    const sDateStr = startDate.format('YYYY-MM-DD HH:mm:ss');
    const eDateStr = endDate.format('YYYY-MM-DD HH:mm:ss');
 
    // ── Filter dinamis ────────────────────────────────────────────────────────
    const andConditions = [
      literal(`(
        SELECT COUNT(id) FROM kehadiran
        WHERE studentId = Student.id
        AND   status    = 'Hadir'
        AND   CONVERT_TZ(createdAt, '+00:00', '+07:00') BETWEEN '${sDateStr}' AND '${eDateStr}'
        AND   DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', '+07:00')) NOT IN (1, 7)
      ) * 100 / ${totalWorkdaysInMonth} < ${parseInt(threshold)}`)
    ];
 
    const whereClause = {
      schoolId:    parseInt(schoolId),
      isActive:    true,
      isGraduated: false,
      [Op.and]:    andConditions
    };
 
    // Filter kelas
    if (kelas && kelas.trim() !== '') {
      whereClause.class = kelas.trim();
    }
 
    // Filter nama atau NIS
    if (search && search.trim() !== '') {
      const keyword = `%${search.trim()}%`;
      andConditions.push({
        [Op.or]: [
          { name: { [Op.like]: keyword } },
          { nis:  { [Op.like]: keyword } }
        ]
      });
    }
    // ─────────────────────────────────────────────────────────────────────────
 
    const { count, rows: students } = await Student.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'nis', 'class', 'photoUrl',
        [
          literal(`(
            SELECT COUNT(id) FROM kehadiran
            WHERE studentId = Student.id
            AND   status    = 'Hadir'
            AND   CONVERT_TZ(createdAt, '+00:00', '+07:00') BETWEEN '${sDateStr}' AND '${eDateStr}'
            AND   DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', '+07:00')) NOT IN (1, 7)
          )`),
          'hadirCount'
        ]
      ],
      limit,
      offset,
      order:    [[literal('hadirCount'), 'ASC']],
      subQuery: false,
      raw:      true
    });
 
    const dataWithPercentage = students.map(s => {
      const hadirCount = parseInt(s.hadirCount || 0);
      return {
        ...s,
        hadirCount,
        totalWorkdays:  totalWorkdaysInMonth,
        passedWorkdays,
        percentage:     Math.round((hadirCount / totalWorkdaysInMonth) * 100),
        period:         `Bulan ${today.format('MMMM YYYY')}`,
        rangeLabel:     `${startDate.format('DD MMM')} - ${endDate.format('DD MMM YYYY')}`
      };
    });
 
    res.json({
      success: true,
      count,
      data: dataWithPercentage,
      pagination: {
        totalData:   count,
        totalPages:  Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (err) {
    console.error('[getLowAttendance Error]:', err);
    res.status(500).json({
      success:  false,
      message:  'Gagal mengambil data kehadiran rendah',
      error:    err.message
    });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
 
async getFrequentLate(req, res) {
  try {
    const { schoolId, minPerWeek = 2, weeksBack = 2, search = '', kelas = '' } = req.query;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;
 
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId diperlukan' });
    }
 
    const deadline  = '07:00:00';
    const endDate   = moment2().tz('Asia/Jakarta').endOf('day');
    const startDate = moment2().tz('Asia/Jakarta').subtract(parseInt(weeksBack), 'weeks').startOf('isoWeek');
 
    const sDateStr = startDate.format('YYYY-MM-DD HH:mm:ss');
    const eDateStr = endDate.format('YYYY-MM-DD HH:mm:ss');
 
    // ── Filter dinamis ────────────────────────────────────────────────────────
    const andConditions = [
      literal(`EXISTS (
        SELECT 1 FROM (
          SELECT studentId, YEARWEEK(CONVERT_TZ(createdAt,'+00:00','+07:00'), 1) AS weekKey
          FROM   kehadiran
          WHERE  status   = 'Hadir'
          AND    schoolId = ${parseInt(schoolId)}
          AND    TIME(CONVERT_TZ(createdAt,'+00:00','+07:00')) > '${deadline}'
          AND    CONVERT_TZ(createdAt,'+00:00','+07:00') BETWEEN '${sDateStr}' AND '${eDateStr}'
          AND    DAYOFWEEK(CONVERT_TZ(createdAt,'+00:00','+07:00')) NOT IN (1, 7)
          GROUP BY studentId, weekKey
          HAVING COUNT(id) >= ${parseInt(minPerWeek)}
        ) AS v_weeks
        WHERE v_weeks.studentId = Student.id
      )`)
    ];
 
    const whereClause = {
      schoolId:    parseInt(schoolId),
      isActive:    true,
      isGraduated: false,
      [Op.and]:    andConditions
    };
 
    // Filter kelas
    if (kelas && kelas.trim() !== '') {
      whereClause.class = kelas.trim();
    }
 
    // Filter nama atau NIS
    if (search && search.trim() !== '') {
      const keyword = `%${search.trim()}%`;
      andConditions.push({
        [Op.or]: [
          { name: { [Op.like]: keyword } },
          { nis:  { [Op.like]: keyword } }
        ]
      });
    }
    // ─────────────────────────────────────────────────────────────────────────
 
    const { count, rows: students } = await Student.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'nis', 'class', 'photoUrl',
        [
          literal(`(
            SELECT COUNT(id) FROM kehadiran
            WHERE studentId = Student.id
            AND   status    = 'Hadir'
            AND   TIME(CONVERT_TZ(createdAt,'+00:00','+07:00')) > '${deadline}'
            AND   CONVERT_TZ(createdAt,'+00:00','+07:00') BETWEEN '${sDateStr}' AND '${eDateStr}'
          )`),
          'totalLate'
        ]
      ],
      limit,
      offset,
      order:    [[literal('totalLate'), 'DESC']],
      subQuery: false,
      raw:      true
    });
 
    res.json({
      success: true,
      count,
      data: students.map(s => ({
        ...s,
        totalLate:     parseInt(s.totalLate || 0),
        weeksAnalyzed: parseInt(weeksBack)
      })),
      pagination: {
        totalData:   count,
        totalPages:  Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (err) {
    console.error('[getFrequentLate]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

async shareRekapHarian(req, res) {
  try {
    const { schoolId, date, via = 'wa' } = req.query;
 
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId diperlukan' });
    }

    const normalizePhone = (phone) => {
      if (!phone) return null;
      let p = String(phone).replace(/\D/g, '');
      if (p.startsWith('0')) p = '62' + p.slice(1);
      if (p.startsWith('+')) p = p.slice(1);
      if (!p.startsWith('62')) p = '62' + p;
      if (p.length < 10 || p.length > 15) {
        console.warn(`[normalizePhone] Nomor mencurigakan (${p.length} digit): ${p}`);
        return null;
      }
      return p;
    };
 
    // Cek status WA jika via wa
    if (via === 'wa' || via === 'all') {
      if (!getIsReady()) {
        try {
          await waitUntilReady(30000);
        } catch {
          return res.status(400).json({
            success: false,
            message: 'WhatsApp belum terhubung. Silakan scan QR di halaman pengaturan WA.',
          });
        }
      }
 
      const stats = getSendStats();
      if (!canSendMessage()) {
        return res.status(429).json({
          success: false,
          message: `Batas pengiriman WA hari ini sudah tercapai (${stats.max} pesan). Coba lagi besok.`,
          stats,
        });
      }
 
      console.log(`[WA RateLimit] Sisa kuota hari ini: ${stats.remaining}/${stats.max}`);
    }
 
    const targetDate = date || moment().format('YYYY-MM-DD');
    const dateMoment = moment2.tz(targetDate, 'Asia/Jakarta');
    const startDate  = dateMoment.clone().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endDate    = dateMoment.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss');
    const deadline   = '07:00:00';
 
    // ─── Ambil data siswa + absensi ──────────────────────────────
    const allStudents = await Student.findAll({
      where: { schoolId: parseInt(schoolId), isActive: true, isGraduated: false },
      attributes: ['id', 'name', 'nis', 'class'],
      include: [{
        model: Attendance,
        as: 'studentAttendances',
        where: { createdAt: { [Op.between]: [startDate, endDate] }, userRole: 'student' },
        attributes: ['status', 'createdAt'],
        required: false,
        limit: 1,
        order: [['createdAt', 'ASC']],
      }],
      raw: false,
    });
 
    console.log(`[shareRekap] allStudents.length: ${allStudents.length}`);
 
    // ─── Susun rekap per kelas ───────────────────────────────────
    let totalAllStudents = 0, totalAllHadir = 0, totalAllBelumHadir = 0;
    const acc = new Map();
 
    for (const student of allStudents) {
      const className = student.class || 'Tanpa Kelas';
      if (!acc.has(className)) {
        acc.set(className, {
          className,
          totalStudents: 0,
          stats: { onTime: 0, late: 0, izin: 0, sakit: 0, alpha: 0, belumHadir: 0 },
        });
      }
      const classObj   = acc.get(className);
      const attendance = student.studentAttendances?.[0];
      totalAllStudents++;
 
      if (attendance) {
        const scanTime = moment2(attendance.createdAt).tz('Asia/Jakarta').format('HH:mm:ss');
        if (attendance.status === 'Hadir') {
          totalAllHadir++;
          scanTime <= deadline ? classObj.stats.onTime++ : classObj.stats.late++;
        } else {
          const k = attendance.status.toLowerCase();
          if (classObj.stats[k] !== undefined) classObj.stats[k]++;
        }
      } else {
        classObj.stats.belumHadir++;
        totalAllBelumHadir++;
      }
      classObj.totalStudents++;
    }
 
    // ─── Ambil kelas & profil sekolah ────────────────────────────
    const Class  = require('../models/kelas');
    const classes = await Class.findAll({ where: { schoolId: parseInt(schoolId) } });
    const school  = await SchoolProfile.findOne({ where: { schoolId: parseInt(schoolId) } });
 
    console.log(`[shareRekap] school.kepalaSekolahPhone (raw): ${school?.kepalaSekolahPhone}`);
 
    // Map walikelas ke data rekap
    classes.forEach(cls => {
      const normalizedClassName = cls.className?.trim();
      let matchedKey = null;
 
      for (const [key] of acc) {
        if (key.trim().toLowerCase() === normalizedClassName?.toLowerCase()) {
          matchedKey = key;
          break;
        }
      }
 
      if (!matchedKey) {
        acc.set(normalizedClassName, {
          className: normalizedClassName,
          totalStudents: 0,
          stats: { onTime: 0, late: 0, izin: 0, sakit: 0, alpha: 0, belumHadir: 0 },
        });
        matchedKey = normalizedClassName;
      }
 
      acc.get(matchedKey).walikelas = {
        phone: normalizePhone(cls.waliKelasPhone),
        email: cls.waliKelasEmail || null,
        name:  cls.waliKelas      || null,
      };
    });
 
    const rekapData = {
      summary: { totalAllStudents, totalAllHadir, totalAllBelumHadir },
      data: Array.from(acc.values()),
    };
 
    const results = { wa: [], email: [], errors: [] };
    const waClient = getClient();

    // Hitung total penerima SEBELUM mulai kirim
    const totalRecipients =
      (school?.kepalaSekolahPhone ? 1 : 0) +
      Array.from(acc.values()).filter(c => c.walikelas?.phone).length;

    let sentCount = 0;

    emitProgress(schoolId, {
      status: 'start',
      message: `Memulai pengiriman ke ${totalRecipients} penerima...`,
      current: 0,
      total: totalRecipients,
    });
 
    // ─── HELPER: Kirim PDF via WA ─────────────────────────────────
    const sendWAWithPDF = async (rawPhone, pdfBuffer, filename, caption, label) => {
      if (!canSendMessage()) {
        console.warn(`[WA RateLimit] Limit harian tercapai, skip ${label}`);
        results.errors.push({ to: label, via: 'wa', error: 'Batas kirim harian tercapai' });
        return;
      }
 
      const phone = normalizePhone(rawPhone);
      if (!phone) {
        console.warn(`[shareRekap] Skip ${label}: nomor tidak valid (${rawPhone})`);
        results.errors.push({ to: label, via: 'wa', error: `Nomor tidak valid: ${rawPhone}` });
        return;
      }
 
      try {
        const chatId = `${phone}@c.us`;
        console.log(`[shareRekap] Mengirim PDF ke ${label} (${chatId})...`);
 
        const media = new MessageMedia(
          'application/pdf',
          pdfBuffer.toString('base64'),
          filename
        );
 
        await waClient.sendMessage(chatId, media, { caption });
 
        incrementSendCount();
        results.wa.push({ to: label, phone, status: 'sent' });
        console.log(`[shareRekap] ✅ PDF terkirim ke ${label} (${phone})`);
 
        sentCount++;
        emitProgress(schoolId, {
          status: 'progress',
          message: `✅ Terkirim ke ${label}`,
          current: sentCount,
          total: totalRecipients,
          label,
        });

        const delay = results.wa.length > 10 ? 3000 : 1500;
        await new Promise(r => setTimeout(r, delay));
       } catch (err) {
        console.error(`[shareRekap] ❌ Gagal kirim PDF ke ${label}:`, err.message);
        results.errors.push({ to: label, via: 'wa', error: err.message });

        // ← TAMBAHKAN INI
        sentCount++;
        emitProgress(schoolId, {
          status: 'progress',
          message: `❌ Gagal ke ${label}: ${err.message}`,
          current: sentCount,
          total: totalRecipients,
          label,
          isError: true,
        });
      }
    };
 
    // ─── KIRIM WA ────────────────────────────────────────────────
    if (via === 'wa' || via === 'all') {
      if (!waClient) {
        return res.status(400).json({
          success: false,
          message: 'WA client tidak tersedia. Pastikan WhatsApp sudah terhubung.',
        });
      }
 
      const schoolName = school?.namaSekolah || 'Sekolah';
 
      // 1. Generate & kirim PDF total ke Kepala Sekolah
      if (school?.kepalaSekolahPhone) {
        try {
          console.log('[shareRekap] Generate PDF rekap total untuk kepsek...');
          const rekapPdfBuffer = await generateRekapPDF(rekapData, targetDate, schoolName);
 
          await sendWAWithPDF(
            school.kepalaSekolahPhone,
            rekapPdfBuffer,
            `Rekap_Harian_${targetDate}.pdf`,
            `*Laporan Rekap Kehadiran Harian*\nTanggal: ${targetDate}\n\nTerlampir laporan lengkap seluruh kelas`,
            'Kepala Sekolah'
          );
        } catch (pdfErr) {
          console.error('[shareRekap] Gagal generate PDF kepsek:', pdfErr.message);
          results.errors.push({ to: 'Kepala Sekolah', via: 'wa', error: `Gagal generate PDF: ${pdfErr.message}` });
        }
      } else {
        console.warn('[shareRekap] kepalaSekolahPhone tidak ditemukan di profil sekolah');
      }
 
      // 2. Generate & kirim PDF per kelas ke masing-masing Wali Kelas
      for (const cls of acc.values()) {
        if (!cls.walikelas?.phone) {
          console.warn(`[shareRekap] Walikelas ${cls.className} tidak punya nomor WA, dilewati`);
          continue;
        }
 
        try {
          console.log(`[shareRekap] Generate PDF kelas ${cls.className}...`);
          const classPdfBuffer = await generateClassRekapPDF(cls, targetDate, schoolName);
 
          await sendWAWithPDF(
            cls.walikelas.phone,
            classPdfBuffer,
            `Rekap_${cls.className}_${targetDate}.pdf`,
            `*Rekap Kehadiran Kelas ${cls.className}*\nTanggal: ${targetDate}\n\nTerlampir laporan kehadiran kelas Anda`,
            `Walikelas ${cls.className}`
          );
        } catch (pdfErr) {
          console.error(`[shareRekap] Gagal generate PDF kelas ${cls.className}:`, pdfErr.message);
          results.errors.push({
            to: `Walikelas ${cls.className}`,
            via: 'wa',
            error: `Gagal generate PDF: ${pdfErr.message}`,
          });
        }
      }
 
      console.log(`[WA RateLimit] Setelah kirim:`, getSendStats());
    }
 
    // ─── KIRIM EMAIL ─────────────────────────────────────────────
    if ((via === 'email' || via === 'all') && process.env.SMTP_USER) {
      const nodemailer  = require('nodemailer');
      const schoolName  = school?.namaSekolah || 'Sekolah';
 
      const transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST || 'smtp.gmail.com',
        port:   587,
        secure: false,
        auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
 
      const sendEmail = async (to, subject, text, pdfBuffer, filename, label) => {
        if (!to) {
          console.warn(`[shareRekap] Skip email ${label}: alamat email kosong`);
          results.errors.push({ to: label, via: 'email', error: 'Email kosong' });
          return;
        }
        try {
          const mailOptions = {
            from:    `"KiraProject" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text:    text.replace(/\*/g, '').replace(/━/g, '—'),
          };
 
          // Attach PDF jika ada
          if (pdfBuffer && filename) {
            mailOptions.attachments = [{
              filename,
              content:     pdfBuffer,
              contentType: 'application/pdf',
            }];
          }
 
          await transporter.sendMail(mailOptions);
          results.email.push({ to: label, email: to, status: 'sent' });
          console.log(`[shareRekap] ✅ Email terkirim ke ${label} (${to})`);
        } catch (err) {
          console.error(`[shareRekap] ❌ Gagal kirim email ke ${label} (${to}):`, err.message);
          results.errors.push({ to: label, via: 'email', error: err.message });
        }
      };
 
      // Kepsek
      if (school?.kepalaSekolahEmail) {
        const rekapPdfBuffer = await generateRekapPDF(rekapData, targetDate, schoolName);
        await sendEmail(
          school.kepalaSekolahEmail,
          `📊 Rekap Kehadiran Harian ${targetDate}`,
          generateRekapText(rekapData, targetDate),
          rekapPdfBuffer,
          `Rekap_Harian_${targetDate}.pdf`,
          'Kepala Sekolah'
        );
      }
 
      // Walikelas
      for (const cls of acc.values()) {
        if (cls.walikelas?.email) {
          const classPdfBuffer = await generateClassRekapPDF(cls, targetDate, schoolName);
          await sendEmail(
            cls.walikelas.email,
            `📚 Rekap Kelas ${cls.className} — ${targetDate}`,
            generateClassSpecificText(cls, targetDate),
            classPdfBuffer,
            `Rekap_${cls.className}_${targetDate}.pdf`,
            `Walikelas ${cls.className}`
          );
        }
      }
    }
 
    console.log(
      `[shareRekap] Selesai. WA: ${results.wa.length}, Email: ${results.email.length}, Gagal: ${results.errors.length}`
    );
 
    // Kumpulkan semua warning (kelas tanpa nomor WA)
    const skippedClasses = [];
    for (const cls of acc.values()) {
      if (!cls.walikelas?.phone) {
        skippedClasses.push(cls.className);
      }
    }

    const warnings = [];
    if (skippedClasses.length > 0) {
      warnings.push({
        type: 'no_phone',
        message: `${skippedClasses.length} walikelas tidak punya nomor WA`,
        list: skippedClasses.map(c => `• ${c}`)
      });
    }
    if (!school?.kepalaSekolahPhone) {
      warnings.push({
        type: 'no_kepsek_phone',
        message: 'Nomor WA Kepala Sekolah belum diisi di profil sekolah',
        list: []
      });
    }

    emitProgress(schoolId, {
      status: 'done',
      message: `Selesai: ${results.wa.length} terkirim, ${results.errors.length} gagal`,
      current: totalRecipients,
      total: totalRecipients,
      results,
    });

    res.json({
      success: true,
      message: results.wa.length > 0
        ? `Rekap dikirim: ${results.wa.length} WA, ${results.email.length} email, ${results.errors.length} gagal`
        : 'Tidak ada pesan terkirim — periksa nomor WA walikelas di data kelas',
      results,
      warnings,         // ← list warning per kategori
      rateLimit: getSendStats(),
    });
 
  } catch (err) {
    console.error('[shareRekapHarian] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


async getClassRecapWithDetails(req, res){
  try {
    const { schoolId, date } = req.query;

    const targetDate = date 
      ? moment.tz(date, 'Asia/Jakarta') 
      : moment.tz('Asia/Jakarta');

    const startDate = targetDate.clone().startOf('day').toDate();
    const endDate   = targetDate.clone().endOf('day').toDate();

    const deadline = "07:00:00";

    const allStudents = await Student.findAll({
      where: { 
        schoolId: parseInt(schoolId), 
        isActive: true, 
        isGraduated: false 
      },
      attributes: ['id', 'name', 'nis', 'class', 'photoUrl'],
      include: [{
        model: Attendance,
        as: 'studentAttendances',
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
          userRole: 'student'
        },
        attributes: ['status', 'createdAt', 'checkOutAt'], // ← tambah checkOutAt
        required: false,
        limit: 1,
        order: [['createdAt', 'ASC']]
      }],
    });

    // --- RINGKASAN GLOBAL ---
    let totalAllStudents = 0;
    let totalAllHadir = 0;
    let totalAllIzin = 0;
    let totalAllPulang = 0;     // ← GANTI dari totalAllSakit
    let totalAllAlpha = 0;
    let totalAllBelumHadir = 0;

    const acc = new Map();

    for (const student of allStudents) {
      const className = student.class || "Tanpa Kelas";

      if (!acc.has(className)) {
        acc.set(className, {
          className,
          totalStudents: 0,
          stats: { 
            onTime: 0, 
            late: 0, 
            izin: 0, 
            pulang: 0,      // ← baru
            alpha: 0, 
            belumHadir: 0 
          },
          students: []
        });
      }

      const classObj = acc.get(className);
      const attendance = student.studentAttendances?.[0];

      let statusInfo = "Belum Hadir";
      let scanTime = null;
      let hasCheckedOut = false;

      totalAllStudents++;
      classObj.totalStudents++;

      if (attendance) {
        scanTime = moment.tz(attendance.createdAt, 'Asia/Jakarta').format("HH:mm:ss");
        hasCheckedOut = !!attendance.checkOutAt; // ← Cek apakah sudah pulang

        const normalizedStatus = (attendance.status || '').toLowerCase().trim();

        if (normalizedStatus === 'hadir') {
          totalAllHadir++;
          if (scanTime <= deadline) {
            classObj.stats.onTime++;
            statusInfo = "Hadir";
          } else {
            classObj.stats.late++;
            statusInfo = "Hadir";
          }
        } else if (normalizedStatus === 'izin') {
          totalAllIzin++;
          classObj.stats.izin++;
          statusInfo = "Izin";
        } else if (normalizedStatus === 'sakit') {
          // Tetap hitung sakit jika diperlukan, tapi tidak ditampilkan di ringkasan utama
          statusInfo = "Sakit";
        } else if (normalizedStatus === 'alpha') {
          totalAllAlpha++;
          classObj.stats.alpha++;
          statusInfo = "Alpha";
        }

        // Hitung yang sudah pulang
        if (hasCheckedOut) {
          totalAllPulang++;
          classObj.stats.pulang++;
          // Optional: ubah statusInfo jadi "Pulang" jika mau
          // statusInfo = "Pulang";
        }
      } else {
        totalAllBelumHadir++;
        classObj.stats.belumHadir++;
        statusInfo = "Belum Hadir";
      }

      classObj.students.push({
        id: student.id,
        name: student.name,
        nis: student.nis,
        status: statusInfo,
        scanTime,
        photoUrl: student.photoUrl,
        checkOutAt: attendance?.checkOutAt ? moment.tz(attendance.checkOutAt, 'Asia/Jakarta').format("HH:mm:ss") : null,
      });
    }

    const sortedData = Array.from(acc.values()).sort((a, b) => 
      a.className.localeCompare(b.className, undefined, { numeric: true })
    );

    res.json({
      success: true,
      summary: { 
        totalAllStudents, 
        totalAllHadir, 
        totalAllIzin,
        totalAllPulang,     // ← Baru (menggantikan totalAllSakit)
        totalAllAlpha,
        totalAllBelumHadir,
        date: targetDate.format('YYYY-MM-DD')
      },
      data: sortedData
    });

  } catch (err) {
    console.error('[getClassRecapWithDetails] Error:', err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


async getGlobalAttendanceStats(req, res){
  try {
    const { schoolId, date, search = '', page = 1, limit = 10 } = req.query;
    
    const targetDate  = date ? moment(date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
    const startOfDay  = `${targetDate} 00:00:00`;
    const endOfDay    = `${targetDate} 23:59:59`;
    const offset      = (Number(page) - 1) * Number(limit);

    const createdAtRange = { [Op.between]: [startOfDay, endOfDay] };
    const baseWhere = { schoolId, userRole: 'student', status: 'Hadir', createdAt: createdAtRange };

    // Where untuk absent students + search
    const absentWhere = { schoolId, isActive: true, isGraduated: false };
    if (search.trim()) {
      absentWhere[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { nis:  { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    const [allHadir, { rows: absentStudents, count: totalAbsent }] = await Promise.all([
      Attendance.findAll({
        where:      baseWhere,
        include:    [{ model: Student, as: 'student', attributes: ['name', 'class', 'photoUrl'] }],
        order:      [['createdAt', 'ASC']],
        attributes: ['createdAt', 'studentId'],
      }),

      Student.findAndCountAll({
        where:   absentWhere,
        include: [{
          model:      Attendance,
          as:         'studentAttendances',
          required:   false,
          where:      { createdAt: createdAtRange, userRole: 'student' },
          attributes: [],
        }],
        having:   literal('COUNT(`studentAttendances`.`id`) = 0'),
        group:    ['Student.id'],
        order:    [['class', 'ASC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'nis', 'class', 'photoUrl'],
        limit:    Number(limit),
        offset,
        subQuery: false,
      }),
    ]);

    const topEarly = allHadir.slice(0, 5);
    const topLate  = [...allHadir].reverse().slice(0, 5);

    const formatAttendance = (a) => ({
      name:     a.student?.name,
      class:    a.student?.class,
      photoUrl: a.student?.photoUrl,
      time:     moment(a.createdAt).format('HH:mm:ss'),
    });

    res.json({
      success: true,
      targetDate,
      data: {
        absentStudents,
        absentMeta: {
          total:      totalAbsent.length, // findAndCountAll dengan group returns array
          page:       Number(page),
          limit:      Number(limit),
          totalPages: Math.ceil(totalAbsent.length / Number(limit)),
        },
        topEarly: topEarly.map(formatAttendance),
        topLate:  topLate.map(formatAttendance),
      },
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
