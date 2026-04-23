// const Student     = require('../models/siswa');
// const redis       = require('../config/redis');
// const moment      = require('moment');
// const attendanceQueue = require('../queues/attendanceQueue');
// const SchoolProfile   = require('../models/profileSekolah');

// // Helper Haversine (sama seperti di scanQr)
// function getDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371e3;
//     const φ1 = lat1 * Math.PI / 180;
//     const φ2 = lat2 * Math.PI / 180;
//     const Δφ = (lat2 - lat1) * Math.PI / 180;
//     const Δλ = (lon2 - lon1) * Math.PI / 180;
//     const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
// }

// // ── 1. ENROLLMENT / UPDATE WAJAH ───────────────────────────────────────────
// exports.enrollFace = async (req, res) => {
//     try {
//         const { descriptor } = req.body;
//         const profile = req.user?.profile || req.user;

//         if (!profile) return res.status(401).json({ success: false, message: 'Sesi tidak valid' });
//         if (profile.role !== 'siswa' && profile.role !== 'student') {
//             return res.status(403).json({ success: false, message: 'Hanya siswa yang bisa mendaftarkan wajah' });
//         }
//         if (!descriptor || descriptor.length !== 128) {
//             return res.status(400).json({ success: false, message: 'Descriptor wajah tidak valid' });
//         }

//         // Cek apakah sudah pernah enroll sebelumnya
//         const existingStudent = await Student.findByPk(profile.id, {
//             attributes: ['faceDescriptor', 'faceEnrolledAt', 'name']
//         });

//         const isUpdate = !!existingStudent?.faceDescriptor;

//         await Student.update(
//             {
//                 faceDescriptor: JSON.stringify(descriptor),
//                 faceEnrolledAt: new Date(),
//             },
//             { where: { id: profile.id } }
//         );

//         // Hapus cache agar data terbaru terbaca
//         await redis.del(`user_profile:student:${profile.id}`).catch(() => {});

//         return res.json({ 
//             success: true, 
//             message: isUpdate 
//                 ? '✅ Data wajah berhasil diperbarui!' 
//                 : '✅ Wajah berhasil didaftarkan!',
//             isUpdate: isUpdate
//         });

//     } catch (err) {
//         console.error('[ENROLL FACE ERROR]:', err);

//         if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
//             return res.status(503).json({ 
//                 success: false, 
//                 message: 'Gagal terhubung ke database. Silakan coba beberapa saat lagi.' 
//             });
//         }

//         res.status(500).json({ 
//             success: false, 
//             message: `Gagal menyimpan data wajah: ${err.message}` 
//         });
//     }
// };

// // ── 2. GET DESCRIPTOR ──────────────────────────────────────────────────────
// exports.getDescriptor = async (req, res) => {
//     try {
//         const profile = req.user?.profile || req.user;
//         if (!profile) return res.status(401).json({ success: false, message: 'Sesi tidak valid' });

//         const student = await Student.findByPk(profile.id, {
//             attributes: ['faceDescriptor', 'faceEnrolledAt']
//         });

//         if (!student?.faceDescriptor) {
//             return res.json({ success: true, enrolled: false });
//         }

//         return res.json({
//             success:     true,
//             enrolled:    true,
//             descriptor:  JSON.parse(student.faceDescriptor),
//             enrolledAt:  student.faceEnrolledAt,
//         });
//     } catch (err) {
//         console.error('[GET DESCRIPTOR]', err.message);
//         res.status(500).json({ success: false, message: 'Gagal ambil data wajah' });
//     }
// };

// // ── 3. ABSENSI VIA WAJAH ──────────────────────────────────────────────────
// exports.faceAbsen = async (req, res) => {
//     const { userLat, userLon, faceDistance } = req.body;
//     const profile = req.user?.profile || req.user;

//     if (!profile) return res.status(401).json({ success: false, message: 'Sesi tidak valid' });

//     const { id, role, schoolId } = profile;

//     // Validasi faceDistance dari client
//     if (!faceDistance || faceDistance > 0.45) {
//         return res.status(400).json({ success: false, message: 'Verifikasi wajah gagal' });
//     }

//     // ── Redis check sudah absen ────────────────────────────────────────────
//     const today    = moment().format('YYYY-MM-DD');
//     const checkKey = `absensi_check:${schoolId}:${id}:${today}`;
//     const lockKey  = `absensi_lock:${schoolId}:${id}:${today}`;
//     const secondsUntilEndOfDay = moment().endOf('day').diff(moment(), 'seconds');

