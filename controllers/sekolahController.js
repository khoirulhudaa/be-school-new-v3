const { Op } = require('sequelize');
const Siswa = require('../models/siswa');
const GuruTendik = require('../models/guruTendik');
const SchoolProfile = require('../models/profileSekolah');
const Announcement = require('../models/pengumuman');
const Presence = require('../models/presence');

// Get dashboard stats for a school
exports.getDashboardStats = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId || req.query.schoolId;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'schoolId diperlukan',
      });
    }

    const schoolIdNum = parseInt(schoolId);

    // Parallel queries for efficiency
    const [
      totalSiswa,
      totalGuru,
      activeClasses,
      activeAnnouncements,
    ] = await Promise.all([
      Siswa.count({ where: { schoolId: schoolIdNum } }),
      GuruTendik.count({ where: { schoolId: schoolIdNum } }),
      // Count unique classes
      Siswa.findAll({
        where: { schoolId: schoolIdNum },
        attributes: ['classId'],
        group: ['classId'],
      }).then(classes => classes.length),
      Announcement.count({
        where: {
          schoolId: schoolIdNum,
          isActive: 1,
        },
      }),
    ]);

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceToday = await Presence.count({
      where: {
        schoolId: schoolIdNum,
        type: 'checkin',
        createdAt: {
          [Op.between]: [today, tomorrow],
        },
      },
    });

    res.json({
      success: true,
      data: {
        totalSiswa,
        totalGuru,
        attendanceToday,
        activeClasses,
        activeAnnouncements,
      },
    });
  } catch (err) {
    console.error('getSchoolDashboardStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all schools (existing)
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await SchoolProfile.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });

    res.json({ success: true, data: schools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all schools paginated
exports.getAllSchoolsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, name } = req.query;

    const where = {};
    if (status) where.status = status;
    if (name) where.name = { [Op.like]: `%${name}%` };

    const { count, rows } = await SchoolProfile.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update school status
exports.updateSchoolStatus = async (req, res) => {
  try {
    const { schoolId, status } = req.body;

    const school = await SchoolProfile.findByPk(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'Sekolah tidak ditemukan' });
    }

    await school.update({ status });

    res.json({ success: true, message: 'Status sekolah berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Export schools to Excel
exports.exportAllSchoolsExcel = async (req, res) => {
  try {
    const schools = await SchoolProfile.findAll({ order: [['name', 'ASC']] });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sekolah');

    sheet.columns = [
      { header: 'Nama Sekolah', key: 'name', width: 30 },
      { header: 'NPSN', key: 'npsn', width: 15 },
      { header: 'Alamat', key: 'address', width: 40 },
      { header: 'Telepon', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
    ];

    schools.forEach(school => {
      sheet.addRow({
        name: school.name,
        npsn: school.npsn,
        address: school.address,
        phone: school.phone,
        email: school.email,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sekolah.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Export students by school
exports.exportSiswaBySchoolExcel = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const students = await Siswa.findAll({
      where: { schoolId: parseInt(schoolId) },
      order: [['name', 'ASC']],
    });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Siswa');

    sheet.columns = [
      { header: 'NIS', key: 'nis', width: 15 },
      { header: 'Nama', key: 'name', width: 30 },
      { header: 'Kelas', key: 'class', width: 15 },
      { header: 'JK', key: 'gender', width: 10 },
    ];

    students.forEach(s => {
      sheet.addRow({
        nis: s.nis,
        name: s.name,
        class: s.classId,
        gender: s.gender,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=siswa-sekolah-${schoolId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Export teachers by school
exports.exportGuruBySchoolExcel = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const teachers = await GuruTendik.findAll({
      where: { schoolId: parseInt(schoolId) },
      order: [['name', 'ASC']],
    });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Guru');

    sheet.columns = [
      { header: 'NIP', key: 'nip', width: 15 },
      { header: 'Nama', key: 'name', width: 30 },
      { header: 'Jabatan', key: 'position', width: 20 },
      { header: 'JK', key: 'gender', width: 10 },
    ];

    teachers.forEach(t => {
      sheet.addRow({
        nip: t.nip,
        name: t.name,
        position: t.position,
        gender: t.gender,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=guru-sekolah-${schoolId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get school distribution (for map/statistics)
exports.getSchoolDistribution = async (req, res) => {
  try {
    const { province, city, limit = 100 } = req.query;

    const where = { isActive: true };
    if (province) where.province = province;
    if (city) where.city = city;

    const schools = await SchoolProfile.findAll({
      where,
      attributes: ['id', 'name', 'npsn', 'address', 'latitude', 'longitude', 'province', 'city', 'status'],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
    });

    // Group by location
    const distribution = {};
    schools.forEach(school => {
      const key = school.province || 'Unknown';
      if (!distribution[key]) {
        distribution[key] = { province: key, count: 0, schools: [] };
      }
      distribution[key].count++;
      distribution[key].schools.push({
        id: school.id,
        name: school.name,
        latitude: school.latitude,
        longitude: school.longitude,
        address: school.address,
        status: school.status,
      });
    });

    return res.json({
      success: true,
      data: {
        totalSchools: schools.length,
        byProvince: Object.values(distribution),
        schools: schools.map(s => ({
          id: s.id,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
          address: s.address,
          status: s.status,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};