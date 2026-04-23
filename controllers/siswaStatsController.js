// const Student = require('../models/siswa');
// const Attendance = require('../models/kehadiran');
// const cloudinary = require('cloudinary').v2;
// const streamifier = require('streamifier');
// const { fn, col, Op, literal, where: sequelizeWhere } = require('sequelize');
// const moment = require('moment');
// const moment2 = require('moment-timezone');
// const ExcelJS = require('exceljs');
// const GuruTendik = require('../models/guruTendik');
// const sequelize = require('../config/database');
// const jwt = require('jsonwebtoken');
// const Alumni = require('../models/alumni');
// const Parent = require('../models/orangTua');
// const bcrypt = require('bcrypt');
// const SchoolProfile = require('../models/profileSekolah');
// const KehadiranGuru = require('../models/kehadiranGuru');

// class SiswaStatsController {
//   // Helper: verify siswa belongs to school
//   async _verifySiswaSchool(siswaId, schoolId) {
//     const siswa = await Siswa.findByPk(siswaId, { attributes: ['id', 'schoolId'] });
//     return siswa && siswa.schoolId === parseInt(schoolId);
//   }

//   // Get student streak (consecutive days present)
//   async getStreak(req, res) {
//     try {
//       const { siswaId, schoolId } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

//       // Security: verify siswa belongs to school
//       if (enforcedSchoolId) {
//         const isValid = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
//         if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
//       }

//       const thirtyDaysAgo = new Date();
//       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//       const attendances = await Kehadiran.findAll({
//         where: {
//           siswaId: parseInt(siswaId),
//           tanggal: { [Op.gte]: thirtyDaysAgo },
//         },
//         order: [['tanggal', 'DESC']],
//       });

