const GuruTendik = require("../models/guruTendik");
const Student = require("../models/siswa");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: Optimasi Gambar Jangka Panjang
const processPhotoUpload = (buffer, schoolId, identifier, role) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `sekolah_${schoolId}/${role}`,
        public_id: `photo_${identifier}`,
        overwrite: true,
        timeout: 60000,
        transformation: [
          { width: 400, height: 400, crop: 'thumb', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// exports.updateMyProfile = async (req, res) => {
//   try {
//     const user = req.user; // dari JWT
//     const { name, email, nis, nisn, nip, oldPassword, newPassword, class: kelas } = req.body;

//     let dataToUpdate = {};

//     if (name) {
//         if (user.role === 'siswa') {
//             dataToUpdate.name = name; 
//         } else {
//             dataToUpdate.nama = name; 
//         }
//     }

//     if (kelas && user.role === 'siswa') {
//       dataToUpdate.class = kelas;
//     }

//     // ========================
//     // VALIDASI EMAIL
//     // ========================
//     if (email) {
//       if (user.role === 'siswa') {
//         const exist = await Student.findOne({
//           where: {
//             email,
//             id: { [Op.ne]: user.id }
//           }
//         });
//         if (exist) {
//           return res.status(400).json({
//             success: false,
//             message: "Email sudah digunakan siswa lain"
//           });
//         }
//       } else {
//         const exist = await GuruTendik.findOne({
//           where: {
//             email,
//             id: { [Op.ne]: user.id }
//           }
//         });
//         if (exist) {
//           return res.status(400).json({
//             success: false,
//             message: "Email sudah digunakan"
//           });
//         }
//       }

//       dataToUpdate.email = email;
//     }

//     // ========================
//     // UPDATE PASSWORD
//     // ========================
//     if (oldPassword && newPassword) {
//         let currentUser;

//         if (user.role === 'siswa') {
//             currentUser = await Student.findByPk(user.id);
//         } else {
//             currentUser = await GuruTendik.findByPk(user.id);
//         }

//         // cek password lama
//         const isMatch = await bcrypt.compare(oldPassword, currentUser.password || '');
//         if (!isMatch) {
//             return res.status(400).json({
//             success: false,
//             message: "Password lama tidak sesuai"
//             });
//         }

//         // hash password baru
//         const hashedPassword = await bcrypt.hash(newPassword, 10);
//         dataToUpdate.password = hashedPassword;
//     }

//     // ========================
//     // ROLE: SISWA
//     // ========================
//     if (user.role === 'siswa') {

//       if (nis && nis !== user.nis) {
//         const existNis = await Student.findOne({
//           where: {
//             schoolId: user.schoolId,
//             nis,
//             id: { [Op.ne]: user.id }
//           }
//         });

//         if (existNis) {
//           return res.status(400).json({
//             success: false,
//             message: `NIS ${nis} sudah digunakan`
//           });
//         }

//         dataToUpdate.nis = nis;
//       }

//       if (nisn && nisn !== user.nisn) {
//         const existNisn = await Student.findOne({
//           where: {
//             nisn,
//             id: { [Op.ne]: user.id }
//           }
//         });

//         if (existNisn) {
//           return res.status(400).json({
//             success: false,
//             message: `NISN ${nisn} sudah digunakan`
//           });
//         }

//         dataToUpdate.nisn = nisn;
//       }

//       await Student.update(dataToUpdate, {
//         where: { id: user.id }
//       });

//     } else {
//       // ========================
//       // ROLE: GURU
//       // ========================
//       if (nip && nip !== user.nip) {
//         const existNip = await GuruTendik.findOne({
//           where: {
//             nip,
//             id: { [Op.ne]: user.id }
//           }
//         });

//         if (existNip) {
//           return res.status(400).json({
//             success: false,
//             message: `NIP ${nip} sudah digunakan`
//           });
//         }

//         dataToUpdate.nip = nip;
//       }

//       await GuruTendik.update(dataToUpdate, {
//         where: { id: user.id }
//       });
//     }

//     let updatedUser;

//     if (user.role === 'siswa') {
//     updatedUser = await Student.findByPk(user.id, {
//         attributes: { exclude: ['password'] }
//     });
//     } else {
//     updatedUser = await GuruTendik.findByPk(user.id, {
//         attributes: { exclude: ['password'] }
//     });
//     }

//     res.json({
//         success: true,
//         message: "Profile berhasil diupdate",
//         data: updatedUser,// <-- INI PENTING,
//         passwordBARU: newPassword,
//         passwordLama: oldPassword,
//     });

//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };

// exports.updateMyProfile = async (req, res) => {
//   try {
//     const user = req.user; 
//     const { name, email, nis, nisn, nip, oldPassword, newPassword, class: kelas } = req.body;

//     let dataToUpdate = {};
//     const Model = user.role === 'siswa' ? Student : GuruTendik;

//     // 1. Mapping Nama berdasarkan Role
//     if (name) {
//         user.role === 'siswa' ? dataToUpdate.name = name : dataToUpdate.nama = name;
//     }
//     if (kelas && user.role === 'siswa') dataToUpdate.class = kelas;

//     // 2. Optimasi Validasi Unik (Email, NIS, NISN)
//     // Kita cek semuanya sekaligus dalam satu query OR
//     const orConditions = [];
//     if (email) orConditions.push({ email });
//     if (user.role === 'siswa') {
//         if (nis) orConditions.push({ nis });
//         if (nisn) orConditions.push({ nisn });
//     } else {
//         if (nip) orConditions.push({ nip });
//     }

//     if (orConditions.length > 0) {
//         const duplicate = await Model.findOne({
//             where: {
//                 [Op.or]: orConditions,
//                 id: { [Op.ne]: user.id }
//             }
//         });

//         if (duplicate) {
//             if (email && duplicate.email === email) return res.status(400).json({ success: false, message: "Email sudah digunakan" });
//             if (nis && duplicate.nis === nis) return res.status(400).json({ success: false, message: "NIS sudah digunakan" });
//             if (nisn && duplicate.nisn === nisn) return res.status(400).json({ success: false, message: "NISN sudah digunakan" });
//             if (nip && duplicate.nip === nip) return res.status(400).json({ success: false, message: "NIP sudah digunakan" });
//         }
//         if (email) dataToUpdate.email = email;
//         if (nis) dataToUpdate.nis = nis;
//         if (nisn) dataToUpdate.nisn = nisn;
//         if (nip) dataToUpdate.nip = nip;
//     }

//     // 3. Update Password (Hanya jika diminta)
//     if (oldPassword && newPassword) {
//         const currentUser = await Model.findByPk(user.id);
//         const isMatch = await bcrypt.compare(oldPassword, currentUser.password || '');
//         if (!isMatch) return res.status(400).json({ success: false, message: "Password lama salah" });
        
//         dataToUpdate.password = await bcrypt.hash(newPassword, 10);
//     }

//     // 4. Eksekusi Update
//     await Model.update(dataToUpdate, { where: { id: user.id } });

//     // 5. Response (Tanpa query findByPk lagi untuk performa)
//     // Kita buat objek user baru dari data yang ada
//     const finalData = { ...user, ...dataToUpdate };
//     delete finalData.password; // Pastikan password tidak ikut dikirim

//     res.json({
//         success: true,
//         message: "Profile berhasil diupdate",
//         data: finalData 
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.updateMyProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, email, nis, nisn, nip, oldPassword, newPassword, class: kelas } = req.body;

    const Model = user.role === 'siswa' ? Student : GuruTendik;

    const currentUser = await Model.findByPk(user.id);
    if (!currentUser) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const changed = (incoming, current) => {
      if (incoming === undefined || incoming === null || incoming === '') return false;
      return String(incoming).trim() !== String(current ?? '').trim();
    };

    let dataToUpdate = {};

    // 1. Nama & Kelas
    if (name) {
      user.role === 'siswa' ? (dataToUpdate.name = name) : (dataToUpdate.nama = name);
    }
    if (kelas && user.role === 'siswa') dataToUpdate.class = kelas;

    // 2. Uniqueness check — sesuai constraint di model
    const orConditions = [];

    if (changed(email, currentUser.email)) {
      orConditions.push({ email });
    }

    if (user.role === 'siswa') {
      // NIS: unique per school (composite index)
      if (changed(nis, currentUser.nis)) {
        orConditions.push({ nis, schoolId: currentUser.schoolId });
      }
      // NISN: unique global
      if (changed(nisn, currentUser.nisn)) {
        orConditions.push({ nisn });
      }
    } else {
      // NIP: unique global
      if (changed(nip, currentUser.nip)) {
        orConditions.push({ nip });
      }
    }

    if (orConditions.length > 0) {
      // Setiap kondisi dicek terpisah karena constraint-nya berbeda
      // (NIS composite vs NISN/email global) — tidak bisa digabung Op.or
      for (const condition of orConditions) {
        const duplicate = await Model.findOne({
          where: { ...condition, id: { [Op.ne]: user.id } },
          attributes: ['id', 'email', 'nis', 'nisn', 'nip'],
        });

        if (duplicate) {
          if (condition.nis)   return res.status(400).json({ success: false, message: 'NIS sudah digunakan di sekolah ini' });
          if (condition.nisn)  return res.status(400).json({ success: false, message: 'NISN sudah digunakan' });
          if (condition.email) return res.status(400).json({ success: false, message: 'Email sudah digunakan' });
          if (condition.nip)   return res.status(400).json({ success: false, message: 'NIP sudah digunakan' });
        }
      }
    }

    // Masukkan nilai baru
    if (email) dataToUpdate.email = email;
    if (user.role === 'siswa') {
      if (nis)  dataToUpdate.nis  = nis;
      if (nisn) dataToUpdate.nisn = nisn;
    } else {
      if (nip) dataToUpdate.nip = nip;
    }

    // 3. Password
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, currentUser.password || '');
      if (!isMatch) return res.status(400).json({ success: false, message: 'Password lama salah' });
      dataToUpdate.password = await bcrypt.hash(newPassword, 10);
    }

    // 4. Tidak ada yang diupdate
    if (Object.keys(dataToUpdate).length === 0) {
      return res.json({ success: true, message: 'Tidak ada perubahan', data: currentUser.toJSON() });
    }

    // 5. Eksekusi
    await Model.update(dataToUpdate, { where: { id: user.id } });

    const finalData = { ...currentUser.toJSON(), ...dataToUpdate };
    delete finalData.password;

    res.json({ success: true, message: 'Profile berhasil diupdate', data: finalData });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMyPhoto = async (req, res) => {
  try {
    const user = req.user;

    // =========================
    // VALIDASI FILE
    // =========================
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File foto wajib diupload"
      });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: "File harus berupa gambar"
      });
    }

    // =========================
    // TENTUKAN MODEL & IDENTIFIER
    // =========================
    const isSiswa = user.role === 'siswa';
    const Model = isSiswa ? Student : GuruTendik;

    const identifier = isSiswa
      ? user.nis
      : (user.nip || user.id);

    const roleFolder = isSiswa ? 'siswa' : 'guru';

    // =========================
    // UPLOAD KE CLOUDINARY
    // =========================
    let photoUrl = await processPhotoUpload(
      req.file.buffer,
      user.schoolId,
      identifier,
      roleFolder
    );

    // cache busting (biar langsung update di FE)
    photoUrl = photoUrl + `?t=${Date.now()}`;

    // =========================
    // UPDATE DATABASE
    // =========================
    await Model.update(
      { photoUrl },
      { where: { id: user.id } }
    );

    // =========================
    // AMBIL DATA TERBARU
    // =========================
    const updatedUser = await Model.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    // =========================
    // RESPONSE
    // =========================
    res.json({
      success: true,
      message: "Foto berhasil diupdate",
      data: updatedUser
    });

 } catch (err) {
    // Catch-all untuk error yang tidak terduga
    console.error("Unexpected Update Photo Error:", err);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan sistem yang tidak terduga",
      error: err.message
    });
  }
};