//     const alreadyAbsen = await redis.get(checkKey);
//     if (alreadyAbsen) {
//         return res.status(400).json({ success: false, message: 'Anda sudah absen hari ini.' });
//     }

//     // ── Redis lock ─────────────────────────────────────────────────────────
//     const lockToken = `lock-${id}-${Date.now()}`;
//     let acquired = await redis.set(lockKey, lockToken, 'NX', 'PX', 30000);
//     console.log(`[LOCK FACE] userId:${id} | acquired:${acquired ? 'OK' : 'FAILED'} | time:${moment().format('HH:mm:ss.SSS')} | schoolId:${schoolId}`);
//     if (!acquired) {
//         await new Promise(r => setTimeout(r, 800));
//         acquired = await redis.set(lockKey, lockToken, 'NX', 'PX', 30000);
//     }
//     if (!acquired) {
//         return res.status(429).json({ success: false, message: 'Sedang diproses, coba lagi.' });
//     }

//     try {
//         // ── Geofencing ────────────────────────────────────────────────────
//         let school = await redis.get(`school_profile:${schoolId}`);
//         school = school ? JSON.parse(school) : await SchoolProfile.findOne({ where: { schoolId }, raw: true });

//         if (school?.latitude && school?.longitude) {
//             const distance = getDistance(userLat, userLon, parseFloat(school.latitude), parseFloat(school.longitude));
//             if (distance > 200) {
//                 await redis.del(lockKey);
//                 return res.status(403).json({ success: false, message: `Luar jangkauan (${Math.round(distance)}m)` });
//             }
//         }

//         // ── Ambil profil siswa ────────────────────────────────────────────
//         const profileCacheKey = `user_profile:student:${id}`;
//         let userProfile = await redis.get(profileCacheKey);
//         userProfile = userProfile ? JSON.parse(userProfile) : await Student.findByPk(id, {
//             attributes: ['id', 'name', 'class', 'photoUrl', 'nis'],
//             raw: true
//         });

//         if (!userProfile) {
//             await redis.del(lockKey);
//             return res.status(404).json({ success: false, message: 'Profil tidak ditemukan' });
//         }

//         // Cache profil
//         if (!await redis.get(profileCacheKey)) {
//             await redis.set(profileCacheKey, JSON.stringify(userProfile), 'EX', 3600);
//         }

//         // ── Masukkan ke queue (sama seperti double-qr) ────────────────────
//         await attendanceQueue.add('create-attendance', {
//             id,
//             schoolId,
//             userRole:     'student',
//             studentId:    id,
//             guruId:       null,
//             currentClass: userProfile.class || 'Unknown',
//             latitude:     userLat,
//             longitude:    userLon,
//             method:       'face',           // ← ini yang kamu minta
//             qrPosition:   null, // ← penanda absen via wajah
//             faceDistance,
//         }, {
//             attempts: 3,
//             backoff:  3000,
//             jobId:    `${schoolId}-${id}-${today}-face`,
//             removeOnComplete: true,
//             removeOnFail:     false,
//         });

//         // ── Socket emit ke TV ─────────────────────────────────────────────
//         setImmediate(() => {
//             try {
//                 const io = req.app.get('socketio');
//                 if (io) {
//                     io.to(`school-${schoolId}`).emit('attendance:face', {
//                         success: true,
//                         method: 'face',
//                         student: {
//                             id:    userProfile.id,
//                             name:  userProfile.name,
//                             class: userProfile.class,
//                             photo: userProfile.photoUrl,
//                             time:  moment().format('HH:mm:ss'),
//                         },
//                         faceDistance: faceDistance,
//                         message: 'Absensi wajah berhasil'
//                     });
//                 }
//             } catch (e) {
//                 console.warn('[SOCKET WARN face]', e.message);
//             }
//         });

//         await redis.set(checkKey, '1', 'EX', secondsUntilEndOfDay);

//         return res.json({ success: true, message: 'Absensi wajah berhasil!' });

//     } catch (err) {
//         console.error('[FACE ABSEN]', err.message);
//         return res.status(500).json({ success: false, message: 'Gagal memproses absensi' });
//     } finally {
//         await redis.del(lockKey).catch(() => {});
//     }
// };


const Student         = require('../models/siswa');
const GuruTendik      = require('../models/guruTendik');
const redis           = require('../config/redis');
const moment          = require('moment');
const moment2 = require('moment-timezone'); // Pastikan import ini ada
const attendanceQueue = require('../queues/attendanceQueue');
const SchoolProfile   = require('../models/profileSekolah');