//       let streak = 0;
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       for (let i = 0; i < attendances.length; i++) {
//         const attDate = new Date(attendances[i].tanggal);
//         attDate.setHours(0, 0, 0, 0);
//         const expectedDate = new Date(today);
//         expectedDate.setDate(today.getDate() - i);
//         if (attDate.getTime() === expectedDate.getTime() && attendances[i].status === 'hadir') {
//           streak++;
//         } else {
//           break;
//         }
//       }

//       return res.json({ success: true, data: { streak } });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Get on-time statistics
//   async getTepatWaktu(req, res) {
//     try {
//       const { siswaId, schoolId } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

//       if (enforcedSchoolId) {
//         const isValid = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
//         if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
//       }

//       const attendances = await Kehadiran.findAll({
//         where: { siswaId: parseInt(siswaId) },
//         limit: 30,
//         order: [['tanggal', 'DESC']],
//       });

//       const total = attendances.length;
//       const tepatWaktu = attendances.filter(a => a.status === 'hadir' && !a.terlambat).length;
//       const persentase = total > 0 ? Math.round((tepatWaktu / total) * 100) : 0;

//       return res.json({ success: true, data: { tepatWaktu, total, persentase } });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Get exemplary student data - MUST provide schoolId
//   async getTeladan(req, res) {
//     try {
//       const { siswaId, limit = 10, schoolId } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!enforcedSchoolId) {
//         return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
//       }

//       // Get all siswa from this school
//       const siswas = await Siswa.findAll({
//         where: { schoolId: parseInt(enforcedSchoolId) },
//         attributes: ['id']
//       });
//       const siswaIds = siswas.map(s => s.id);

//       const students = await Kehadiran.findAll({
//         attributes: ['siswaId'],
//         where: { siswaId: { [Op.in]: siswaIds }, status: 'hadir' },
//         group: ['siswaId'],
//         order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
//         limit: parseInt(limit),
//       });

//       const siswaIdsResult = students.map(s => s.siswaId);

//       const studentStats = await Promise.all(
//         siswaIdsResult.map(async (id) => {
//           const total = await Kehadiran.count({ where: { siswaId: id, status: 'hadir' } });
//           return { siswaId: id, totalHadir: total };
//         })
//       );

//       studentStats.sort((a, b) => b.totalHadir - a.totalHadir);

//       return res.json({ success: true, data: studentStats.slice(0, parseInt(limit)) });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Get today's statistics
//   async getTodayStats(req, res) {
//     try {
//       const { siswaId, schoolId } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

//       if (enforcedSchoolId) {
//         const isValid = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
//         if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
//       }

//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const tomorrow = new Date(today);
//       tomorrow.setDate(tomorrow.getDate() + 1);

//       const todayAttendance = await Kehadiran.findOne({
//         where: {
//           siswaId: parseInt(siswaId),
//           tanggal: { [Op.gte]: today, [Op.lt]: tomorrow },
//         },
//       });

//       return res.json({
//         success: true,
//         data: {
//           tanggal: today,
//           status: todayAttendance?.status || 'alpha',
//           jamMasuk: todayAttendance?.jamMasuk || null,
//           jamPulang: todayAttendance?.jamPulang || null,
//         },
//       });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Get recap/summary for student
//   async getRekapSaya(req, res) {
//     try {
//       const { siswaId, bulan, schoolId } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

//       if (enforcedSchoolId) {
//         const isValid = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
//         if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
//       }

//       const whereClause = { siswaId: parseInt(siswaId) };
//       if (bulan) {
//         const [year, month] = bulan.split('-');
//         const startDate = new Date(year, parseInt(month) - 1, 1);
//         const endDate = new Date(year, parseInt(month), 0);
//         whereClause.tanggal = { [Op.gte]: startDate, [Op.lte]: endDate };
//       }

//       const attendances = await Kehadiran.findAll({
//         where: whereClause,
//         order: [['tanggal', 'DESC']],
//       });

//       const stats = {
//         hadir: attendances.filter(a => a.status === 'hadir').length,
//         sakit: attendances.filter(a => a.status === 'sakit').length,
//         izin: attendances.filter(a => a.status === 'izin').length,
//         alpha: attendances.filter(a => a.status === 'alpha').length,
//         total: attendances.length,
//       };

//       return res.json({ success: true, data: stats, attendances });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Get all attendances for student
//   async getAttendances(req, res) {
//     try {
//       const { siswaId, page = 1, limit = 30, schoolId } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

//       if (enforcedSchoolId) {
//         const isValid = await this._verifySiswaSchool(siswaId, enforcedSchoolId);
//         if (!isValid) return res.status(403).json({ success: false, message: 'Akses ditolak' });
//       }

//       const offset = (parseInt(page) - 1) * parseInt(limit);

//       const { count, rows } = await Kehadiran.findAndCountAll({
//         where: { siswaId: parseInt(siswaId) },
//         order: [['tanggal', 'DESC']],
//         limit: parseInt(limit),
//         offset,
//       });

//       return res.json({
//         success: true,
//         data: rows,
//         pagination: {
//           total: count,
//           page: parseInt(page),
//           limit: parseInt(limit),
//           pages: Math.ceil(count / parseInt(limit)),
//         },
//       });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Get attendance report for admin dashboard
//   async getAttendanceReport(req, res) {
//     try {
//       const { schoolId, class: kelas, month, year, page = 1, limit = 50 } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!enforcedSchoolId) {
//         return res.status(400).json({ success: false, message: 'schoolId required' });
//       }

//       const offset = (parseInt(page) - 1) * parseInt(limit);
//       const whereClause = {};

//       if (month) whereClause.month = month;
//       if (year) whereClause.year = year;

//       const { count, rows } = await Kehadiran.findAndCountAll({
//         where: whereClause,
//         include: [{
//           model: Siswa,
//           where: { schoolId: parseInt(enforcedSchoolId) },
//           required: true
//         }],
//         order: [['tanggal', 'DESC']],
//         limit: parseInt(limit),
//         offset,
//       });

//       return res.json({
//         success: true,
//         data: rows,
//         pagination: {
//           total: count,
//           page: parseInt(page),
//           limit: parseInt(limit),
//           pages: Math.ceil(count / parseInt(limit)),
//         },
//       });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Get early warning for students with low attendance
//   async getEarlyWarning(req, res) {
//     try {
//       const { schoolId } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!enforcedSchoolId) {
//         return res.status(400).json({ success: false, message: 'schoolId required' });
//       }

//       // Get attendance stats per student
//       const thirtyDaysAgo = new Date();
//       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//       const students = await Siswa.findAll({
//         where: { schoolId: parseInt(enforcedSchoolId) },
//         attributes: ['id', 'name', 'nisn'],
//         include: [{
//           model: Kehadiran,
//           as: 'studentAttendances',
//           where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
//           required: false
//         }]
//       });

//       const warnings = students.map(student => {
//         const totalDays = student.kehadirans?.length || 0;
//         const hadir = student.studentAttendances?.filter(k => k.status === 'hadir').length || 0;
//         const presentRate = totalDays > 0 ? (hadir / totalDays) * 100 : 0;

//         return {
//           siswaId: student.id,
//           name: student.name,
//           nisn: student.nisn,
//           totalDays,
//           hadirDays: hadir,
//           presentRate: Math.round(presentRate),
//           status: presentRate < 75 ? 'danger' : presentRate < 90 ? 'warning' : 'good'
//         };
//       }).filter(s => s.presentRate < 90);

//       return res.json({ success: true, data: warnings });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Get students with consecutive absent days
//   // async getConsecutiveAbsent(req, res) {
//   //   try {
//   //     const { schoolId, minDays = 3, page = 1, limit = 20 } = req.query;
//   //     const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//   //     if (!enforcedSchoolId) {
//   //       return res.status(400).json({ success: false, message: 'schoolId required' });
//   //     }

//   //     const thirtyDaysAgo = new Date();
//   //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - parseInt(minDays));

//   //     const students = await Siswa.findAll({
//   //       where: { schoolId: parseInt(enforcedSchoolId) },
//   //       attributes: ['id', 'name', 'nisn'],
//   //       include: [{
//   //         model: Kehadiran,
//   //         as: 'studentAttendances',
//   //         where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
//   //         required: false
//   //       }]
//   //     });

//   //     const absentStudents = students
//   //       .map(student => {
//   //         const absentDays = student.studentAttendances?.filter(k => k.status !== 'hadir').length || 0;
//   //         return { ...student.toJSON(), absentDays };
//   //       })
//   //       .filter(s => s.absentDays >= parseInt(minDays))
//   //       .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

//   //     return res.json({ success: true, data: absentStudents });
//   //   } catch (err) {
//   //     return res.status(500).json({ success: false, message: err.message });
//   //   }
//   // }

//   // // Get students with low attendance rate
//   // async getLowAttendance(req, res) {
//   //   try {
//   //     const { schoolId, threshold = 75, page = 1, limit = 20 } = req.query;
//   //     const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//   //     if (!enforcedSchoolId) {
//   //       return res.status(400).json({ success: false, message: 'schoolId required' });
//   //     }

//   //     const thirtyDaysAgo = new Date();
//   //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//   //     const students = await Siswa.findAll({
//   //       where: { schoolId: parseInt(enforcedSchoolId) },
//   //       attributes: ['id', 'name', 'nisn'],
//   //       include: [{
//   //         model: Kehadiran,
//   //         as: 'studentAttendances',
//   //         where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
//   //         required: false
//   //       }]
//   //     });

//   //     const lowAttendance = students
//   //       .map(student => {
//   //         const totalDays = student.kehadirans?.length || 0;
//   //         const hadir = student.studentAttendances?.filter(k => k.status === 'hadir').length || 0;
//   //         const presentRate = totalDays > 0 ? (hadir / totalDays) * 100 : 0;
//   //         return { ...student.toJSON(), totalDays, hadir, presentRate: Math.round(presentRate) };
//   //       })
//   //       .filter(s => s.presentRate < parseInt(threshold))
//   //       .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

//   //     return res.json({ success: true, data: lowAttendance });
//   //   } catch (err) {
//   //     return res.status(500).json({ success: false, message: err.message });
//   //   }
//   // }

//   // // Get students with frequent late arrivals
//   // async getFrequentLate(req, res) {
//   //   try {
//   //     const { schoolId, minPerWeek = 2, page = 1, limit = 20 } = req.query;
//   //     const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//   //     if (!enforcedSchoolId) {
//   //       return res.status(400).json({ success: false, message: 'schoolId required' });
//   //     }

//   //     const thirtyDaysAgo = new Date();
//   //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//   //     const students = await Siswa.findAll({
//   //       where: { schoolId: parseInt(enforcedSchoolId) },
//   //       attributes: ['id', 'name', 'nisn'],
//   //       include: [{
//   //         model: Kehadiran,
//   //         as: 'studentAttendances',
//   //         where: { tanggal: { [Op.gte]: thirtyDaysAgo }, status: 'terlambat' },
//   //         required: false
//   //       }]
//   //     });

//   //     const frequentLate = students
//   //       .map(student => {
//   //         const lateCount = student.kehadirans?.length || 0;
//   //         return { ...student.toJSON(), lateCount };
//   //       })
//   //       .filter(s => s.lateCount >= parseInt(minPerWeek))
//   //       .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

//   //     return res.json({ success: true, data: frequentLate });
//   //   } catch (err) {
//   //     return res.status(500).json({ success: false, message: err.message });
//   //   }
//   // }

//   // // Get recap per class
//   // async getRecapKelas(req, res) {
//   //   try {
//   //     const { schoolId, date } = req.query;
//   //     const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//   //     if (!enforcedSchoolId) {
//   //       return res.status(400).json({ success: false, message: 'schoolId required' });
//   //     }

//   //     const { Op } = require('sequelize');
//   //     const Kelas = require('../models/kelas');

//   //     const whereClause = { schoolId: parseInt(enforcedSchoolId) };
//   //     if (date) {
//   //       whereClause.tanggal = date;
//   //     }

//   //     const kelasList = await Kelas.findAll({
//   //       where: { schoolId: parseInt(enforcedSchoolId) },
//   //       attributes: ['id', 'className']
//   //     });

//   //     const recap = await Promise.all(kelasList.map(async (kelas) => {
//   //       const students = await Siswa.findAll({
//   //         where: { kelasId: kelas.id },
//   //         attributes: ['id']
//   //       });
//   //       const studentIds = students.map(s => s.id);

//   //       const attendances = await Kehadiran.findAll({
//   //         where: {
//   //           siswaId: { [Op.in]: studentIds },
//   //           ...(date ? { tanggal: date } : {})
//   //         }
//   //       });

//   //       const hadir = attendances.filter(a => a.status === 'hadir').length;
//   //       const izin = attendances.filter(a => a.status === 'izin').length;
//   //       const sakit = attendances.filter(a => a.status === 'sakit').length;
//   //       const alpha = attendances.filter(a => a.status === 'alpha').length;
//   //       const terlambat = attendances.filter(a => a.status === 'terlambat').length;

//   //       return {
//   //         kelasId: kelas.id,
//   //         namaKelas: kelas.namaKelas,
//   //         totalSiswa: studentIds.length,
//   //         hadir,
//   //         izin,
//   //         sakit,
//   //         alpha,
//   //         terlambat,
//   //         presentRate: studentIds.length > 0 ? Math.round((hadir / studentIds.length) * 100) : 0
//   //       };
//   //     }));

//   //     return res.json({ success: true, data: recap });
//   //   } catch (err) {
//   //     return res.status(500).json({ success: false, message: err.message });
//   //   }
//   // }


  
// async getConsecutiveAbsent(req, res) {
//   try {
//     const { schoolId, minDays = 3, search = '', kelas = '' } = req.query;
//     const page   = Math.max(1, parseInt(req.query.page)  || 1);
//     const limit  = Math.min(100, parseInt(req.query.limit) || 10);
//     const offset = (page - 1) * limit;
 
//     // Bangun N hari kerja ke belakang dari hari ini
//     const checkDays = [];
//     let current = moment2().tz('Asia/Jakarta').startOf('day');
//     while (checkDays.length < parseInt(minDays)) {
//       if (current.day() !== 0 && current.day() !== 6) {
//         checkDays.push(current.format('YYYY-MM-DD'));
//       }
//       current.subtract(1, 'day');
//     }
//     const formattedDates = checkDays.map(d => `'${d}'`).join(',');
 
//     const andConditions = [
//       { schoolId: parseInt(schoolId) },
//       { isActive: true },
//       { isGraduated: false },
//       literal(`NOT EXISTS (
//         SELECT 1 FROM kehadiran
//         WHERE studentId = Student.id
//         AND status = 'Hadir'
//         AND DATE(CONVERT_TZ(createdAt, '+00:00', '+07:00')) IN (${formattedDates})
//       )`)
//     ];

//     // Tambahkan filter kelas ke array jika ada
//     if (kelas && kelas.trim() !== '') {
//       andConditions.push({ class: kelas.trim() });
//     }

//     // Tambahkan filter search ke array jika ada
//     if (search && search.trim() !== '') {
//       const keyword = `%${search.trim()}%`;
//       andConditions.push({
//         [Op.or]: [
//           { name: { [Op.like]: keyword } },
//           { nis: { [Op.like]: keyword } }
//         ]
//       });
//     }

//     // Masukkan ke findAndCountAll
//     const { count, rows: students } = await Student.findAndCountAll({
//       where: { [Op.and]: andConditions }, // Gunakan array yang sudah dibangun
//       logging: (sql) => console.log("CEK SQL DISINI:", sql),
//       attributes: ['id', 'name', 'nis', 'class', 'photoUrl'],
//       limit,
//       offset,
//       order: [['name', 'ASC']],
//       subQuery: false,
//       raw: true
//     });
 
//     res.json({
//       success: true,
//       count,
//       data: students.map(s => ({ ...s, isAlert: true, absentDates: checkDays })),
//       pagination: {
//         totalData:   count,
//         totalPages:  Math.ceil(count / limit),
//         currentPage: page
//       }
//     });
//   } catch (err) {
//     console.error('[getConsecutiveAbsent]', err);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// };
 
// // ─────────────────────────────────────────────────────────────────────────────
 
// async getLowAttendance(req, res) {
//   try {
//     const { schoolId, threshold = 75, search = '', kelas = '' } = req.query;
//     const page   = Math.max(1, parseInt(req.query.page)  || 1);
//     const limit  = Math.min(100, parseInt(req.query.limit) || 10);
//     const offset = (page - 1) * limit;
 
//     if (!schoolId) {
//       return res.status(400).json({ success: false, message: 'schoolId diperlukan' });
//     }
 
//     const startDate = moment2().tz('Asia/Jakarta').startOf('month');
//     const endDate   = moment2().tz('Asia/Jakarta').endOf('month');
//     const today     = moment2().tz('Asia/Jakarta');
 
//     // Hitung total hari kerja bulan ini (penuh)
//     let totalWorkdaysInMonth = 0;
//     let dayCursor = startDate.clone();
//     while (dayCursor.isSameOrBefore(endDate, 'day')) {
//       if (dayCursor.day() !== 0 && dayCursor.day() !== 6) totalWorkdaysInMonth++;
//       dayCursor.add(1, 'day');
//     }
 
//     // Hitung hari kerja yang sudah berlalu (untuk info UI)
//     let passedWorkdays = 0;
//     let cursor = startDate.clone();
//     while (cursor.isSameOrBefore(today, 'day')) {
//       if (cursor.day() !== 0 && cursor.day() !== 6) passedWorkdays++;
//       cursor.add(1, 'day');
//     }
//     passedWorkdays = Math.max(1, passedWorkdays);
 
//     const sDateStr = startDate.format('YYYY-MM-DD HH:mm:ss');
//     const eDateStr = endDate.format('YYYY-MM-DD HH:mm:ss');
 
//     // ── Filter dinamis ────────────────────────────────────────────────────────
//     const andConditions = [
//       literal(`(
//         SELECT COUNT(id) FROM kehadiran
//         WHERE studentId = Student.id
//         AND   status    = 'Hadir'
//         AND   CONVERT_TZ(createdAt, '+00:00', '+07:00') BETWEEN '${sDateStr}' AND '${eDateStr}'
//         AND   DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', '+07:00')) NOT IN (1, 7)
//       ) * 100 / ${totalWorkdaysInMonth} < ${parseInt(threshold)}`)
//     ];
 
//     const whereClause = {
//       schoolId:    parseInt(schoolId),
//       isActive:    true,
//       isGraduated: false,
//       [Op.and]:    andConditions
//     };
 
//     // Filter kelas
//     if (kelas && kelas.trim() !== '') {
//       whereClause.class = kelas.trim();
//     }
 
//     // Filter nama atau NIS
//     if (search && search.trim() !== '') {
//       const keyword = `%${search.trim()}%`;
//       andConditions.push({
//         [Op.or]: [
//           { name: { [Op.like]: keyword } },
//           { nis:  { [Op.like]: keyword } }
//         ]
//       });
//     }
//     // ─────────────────────────────────────────────────────────────────────────
 
//     const { count, rows: students } = await Student.findAndCountAll({
//       where: whereClause,
//       attributes: [
//         'id', 'name', 'nis', 'class', 'photoUrl',
//         [
//           literal(`(
//             SELECT COUNT(id) FROM kehadiran
//             WHERE studentId = Student.id
//             AND   status    = 'Hadir'
//             AND   CONVERT_TZ(createdAt, '+00:00', '+07:00') BETWEEN '${sDateStr}' AND '${eDateStr}'
//             AND   DAYOFWEEK(CONVERT_TZ(createdAt, '+00:00', '+07:00')) NOT IN (1, 7)
//           )`),
//           'hadirCount'
//         ]
//       ],
//       limit,
//       offset,
//       order:    [[literal('hadirCount'), 'ASC']],
//       subQuery: false,
//       raw:      true
//     });
 
//     const dataWithPercentage = students.map(s => {
//       const hadirCount = parseInt(s.hadirCount || 0);
//       return {
//         ...s,
//         hadirCount,
//         totalWorkdays:  totalWorkdaysInMonth,
//         passedWorkdays,
//         percentage:     Math.round((hadirCount / totalWorkdaysInMonth) * 100),
//         period:         `Bulan ${today.format('MMMM YYYY')}`,
//         rangeLabel:     `${startDate.format('DD MMM')} - ${endDate.format('DD MMM YYYY')}`
//       };
//     });
 
//     res.json({
//       success: true,
//       count,
//       data: dataWithPercentage,
//       pagination: {
//         totalData:   count,
//         totalPages:  Math.ceil(count / limit),
//         currentPage: page
//       }
//     });
//   } catch (err) {
//     console.error('[getLowAttendance Error]:', err);
//     res.status(500).json({
//       success:  false,
//       message:  'Gagal mengambil data kehadiran rendah',
//       error:    err.message
//     });
//   }
// };
 
// // ─────────────────────────────────────────────────────────────────────────────
 
// async getFrequentLate(req, res) {
//   try {
//     const { schoolId, minPerWeek = 2, weeksBack = 2, search = '', kelas = '' } = req.query;
//     const page   = Math.max(1, parseInt(req.query.page)  || 1);
//     const limit  = Math.min(100, parseInt(req.query.limit) || 10);
//     const offset = (page - 1) * limit;
 
//     if (!schoolId) {
//       return res.status(400).json({ success: false, message: 'schoolId diperlukan' });
//     }
 
//     const deadline  = '07:00:00';
//     const endDate   = moment2().tz('Asia/Jakarta').endOf('day');
//     const startDate = moment2().tz('Asia/Jakarta').subtract(parseInt(weeksBack), 'weeks').startOf('isoWeek');
 
//     const sDateStr = startDate.format('YYYY-MM-DD HH:mm:ss');
//     const eDateStr = endDate.format('YYYY-MM-DD HH:mm:ss');
 
//     // ── Filter dinamis ────────────────────────────────────────────────────────
//     const andConditions = [
//       literal(`EXISTS (
//         SELECT 1 FROM (
//           SELECT studentId, YEARWEEK(CONVERT_TZ(createdAt,'+00:00','+07:00'), 1) AS weekKey
//           FROM   kehadiran
//           WHERE  status   = 'Hadir'
//           AND    schoolId = ${parseInt(schoolId)}
//           AND    TIME(CONVERT_TZ(createdAt,'+00:00','+07:00')) > '${deadline}'
//           AND    CONVERT_TZ(createdAt,'+00:00','+07:00') BETWEEN '${sDateStr}' AND '${eDateStr}'
//           AND    DAYOFWEEK(CONVERT_TZ(createdAt,'+00:00','+07:00')) NOT IN (1, 7)
//           GROUP BY studentId, weekKey
//           HAVING COUNT(id) >= ${parseInt(minPerWeek)}
//         ) AS v_weeks
//         WHERE v_weeks.studentId = Student.id
//       )`)
//     ];
 
//     const whereClause = {
//       schoolId:    parseInt(schoolId),
//       isActive:    true,
//       isGraduated: false,
//       [Op.and]:    andConditions
//     };
 
//     // Filter kelas
//     if (kelas && kelas.trim() !== '') {
//       whereClause.class = kelas.trim();
//     }
 
//     // Filter nama atau NIS
//     if (search && search.trim() !== '') {
//       const keyword = `%${search.trim()}%`;
//       andConditions.push({
//         [Op.or]: [
//           { name: { [Op.like]: keyword } },
//           { nis:  { [Op.like]: keyword } }
//         ]
//       });
//     }
//     // ─────────────────────────────────────────────────────────────────────────
 
//     const { count, rows: students } = await Student.findAndCountAll({
//       where: whereClause,
//       attributes: [
//         'id', 'name', 'nis', 'class', 'photoUrl',
//         [
//           literal(`(
//             SELECT COUNT(id) FROM kehadiran
//             WHERE studentId = Student.id
//             AND   status    = 'Hadir'
//             AND   TIME(CONVERT_TZ(createdAt,'+00:00','+07:00')) > '${deadline}'
//             AND   CONVERT_TZ(createdAt,'+00:00','+07:00') BETWEEN '${sDateStr}' AND '${eDateStr}'
//           )`),
//           'totalLate'
//         ]
//       ],
//       limit,
//       offset,
//       order:    [[literal('totalLate'), 'DESC']],
//       subQuery: false,
//       raw:      true
//     });
 
//     res.json({
//       success: true,
//       count,
//       data: students.map(s => ({
//         ...s,
//         totalLate:     parseInt(s.totalLate || 0),
//         weeksAnalyzed: parseInt(weeksBack)
//       })),
//       pagination: {
//         totalData:   count,
//         totalPages:  Math.ceil(count / limit),
//         currentPage: page
//       }
//     });
//   } catch (err) {
//     console.error('[getFrequentLate]', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// async shareRekapHarian(req, res) {
//   try {
//     const { schoolId, date, via = 'wa' } = req.query;
 
//     if (!schoolId) {
//       return res.status(400).json({ success: false, message: 'schoolId diperlukan' });
//     }

//     const normalizePhone = (phone) => {
//       if (!phone) return null;
//       let p = String(phone).replace(/\D/g, '');
//       if (p.startsWith('0')) p = '62' + p.slice(1);
//       if (p.startsWith('+')) p = p.slice(1);
//       if (!p.startsWith('62')) p = '62' + p;
//       if (p.length < 10 || p.length > 15) {
//         console.warn(`[normalizePhone] Nomor mencurigakan (${p.length} digit): ${p}`);
//         return null;
//       }
//       return p;
//     };
 
//     // Cek status WA jika via wa
//     if (via === 'wa' || via === 'all') {
//       if (!getIsReady()) {
//         try {
//           await waitUntilReady(30000);
//         } catch {
//           return res.status(400).json({
//             success: false,
//             message: 'WhatsApp belum terhubung. Silakan scan QR di halaman pengaturan WA.',
//           });
//         }
//       }
 
//       const stats = getSendStats();
//       if (!canSendMessage()) {
//         return res.status(429).json({
//           success: false,
//           message: `Batas pengiriman WA hari ini sudah tercapai (${stats.max} pesan). Coba lagi besok.`,
//           stats,
//         });
//       }
 
//       console.log(`[WA RateLimit] Sisa kuota hari ini: ${stats.remaining}/${stats.max}`);
//     }
 
//     const targetDate = date || moment().format('YYYY-MM-DD');
//     const dateMoment = moment2.tz(targetDate, 'Asia/Jakarta');
//     const startDate  = dateMoment.clone().startOf('day').format('YYYY-MM-DD HH:mm:ss');
//     const endDate    = dateMoment.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss');
//     const deadline   = '07:00:00';
 
//     // ─── Ambil data siswa + absensi ──────────────────────────────
//     const allStudents = await Student.findAll({
//       where: { schoolId: parseInt(schoolId), isActive: true, isGraduated: false },
//       attributes: ['id', 'name', 'nis', 'class'],
//       include: [{
//         model: Attendance,
//         as: 'studentAttendances',
//         where: { createdAt: { [Op.between]: [startDate, endDate] }, userRole: 'student' },
//         attributes: ['status', 'createdAt'],
//         required: false,
//         limit: 1,
//         order: [['createdAt', 'ASC']],
//       }],
//       raw: false,
//     });
 
//     console.log(`[shareRekap] allStudents.length: ${allStudents.length}`);
 
//     // ─── Susun rekap per kelas ───────────────────────────────────
//     let totalAllStudents = 0, totalAllHadir = 0, totalAllBelumHadir = 0;
//     const acc = new Map();
 
//     for (const student of allStudents) {
//       const className = student.class || 'Tanpa Kelas';
//       if (!acc.has(className)) {
//         acc.set(className, {
//           className,
//           totalStudents: 0,
//           stats: { onTime: 0, late: 0, izin: 0, sakit: 0, alpha: 0, belumHadir: 0 },
//         });
//       }
//       const classObj   = acc.get(className);
//       const attendance = student.studentAttendances?.[0];
//       totalAllStudents++;
 
//       if (attendance) {
//         const scanTime = moment2(attendance.createdAt).tz('Asia/Jakarta').format('HH:mm:ss');
//         if (attendance.status === 'Hadir') {
//           totalAllHadir++;
//           scanTime <= deadline ? classObj.stats.onTime++ : classObj.stats.late++;
//         } else {
//           const k = attendance.status.toLowerCase();
//           if (classObj.stats[k] !== undefined) classObj.stats[k]++;
//         }
//       } else {
//         classObj.stats.belumHadir++;
//         totalAllBelumHadir++;
//       }
//       classObj.totalStudents++;
//     }
 
//     // ─── Ambil kelas & profil sekolah ────────────────────────────
//     const Class  = require('../models/kelas');
//     const classes = await Class.findAll({ where: { schoolId: parseInt(schoolId) } });
//     const school  = await SchoolProfile.findOne({ where: { schoolId: parseInt(schoolId) } });
 
//     console.log(`[shareRekap] school.kepalaSekolahPhone (raw): ${school?.kepalaSekolahPhone}`);
 
//     // Map walikelas ke data rekap
//     classes.forEach(cls => {
//       const normalizedClassName = cls.className?.trim();
//       let matchedKey = null;
 
//       for (const [key] of acc) {
//         if (key.trim().toLowerCase() === normalizedClassName?.toLowerCase()) {
//           matchedKey = key;
//           break;
//         }
//       }
 
//       if (!matchedKey) {
//         acc.set(normalizedClassName, {
//           className: normalizedClassName,
//           totalStudents: 0,
//           stats: { onTime: 0, late: 0, izin: 0, sakit: 0, alpha: 0, belumHadir: 0 },
//         });
//         matchedKey = normalizedClassName;
//       }
 
//       acc.get(matchedKey).walikelas = {
//         phone: normalizePhone(cls.waliKelasPhone),
//         email: cls.waliKelasEmail || null,
//         name:  cls.waliKelas      || null,
//       };
//     });
 
//     const rekapData = {
//       summary: { totalAllStudents, totalAllHadir, totalAllBelumHadir },
//       data: Array.from(acc.values()),
//     };
 
//     const results = { wa: [], email: [], errors: [] };
//     const waClient = getClient();

//     // Hitung total penerima SEBELUM mulai kirim
//     const totalRecipients =
//       (school?.kepalaSekolahPhone ? 1 : 0) +
//       Array.from(acc.values()).filter(c => c.walikelas?.phone).length;

//     let sentCount = 0;

//     emitProgress(schoolId, {
//       status: 'start',
//       message: `Memulai pengiriman ke ${totalRecipients} penerima...`,
//       current: 0,
//       total: totalRecipients,
//     });
 
//     // ─── HELPER: Kirim PDF via WA ─────────────────────────────────
//     const sendWAWithPDF = async (rawPhone, pdfBuffer, filename, caption, label) => {
//       if (!canSendMessage()) {
//         console.warn(`[WA RateLimit] Limit harian tercapai, skip ${label}`);
//         results.errors.push({ to: label, via: 'wa', error: 'Batas kirim harian tercapai' });
//         return;
//       }
 
//       const phone = normalizePhone(rawPhone);
//       if (!phone) {
//         console.warn(`[shareRekap] Skip ${label}: nomor tidak valid (${rawPhone})`);
//         results.errors.push({ to: label, via: 'wa', error: `Nomor tidak valid: ${rawPhone}` });
//         return;
//       }
 
//       try {
//         const chatId = `${phone}@c.us`;
//         console.log(`[shareRekap] Mengirim PDF ke ${label} (${chatId})...`);
 
//         const media = new MessageMedia(
//           'application/pdf',
//           pdfBuffer.toString('base64'),
//           filename
//         );
 
//         await waClient.sendMessage(chatId, media, { caption });
 
//         incrementSendCount();
//         results.wa.push({ to: label, phone, status: 'sent' });
//         console.log(`[shareRekap] ✅ PDF terkirim ke ${label} (${phone})`);
 
//         sentCount++;
//         emitProgress(schoolId, {
//           status: 'progress',
//           message: `✅ Terkirim ke ${label}`,
//           current: sentCount,
//           total: totalRecipients,
//           label,
//         });

//         const delay = results.wa.length > 10 ? 3000 : 1500;
//         await new Promise(r => setTimeout(r, delay));
//        } catch (err) {
//         console.error(`[shareRekap] ❌ Gagal kirim PDF ke ${label}:`, err.message);
//         results.errors.push({ to: label, via: 'wa', error: err.message });

//         // ← TAMBAHKAN INI
//         sentCount++;
//         emitProgress(schoolId, {
//           status: 'progress',
//           message: `❌ Gagal ke ${label}: ${err.message}`,
//           current: sentCount,
//           total: totalRecipients,
//           label,
//           isError: true,
//         });
//       }
//     };
 
//     // ─── KIRIM WA ────────────────────────────────────────────────
//     if (via === 'wa' || via === 'all') {
//       if (!waClient) {
//         return res.status(400).json({
//           success: false,
//           message: 'WA client tidak tersedia. Pastikan WhatsApp sudah terhubung.',
//         });
//       }
 
//       const schoolName = school?.namaSekolah || 'Sekolah';
 
//       // 1. Generate & kirim PDF total ke Kepala Sekolah
//       if (school?.kepalaSekolahPhone) {
//         try {
//           console.log('[shareRekap] Generate PDF rekap total untuk kepsek...');
//           const rekapPdfBuffer = await generateRekapPDF(rekapData, targetDate, schoolName);
 
//           await sendWAWithPDF(
//             school.kepalaSekolahPhone,
//             rekapPdfBuffer,
//             `Rekap_Harian_${targetDate}.pdf`,
//             `*Laporan Rekap Kehadiran Harian*\nTanggal: ${targetDate}\n\nTerlampir laporan lengkap seluruh kelas`,
//             'Kepala Sekolah'
//           );
//         } catch (pdfErr) {
//           console.error('[shareRekap] Gagal generate PDF kepsek:', pdfErr.message);
//           results.errors.push({ to: 'Kepala Sekolah', via: 'wa', error: `Gagal generate PDF: ${pdfErr.message}` });
//         }
//       } else {
//         console.warn('[shareRekap] kepalaSekolahPhone tidak ditemukan di profil sekolah');
//       }
 
//       // 2. Generate & kirim PDF per kelas ke masing-masing Wali Kelas
//       for (const cls of acc.values()) {
//         if (!cls.walikelas?.phone) {
//           console.warn(`[shareRekap] Walikelas ${cls.className} tidak punya nomor WA, dilewati`);
//           continue;
//         }
 
//         try {
//           console.log(`[shareRekap] Generate PDF kelas ${cls.className}...`);
//           const classPdfBuffer = await generateClassRekapPDF(cls, targetDate, schoolName);
 
//           await sendWAWithPDF(
//             cls.walikelas.phone,
//             classPdfBuffer,
//             `Rekap_${cls.className}_${targetDate}.pdf`,
//             `*Rekap Kehadiran Kelas ${cls.className}*\nTanggal: ${targetDate}\n\nTerlampir laporan kehadiran kelas Anda`,
//             `Walikelas ${cls.className}`
//           );
//         } catch (pdfErr) {
//           console.error(`[shareRekap] Gagal generate PDF kelas ${cls.className}:`, pdfErr.message);
//           results.errors.push({
//             to: `Walikelas ${cls.className}`,
//             via: 'wa',
//             error: `Gagal generate PDF: ${pdfErr.message}`,
//           });
//         }
//       }
 
//       console.log(`[WA RateLimit] Setelah kirim:`, getSendStats());
//     }
 
//     // ─── KIRIM EMAIL ─────────────────────────────────────────────
//     if ((via === 'email' || via === 'all') && process.env.SMTP_USER) {
//       const nodemailer  = require('nodemailer');
//       const schoolName  = school?.namaSekolah || 'Sekolah';
 
//       const transporter = nodemailer.createTransport({
//         host:   process.env.SMTP_HOST || 'smtp.gmail.com',
//         port:   587,
//         secure: false,
//         auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
//       });
 
//       const sendEmail = async (to, subject, text, pdfBuffer, filename, label) => {
//         if (!to) {
//           console.warn(`[shareRekap] Skip email ${label}: alamat email kosong`);
//           results.errors.push({ to: label, via: 'email', error: 'Email kosong' });
//           return;
//         }
//         try {
//           const mailOptions = {
//             from:    `"KiraProject" <${process.env.SMTP_USER}>`,
//             to,
//             subject,
//             text:    text.replace(/\*/g, '').replace(/━/g, '—'),
//           };
 
//           // Attach PDF jika ada
//           if (pdfBuffer && filename) {
//             mailOptions.attachments = [{
//               filename,
//               content:     pdfBuffer,
//               contentType: 'application/pdf',
//             }];
//           }
 
//           await transporter.sendMail(mailOptions);
//           results.email.push({ to: label, email: to, status: 'sent' });
//           console.log(`[shareRekap] ✅ Email terkirim ke ${label} (${to})`);
//         } catch (err) {
//           console.error(`[shareRekap] ❌ Gagal kirim email ke ${label} (${to}):`, err.message);
//           results.errors.push({ to: label, via: 'email', error: err.message });
//         }
//       };
 
//       // Kepsek
//       if (school?.kepalaSekolahEmail) {
//         const rekapPdfBuffer = await generateRekapPDF(rekapData, targetDate, schoolName);
//         await sendEmail(
//           school.kepalaSekolahEmail,
//           `📊 Rekap Kehadiran Harian ${targetDate}`,
//           generateRekapText(rekapData, targetDate),
//           rekapPdfBuffer,
//           `Rekap_Harian_${targetDate}.pdf`,
//           'Kepala Sekolah'
//         );
//       }
 
//       // Walikelas
//       for (const cls of acc.values()) {
//         if (cls.walikelas?.email) {
//           const classPdfBuffer = await generateClassRekapPDF(cls, targetDate, schoolName);
//           await sendEmail(
//             cls.walikelas.email,
//             `📚 Rekap Kelas ${cls.className} — ${targetDate}`,
//             generateClassSpecificText(cls, targetDate),
//             classPdfBuffer,
//             `Rekap_${cls.className}_${targetDate}.pdf`,
//             `Walikelas ${cls.className}`
//           );
//         }
//       }
//     }
 
//     console.log(
//       `[shareRekap] Selesai. WA: ${results.wa.length}, Email: ${results.email.length}, Gagal: ${results.errors.length}`
//     );
 
//     // Kumpulkan semua warning (kelas tanpa nomor WA)
//     const skippedClasses = [];
//     for (const cls of acc.values()) {
//       if (!cls.walikelas?.phone) {
//         skippedClasses.push(cls.className);
//       }
//     }

//     const warnings = [];
//     if (skippedClasses.length > 0) {
//       warnings.push({
//         type: 'no_phone',
//         message: `${skippedClasses.length} walikelas tidak punya nomor WA`,
//         list: skippedClasses.map(c => `• ${c}`)
//       });
//     }
//     if (!school?.kepalaSekolahPhone) {
//       warnings.push({
//         type: 'no_kepsek_phone',
//         message: 'Nomor WA Kepala Sekolah belum diisi di profil sekolah',
//         list: []
//       });
//     }

//     emitProgress(schoolId, {
//       status: 'done',
//       message: `Selesai: ${results.wa.length} terkirim, ${results.errors.length} gagal`,
//       current: totalRecipients,
//       total: totalRecipients,
//       results,
//     });

//     res.json({
//       success: true,
//       message: results.wa.length > 0
//         ? `Rekap dikirim: ${results.wa.length} WA, ${results.email.length} email, ${results.errors.length} gagal`
//         : 'Tidak ada pesan terkirim — periksa nomor WA walikelas di data kelas',
//       results,
//       warnings,         // ← list warning per kategori
//       rateLimit: getSendStats(),
//     });
 
//   } catch (err) {
//     console.error('[shareRekapHarian] Error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// async getClassRecapWithDetails(req, res){
//   try {
//     const { schoolId, date } = req.query;

//     const targetDate = date 
//       ? moment.tz(date, 'Asia/Jakarta') 
//       : moment.tz('Asia/Jakarta');

//     const startDate = targetDate.clone().startOf('day').toDate();
//     const endDate   = targetDate.clone().endOf('day').toDate();

//     const deadline = "07:00:00";

//     const allStudents = await Student.findAll({
//       where: { 
//         schoolId: parseInt(schoolId), 
//         isActive: true, 
//         isGraduated: false 
//       },
//       attributes: ['id', 'name', 'nis', 'class', 'photoUrl'],
//       include: [{
//         model: Attendance,
//         as: 'studentAttendances',
//         where: {
//           createdAt: { [Op.between]: [startDate, endDate] },
//           userRole: 'student'
//         },
//         attributes: ['status', 'createdAt', 'checkOutAt'], // ← tambah checkOutAt
//         required: false,
//         limit: 1,
//         order: [['createdAt', 'ASC']]
//       }],
//     });

//     // --- RINGKASAN GLOBAL ---
//     let totalAllStudents = 0;
//     let totalAllHadir = 0;
//     let totalAllIzin = 0;
//     let totalAllPulang = 0;     // ← GANTI dari totalAllSakit
//     let totalAllAlpha = 0;
//     let totalAllBelumHadir = 0;

//     const acc = new Map();

//     for (const student of allStudents) {
//       const className = student.class || "Tanpa Kelas";

//       if (!acc.has(className)) {
//         acc.set(className, {
//           className,
//           totalStudents: 0,
//           stats: { 
//             onTime: 0, 
//             late: 0, 
//             izin: 0, 
//             pulang: 0,      // ← baru
//             alpha: 0, 
//             belumHadir: 0 
//           },
//           students: []
//         });
//       }

//       const classObj = acc.get(className);
//       const attendance = student.studentAttendances?.[0];

//       let statusInfo = "Belum Hadir";
//       let scanTime = null;
//       let hasCheckedOut = false;

//       totalAllStudents++;
//       classObj.totalStudents++;

//       if (attendance) {
//         scanTime = moment.tz(attendance.createdAt, 'Asia/Jakarta').format("HH:mm:ss");
//         hasCheckedOut = !!attendance.checkOutAt; // ← Cek apakah sudah pulang

//         const normalizedStatus = (attendance.status || '').toLowerCase().trim();

//         if (normalizedStatus === 'hadir') {
//           totalAllHadir++;
//           if (scanTime <= deadline) {
//             classObj.stats.onTime++;
//             statusInfo = "Hadir";
//           } else {
//             classObj.stats.late++;
//             statusInfo = "Hadir";
//           }
//         } else if (normalizedStatus === 'izin') {
//           totalAllIzin++;
//           classObj.stats.izin++;
//           statusInfo = "Izin";
//         } else if (normalizedStatus === 'sakit') {
//           // Tetap hitung sakit jika diperlukan, tapi tidak ditampilkan di ringkasan utama
//           statusInfo = "Sakit";
//         } else if (normalizedStatus === 'alpha') {
//           totalAllAlpha++;
//           classObj.stats.alpha++;
//           statusInfo = "Alpha";
//         }

//         // Hitung yang sudah pulang
//         if (hasCheckedOut) {
//           totalAllPulang++;
//           classObj.stats.pulang++;
//           // Optional: ubah statusInfo jadi "Pulang" jika mau
//           // statusInfo = "Pulang";
//         }
//       } else {
//         totalAllBelumHadir++;
//         classObj.stats.belumHadir++;
//         statusInfo = "Belum Hadir";
//       }

//       classObj.students.push({
//         id: student.id,
//         name: student.name,
//         nis: student.nis,
//         status: statusInfo,
//         scanTime,
//         photoUrl: student.photoUrl,
//         checkOutAt: attendance?.checkOutAt ? moment.tz(attendance.checkOutAt, 'Asia/Jakarta').format("HH:mm:ss") : null,
//       });
//     }

//     const sortedData = Array.from(acc.values()).sort((a, b) => 
//       a.className.localeCompare(b.className, undefined, { numeric: true })
//     );

//     res.json({
//       success: true,
//       summary: { 
//         totalAllStudents, 
//         totalAllHadir, 
//         totalAllIzin,
//         totalAllPulang,     // ← Baru (menggantikan totalAllSakit)
//         totalAllAlpha,
//         totalAllBelumHadir,
//         date: targetDate.format('YYYY-MM-DD')
//       },
//       data: sortedData
//     });

//   } catch (err) {
//     console.error('[getClassRecapWithDetails] Error:', err);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };


// async getGlobalAttendanceStats(req, res){
//   try {
//     const { schoolId, date, search = '', page = 1, limit = 10 } = req.query;
    
//     const targetDate  = date ? moment(date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
//     const startOfDay  = `${targetDate} 00:00:00`;
//     const endOfDay    = `${targetDate} 23:59:59`;
//     const offset      = (Number(page) - 1) * Number(limit);

//     const createdAtRange = { [Op.between]: [startOfDay, endOfDay] };
//     const baseWhere = { schoolId, userRole: 'student', status: 'Hadir', createdAt: createdAtRange };

//     // Where untuk absent students + search
//     const absentWhere = { schoolId, isActive: true, isGraduated: false };
//     if (search.trim()) {
//       absentWhere[Op.or] = [
//         { name: { [Op.like]: `%${search.trim()}%` } },
//         { nis:  { [Op.like]: `%${search.trim()}%` } },
//       ];
//     }

//     const [allHadir, { rows: absentStudents, count: totalAbsent }] = await Promise.all([
//       Attendance.findAll({
//         where:      baseWhere,
//         include:    [{ model: Student, as: 'student', attributes: ['name', 'class', 'photoUrl'] }],
//         order:      [['createdAt', 'ASC']],
//         attributes: ['createdAt', 'studentId'],
//       }),

//       Student.findAndCountAll({
//         where:   absentWhere,
//         include: [{
//           model:      Attendance,
//           as:         'studentAttendances',
//           required:   false,
//           where:      { createdAt: createdAtRange, userRole: 'student' },
//           attributes: [],
//         }],
//         having:   literal('COUNT(`studentAttendances`.`id`) = 0'),
//         group:    ['Student.id'],
//         order:    [['class', 'ASC'], ['name', 'ASC']],
//         attributes: ['id', 'name', 'nis', 'class', 'photoUrl'],
//         limit:    Number(limit),
//         offset,
//         subQuery: false,
//       }),
//     ]);

//     const topEarly = allHadir.slice(0, 5);
//     const topLate  = [...allHadir].reverse().slice(0, 5);

//     const formatAttendance = (a) => ({
//       name:     a.student?.name,
//       class:    a.student?.class,
//       photoUrl: a.student?.photoUrl,
//       time:     moment(a.createdAt).format('HH:mm:ss'),
//     });

//     res.json({
//       success: true,
//       targetDate,
//       data: {
//         absentStudents,
//         absentMeta: {
//           total:      totalAbsent.length, // findAndCountAll dengan group returns array
//           page:       Number(page),
//           limit:      Number(limit),
//           totalPages: Math.ceil(totalAbsent.length / Number(limit)),
//         },
//         topEarly: topEarly.map(formatAttendance),
//         topLate:  topLate.map(formatAttendance),
//       },
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// }

// // Get global statistics
//   async getGlobalStats(req, res) {
//     try {
//       const { schoolId } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!enforcedSchoolId) {
//         return res.status(400).json({ success: false, message: 'schoolId required' });
//       }

//       const { Op } = require('sequelize');

//       const thirtyDaysAgo = new Date();
//       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//       const totalSiswa = await Siswa.count({
//         where: { schoolId: parseInt(enforcedSchoolId) }
//       });

//       const attendances = await Kehadiran.findAll({
//         where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
//         include: [{
//           model: Siswa,
//           where: { schoolId: parseInt(enforcedSchoolId) },
//           required: true
//         }]
//       });

//       const totalAttendances = attendances.length;
//       const hadir = attendances.filter(a => a.status === 'hadir').length;
//       const izin = attendances.filter(a => a.status === 'izin').length;
//       const sakit = attendances.filter(a => a.status === 'sakit').length;
//       const alpha = attendances.filter(a => a.status === 'alpha').length;
//       const terlambat = attendances.filter(a => a.status === 'terlambat').length;

//       return res.json({
//         success: true,
//         data: {
//           totalSiswa,
//           totalAttendances,
//           hadir,
//           izin,
//           sakit,
//           alpha,
//           terlambat,
//           presentRate: totalAttendances > 0 ? Math.round((hadir / totalAttendances) * 100) : 0,
//           period: '30 days'
//         }
//       });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Search siswa by name or nisn
//   async searchSiswa(req, res) {
//     try {
//       const { schoolId, q } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!enforcedSchoolId) {
//         return res.status(400).json({ success: false, message: 'schoolId required' });
//       }

//       if (!q || q.length < 2) {
//         return res.status(400).json({ success: false, message: 'Search query min 2 characters' });
//       }

//       const students = await Siswa.findAll({
//         where: {
//           schoolId: parseInt(enforcedSchoolId),
//           [Op.or]: [
//             { name: { [Op.like]: `%${q}%` } },
//             { nisn: { [Op.like]: `%${q}%` } }
//           ]
//         },
//         attributes: ['id', 'name', 'nisn', 'photoUrl'],
//         limit: 20
//       });

//       return res.json({ success: true, data: students });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Share recap progress via WhatsApp
//   async shareRekapProgress(req, res) {
//     try {
//       const { schoolId } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!enforcedSchoolId) {
//         return res.status(400).json({ success: false, message: 'schoolId required' });
//       }

//       const thirtyDaysAgo = new Date();
//       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//       const totalSiswa = await Siswa.count({
//         where: { schoolId: parseInt(enforcedSchoolId) }
//       });

//       const attendances = await Kehadiran.findAll({
//         where: { tanggal: { [Op.gte]: thirtyDaysAgo } },
//         include: [{
//           model: Siswa,
//           where: { schoolId: parseInt(enforcedSchoolId) },
//           required: true
//         }]
//       });

//       const hadir = attendances.filter(a => a.status === 'hadir').length;
//       const presentRate = attendances.length > 0 ? Math.round((hadir / attendances.length) * 100) : 0;

//       const recapText = `📊 *Rekap Kehadiran 30 Hari*\n\n` +
//         `🏫 Total Siswa: ${totalSiswa}\n` +
//         `✅ Hadir: ${hadir}\n` +
//         `📈 Kehadiran: ${presentRate}%\n\n` +
//         `_Dikirim dari Xpresensi_`;

//       return res.json({ success: true, data: { text: recapText } });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   // Share recap via specific channel (WA/sms/email)
//   async shareRekap(req, res) {
//     try {
//       const { schoolId, date, via } = req.query;
//       const enforcedSchoolId = schoolId || req.enforcedSchoolId;

//       if (!enforcedSchoolId) {
//         return res.status(400).json({ success: false, message: 'schoolId required' });
//       }

//       const { Op } = require('sequelize');

//       const kelasList = await require('../models/kelas').findAll({
//         where: { schoolId: parseInt(enforcedSchoolId) },
//         attributes: ['id', 'className']
//       });

//       const recap = await Promise.all(kelasList.map(async (kelas) => {
//         const students = await Siswa.findAll({
//           where: { kelasId: kelas.id },
//           attributes: ['id']
//         });
//         const studentIds = students.map(s => s.id);

//         const whereClause = {
//           siswaId: { [Op.in]: studentIds },
//           ...(date ? { tanggal: date } : {})
//         };

//         const attendances = await Kehadiran.findAll({ where: whereClause });

//         const hadir = attendances.filter(a => a.status === 'hadir').length;

//         return {
//           kelas: kelas.namaKelas,
//           hadir,
//           total: studentIds.length,
//           rate: studentIds.length > 0 ? Math.round((hadir / studentIds.length) * 100) : 0
//         };
//       }));

//       return res.json({ success: true, data: { recap, via: via || 'wa' } });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }
//   }
// }

// module.exports = new SiswaStatsController();

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
// const nodemailer = require('nodemailer'); // npm i nodemailer
// const axios = require('axios');
const { 
  getIsReady, 
  getClient, 
  waitUntilReady,
  canSendMessage,      // ← tambah
  incrementSendCount,  // ← tambah
  getSendStats         // ← tambah
} = require('../config/whatsapp');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const verifySiswaSchool = async (siswaId, schoolId) => {
  const siswa = await Student.findByPk(siswaId, { attributes: ['id', 'schoolId'] });
  return siswa && siswa.schoolId === parseInt(schoolId);
};

// === REDIS + INVALIDATE CACHE ===
// const redisClient = require('../config/redis');
// const { getWorkdaysInRange } = require('../helper/getWorkDays');
const { generateRekapText } = require('../helper/generateRecapText');
const { generateClassSpecificText } = require('../helper/generateClassSpecificText');
const { generateRekapPDF } = require('../helper/generateRekapPDF');
const { generateClassRekapPDF } = require('../utils/generateClassRekapPDF');
const { MessageMedia } = require('whatsapp-web.js');
const progressClients = new Map();

exports.shareRekapProgress = async (req, res) => {
  const { schoolId, date } = req.query;
  
  if (!schoolId) {
    return res.status(400).json({ success: false, message: 'School ID diperlukan' });
  }

  // 1. Setup Header SSE agar browser tetap mendengarkan
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Simpan res ke Map agar bisa diakses oleh fungsi processSharingRekap
  progressClients.set(String(schoolId), res);

  try {
    // 2. Ambil Data Rekap (Ganti ini dengan fungsi/query DB kamu yang asli)
    // const rekapData = await Siswa.getRekapHarian(schoolId, date);
    
    if (!rekapData || !rekapData.data) {
      emitProgress(schoolId, { error: 'Data rekap tidak ditemukan untuk tanggal ini' });
      return res.end();
    }

    // 3. Jalankan proses pengiriman tanpa 'await' agar SSE tidak blocking
    // Kita berikan Nama Sekolah (misal dari req.user atau rekapData)
    const schoolName = rekapData.schoolName || "Sekolah KiraProject";
    processSharingRekap(schoolId, rekapData, date, schoolName);

  } catch (error) {
    console.error("SSE Error:", error);
    emitProgress(schoolId, { error: 'Terjadi kesalahan internal pada server' });
  }

  // Hapus dari Map jika user menutup browser/tab
  req.on('close', () => {
    progressClients.delete(String(schoolId));
  });
};

/**
 * Fungsi Background untuk Proses Pengiriman WA & Update Kuota
 */
const processSharingRekap = async (schoolId, rekapData, targetDate, schoolName) => {
  const client = getClient();
  const totalItems = rekapData.data.length;

  // Cek Koneksi WA di awal
  if (!client || !getIsReady()) {
    emitProgress(schoolId, { error: 'WhatsApp belum terhubung atau sedang reconnecting' });
    return;
  }

  for (const [index, cls] of rekapData.data.entries()) {
    try {
      // A. CEK KUOTA (Rate Limit 50/day)
      if (!canSendMessage()) {
        emitProgress(schoolId, { error: 'Limit pengiriman harian (50) sudah tercapai.' });
        break; // Hentikan loop pengiriman
      }

      // B. GENERATE ASSET (PDF & Pesan)
      const classPdfBuffer = await generateClassRekapPDF(cls, targetDate, schoolName);
      const media = new MessageMedia(
        'application/pdf', 
        classPdfBuffer.toString('base64'), 
        `REKAP_${cls.className.replace(/\s+/g, '_')}.pdf`
      );
      const text = generateClassSpecificText(cls, targetDate);

      // C. KIRIM PESAN
      const phone = cls.walikelas?.phone;
      if (phone) {
        const chatId = `${phone.replace(/\D/g, '')}@c.us`; // pastikan format hanya angka
        await client.sendMessage(chatId, media, { caption: text });
        
        // --- POIN KRITIS: Update kuota setelah sukses kirim ---
        incrementSendCount();
      }

      // D. UPDATE PROGRESS KE FRONTEND
      const progress = Math.round(((index + 1) / totalItems) * 100);
      emitProgress(schoolId, { 
        progress, 
        message: `Berhasil mengirim rekap ke Kelas ${cls.className}` 
      });

    } catch (err) {
      console.error(`Gagal mengirim kelas ${cls.className}:`, err);
      emitProgress(schoolId, { message: `Gagal mengirim Kelas ${cls.className}, lanjut ke kelas berikutnya...` });
    }
  }

  // E. BERITAHU SELESAI
  emitProgress(schoolId, { done: true, message: 'Semua rekap berhasil diproses!' });
};

/**
 * Helper untuk mengirim data ke stream SSE
 */
const emitProgress = (schoolId, data) => {
  const res = progressClients.get(String(schoolId));
  if (res) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
};

// const invalidateStudentCache = async (schoolId) => {
//   if (!schoolId) return;
//   try {
//     const pattern = `cache:/siswa*schoolId=${schoolId}*`;
//     const keys = await redisClient.keys(pattern);
//     if (keys.length > 0) {
//       await redisClient.del(...keys); // Spread karena ioredis
//       console.log(`✅ Cache invalidated: ${keys.length} keys for schoolId ${schoolId}`);
//     }
//   } catch (err) {
//     console.error('❌ Invalidate cache error:', err.message);
//   }
// };

// Helper: Optimasi Gambar Jangka Panjang
const processPhotoUpload = (buffer, schoolId, nis) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `sekolah_${schoolId}/siswa`,
        public_id: `photo_${nis}`,
        overwrite: true,
        // AI-Powered Optimization
        transformation: [
          { width: 400, height: 400, crop: 'thumb', gravity: 'face' }, // Fokus wajah
          { quality: 'auto', fetch_format: 'auto' } // Kompresi WebP otomatis
        ]
      },
      (error, result) => { if (error) reject(error); else resolve(result.secure_url); }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Server User - studentController.js

