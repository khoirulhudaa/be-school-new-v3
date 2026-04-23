const Student = require('../models/siswa');
const Attendance = require('../models/kehadiran');
const { Op } = require('sequelize');
const moment = require('moment');
const moment2 = require('moment-timezone'); // Pastikan import ini ada
const jwt = require('jsonwebtoken');
const GuruTendik = require('../models/guruTendik');
const sequelize = require('../config/database');
const SchoolProfile = require('../models/profileSekolah'); // Pastikan ini di-import
const redis = require('../config/redis'); // Pastikan path benar
const attendanceQueue = require('../queues/attendanceQueue');

// Fungsi Helper Haversine
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // meter
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

exports.scanSelf = async (req, res) => {
    // 1. Ambil qrScanned DAN koordinat dari body
    const { qrCodeData, userLat, userLon } = req.body; // Ganti qrScanned jadi qrCodeData

    const profile = req.user?.profile || req.user; 
    if (!profile) return res.status(401).json({ success: false, message: "Sesi tidak valid" });

    const { id, role, schoolId } = profile;
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    // 2. Validasi QR Code Sekolah
    if (!qrCodeData.includes(`SCHOOL_QR_${schoolId}`)) {
        return res.status(403).json({ success: false, message: `QR Code tidak valid untuk sekolah ini.` });
    }

    const redisKey = `absensi_check:${schoolId}:${id}:${moment().format('YYYY-MM-DD')}`;
    
    try {
        const isAlreadyScanned = await redis.get(redisKey);
        if (isAlreadyScanned) {
            return res.status(400).json({ success: false, message: 'Anda sudah absen hari ini.' });
        }
    } catch (redisError) {
        console.error("Redis Error:", redisError);
        // Lanjut saja ke DB jika Redis mati (failover)
    }

    const t = await sequelize.transaction();

    try {
        // --- 3. VALIDASI GEOFENCING (REVISED) ---
        let school = await redis.get(`school_profile:${schoolId}`);
        
        if (school) {
            try {
                school = JSON.parse(school);
            } catch (e) {
                console.error("Redis Parse Error:", e);
                school = null; // Paksa null agar di-fetch ulang dari DB di bawah
            }
        }

        // Ini memastikan jika Redis kosong ATAU JSON error, kita ambil dari DB.
        if (!school) {
            school = await SchoolProfile.findOne({ where: { schoolId } });
            if (school) {
                await redis.set(`school_profile:${schoolId}`, JSON.stringify(school), {
                    EX: 60 * 60 * 24 
                });
            }
        }

        if (school && school.latitude && school.longitude) {
            if (!userLat || !userLon) {
                await t.rollback();
                return res.status(400).json({ success: false, message: 'Lokasi GPS diperlukan' });
            }

            const distance = getDistance(userLat, userLon, parseFloat(school.latitude), parseFloat(school.longitude));
            const maxRadius = 200; // 200m

            if (distance > maxRadius) {
                await t.rollback();
                return res.status(403).json({ 
                    success: false, 
                    message: `Anda di luar jangkauan (${Math.round(distance)}m). Maksimal ${maxRadius}m.` 
                });
            }
        }

        const isStudent = role.toLowerCase() === 'siswa' || role === 'student';
        const idKey = isStudent ? 'studentId' : 'guruId';
        const attendanceRole = isStudent ? 'student' : 'teacher';

        // 4. Cek Duplikasi
        const alreadyExists = await Attendance.findOne({
            where: { 
                [idKey]: id, 
                createdAt: { [Op.between]: [todayStart, todayEnd] } 
            },
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (alreadyExists) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Anda sudah absen hari ini.' });
        }

        // 5. Ambil Kelas & Create
        let userProfile = isStudent ? await Student.findByPk(id, { transaction: t }) : await GuruTendik.findByPk(id, { transaction: t });
        if (!userProfile) throw new Error("Profil tidak ditemukan");

        const currentClassLabel = isStudent ? (userProfile.class || userProfile.kelas) : 'GURU/STAFF';

        const newAttendance = await Attendance.create({ 
            [idKey]: id,
            userRole: attendanceRole,
            schoolId: schoolId, 
            currentClass: currentClassLabel,
            status: 'Hadir',
            latitude: userLat,
            longitude: userLon
        }, { transaction: t });
        
        await t.commit();

        // 🔥 AMBIL SOCKET.IO
        const io = req.app.get('socketio');

        // 🔥 DATA YANG DIKIRIM KE TV
        const studentData = {
          id: userProfile.id,
          name: userProfile.name,
          class: userProfile.class,
          photo: userProfile.photoUrl,
          time: moment(newAttendance.createdAt).format("HH:mm:ss"),
        };

        // 🔥 KIRIM KE TV BERDASARKAN SCHOOL
        io.to(`school-${schoolId}`).emit('attendance:new', studentData);

        // SIMPAN KE REDIS SETELAH COMMIT BERHASIL
        // Beri TTL (Time to Live) misal 20 jam agar besok key ini otomatis hilang
        await redis.set(redisKey, 'true', {
            EX: 12 * 60 * 60 // 12 jam dalam detik
        });

        res.json({ success: true, message: `Absensi Berhasil!`, time: moment(newAttendance.createdAt).format("HH:mm:ss") });

    } catch (err) {
        if (t) await t.rollback();
        console.error("DETAILED ERROR:", err);
        res.status(500).json({ 
            success: false, 
            message: "Gagal memproses absensi", 
            details: err.original?.sqlMessage || err.message 
        });
    }
};

exports.scanSelfDoubleQr = async (req, res) => {
    const { qrCodeData, userLat, userLon } = req.body;
    const profile = req.user?.profile || req.user;

    if (!profile) {
        return res.status(401).json({ 
            success: false, 
            message: "Sesi tidak valid" 
        });
    }

    const { id, role, schoolId } = profile;

    // --- 1. Validasi Awal ---
    if (!qrCodeData || !schoolId) {
        return res.status(400).json({ 
            success: false, 
            message: "Data tidak lengkap" 
        });
    }

    const regex = new RegExp(`^SCHOOL_QR_${schoolId}_(LEFT|RIGHT)$`);
    const match = qrCodeData.match(regex);
    if (!match) {
        return res.status(403).json({ 
            success: false, 
            message: "QR Code tidak valid" 
        });
    }
    const qrPosition = match[1].toLowerCase();

    // --- 2. Geofencing ---
    let school = await redis.get(`school_profile:${schoolId}`);
    if (school) {
        school = JSON.parse(school);
    } else {
        school = await SchoolProfile.findOne({ 
            where: { schoolId }, 
            raw: true 
        });
        if (school) {
            await redis.set(`school_profile:${schoolId}`, JSON.stringify(school), 'EX', 86400);
        }
    }

    if (school?.latitude && school?.longitude) {
        const distance = getDistance(
            userLat, 
            userLon, 
            parseFloat(school.latitude), 
            parseFloat(school.longitude)
        );
        if (distance > 200) {
            return res.status(403).json({ 
                success: false, 
                message: `Luar jangkauan (${Math.round(distance)}m)` 
            });
        }
    }

    // ==================== REDIS LOCKING ====================
    const today = moment().format('YYYY-MM-DD');
    const secondsUntilEndOfDay = moment().endOf('day').diff(moment(), 'seconds');

    const isStudent = role?.toLowerCase?.() === 'siswa' || role === 'student';
    const entityKey = isStudent ? `student:${id}` : `guru:${id}`;

    const lockKey = `absensi_lock:${schoolId}:${entityKey}:${today}`;     
    const checkKey = `absensi_check:${schoolId}:${entityKey}:${today}`;   

    // Cek apakah sudah absen hari ini
    const alreadyAbsen = await redis.get(checkKey);
    if (alreadyAbsen) {
        console.log(`[ALREADY PRESENSI] userId:${id} | already:${alreadyAbsen ? 'YES' : 'NO'} | time:${moment().format('HH:mm:ss.SSS')}`);
        return res.status(400).json({ 
            success: false, 
            message: 'Anda sudah absen hari ini.' 
        });
    }

    // Ambil lock sementara
    const lockToken = `lock-${id}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    let acquired = await redis.set(lockKey, lockToken, 'NX', 'PX', 30000); // 30 detik

    // Retry sekali jika gagal
    if (!acquired) {
        console.log(`[LOCK RETRY] userId:${id} | mencoba retry...`);
        await new Promise(r => setTimeout(r, 800));
        acquired = await redis.set(lockKey, lockToken, 'NX', 'PX', 30000);
    }

    console.log(`[LOCK QRCODE] userId:${id} | acquired:${acquired ? 'OK' : 'null'} | time:${moment().format('HH:mm:ss.SSS')}`);

    if (!acquired) {
        return res.status(429).json({ 
            success: false, 
            message: 'Absensi sedang diproses, silakan coba lagi dalam 2 detik.' 
        });
    }

    // ==================== PROSES UTAMA ====================
    try {
        const isStudent = role?.toLowerCase?.() === 'siswa' || role === 'student';

        // Ambil Profil dengan Cache
        const profileCacheKey = `user_profile:${isStudent ? 'student' : 'guru'}:${id}`;
        let userProfile = await redis.get(profileCacheKey);

        if (userProfile) {
            userProfile = JSON.parse(userProfile);
        } else {
            userProfile = isStudent
                ? await Student.findByPk(id, { 
                    attributes: ['id', 'name', 'class', 'photoUrl', 'nis'], 
                    raw: true 
                  })
                : await GuruTendik.findByPk(id, { 
                    attributes: ['id', 'nama', 'photoUrl', 'nip', 'role'], 
                    raw: true 
                  });

            if (!userProfile) {
                await redis.del(lockKey);
                return res.status(404).json({ 
                    success: false, 
                    message: "Profil tidak ditemukan" 
                });
            }

            await redis.set(profileCacheKey, JSON.stringify(userProfile), 'EX', 3600);
        }

        const scanTime = moment2().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

        // Queue untuk simpan ke database
        await attendanceQueue.add('create-attendance', {
            id,
            schoolId,
            userRole: isStudent ? 'student' : 'teacher',
            studentId: isStudent ? id : null,
            guruId: isStudent ? null : id,
            currentClass: isStudent 
                ? (userProfile.class || userProfile.kelas || 'Unknown') 
                : 'GURU/STAFF',
            latitude: userLat,
            longitude: userLon,
            qrPosition,
            createdAt: scanTime, // Terkunci di WIB jam scan asli
            updatedAt: scanTime,
            method: 'qr',
            targetTable:  isStudent ? 'kehadiran' : 'kehadiran_guru', // ← tambah ini
        }, {
            attempts: 3,
            backoff: { type: 'fixed', delay: 3000 }, // ← fix dari number ke object
            // jobId: `${schoolId}-${id}-${today}`,
            jobId: `${schoolId}-${isStudent ? 'student' : 'guru'}-${id}-${today}-${Date.now()}`, 
            removeOnComplete: true,
            removeOnFail: true
        });

        // Socket.io emit (fire and forget)
        setImmediate(() => {
            try {
                const io = req.app.get('socketio');
                if (io) {
                    io.to(`school-${schoolId}`).emit('attendance:new', {
                        student: {
                            id: userProfile.id,
                            name: userProfile.name || userProfile.nama,
                            class: isStudent 
                                ? (userProfile.class || userProfile.kelas) 
                                : 'GURU/STAFF',
                            photo: userProfile.photoUrl,
                            time: moment().format("HH:mm:ss")
                        },
                        qrPosition
                    });
                }
            } catch (socketErr) {
                console.warn(`[SOCKET WARN] userId:${id} | ${socketErr.message}`);
            }
        });

        // Set flag absensi permanen
        await redis.set(checkKey, '1', 'EX', secondsUntilEndOfDay);

        return res.json({ 
            success: true, 
            message: "Absensi Berhasil!" 
        });

    } catch (err) {
        console.error(`[ERROR ABSENSI] userId:${id} |`, err.message);
        console.error(err.stack);   // ← Ini sangat penting untuk debug

        return res.status(500).json({ 
            success: false, 
            message: "Gagal memproses absensi. Silakan coba lagi." 
        });
    } finally {
        // Selalu bersihkan lock
        await redis.del(lockKey).catch(() => {});
    }
};

exports.loginWithQR = async (req, res) => {
  try {
    const { qrCodeData, role: requestedRole } = req.body; // role opsional: 'siswa' atau 'guru'

    if (!qrCodeData) {
      return res.status(400).json({ success: false, message: 'QR Code data diperlukan' });
    }

    let user = null;
    let finalRole = null;
    let profile = null;

    // 1. Coba cari di tabel Siswa dulu
    user = await Student.findOne({
      where: { 
        qrCodeData, 
        isActive: true 
      }
    });

    if (user) {
      finalRole = 'siswa';
      profile = user.toJSON();
      profile.role = 'siswa';
      
      // Ambil info sekolah (sama seperti login biasa)
      const school = await SchoolProfile.findOne({
        where: { schoolId: user.schoolId },
        attributes: ['logoUrl', 'latitude', 'longitude']
      });
      
      if (school) {
        profile.schoolLogo = school.logoUrl;
        profile.schoolLocation = {
          lat: school.latitude,
          lng: school.longitude,
          radiusMeter: 200
        };
      }
    } 
    // 2. Jika bukan siswa, coba cari di GuruTendik
    else {
      user = await GuruTendik.findOne({
        where: { 
          qrCodeData, 
          isActive: true 
        }
      });

      if (user) {
        finalRole = 'guru';
        profile = user.toJSON();
        profile.role = 'guru';
        profile.name = user.nama; // alias supaya seragam
        
        // Ambil logo sekolah
        const school = await SchoolProfile.findOne({
          where: { schoolId: user.schoolId },
          attributes: ['logoUrl']
        });
        if (school) profile.schoolLogo = school.logoUrl;
      }
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'QR Code tidak valid atau akun tidak aktif.' 
      });
    }

    // Hapus field sensitif
    delete profile.password;
    delete profile.createdAt;
    delete profile.updatedAt;

    // Generate JWT (sama seperti login biasa)
    const token = jwt.sign(
      { profile },
      process.env.JWT_SECRET || 'secret_key_anda',
      { expiresIn: '1d' }
    );

    res.json({ 
      success: true, 
      token, 
      data: profile,
      role: finalRole 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.loginWithQRNew = async (req, res) => {
  try {
    const { qrCodeData } = req.body; // Ini adalah sessionId (UUID) dari layar Perpus
    
    // req.user biasanya diisi oleh middleware verifyToken Anda
    // Pastikan strukturnya sama dengan format login manual (data: profile)
    const userProfile = req.user.profile || req.user;
    
    if (userProfile.role === 'Siswa' || userProfile.role === 'siswa') {
      return res.status(403).json({ 
        success: false, 
        message: 'Akses Ditolak: siswa tidak diizinkan!' 
      });
    }

    if (!qrCodeData) {
      return res.status(400).json({ success: false, message: 'Session ID diperlukan' });
    }

    // 1. Ambil instance io yang tadi kita simpan di app.set
    const io = req.app.get('socketio');

    const room = io.sockets.adapter.rooms.get(qrCodeData);
    console.log(`[EMIT TARGET] room='${qrCodeData}' | clients=${room?.size ?? 0}`);

    // ✅ Generate token baru dari data req.user hasil decode middleware
    const webToken = jwt.sign(
      { 
        id: userProfile.id, 
        role: userProfile.role,
        schoolId: userProfile.schoolId // sesuaikan field yang ada di payload token kamu
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    // 2. Kirim data login ke Web Perpus yang sedang menunggu di room 'qrCodeData'
    // Format payload disesuaikan dengan kebutuhan Vokadash (token & user)
    io.to(qrCodeData).emit('login-success', {
      token: webToken, // Meneruskan token aktif HP
      user: userProfile // Data profile lengkap siswa/guru
    });

    // console.log('[profile user]', userProfile)

    return res.json({ 
      success: true, 
      message: 'Autentikasi berhasil dikirim ke perangkat tujuan.' 
    });

  } catch (err) {
    console.error("Socket Emit Error:", err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Update FCM Token for notifications
exports.updateFcmToken = async (req, res) => {
  try {
    const { userId, fcmToken, role } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({ success: false, message: 'userId and fcmToken required' });
    }

    // Store/update FCM token in database (depending on role)
    // This is a placeholder - implement according to your FCM storage model
    // For now just return success
    console.log(`[FCM] Token updated for ${role}:${userId}`);

    return res.json({ success: true, message: 'FCM token updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};