function getDistance(lat1, lon1, lat2, lon2) {
    const R  = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function resolveProfile(req) {
    return req.user?.profile || req.user || null;
}

function isGuru(role = '') {
    return role.toLowerCase() !== 'siswa' && role.toLowerCase() !== 'student';
}

function getModel(role) {
    return isGuru(role) ? GuruTendik : Student;
}

function cachePrefix(role) {
    return isGuru(role) ? 'user_profile:guru' : 'user_profile:student';
}

exports.enrollFace = async (req, res) => {
    try {
        const { descriptor } = req.body;
        const profile = resolveProfile(req);

        if (!profile) {
            return res.status(401).json({ success: false, message: 'Sesi tidak valid' });
        }

        const { id, role } = profile;
        const Model = getModel(role);

        // Validasi: hanya siswa / guru / tendik
        if (!['siswa', 'student', 'guru', 'teacher', 'tendik'].includes(role?.toLowerCase())) {
            return res.status(403).json({ success: false, message: 'Role tidak diizinkan untuk enroll wajah' });
        }

        if (!descriptor || descriptor.length !== 128) {
            return res.status(400).json({ success: false, message: 'Descriptor wajah tidak valid (harus 128 float)' });
        }

        // Cek apakah sudah pernah enroll
        const existing = await Model.findByPk(id, {
            attributes: ['faceDescriptor'],
        });
        const isUpdate = !!existing?.faceDescriptor;

        await Model.update(
            { faceDescriptor: JSON.stringify(descriptor), faceEnrolledAt: new Date() },
            { where: { id } }
        );

        // Hapus cache agar data terbaru terbaca saat absen
        await redis.del(`${cachePrefix(role)}:${id}`).catch(() => {});

        return res.json({
            success:  true,
            message:  isUpdate ? '✅ Data wajah berhasil diperbarui!' : '✅ Wajah berhasil didaftarkan!',
            isUpdate,
        });

    } catch (err) {
        console.error('[ENROLL FACE ERROR]:', err);

        if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
            return res.status(503).json({ success: false, message: 'Gagal terhubung ke database.' });
        }

        return res.status(500).json({ success: false, message: `Gagal menyimpan data wajah: ${err.message}` });
    }
};

// ── 2. GET DESCRIPTOR ────────────────────────────────────────────────────────

exports.getDescriptor = async (req, res) => {
    try {
        const profile = resolveProfile(req);
        if (!profile) {
            return res.status(401).json({ success: false, message: 'Sesi tidak valid' });
        }

        const { id, role } = profile;
        const Model = getModel(role);

        const user = await Model.findByPk(id, {
            attributes: ['faceDescriptor', 'faceEnrolledAt'],
        });

        if (!user?.faceDescriptor) {
            return res.json({ success: true, enrolled: false });
        }

        return res.json({
            success:    true,
            enrolled:   true,
            descriptor: JSON.parse(user.faceDescriptor),
            enrolledAt: user.faceEnrolledAt,
        });

    } catch (err) {
        console.error('[GET DESCRIPTOR]', err.message);
        return res.status(500).json({ success: false, message: 'Gagal ambil data wajah' });
    }
};

// ── 3. ABSENSI VIA WAJAH ─────────────────────────────────────────────────────