exports.validateUserByQR = async (req, res) => {
  try {
    const { qrCodeData, rfidUid, schoolId } = req.query;

    let user = null;
    let role = null;


    if (!qrCodeData || !schoolId) {
      return res.status(400).json({ success: false, message: "QR Data dan SchoolId diperlukan." });
    }

    // PRIORITAS RFID
    if (rfidUid) {
      user = await Student.findOne({ 
        where: { rfidUid, schoolId: parseInt(schoolId), isActive: true },
        attributes: ['id', 'name', 'class', 'schoolId', 'nis', 'nisn', 'gender']
      });
      role = 'student';

      if (!user) {
        user = await GuruTendik.findOne({ 
          where: { rfidUid, schoolId: parseInt(schoolId), isActive: true },
          attributes: ['id', ['nama', 'name'], 'role', 'schoolId', 'nip']
        });
        role = 'teacher';
      }
    }

    // FALLBACK QR
    if (!user && qrCodeData) {
      user = await Student.findOne({ 
        where: { qrCodeData, schoolId: parseInt(schoolId), isActive: true }
      });
      role = 'student';
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "Kartu tidak dikenali." });
    }

    res.json({ success: true, user, role });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkStudentAuth = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Cari siswa berdasarkan email
    const student = await Student.findOne({ 
      where: { email, isActive: true } 
    });

    // 2. Jika email tidak ketemu
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email siswa tidak ditemukan.' 
      });
    }

    // 3. Verifikasi Password (Bcrypt)
    // Jika data lama belum ada password, kita berikan pesan khusus
    if (!student.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Akun belum diaktivasi. Hubungi Admin.' 
      });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Password yang Anda masukkan salah.' 
      });
    }

    // 4. Ambil data sekolah untuk lokasi/geofencing
    const school = await SchoolProfile.findOne({
      where: { schoolId: student.schoolId }
    });
    
    // 5. Susun Profile (Hapus data sensitif)
    const profile = student.toJSON();
    profile.role = 'siswa';
    delete profile.password;
    delete profile.createdAt;
    delete profile.updatedAt;

    profile.schoolLocation = {
      lat: school ? school.latitude : null,
      lng: school ? school.longitude : null,
      radiusMeter: 200
    };

    // 6. Generate JWT
    const token = jwt.sign(
      { profile },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.json({ 
      success: true, 
      token, 
      data: profile 
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, nis, nisn, gender, birthPlace, birthDate, nik, address,
      isActive, class: className, batch, 
      email, password, rfidUid // Tambahkan ini
    } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }

    // --- 1. VALIDASI DUPLIKAT ---

    if (rfidUid && rfidUid !== student.rfidUid) {
      const existingRfid = await Student.findOne({
        where: { rfidUid, id: { [Op.ne]: id } }
      });

      if (existingRfid) {
        return res.status(400).json({
          success: false,
          message: `RFID sudah digunakan oleh siswa lain`
        });
      }
    }
    
    // Cek NIS (Unik per Sekolah)
    if (nis && nis !== student.nis) {
      const existingNis = await Student.findOne({
        where: { schoolId: student.schoolId, nis: nis, id: { [Op.ne]: id } }
      });
      if (existingNis) return res.status(400).json({ success: false, message: `NIS ${nis} sudah terdaftar.` });
    }

    // Cek NISN (Unik Global)
    if (nisn && nisn !== student.nisn) {
      const existingNisn = await Student.findOne({
        where: { nisn: nisn, id: { [Op.ne]: id } }
      });
      if (existingNisn) return res.status(400).json({ success: false, message: `NISN ${nisn} sudah terdaftar.` });
    }

    // Cek Email (Unik Global) - TAMBAHAN
    if (email && email !== student.email) {
      const existingEmail = await Student.findOne({
        where: { email: email, id: { [Op.ne]: id } }
      });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: `Email ${email} sudah digunakan oleh pengguna lain.` 
        });
      }
    }

    // --- 2. PROSES DATA TAMBAHAN ---
    
    // Foto
    let photoUrl = student.photoUrl;
    if (req.file) {
      photoUrl = await processPhotoUpload(req.file.buffer, student.schoolId, nis || student.nis);
    }

    // Hash Password jika ada perubahan - TAMBAHAN
    let updatedData = {
      name, nis, nisn, gender, birthPlace, birthDate, nik, isActive, address,
      class: className, batch, photoUrl, email, rfidUid
    };

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(password, salt);
    }

    // --- 3. EKSEKUSI UPDATE ---
    await student.update(updatedData);

    // Hilangkan password dari response agar aman
    const responseData = student.toJSON();
    responseData.role = 'siswa';
    delete responseData.password;

    // await invalidateStudentCache(student.schoolId);

    res.json({ success: true, message: 'Data siswa diperbarui', data: responseData });

  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Gagal update: Email, NIS, atau NISN sudah digunakan.' 
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { 
      name, nis, nisn, gender, birthPlace, birthDate, nik, address,
      schoolId, class: className, batch, 
      email, password, rfidUid // Ambil email & password dari req.body
    } = req.body;

    if (!name || !nis || !schoolId) {
      return res.status(400).json({ success: false, message: 'Name, NIS, dan SchoolId wajib diisi!' });
    }

    if (rfidUid && rfidUid.length < 5) {
      return res.status(400).json({
        success: false,
        message: "RFID tidak valid"
      });
    }

    if (rfidUid) {
      const existingRfid = await Student.findOne({
        where: { rfidUid, schoolId }
      });

      if (existingRfid) {
        return res.status(400).json({
          success: false,
          message: `RFID sudah digunakan`
        });
      }
    }

    const existing = await Student.findOne({ where: { nis, schoolId } });
    if (existing) {
      return res.status(400).json({ success: false, message: `NIS ${nis} sudah terdaftar` });
    }

    // --- Logika Default Email & Password ---
    const finalEmail = email || `${nis}@gmail.com`;
    const rawPassword = password || 'sekolah123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    // ---------------------------------------

    let photoUrl = null;
    if (req.file) {
      photoUrl = await processPhotoUpload(req.file.buffer, schoolId, nis);
    }

    const newStudent = await Student.create({
      name, 
      nis, 
      nisn, 
      gender, 
      address,
      birthPlace, 
      birthDate, 
      nik, 
      rfidUid,
      schoolId: parseInt(schoolId),
      email: finalEmail,      
      password: hashedPassword, 
      photoUrl,
      class: className, 
      batch,
      qrCodeData: `QR-${nis}-${Date.now()}`
    });

    // await invalidateStudentCache(parseInt(req.body.schoolId));   // ← TAMBAHAN
    res.json({ success: true, data: newStudent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.bulkCreateStudents = async (req, res) => {
  try {
    const { students, schoolId } = req.body;

    if (!schoolId || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Data tidak valid' });
    }

    const sId = parseInt(schoolId);
    const nisList  = students.map(s => s.nis).filter(Boolean);
    const rfidList = students.map(s => s.rfidUid).filter(Boolean);

    // ✅ Semua pre-check jalan paralel sekaligus
    const [existingStudents, existingRfids] = await Promise.all([
      Student.findAll({
        where: { nis: { [Op.in]: nisList }, schoolId: sId },
        attributes: ['nis', 'name'],
        raw: true
      }),
      rfidList.length > 0
        ? Student.findAll({
            where: { rfidUid: { [Op.in]: rfidList } },
            attributes: ['rfidUid', 'name'],
            raw: true
          })
        : Promise.resolve([])
    ]);

    const existingNisSet  = new Set(existingStudents.map(s => s.nis));
    const existingRfidSet = new Set(existingRfids.map(s => s.rfidUid));

    const duplicateNis  = existingStudents.map(s => ({ nis: s.nis, name: s.name }));
    const duplicateRfid = existingRfids.map(s => ({ rfidUid: s.rfidUid, name: s.name }));

    const validStudents = students.filter(s =>
      !existingNisSet.has(s.nis) &&
      (!s.rfidUid || !existingRfidSet.has(s.rfidUid))
    );

    if (validStudents.length === 0) {
      return res.json({
        success: true,
        summary: { total: students.length, berhasil: 0, dilewati: duplicateNis.length + duplicateRfid.length, gagal: 0 },
        detail: { berhasil: [], nisDuplikat: duplicateNis, rfidDuplikat: duplicateRfid, gagal: [] }
      });
    }

    // ✅ Bcrypt paralel dengan concurrency limit (jangan semua 1000 sekaligus)
    const BCRYPT_CONCURRENCY = 10;
    const preparedStudents = [];
    const failed = [];

    for (let i = 0; i < validStudents.length; i += BCRYPT_CONCURRENCY) {
      const chunk = validStudents.slice(i, i + BCRYPT_CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(async (s) => {
          const rawEmail   = s.email?.trim();
          const finalEmail = (rawEmail && rawEmail !== 'xxx@gmail.com')
            ? rawEmail
            : `${s.nis}@sekolah.sch.id`;

          const hashedPassword = await bcrypt.hash(s.password || 'sekolah123', 10);

          return {
            name:       s.name,
            nis:        s.nis,
            nisn:       s.nisn       || null,
            gender:     s.gender     || null,
            birthPlace: s.birthPlace || null,
            birthDate:  s.birthDate  || null,
            nik:        s.nik        || null,
            rfidUid:    s.rfidUid    || null,
            schoolId:   sId,
            email:      finalEmail,
            password:   hashedPassword,
            photoUrl:   null,
            address:    s.address    || null, // <--- TAMBAHKAN INI
            class:      s.class      || null,
            batch:      s.batch      || null,
            qrCodeData: `QR-${s.nis}-${Date.now()}`
          };
        })
      );

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          preparedStudents.push(result.value);
        } else {
          failed.push({ nis: chunk[idx].nis, name: chunk[idx].name, reason: 'Gagal memproses data' });
        }
      });
    }

    // ✅ bulkCreate dengan ignoreDuplicates sebagai safety net
    const created = [];
    const INSERT_CHUNK = 100; // insert 100 per query

    for (let i = 0; i < preparedStudents.length; i += INSERT_CHUNK) {
      const chunk = preparedStudents.slice(i, i + INSERT_CHUNK);
      try {
        const results = await Student.bulkCreate(chunk, {
          validate: true,
          returning: true, // ambil data yang berhasil dibuat
        });
        results.forEach(r => created.push({ nis: r.nis, name: r.name }));
      } catch (err) {
        // Kalau bulkCreate gagal, fallback create satu per satu untuk tahu mana yang error
        for (const s of chunk) {
          try {
            await Student.create(s);
            created.push({ nis: s.nis, name: s.name });
          } catch (innerErr) {
            let reason = innerErr.message;

            if (innerErr.name === 'SequelizeUniqueConstraintError') {
              const fieldLabels = {
                email:              'Email',
                nis:                'NIS',
                nisn:               'NISN',
                nik:                'NIK',
                rfidUid:            'RFID',
                unique_nisn_global: 'NISN',
                unique_nis_school:  'NIS',
                unique_email:       'Email',
              };
              const parts = innerErr.errors?.map(e => {
                const label = fieldLabels[e.path] || e.path;
                return `${label} "${e.value}" sudah digunakan`;
              }).join(', ');
              reason = parts || 'Data sudah terdaftar';

            } else if (innerErr.name === 'SequelizeValidationError') {
              const fieldLabels = {
                name:      'Nama',
                email:     'Email',
                nis:       'NIS',
                nisn:      'NISN',
                birthDate: 'Tanggal Lahir',
                gender:    'Gender',
              };
              const parts = innerErr.errors?.map(e => {
                const label = fieldLabels[e.path] || e.path;
                return `${label} tidak valid`;
              }).join(', ');
              reason = parts || 'Data tidak valid';

            } else if (innerErr.name === 'SequelizeDatabaseError') {
              reason = 'Gagal menyimpan ke database';
            }

            failed.push({ nis: s.nis, name: s.name, reason });
          }
        }
      }
    }

    // await invalidateStudentCache(sId);

    return res.json({
      success: true,
      summary: {
        total:    students.length,
        berhasil: created.length,
        dilewati: duplicateNis.length + duplicateRfid.length,
        gagal:    failed.length,
      },
      detail: {
        berhasil:     created,
        nisDuplikat:  duplicateNis,
        rfidDuplikat: duplicateRfid,
        gagal:        failed
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentSearch = async (req, res) => {
  try {
    const { schoolId, name } = req.query;
    console.log("Searching for:", name, "in schoolId:", schoolId);

    let condition = { 
      schoolId: parseInt(schoolId),
      // isActive: true // SEMENTARA MATIKAN INI untuk cek apakah data muncul
    };
    
    if (name) {
      // Gunakan [Op.like] untuk MySQL atau [Op.iLike] untuk PostgreSQL
      condition.name = { [Op.like]: `%${name}%` };
    }

    const students = await Student.findAll({
      where: condition,
      attributes: ['id', 'name', 'class', 'photoUrl'],
      limit: 10,
      raw: true
    });

    res.json({ success: true, data: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const { 
      schoolId, 
      page = 1, 
      limit = 10, 
      class: studentClass, 
      batch, 
      search,
      isDuplicateOnly
    } = req.query;

    if (!schoolId || isNaN(parseInt(schoolId))) {
      return res.status(400).json({ success: false, message: "schoolId diperlukan." });
    }

    const sId = parseInt(schoolId);
    let condition = { schoolId: sId, isActive: true };

    // --- 1. LOGIKA IDENTIFIKASI DUPLIKAT ---
    const dupNisRows = await Student.findAll({
      where: { schoolId: sId, isActive: true },
      attributes: ['nis'],
      group: ['nis'],
      having: sequelizeWhere(fn('COUNT', col('nis')), '>', 1),
      raw: true
    });

    const dupNisnRows = await Student.findAll({
      where: { isActive: true, nisn: { [Op.ne]: null } },
      attributes: ['nisn'],
      group: ['nisn'],
      having: sequelizeWhere(fn('COUNT', col('nisn')), '>', 1),
      raw: true
    });

    const duplicateNisList = dupNisRows.map(d => d.nis);
    const duplicateNisnList = dupNisnRows.map(d => d.nisn);

    // --- 2. PENYUSUNAN FILTER QUERY ---
    if (studentClass) condition.class = studentClass;
    if (batch) condition.batch = batch;

    const filters = [];

    // Filter search: nama atau NIS
    if (search) {
      filters.push({
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { nis:  { [Op.like]: `%${search}%` } },
        ]
      });
    }

    // Filter duplikat
    if (isDuplicateOnly === 'true') {
      filters.push({
        [Op.or]: [
          { nis:  { [Op.in]: duplicateNisList } },
          { nisn: { [Op.in]: duplicateNisnList } },
          { nis:  { [Op.like]: '%-DUP-%' } },
          { nisn: { [Op.like]: '%-DUP-%' } },
        ]
      });
    }

    if (filters.length > 0) {
      condition[Op.and] = filters;
    }

    const safeLimit = Math.min(parseInt(limit) || 10, 1000); // Max 1000

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // --- 3. QUERY UTAMA DATA SISWA ---
    const { count, rows } = await Student.findAndCountAll({
      where: condition,
      limit: safeLimit,
      offset: offset,
      order: [['name', 'ASC']],
      include: [{
        model: Attendance,
        as: 'studentAttendances',
        where: {
          createdAt: {
            [Op.between]: [
              moment().startOf('day').toDate(),
              moment().endOf('day').toDate()
            ]
          }
        },
        required: false
      }]
    });

    // --- 4. MAPPING DATA & FLAG DUPLIKAT ---
    const dataWithStatus = rows.map(s => {
      const student = s.toJSON();
      const attendanceToday = student.studentAttendances?.[0];
      
      student.statusKehadiran = attendanceToday ? attendanceToday.status : 'Belum Hadir';
      student.isNisDuplicate = duplicateNisList.includes(student.nis) || student.nis.includes('-DUP-');
      student.isNisnDuplicate = student.nisn 
        ? (duplicateNisnList.includes(student.nisn) || student.nisn.includes('-DUP-')) 
        : false;

      delete student.studentAttendances;
      return student;
    });

    // --- 5. KIRIM RESPONSE ---
    res.json({
      success: true,
      summary: {
        uniqueNisDuplicates: duplicateNisList.length,
        uniqueNisnDuplicates: duplicateNisnList.length,
        hasIssues: duplicateNisList.length > 0 || duplicateNisnList.length > 0
      },
      data: dataWithStatus,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Siswa tidak ditemukan'
      });
    }

    const data = student.toJSON();
    delete data.password; // keamanan

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getAllStudentsNoPagination = async (req, res) => {
  try {
    const { schoolId, class: studentClass, batch, name } = req.query;

    if (!schoolId || isNaN(parseInt(schoolId))) {
      return res.status(400).json({ success: false, message: "schoolId diperlukan." });
    }

    // Bangun kondisi filter yang sama agar hasil cetak sesuai dengan filter di UI
    let condition = {
      schoolId: parseInt(schoolId),
      isActive: true
    };

    if (name) condition.name = { [Op.like]: `%${name}%` };
    if (studentClass) condition.class = studentClass;
    if (batch) condition.batch = batch;

    // Ambil semua data tanpa limit & offset
    const students = await Student.findAll({
      where: condition,
      order: [['name', 'ASC']],
      // Kita hanya ambil kolom yang diperlukan untuk kartu agar hemat memory
      attributes: ['id', 'name', 'nis', 'nisn', 'class', 'rfidUid', 'photoUrl', 'qrCodeData']
    });

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    console.error("Error Get All Students for Card:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "schoolId diperlukan." });
    }

    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    // 1. Ambil Total Keseluruhan (Master Data)
    const totalSiswaTerdaftar = await Student.count({ 
      where: { schoolId: parseInt(schoolId), isActive: true } 
    });
    const totalGuruTerdaftar = await GuruTendik.count({ 
      where: { schoolId: parseInt(schoolId), isActive: true } 
    });

    // 2. Ambil Statistik Kehadiran Siswa
    const studentStats = await Attendance.findAll({
      where: {
        schoolId: parseInt(schoolId),
        userRole: 'student',
        createdAt: { [Op.between]: [todayStart, todayEnd] }
      },
      attributes: ['status', [fn('COUNT', col('id')), 'total']],
      group: ['status'],
      raw: true
    });

    // 3. Ambil Statistik Kehadiran Guru
    const guruStats = await Attendance.findAll({
      where: {
        schoolId: parseInt(schoolId),
        userRole: 'teacher',
        createdAt: { [Op.between]: [todayStart, todayEnd] }
      },
      attributes: ['status', [fn('COUNT', col('id')), 'total']],
      group: ['status'],
      raw: true
    });

    // Helper untuk memetakan hasil query ke objek status
    const formatStats = (stats) => {
      const summary = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
      let totalSudahAbsen = 0;

      stats.forEach(item => {
        // raw: true → item sudah plain object, tidak perlu .toJSON()
        if (summary.hasOwnProperty(item.status)) {
          summary[item.status] = parseInt(item.total);
        }
        totalSudahAbsen += parseInt(item.total);
      });

      return { summary, totalSudahAbsen };
    };

    const formattedStudent = formatStats(studentStats);
    const formattedGuru = formatStats(guruStats);

    res.json({
      success: true,
      date: moment().format('YYYY-MM-DD'),
      data: {
        siswa: {
          totalSiswa: totalSiswaTerdaftar,
          sudahAbsen: formattedStudent.totalSudahAbsen,
          belumAbsen: totalSiswaTerdaftar - formattedStudent.totalSudahAbsen,
          rincian: formattedStudent.summary
        },
        guru: {
          totalGuru: totalGuruTerdaftar,
          sudahAbsen: formattedGuru.totalSudahAbsen,
          belumAbsen: totalGuruTerdaftar - formattedGuru.totalSudahAbsen,
          rincian: formattedGuru.summary
        }
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllTeachers = async (req, res) => {
  try {
    const { schoolId, page = 1, limit = 10, nama, nip, role } = req.query;
    
    // Validasi schoolId
    if (!schoolId || isNaN(parseInt(schoolId))) {
      return res.status(400).json({ success: false, message: "schoolId diperlukan." });
    }

    // 1. Membangun Kondisi Filter
    let condition = { 
      schoolId: parseInt(schoolId), 
      isActive: true 
    };
    
    // Filter pencarian berdasarkan nama (Op.like)
    if (nama) condition.nama = { [Op.like]: `%${nama}%` };
    // Filter berdasarkan NIP
    if (nip) condition.nip = { [Op.like]: `%${nip}%` };
    // Filter berdasarkan Role (Guru/Staff/Admin)
    if (role) condition.role = role;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 2. Fetch Data dengan Eager Loading Attendance hari ini
    const { count, rows } = await GuruTendik.findAndCountAll({
      where: condition,
      limit: parseInt(limit),
      offset: offset,
      order: [['nama', 'ASC']],
      include: [{
        model: Attendance,
        as: 'guruAttendances', // Pastikan alias ini sama dengan di Model Guru
        where: {
          createdAt: {
            [Op.between]: [
              moment().startOf('day').toDate(), 
              moment().endOf('day').toDate()
            ]
          }
        },
        required: false // Agar guru tetap muncul meskipun belum scan absen harian
      }]
    });

    // 3. Mapping Data & Status Kehadiran
    const dataWithStatus = rows.map(g => {
      const teacher = g.toJSON();
      
      // Ambil data absen pertama yang ditemukan untuk hari ini
      const attendanceToday = teacher.guruAttendances?.[0]; 
      
      // Tentukan status kehadiran (Hadir/Izin/Sakit/Alpha/Belum Hadir)
      teacher.statusKehadiran = attendanceToday ? attendanceToday.status : 'Belum Hadir';
      
      // Optional: Sertakan waktu scan jika sudah hadir
      teacher.scanTime = attendanceToday ? moment(attendanceToday.createdAt).format("HH:mm:ss") : null;

      return teacher;
    });

    // 4. Response JSON
    res.json({
      success: true,
      data: dataWithStatus,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    console.error("Error Get Teachers:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, year, page = 1, limit = 10 } = req.query;

    // Validasi role
    if (!role || !['student', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role harus 'student' atau 'teacher'."
      });
    }

    const isStudent = role === 'student';
    const Model = isStudent ? Student : GuruTendik;
    const attendanceAlias = isStudent ? 'studentAttendances' : 'guruAttendances';

    // Validasi & set tahun
    if (year && !/^\d{4}$/.test(year)) {
      return res.status(400).json({
        success: false,
        message: "Format tahun tidak valid, gunakan YYYY (contoh: 2025)"
      });
    }

    // Tentukan rentang tanggal
   const startDate = year 
      ? moment(`${year}-01-01`).startOf('year').toDate() 
      : moment().subtract(1, 'years').toDate();
    const endDate = year 
      ? moment(`${year}-12-31`).endOf('year').toDate() 
      : moment().endOf('day').toDate();

    // Opsi include
    let includeOptions = [
      {
        model: Attendance,
        as: attendanceAlias,
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        required: false,
        attributes: ['id', 'status', 'createdAt', 'checkOutAt'] // hanya yang dibutuhkan
      }
    ];

    // Tambahkan relasi orang tua hanya untuk siswa
    if (isStudent) {
      includeOptions.push({
        model: Parent,
        as: 'parent',
        attributes: ['id', 'name', 'gender', 'relationStatus', 'phoneNumber', 'type'],
        required: false
      });
    }

    // Tentukan kolom secara dinamis
    const selectedAttributes = isStudent 
      ? ['id', 'name', 'nis', 'nisn', 'class', 'batch', 'photoUrl', 'gender', 'qrCodeData']
      : ['id', ['nama', 'name'], 'nip', 'email', 'mapel', 'jurusan', 'photoUrl', ['jenisKelamin', 'gender'], 'qrCodeData'];
      
    const user = await Model.findOne({
      where: { id, isActive: true },
      attributes: selectedAttributes,
      include: includeOptions
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Data ${role} dengan ID ${id} tidak ditemukan atau tidak aktif`
      });
    }

  // 1. Ambil Profil & Statistik (Tanpa limit untuk hitung total stats)
    const userWithAllAttendance = await Model.findOne({
      where: { id, isActive: true },
      include: [{
        model: Attendance,
        as: attendanceAlias,
        where: { createdAt: { [Op.between]: [startDate, endDate] } },
        required: false
      }]
    });

    if (!userWithAllAttendance) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    // 2. Hitung Statistik (Logic tetap sama)
    const stats = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Terlambat: 0 };
    const deadline = "07:00:00";
    const allRecords = userWithAllAttendance[attendanceAlias] || [];
    
    allRecords.forEach(record => {
      const scanTime = moment(record.createdAt).format("HH:mm:ss");
      if (record.status === 'Hadir' && scanTime > deadline) stats.Terlambat++;
      if (stats.hasOwnProperty(record.status)) stats[record.status]++;
    });

    // 3. Query Terpisah untuk Riwayat (Dengan Pagination)
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Kita ambil datanya langsung dari model Attendance agar pagination lebih akurat
    const { count, rows } = await Attendance.findAndCountAll({
      where: {
        // Sesuaikan foreign key berdasarkan role
        [isStudent ? 'studentId' : 'guruId']: id, 
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const history = rows.map(record => {
      const scanTime = moment(record.createdAt).format("HH:mm:ss");
      return {
        id: record.id,
        date: moment(record.createdAt).format('YYYY-MM-DD'),
        time: scanTime,
        status: record.status,
        isLate: record.status === 'Hadir' && scanTime > deadline,
        info: isStudent ? record.currentClass : 'GURU/STAFF'
      };
    });

    // 4. Siapkan response
    const profile = user.toJSON();
    delete profile[attendanceAlias]; // hapus array attendance dari profil

    return res.json({
      success: true,
      data: {
        role,
        profile,
        statistics: stats,
        attendanceHistory: history,
        pagination: {
          totalItems: count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (err) {
    console.error('[getUserDetail] Error:', err);
    return res.status(500).json({
      success: false,
      message: `Terjadi kesalahan server: ${err.message}`,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.exportUserAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, year } = req.query;

    if (!role) return res.status(400).json({ success: false, message: "Role diperlukan." });

    const isStudent = role === 'student';
    const deadline = "07:00:00";

    // Konfigurasi Waktu (Sama dengan logika utama)
    const startDate = year 
      ? moment(`${year}-01-01`).startOf('year').toDate() 
      : moment().subtract(1, 'years').toDate();
    const endDate = year 
      ? moment(`${year}-12-31`).endOf('year').toDate() 
      : moment().endOf('day').toDate();

    // Ambil SEMUA data tanpa pagination
    const rows = await Attendance.findAll({
      where: {
        [isStudent ? 'studentId' : 'guruId']: id, 
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      order: [['createdAt', 'DESC']],
      raw: true
    });

    // Mapping data agar siap dibaca Excel
    const history = rows.map((record, index) => {
      const scanTime = moment(record.createdAt).format("HH:mm:ss");
      return {
        No: index + 1,
        Tanggal: moment(record.createdAt).format('YYYY-MM-DD'),
        Jam: scanTime,
        Status: record.status,
        Keterangan: (record.status === 'Hadir' && scanTime > deadline) ? 'Terlambat' : 'Tepat Waktu',
        Info: isStudent ? record.currentClass : 'GURU/STAFF'
      };
    });

    res.json({
      success: true,
      data: history
    });

  } catch (err) {
    console.error("Error Export Data:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Fungsi Helper Haversine (Gratis & Akurat)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Hasil dalam meter
}

// SCAN YANG ASLI TANPA KOORDINAT (PROD)
exports.scanQRCode = async (req, res) => {
  // role: 'student' atau 'teacher'
  const { qrCodeData, role } = req.body; 
  const todayStart = moment().startOf('day').toDate();
  const todayEnd = moment().endOf('day').toDate();

  const t = await sequelize.transaction();

  try {
    let user;
    let updateFields = { schoolId: null, id: null, name: null, class: null, nisn: null, email: null };

    if (role === 'student') {
      user = await Student.findOne({ where: { qrCodeData, isActive: true } });
      if (user) {
        updateFields = { idKey: 'studentId', id: user.id, name: user.name, class: user.class, schoolId: user.schoolId, nisn: user.nisn };
      }
    } else {
      // Untuk Guru, asumsikan qrCodeData disimpan di field tertentu atau pakai ID
      user = await GuruTendik.findOne({ where: { qrCodeData, isActive: true } }); 
      if (user) {
        updateFields = { idKey: 'guruId', id: user.id, name: user.nama, class: 'GURU/STAFF', schoolId: user.schoolId, email: user.email };
      }
    }

    if (!user) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const alreadyExists = await Attendance.findOne({
      where: { 
        [updateFields.idKey]: updateFields.id, 
        createdAt: { [Op.between]: [todayStart, todayEnd] } 
      },
      transaction: t,
      lock: true 
    });

    if (alreadyExists) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'sudah absen.' });
    }

    // Simpan
    await Attendance.create({ 
      [updateFields.idKey]: updateFields.id,
      userRole: role,
      schoolId: updateFields.schoolId, 
      currentClass: updateFields.class,
      status: 'Hadir'
    }, { transaction: t });

    await t.commit();

    // await invalidateStudentCache(updateFields.schoolId);

     res.json({ 
      success: true, 
      message: `Absen berhasil: ${updateFields.name}`,
      data: {  // Tambahkan objek data ini
        name: updateFields.name,
        nisn: updateFields.nisn || updateFields.email, // Sesuaikan field yang ada
        class: updateFields.class
      }
    });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- DELETE SISWA (Soft Delete) ---
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }

    // Opsi A: Hard Delete (Hapus permanen)
    // await student.destroy(); 

    // Opsi B: Soft Delete (Hanya nonaktifkan) -> Lebih aman untuk history absen
    student.isActive = false;
    await student.save();

    // await invalidateStudentCache(student.schoolId);
    res.json({ success: true, message: 'Siswa berhasil dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Hard delete semua siswa by batch
exports.deleteStudentsByBatch = async (req, res) => {
  try {
    const { schoolId, batch } = req.body;

    if (!schoolId || !batch) {
      return res.status(400).json({ success: false, message: 'schoolId dan batch wajib diisi' });
    }

    const count = await Student.destroy({
      where: { schoolId: parseInt(schoolId), batch }
    });

    // await invalidateStudentCache(parseInt(schoolId));
    res.json({ success: true, message: `${count} siswa angkatan ${batch} berhasil dihapus permanen` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Hard delete semua siswa satu sekolah
exports.deleteAllStudents = async (req, res) => {
  try {
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
    }

    const count = await Student.destroy({
      where: { schoolId: parseInt(schoolId) }
    });

    // await invalidateStudentCache(parseInt(schoolId));
    res.json({ success: true, message: `${count} siswa berhasil dihapus permanen` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTodayStats = async (req, res) => {
  try {
    const { schoolId, role = 'student' } = req.query;

    const isStudent = role === 'student';
    const MainModel = isStudent ? Attendance : KehadiranGuru;

    const attendanceData = await MainModel.findAll({
      where: {
        schoolId: parseInt(schoolId),
        ...(isStudent && { userRole: role }),
        createdAt: {
          [Op.between]: [
            moment().startOf('day').toDate(), 
            moment().endOf('day').toDate()
          ]
        }
      },
      attributes: ['status', 'createdAt', 'checkOutAt'], // ← Tambahkan checkOutAt
      raw: true 
    });

    const summary = { 
      Hadir: 0, 
      Terlambat: 0, 
      Izin: 0, 
      Sakit: 0, 
      Alpha: 0,
      Pulang: 0   // ← BARU
    };

    const deadline = "07:00:00";

    attendanceData.forEach(item => {
      const hasCheckedOut = !!item.checkOutAt; // Sudah pulang jika ada checkOutAt

      if (item.status === 'Hadir') {
        const scanTime = moment(item.createdAt).format("HH:mm:ss");

        if (scanTime > deadline) {
          summary.Terlambat += 1;
        } else {
          summary.Hadir += 1;
        }
      } else {
        if (summary.hasOwnProperty(item.status)) {
          summary[item.status] += 1;
        }
      }

      // Hitung yang sudah pulang (hanya untuk siswa)
      if (isStudent && hasCheckedOut) {
        summary.Pulang += 1;
      }
    });

    res.json({ 
      success: true, 
      data: { 
        role,
        date: moment().format('YYYY-MM-DD'),
        deadlineInfo: deadline,
        ...summary 
      } 
    });

  } catch (err) {
    console.error(`[getTodayStats] Error:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const { schoolId, role, year, month, date, page = 1, limit = 50 } = req.query;

    let startDate, endDate;

    // 1. Tentukan Rentang Waktu
    if (date) {
      startDate = moment(date).startOf('day').toDate();
      endDate = moment(date).endOf('day').toDate();
    } else {
      startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
      endDate = moment(startDate).endOf('month').toDate();
    }

    // 2. Tentukan Model dan Include secara dinamis berdasarkan Role
    const isStudent = role === 'student';
    
    // ModelUtama: Jika student pakai 'Attendance', jika teacher pakai 'KehadiranGuru'
    const MainModel = isStudent ? Attendance : KehadiranGuru;
    
    const includeOptions = [
      {
        model: isStudent ? Student : GuruTendik,
        as: isStudent ? 'student' : 'guru',
        attributes: isStudent 
          ? ['name', 'nis'] 
          : [['nama', 'name'], 'role', 'mapel'] // Alias 'nama' jadi 'name' agar frontend konsisten
      }
    ];

    // 3. Eksekusi Query
    const { count, rows } = await MainModel.findAndCountAll({
      where: {
        schoolId,
        // Jika di tabel KehadiranGuru tidak ada kolom userRole, 
        // kita hanya masukkan filter ini untuk tabel Attendance (siswa)
        ...(isStudent && { userRole: role }),
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      include: includeOptions,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
      raw: false 
    });

    const deadline = "07:00:00";

    const processedRows = rows.map(record => {
      const attendance = record.toJSON();
      
      const createdAtMoment = moment(attendance.createdAt);
      const scanTime = createdAtMoment.format("HH:mm:ss");
      
      const isLate = attendance.status === 'Hadir' && scanTime > deadline;
      
      let lateDuration = "0 Menit";
      if (isLate) {
        const diffInMinutes = createdAtMoment.diff(
          moment(createdAtMoment).set({ hour: 7, minute: 0, second: 0 }), 
          'minutes'
        );
        lateDuration = `${diffInMinutes} Menit`;
      }

      // === TAMBAHAN BARU UNTUK STATUS "PULANG" ===
      let displayStatus = attendance.status;
      let isPulang = false;

      // Jika ada checkOutAt → berarti sudah pulang
      if (attendance.checkOutAt) {
        isPulang = true;
        displayStatus = "Pulang";
      }

      const userData = isStudent ? attendance.student : attendance.guru;

      return {
        ...attendance,
        name: userData?.name || userData?.nama || '-',
        identifier: isStudent ? userData?.nis : userData?.role,
        isLate: isLate,
        scanTime: scanTime,
        lateDuration: lateDuration,
        
        // Field baru untuk frontend
        isPulang: isPulang,
        displayStatus: displayStatus   // ← ini yang akan ditampilkan di badge
      };
    });

    res.json({ 
      success: true, 
      data: processedRows, 
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    console.error("Error Report:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.exportAttendanceExcel = async (req, res) => {
  try {
    // Ambil userRole dari query (default ke student jika tidak ada)
    const { schoolId, year, month, className, role } = req.query;
    const userRole = role || 'student'; 

    if (!schoolId || schoolId === 'undefined' || isNaN(parseInt(schoolId))) {
      return res.status(400).json({
        success: false,
        message: "Parameter 'schoolId' diperlukan."
      });
    }

    let startDate, endDate, fileName;
    const roleLabel = userRole === 'teacher' ? 'Guru' : 'Siswa';

    if (month) {
      startDate = moment(`${year}-${month}-01`).startOf('month');
      endDate = moment(startDate).endOf('month');
      fileName = `Laporan_Absen_${roleLabel}_${month}_${year}.xlsx`;
    } else {
      startDate = moment(`${year}-01-01`).startOf('year');
      endDate = moment(startDate).endOf('year');
      fileName = `Laporan_Absen_${roleLabel}_Tahun_${year}.xlsx`;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
      useSharedStrings: true
    });
    
    const worksheet = workbook.addWorksheet('Presensi');

    // Kolom Dinamis berdasarkan Role
    const columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Waktu', key: 'waktu', width: 10 },
      { header: roleLabel, key: 'nama', width: 30 }, // Header jadi "Siswa" atau "Guru"
    ];

    if (userRole === 'student') {
      columns.push({ header: 'NIS', key: 'identitas', width: 15 });
      columns.push({ header: 'Kelas', key: 'info_tambahan', width: 15 });
    } else {
      columns.push({ header: 'Jabatan/Role', key: 'identitas', width: 15 });
      columns.push({ header: 'Mapel', key: 'info_tambahan', width: 15 });
    }

    columns.push({ header: 'Status', key: 'status', width: 12 });
    worksheet.columns = columns;

    let count = 1;
    const batchSize = 1000;
    let offset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      const attendances = await Attendance.findAll({
        where: {
          userRole: userRole, // Filter berdasarkan role yang diminta
          createdAt: { [Op.between]: [startDate.toDate(), endDate.toDate()] },
          ...(userRole === 'student' && className && { currentClass: className })
        },
        include: [
          userRole === 'student' 
          ? {
              model: Student,
              as: 'student',
              where: { schoolId: parseInt(schoolId) },
              attributes: ['name', 'nis']
            }
          : {
              model: GuruTendik, // Pastikan nama model Guru Anda benar
              as: 'guru',   // Sesuaikan alias di asosiasi model Anda
              where: { schoolId: parseInt(schoolId) },
              attributes: ['nama', 'role', 'mapel']
            }
        ],
        limit: batchSize,
        offset: offset,
        order: [['createdAt', 'ASC']],
        raw: true,
        nest: true
      });

      if (attendances.length === 0) {
        hasMoreData = false;
      } else {
        attendances.forEach(item => {
          const person = userRole === 'student' ? item.student : item.guru;
          
          worksheet.addRow({
            no: count++,
            tanggal: moment(item.createdAt).format('YYYY-MM-DD'),
            waktu: moment(item.createdAt).format('HH:mm'),
            nama: userRole === 'student' ? (person?.name || '-') : (person?.nama || '-'),
            identitas: userRole === 'student' ? person?.nis : (person?.role || 'Guru/Staff'),
            info_tambahan: userRole === 'student' ? item.currentClass : (person?.mapel || '-'),
            status: item?.isLate ? 'Terlambat' : item.status
          }).commit();
        });
        offset += batchSize;
      }
    }

    await workbook.commit();

  } catch (err) {
    console.error('Export Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Gagal men-generate excel: ' + err.message });
    }
  }
};

exports.markAbsence = async (req, res) => {
  try {
    let data = req.body;
    if (!Array.isArray(data)) data = [data];

    if (data.length === 0) {
      return res.status(400).json({ success: false, message: "Data kosong." });
    }

    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const operations = data.map(async (item) => {
      // Ambil guruId, studentId, dan userRole dari body
      const { studentId, guruId, schoolId, status, currentClass, userRole } = item;

      // 1. Tentukan kondisi pencarian (Cari berdasarkan ID yang ada)
      let searchCondition = {
        schoolId,
        createdAt: { [Op.between]: [startOfDay, endOfDay] }
      };

      if (userRole === 'teacher' || guruId) {
        searchCondition.guruId = guruId;
        searchCondition.userRole = 'teacher';
      } else {
        searchCondition.studentId = studentId;
        searchCondition.userRole = 'student';
      }

      // 2. Cari data existing
      const existing = await Attendance.findOne({ where: searchCondition });

      if (existing) {
        // Update data jika sudah ada
        return existing.update({ 
          status, 
          currentClass: userRole === 'student' ? currentClass : null // Guru biasanya tidak punya currentClass
        });
      } else {
        // Buat data baru jika belum ada
        return Attendance.create({
          studentId: userRole === 'student' ? studentId : null,
          guruId: (userRole === 'teacher' || guruId) ? guruId : null,
          schoolId,
          status,
          userRole: userRole || (guruId ? 'teacher' : 'student'),
          currentClass: userRole === 'student' ? currentClass : null
        });
      }
    });

    const records = await Promise.all(operations);
    // await invalidateStudentCache(schoolId);

    res.json({
      success: true,
      message: `Berhasil memproses ${records.length} data absensi (Guru/Siswa).`,
      data: records
    });
  } catch (err) {
    console.error("Error markAbsence:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEarlyWarningReport = async (req, res) => {
    try {
        const { schoolId } = req.query;
        const deadline = "07:00:00";
        const oneWeekAgo = moment().subtract(7, 'days').startOf('day').toDate();

        // 1. TIDAK MASUK > 3 HARI (Status 'Alpha') dalam 7 hari terakhir
        const chronicAbsents = await Attendance.findAll({
            where: {
                schoolId,
                userRole: 'student',
                status: 'Alpha',
                createdAt: { [Op.gte]: oneWeekAgo }
            },
            attributes: ['studentId', [fn('COUNT', col('studentId')), 'totalAlpa']],
            include: [{ model: Student, as: 'student', attributes: ['name', 'class', 'nis'] }],
            group: ['studentId', 'student.id'],
            having: literal('totalAlpa >= 3'),
            raw: false
        });

        // 2. TERLAMBAT > 3x (Status 'Hadir' tapi jam > 07:00) dalam 7 hari terakhir
        const habitualLaters = await Attendance.findAll({
            where: {
                schoolId,
                userRole: 'student',
                status: 'Hadir',
                createdAt: { 
                    [Op.gte]: oneWeekAgo,
                    [Op.and]: [literal(`TIME(Attendance.createdAt) > "${deadline}"`)]
                }
            },
            attributes: ['studentId', [fn('COUNT', col('studentId')), 'totalLate']],
            include: [{ model: Student, as: 'student', attributes: ['name', 'class'] }],
            group: ['studentId', 'student.id'],
            having: literal('totalLate >= 3'),
            raw: false
        });

        // 3. EXTREMES HARI INI (Paling Pagi vs Paling Telat)
        const todayAttendance = await Attendance.findAll({
            where: {
                schoolId,
                userRole: 'student',
                status: 'Hadir',
                createdAt: {
                    [Op.between]: [moment().startOf('day').toDate(), moment().endOf('day').toDate()]
                }
            },
            include: [{ model: Student, as: 'student', attributes: ['name', 'class'] }],
            order: [['createdAt', 'ASC']] 
        });

        res.json({
            success: true,
            warnings: {
                unexcusedAbsence: chronicAbsents,
                habitualLaters: habitualLaters,
            },
            todayExtremes: {
                earliest: todayAttendance[0] || null,
                latest: todayAttendance[todayAttendance.length - 1] || null
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPublicHallOfFame = async (req, res) => {
    try {
        const { schoolId } = req.query;

        // Karena DB Anda menyimpan waktu lokal (WIB), 
        // pastikan startOfDay dan endOfDay juga dalam konteks lokal server.
        const startOfDay = moment().startOf('day').toDate();
        const endOfDay = moment().endOf('day').toDate();
        const startOfMonth = moment().startOf('month').toDate();

        // 1. TOP 10 DATANG PALING AWAL HARI INI
        const top10Today = await Attendance.findAll({
            where: {
                schoolId,
                userRole: 'student',
                status: 'Hadir',
                createdAt: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            },
            include: [{ 
                model: Student, 
                as: 'student', 
                attributes: ['name', 'class'] 
            }],
            limit: 10,
            order: [['createdAt', 'ASC']]
        });

        // 2. TOP 5 KONSISTENSI (Bulanan)
        const deadline = "07:00:00";
        const top5Monthly = await Attendance.findAll({
            where: {
                schoolId,
                userRole: 'student',
                status: 'Hadir',
                createdAt: { [Op.gte]: startOfMonth },
                // Gunakan Attendance.createdAt untuk menghindari Ambiguous Error
                [Op.and]: [
                    literal(`TIME(Attendance.createdAt) <= "${deadline}"`)
                ]
            },
            attributes: [
                'studentId', 
                [fn('COUNT', col('studentId')), 'ontimeCount']
            ],
            include: [{ 
                model: Student, 
                as: 'student', 
                attributes: ['name', 'class'] 
            }],
            group: ['studentId', 'student.id', 'student.name', 'student.class'],
            order: [[literal('ontimeCount'), 'DESC']],
            limit: 5
        });

        res.json({
            success: true,
            data: {
                dailyEarlyBirds: top10Today.map(t => ({
                    name: t.student?.name || "Siswa",
                    class: t.student?.class || "-",
                    // JANGAN gunakan .utc() atau .tz() jika value DB sudah 13:24
                    // Cukup format jam:menit saja
                    time: moment(t.createdAt)
                })),
                monthlyChampions: top5Monthly.map(m => ({
                    name: m.student?.name || "Siswa",
                    class: m.student?.class || "-",
                    totalOnTime: parseInt(m.get('ontimeCount'))
                }))
            }
        });
    } catch (err) {
        console.error("Error Hall of Fame:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 1. Cek Kelulusan (Untuk Siswa/Orang Tua)
exports.processGraduation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { studentIds, graduationYear, batch, description, schoolId } = req.body;

    // --- VALIDASI INPUT ---
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "Pilih minimal satu siswa." });
    }

    if (!batch) {
      return res.status(400).json({ success: false, message: "Nama Angkatan (Batch) wajib diisi." });
    }

    if (!graduationYear || !schoolId) {
      return res.status(400).json({ success: false, message: "Tahun lulus dan School ID wajib diisi." });
    }
    const idsToFind = studentIds.map(item => (typeof item === 'object' ? item.id : item));

    const selectedStudents = await Student.findAll({
      where: { 
        id: { [Op.in]: idsToFind },
        schoolId: parseInt(schoolId)
      }
    });

    if (selectedStudents.length === 0) {
      return res.status(404).json({ success: false, message: "Data siswa tidak ditemukan di database." });
    }

    // 2. PEMETAAN DATA KE TABEL ALUMNI (Tambahkan NIS di sini)
    const alumniData = selectedStudents.map(student => ({
      schoolId: student.schoolId,
      name: student.name,
      nis: student.nis, // <--- KRUSIAL: Memindahkan NIS dari tabel Student ke Alumni
      graduationYear: parseInt(graduationYear),
      batch: batch, 
      description: description || `Alumni angkatan ${batch}`,
      photoUrl: student.photoUrl,
      isActive: true,
      isVerified: true 
    }));

    await Alumni.bulkCreate(alumniData, { transaction: t });

    await Student.update(
      { isActive: false }, 
      { 
        where: { id: { [Op.in]: idsToFind } },
        transaction: t 
      }
    );

    // SELESAIKAN TRANSAKSI
    await t.commit();

    // await invalidateStudentCache(parseInt(req.body.schoolId));

    res.json({ 
      success: true, 
      message: `Berhasil: ${selectedStudents.length} siswa tahun lulus ${graduationYear} dengan angkatan ${batch}.` 
    });

  } catch (err) {
    // BATALKAN SEMUA PERUBAHAN JIKA TERJADI ERROR
    if (t) await t.rollback();
    
    console.error("Graduation Error Detail:", err);

    // Penanganan error khusus jika NIS duplikat di tabel Alumni
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: "Beberapa siswa dengan NIS tersebut sudah terdaftar sebagai alumni." 
      });
    }

    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message });
  }
};

exports.getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.userRole;
    const { year } = req.query;

    // 1. Rentang Waktu
    const startDate = year 
      ? moment(`${year}-01-01`).startOf('year').toDate() 
      : moment().startOf('month').toDate();
    const endDate = moment().endOf('day').toDate();

    let attendanceRecords;
    const deadline = "07:00:00";

    // 2. Query Berdasarkan Role
    if (role === 'siswa') {
      attendanceRecords = await Attendance.findAll({
        where: {
          studentId: userId,
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        order: [['createdAt', 'DESC']]
      });
    } else {
      // Role Guru/Tendik
      attendanceRecords = await KehadiranGuru.findAll({
        where: {
          guruId: userId,
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        order: [['createdAt', 'DESC']]
      });
    }

    // 3. Mapping Data untuk Frontend
    const history = attendanceRecords.map(record => {
      const scanTime = moment(record.createdAt).format("HH:mm:ss");
      return {
        date: moment(record.createdAt).format('DD MMM YYYY'),
        time: scanTime,
        status: record.status || 'Hadir',
        isLate: record.status === 'Hadir' && scanTime > deadline
      };
    });

    res.json({
      success: true,
      data: history
    });

  } catch (err) {
    console.error("Fetch Attendance Error:", err.message);
    res.status(500).json({ success: false, message: 'Gagal memuat riwayat' });
  }
};

// Route: GET /orang-tua/:parentId/anak
exports.getParentChildren = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { schoolId } = req.query; // opsional, untuk filter

    const parent = await Parent.findByPk(parentId);
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Orang tua tidak ditemukan' });
    }

    // Asumsi ada relasi di model (Parent.hasMany(Student, { as: 'children', foreignKey: 'parentId' }))
    // Jika belum ada relasi, gunakan query manual:

    const children = await Student.findAll({
      where: { 
        schoolId: parent.schoolId,
        // Jika kamu punya kolom parentId di tabel siswa:
        parentId: parentId 
      },
      attributes: [
        'id', 'name', 'nis', 'nisn', 'nik', 'gender', 
        'birthPlace', 'birthDate', 'class', 'batch', 'photoUrl', 'isActive'
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: children
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// exports.getClassRecapWithDetails = async (req, res) => {
//   try {
//     const { schoolId, date } = req.query;

//      // pastikan sudah di-install
//     const targetDate = date 
//       ? moment2.tz(date, 'Asia/Jakarta') 
//       : moment2().tz('Asia/Jakarta');

//     // Rentang tanggal dalam WIB (format string yang aman untuk MySQL)
//     const startDate = targetDate.clone().startOf('day').format('YYYY-MM-DD HH:mm:ss');
//     const endDate   = targetDate.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss');

//     const deadline = "07:00:00";

//     // Query utama
//     const allStudents = await Student.findAll({
//       where: { 
//         schoolId: parseInt(schoolId), 
//         isActive: true, 
//         isGraduated: false 
//       },
//       attributes: ['id', 'name', 'nis', 'class', 'photoUrl'],
//       include: [{
//         model: Attendance,
//         as: 'studentAttendances',
//         where: {
//           createdAt: { [Op.between]: [startDate, endDate] },
//           userRole: 'student'
//         },
//         attributes: ['status', 'createdAt'],
//         required: false,
//         limit: 1,                     // Hanya ambil 1 record
//         order: [['createdAt', 'ASC']] // Paling awal (scan pertama hari itu)
//       }],
//       raw: false,
//     });

//     let totalAllStudents = 0;
//     let totalAllHadir = 0;
//     let totalAllBelumHadir = 0;

//     const acc = new Map();

//     for (const student of allStudents) {
//       const className = student.class || "Tanpa Kelas";

//       if (!acc.has(className)) {
//         acc.set(className, {
//           className,
//           totalStudents: 0,
//           stats: { onTime: 0, late: 0, izin: 0, sakit: 0, alpha: 0, belumHadir: 0 },
//           students: []
//         });
//       }

//       const classObj = acc.get(className);
//       const attendance = student.studentAttendances?.[0];

//       let statusInfo = "Belum Hadir";
//       let isLate = false;
//       let scanTime = null;

//       totalAllStudents++;

//       if (attendance) {
//         scanTime = moment2(attendance.createdAt).tz('Asia/Jakarta').format("HH:mm:ss");

//         if (attendance.status === 'Hadir') {
//           totalAllHadir++;

//           if (scanTime <= deadline) {
//             classObj.stats.onTime++;
//             statusInfo = "Tepat Waktu";
//           } else {
//             classObj.stats.late++;
//             statusInfo = "Telat";
//             isLate = true;
//           }
//         } else {
//           const statusKey = attendance.status.toLowerCase();
//           if (classObj.stats[statusKey] !== undefined) {
//             classObj.stats[statusKey]++;
//           }
//           statusInfo = attendance.status;
//         }
//       } else {
//         classObj.stats.belumHadir++;
//         totalAllBelumHadir++;
//       }

//       classObj.totalStudents++;
//       classObj.students.push({
//         id: student.id,
//         name: student.name,
//         nis: student.nis,
//         status: statusInfo,
//         scanTime,
//         isLate,
//         photoUrl: student.photoUrl
//       });
//     }

//     res.json({
//       success: true,
//       summary: { 
//         totalAllStudents, 
//         totalAllHadir, 
//         totalAllBelumHadir,
//         date: targetDate.format('YYYY-MM-DD')
//       },
//       data: Array.from(acc.values()).sort((a, b) => a.className.localeCompare(b.className))
//     });

//   } catch (err) {
//     console.error('[getClassRecapWithDetails] Error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.getClassRecapWithDetails = async (req, res) => {
//   try {
//     const { schoolId, date } = req.query;

//     const targetDate = date 
//       ? moment.tz(date, 'Asia/Jakarta') 
//       : moment.tz('Asia/Jakarta');

//     const startDate = targetDate.clone().startOf('day').toDate();
//     const endDate   = targetDate.clone().endOf('day').toDate();

//     const deadline = "07:00:00";

//     const allStudents = await Student.findAll({
//       where: { 
//         schoolId: parseInt(schoolId), 
//         isActive: true, 
//         isGraduated: false 
//       },
//       attributes: ['id', 'name', 'nis', 'class', 'photoUrl'],
//       include: [{
//         model: Attendance,
//         as: 'studentAttendances',
//         where: {
//           createdAt: { [Op.between]: [startDate, endDate] },
//           userRole: 'student'
//         },
//         attributes: ['status', 'createdAt'],
//         required: false,
//         limit: 1,
//         order: [['createdAt', 'ASC']]
//       }],
//     });

//     // --- RINGKASAN GLOBAL (DIPISAH) ---
//     let totalAllStudents = 0;
//     let totalAllHadir = 0;
//     let totalAllIzin = 0;
//     let totalAllPulang = 0;
//     let totalAllAlpha = 0;
//     let totalAllBelumHadir = 0;

//     const acc = new Map();

//     for (const student of allStudents) {
//       const className = student.class || "Tanpa Kelas";

//       if (!acc.has(className)) {
//         acc.set(className, {
//           className,
//           totalStudents: 0,
//           stats: { 
//             onTime: 0, 
//             late: 0, 
//             izin: 0, 
//             sakit: 0, 
//             alpha: 0, 
//             belumHadir: 0 
//           },
//           students: []
//         });
//       }

//       const classObj = acc.get(className);
//       const attendance = student.studentAttendances?.[0];

//       let statusInfo = "Belum Hadir";
//       let isLate = false;
//       let scanTime = null;

//       totalAllStudents++;
//       classObj.totalStudents++;

//       if (attendance) {
//         scanTime = moment.tz(attendance.createdAt, 'Asia/Jakarta').format("HH:mm:ss");
//         const normalizedStatus = (attendance.status || '').toLowerCase().trim();

//         if (normalizedStatus === 'hadir') {
//           totalAllHadir++;
//           if (scanTime <= deadline) {
//             classObj.stats.onTime++;
//             statusInfo = "Hadir";
//           } else {
//             classObj.stats.late++;
//             statusInfo = "Hadir";
//             isLate = true;
//           }
//         } else if (normalizedStatus === 'izin') {
//           totalAllIzin++;
//           classObj.stats.izin++;
//           statusInfo = "Izin";
//         } else if (normalizedStatus === 'sakit') {
//           totalAllPulang++;
//           classObj.stats.sakit++;
//           statusInfo = "Sakit";
//         } else if (normalizedStatus === 'alpha') {
//           totalAllAlpha++;
//           classObj.stats.alpha++;
//           statusInfo = "Alpha";
//         }
//       } else {
//         totalAllBelumHadir++;
//         classObj.stats.belumHadir++;
//         statusInfo = "Belum Hadir";
//       }

//       classObj.students.push({
//         id: student.id,
//         name: student.name,
//         nis: student.nis,
//         status: statusInfo,
//         scanTime,
//         isLate,
//         photoUrl: student.photoUrl
//       });
//     }

//     const sortedData = Array.from(acc.values()).sort((a, b) => 
//       a.className.localeCompare(b.className, undefined, { numeric: true })
//     );

//     res.json({
//       success: true,
//       summary: { 
//         totalAllStudents, 
//         totalAllHadir, 
//         totalAllIzin,    // Terpisah
//         totalAllPulang,   // Terpisah
//         totalAllAlpha,   // Terpisah
//         totalAllBelumHadir,
//         date: targetDate.format('YYYY-MM-DD')
//       },
//       data: sortedData
//     });

//   } catch (err) {
//     console.error('[getClassRecapWithDetails] Error:', err);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

exports.getClassRecapWithDetails = async (req, res) => {
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

exports.getGlobalAttendanceStats = async (req, res) => {
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
};

exports.updateStudentLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "latitude dan longitude wajib diisi" });
    }

    await Student.update(
      { latitude, longitude },
      { where: { id } }
    );

    res.json({ success: true, message: "Lokasi berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.updateClassByBatch = async (req, res) => {
  try {
    const { schoolId, batch, newClass, studentIds } = req.body;

    if (!newClass) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kelas tujuan wajib diisi' 
      });
    }

    // Jika ada studentIds spesifik → update by IDs
    // Jika ada batch tapi tidak ada IDs → update semua siswa di batch itu
    let whereCondition = { schoolId: parseInt(schoolId) };

    if (studentIds && studentIds.length > 0) {
      whereCondition.id = { [Op.in]: studentIds };
    } else if (batch) {
      whereCondition.batch = batch;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Masukkan batch atau pilih siswa terlebih dahulu' 
      });
    }

    const [affectedCount] = await Student.update(
      { class: newClass },
      { where: whereCondition }
    );

    // await invalidateStudentCache(parseInt(schoolId));

    res.json({ 
      success: true, 
      message: `${affectedCount} siswa berhasil dipindahkan ke kelas ${newClass}`,
      affectedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getConsecutiveAbsent = async (req, res) => {
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
 
exports.getLowAttendance = async (req, res) => {
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
 
exports.getFrequentLate = async (req, res) => {
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

exports.shareRekapHarian = async (req, res) => {
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

 exports.getRekapSaya = async (req, res) => {
    try {
      const { siswaId, bulan, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

      if (enforcedSchoolId) {
        const isValid = await verifySiswaSchool(siswaId, enforcedSchoolId);
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
  exports.getAttendances = async (req, res) => {
    try {
      const { siswaId, page = 1, limit = 30, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

      if (enforcedSchoolId) {
        const isValid = await verifySiswaSchool(siswaId, enforcedSchoolId);
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

  exports.getTeladan = async (req, res) => {
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

  exports.getTepatWaktu = async (req, res) => {
    try {
      const { siswaId, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

      if (enforcedSchoolId) {
        const isValid = await verifySiswaSchool(siswaId, enforcedSchoolId);
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

  exports.getStreak = async (req, res) => {
    try {
      const { siswaId, schoolId } = req.query;
      const enforcedSchoolId = schoolId || req.enforcedSchoolId;

      if (!siswaId) return res.status(400).json({ success: false, message: 'siswaId required' });

      // Security: verify siswa belongs to school
      if (enforcedSchoolId) {
        const isValid = await verifySiswaSchool(siswaId, enforcedSchoolId);
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

  exports.getEarlyWarning = async (req, res) => {
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

  exports.searchSiswa = async (req, res) => {
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