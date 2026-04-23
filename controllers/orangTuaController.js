const Parent = require('../models/orangTua');
const Student = require('../models/siswa');
const Attendance = require('../models/kehadiran');
const { Op } = require('sequelize');
const moment = require('moment');
const jwt = require('jsonwebtoken')

// --- 1. CREATE ---
exports.createParent = async (req, res) => {
  try {
    const { name, gender, relationStatus, type, phoneNumber, schoolId, studentIds } = req.body;

    const existing = await Parent.findOne({ where: { phoneNumber } });
    if (existing) return res.status(400).json({ success: false, message: "Nomor ini sudah terdaftar" });

    const newParent = await Parent.create({
      name, gender, relationStatus, type, phoneNumber, schoolId: parseInt(schoolId)
    });

    // Hubungkan siswa ke orang tua ini
    if (studentIds && Array.isArray(studentIds)) {
      await Student.update(
        { parentId: newParent.id },
        { where: { id: { [Op.in]: studentIds } } }
      );
    }

    res.json({ success: true, data: newParent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- 2. GET ALL ---
exports.getAllParents = async (req, res) => {
  try {
    const { schoolId, name } = req.query;
    let condition = { schoolId: parseInt(schoolId), isActive: true };
    if (name) condition.name = { [Op.like]: `%${name}%` };

    const data = await Parent.findAll({
      where: condition,
      include: [{
        model: Student,
        as: 'children',
        attributes: ['id', 'name', 'class', 'nis']
      }],
      order: [['name', 'ASC']]
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- 3. UPDATE ---
exports.updateParent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, relationStatus, type, phoneNumber, studentIds } = req.body;

    await Parent.update(
      { name, gender, relationStatus, type, phoneNumber },
      { where: { id } }
    );

    if (studentIds) {
      // Step 1: Kosongkan dulu anak-anak yang sebelumnya terhubung ke ortu ini
      await Student.update({ parentId: null }, { where: { parentId: id } });
      // Step 2: Hubungkan anak-anak baru berdasarkan list studentIds
      await Student.update({ parentId: id }, { where: { id: { [Op.in]: studentIds } } });
    }

    res.json({ success: true, message: "Data berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- 4. DELETE (Soft Delete) ---
exports.deleteParent = async (req, res) => {
  try {
    const { id } = req.params;
    // Set non-aktif
    await Parent.update({ isActive: false }, { where: { id } });
    // Lepas relasi anak agar siswa bisa didaftarkan ke ortu lain (misal ortu satunya)
    await Student.update({ parentId: null }, { where: { parentId: id } });

    res.json({ success: true, message: "Data orang tua berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getChildrenAttendance = async (req, res) => {
  try {
    const { parentId } = req.params; // ID orang tua dari session atau params
    const { year } = req.query;

    // 1. Cari semua anak yang terhubung dengan parent ini
    const children = await Student.findAll({
      // where: { parentId: parentId, isActive: true },
      where: { parentId: parentId },
      attributes: ['id', 'name', 'class', 'nis']
    });

    if (!children || children.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Tidak ada data anak yang terhubung dengan akun ini." 
      });
    }

    const studentIds = children.map(c => c.id);

    // 2. Konfigurasi Waktu (1 tahun terakhir)
    const startDate = year 
      ? moment(`${year}-01-01`).startOf('year').toDate() 
      : moment().subtract(1, 'years').toDate();
    const endDate = year 
      ? moment(`${year}-12-31`).endOf('year').toDate() 
      : moment().endOf('day').toDate();

    // 3. Ambil data kehadiran semua anak tersebut
    const attendanceRecords = await Attendance.findAll({
      where: {
        studentId: { [Op.in]: studentIds },
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      order: [['createdAt', 'DESC']],
      // Sertakan info siswa agar orang tua tahu ini record milik anak yang mana
      include: [{
        model: Student,
        as: 'student',
        attributes: ['name', 'class']
      }]
    });

    // 4. Mapping data untuk tampilan yang rapi
    const deadline = "07:00:00";
    const history = attendanceRecords.map(record => {
      const scanTime = moment(record.createdAt).format("HH:mm:ss");
      return {
        studentName: record.student.name,
        class: record.currentClass || record.student.class,
        date: moment(record.createdAt).format('YYYY-MM-DD'),
        time: scanTime,
        status: record.status,
        isLate: record.status === 'Hadir' && scanTime > deadline
      };
    });

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (err) {
    console.error("Error Get Children Attendance:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.loginParentWithoutPassword = async (req, res) => {
  try {
    const { phoneNumber, childNis } = req.body;

    // 1. Cari orang tua berdasarkan nomor HP
    const parent = await Parent.findOne({ 
      where: { phoneNumber, isActive: true } 
    });

    if (!parent) {
      return res.status(404).json({ 
        success: false, 
        message: "Nomor HP tidak terdaftar di sistem sekolah." 
      });
    }

    // 2. Validasi: Apakah benar ortu ini punya anak dengan NIS tersebut?
    const studentMatch = await Student.findOne({
      where: { 
        parentId: parent.id, 
        nis: childNis 
      }
    });

    if (!studentMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Kombinasi Nomor HP dan NIS Anak tidak cocok." 
      });
    }

    // 3. Jika cocok, buatkan Token (JWT)
    const token = jwt.sign(
      { id: parent.id, role: 'parent', schoolId: parent.schoolId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Buat durasi lama agar ortu tidak sering login ulang
    );

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      parent: {
        id: parent.id,
        name: parent.name,
        schoolId: parent.schoolId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Fungsi untuk membantu orang tua mencari data anak sebelum registrasi
exports.searchStudentForRegister = async (req, res) => {
  try {
    const { nis, schoolId } = req.query;
    const student = await Student.findOne({
      where: { nis, schoolId, parentId: null }, // Hanya cari siswa yang belum punya ortu terdaftar
      attributes: ['id', 'name', 'class', 'nis']
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Siswa tidak ditemukan atau sudah terdaftar." });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- UPDATE PROFILE (Sesuai Model Parent) ---
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      gender, 
      relationStatus, 
      type, 
      phoneNumber,
      email // Menjaga kompatibilitas jika frontend mengirim field 'email'
    } = req.body;

    // 1. Cari data orang tua
    const parent = await Parent.findByPk(id);
    if (!parent) {
      return res.status(404).json({ 
        success: false, 
        message: "Data orang tua tidak ditemukan." 
      });
    }

    // 2. Cek duplikasi nomor HP jika nomor diubah
    const newPhone = phoneNumber || email; // Gunakan phoneNumber atau email dari body
    if (newPhone && newPhone !== parent.phoneNumber) {
      const existing = await Parent.findOne({ 
        where: { phoneNumber: newPhone, isActive: true } 
      });
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: "Nomor telepon sudah digunakan oleh akun lain." 
        });
      }
    }

    // 3. Eksekusi Update (Hanya field yang ada di Model)
    await Parent.update({
      name: name || parent.name,
      gender: gender || parent.gender,
      relationStatus: relationStatus || parent.relationStatus,
      type: type || parent.type,
      phoneNumber: newPhone || parent.phoneNumber
    }, { 
      where: { id } 
    });

    // 4. Ambil data terbaru untuk dikirim balik ke frontend
    const updatedData = await Parent.findByPk(id);

    res.json({ 
      success: true, 
      message: "Profil berhasil diperbarui", 
      data: updatedData 
    });

  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getParentById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Parent.findByPk(id);

    if (!data) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- LINK CHILD (Flutter app) ---
exports.linkChild = async (req, res) => {
  try {
    const { ortu_id, nisn, school_id, relation } = req.body;

    // Cari siswa berdasarkan NISN dan sekolah
    const student = await Student.findOne({
      where: { nisn, schoolId: parseInt(school_id) }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Siswa dengan NISN tersebut tidak ditemukan" });
    }

    if (student.parentId && student.parentId !== parseInt(ortu_id)) {
      return res.status(400).json({ success: false, message: "Siswa sudah terdaftar ke orang tua lain" });
    }

    // Update student_parents junction if exists, or update student.parentId
    await Student.update(
      { parentId: parseInt(ortu_id) },
      { where: { id: student.id } }
    );

    res.json({ success: true, message: "Anak berhasil ditautkan", data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- UNLINK CHILD (Flutter app) ---
exports.unlinkChild = async (req, res) => {
  try {
    const { siswa_id, ortu_id } = req.query;

    await Student.update(
      { parentId: null },
      { where: { id: parseInt(siswa_id), parentId: parseInt(ortu_id) } }
    );

    res.json({ success: true, message: "Anak berhasil dilepas" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};