exports.faceAbsen = async (req, res) => {
    const { userLat, userLon, faceDistance } = req.body;
    const profile = resolveProfile(req);

    if (!profile) {
        return res.status(401).json({ success: false, message: 'Sesi tidak valid' });
    }

    const { id, role, schoolId } = profile;
    const guruMode = isGuru(role);

    // ── Validasi faceDistance dari client ─────────────────────────────────
    if (!faceDistance || faceDistance > 0.45) {
        return res.status(400).json({ success: false, message: 'Verifikasi wajah gagal (jarak terlalu jauh)' });
    }

    // ── Redis guard: sudah absen hari ini? ────────────────────────────────
    const today               = moment().format('YYYY-MM-DD');
    const entityKey           = guruMode ? `guru:${id}` : `student:${id}`;
    const checkKey            = `absensi_check:${schoolId}:${entityKey}:${today}`;
    const lockKey             = `absensi_lock:${schoolId}:${entityKey}:${today}`;
    const secondsUntilEndOfDay = moment().endOf('day').diff(moment(), 'seconds');

    const alreadyAbsen = await redis.get(checkKey);
    if (alreadyAbsen) {
        return res.status(400).json({ success: false, message: 'Anda sudah absen hari ini.' });
    }

    // ── Redis distributed lock ────────────────────────────────────────────
    const lockToken = `lock-face-${id}-${Date.now()}`;
    let acquired = await redis.set(lockKey, lockToken, 'NX', 'PX', 30000);

    console.log(`[LOCK FACE] role:${role} id:${id} | acquired:${acquired ? 'OK' : 'FAILED'} | ${moment().format('HH:mm:ss.SSS')}`);

    if (!acquired) {
        await new Promise(r => setTimeout(r, 800));
        acquired = await redis.set(lockKey, lockToken, 'NX', 'PX', 30000);
    }
    if (!acquired) {
        return res.status(429).json({ success: false, message: 'Sedang diproses, coba lagi sebentar.' });
    }

    try {
        // ── Geofencing ────────────────────────────────────────────────────
        let school = await redis.get(`school_profile:${schoolId}`);
        school = school
            ? JSON.parse(school)
            : await SchoolProfile.findOne({ where: { schoolId }, raw: true });

        if (school?.latitude && school?.longitude) {
            const distance = getDistance(
                userLat, userLon,
                parseFloat(school.latitude), parseFloat(school.longitude)
            );
            if (distance > 200) {
                await redis.del(lockKey);
                return res.status(403).json({
                    success: false,
                    message: `Di luar jangkauan sekolah (${Math.round(distance)}m dari lokasi sekolah)`,
                });
            }
        }

        // ── Ambil profil user (cached) ────────────────────────────────────
        const profileCacheKey = `${cachePrefix(role)}:${id}`;
        let userProfile = await redis.get(profileCacheKey);

        if (!userProfile) {
            const Model      = getModel(role);
            const attributes = guruMode
                ? ['id', 'nama', 'role', 'photoUrl', 'nip']   // GuruTendik
                : ['id', 'name', 'class', 'photoUrl', 'nis'];  // Student

            const raw = await Model.findByPk(id, { attributes, raw: true });
            if (!raw) {
                await redis.del(lockKey);
                return res.status(404).json({ success: false, message: 'Profil tidak ditemukan' });
            }

            await redis.set(profileCacheKey, JSON.stringify(raw), 'EX', 3600);
            userProfile = raw;
        } else {
            userProfile = JSON.parse(userProfile);
        }

        // ── Masukkan ke attendance queue ──────────────────────────────────
        const jobId = `${schoolId}-${guruMode ? 'guru' : 'student'}-${id}-${today}-face`;
        const scanTime = moment2().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

        await attendanceQueue.add('create-attendance', {
            id,
            schoolId,
            userRole:     guruMode ? 'teacher' : 'student',
            studentId:    guruMode ? null : id,
            guruId:       guruMode ? id : null,
            currentClass: 'GURU/STAFF',
            latitude:     userLat,
            longitude:    userLon,
            method:       'face',
            qrPosition:   null,
            faceDistance,
            createdAt: scanTime, // Terkunci di WIB jam scan asli
            updatedAt: scanTime,
            // flag untuk worker agar tahu tabel tujuan
            targetTable:  guruMode ? 'kehadiran_guru' : 'kehadiran',
        }, {
            attempts:         3,
            backoff:          3000,
            jobId,
            removeOnComplete: true,
            removeOnFail:     false,
        });

        // ── Socket emit ke TV ─────────────────────────────────────────────
        setImmediate(() => {
            try {
                const io = req.app.get('socketio');
                if (io) {
                    const displayName = guruMode ? userProfile.nama : userProfile.name;
                    io.to(`school-${schoolId}`).emit('attendance:face', {
                        success:      true,
                        method:       'face',
                        userType:     guruMode ? 'guru' : 'student',
                        student: {
                            id:    userProfile.id,
                            name:  displayName,
                            class: userProfile.class || userProfile.role || '-',
                            photo: userProfile.photoUrl,
                            time:  moment().format('HH:mm:ss'),
                        },
                        faceDistance,
                        message: 'Absensi wajah berhasil',
                    });
                }
            } catch (e) {
                console.warn('[SOCKET WARN face]', e.message);
            }
        });

        // ── Tandai sudah absen di Redis ───────────────────────────────────
        await redis.set(checkKey, '1', 'EX', secondsUntilEndOfDay);

        return res.json({ success: true, message: '✅ Absensi wajah berhasil!' });

    } catch (err) {
        console.error('[FACE ABSEN ERROR]', err.message);
        return res.status(500).json({ success: false, message: 'Gagal memproses absensi' });
    } finally {
        // Selalu lepas lock
        await redis.del(lockKey).catch(() => {});
    }
};