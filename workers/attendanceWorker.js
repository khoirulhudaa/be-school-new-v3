require('dotenv').config();

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const Attendance    = require('../models/kehadiran');
const KehadiranGuru = require('../models/kehadiranGuru');

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const worker = new Worker(
  'attendance-queue',
  async job => {
  
    const data = job.data;
  
    // UTAMAKAN CEK targetTable YANG DIKIRIM CONTROLLER
    const saveToGuruTable = data.targetTable === 'kehadiran_guru' || data.userRole === 'teacher';
    const originalTime = data.createdAt;

    console.log(`[WORKER] Memproses Job: ${job.id}`);
    console.log(`[WORKER] Role: ${data.userRole} | Target: ${data.targetTable} | Decision: ${saveToGuruTable ? 'GURU' : 'SISWA'}`);

    if (saveToGuruTable) {
      // ── Guru / Tendik → kehadiran_guru ──────────────────────────────────
      await KehadiranGuru.create({
        schoolId:     data.schoolId,
        guruId:       data.guruId,
        userRole:     'teacher',
        status:       'Hadir',
        currentClass: data.currentClass || null,
        latitude:     data.latitude,
        longitude:    data.longitude,
        method:       data.method || null,
        createdAt:    originalTime, // <-- MASUKKAN DISINI
        updatedAt:    originalTime
      });

    } else {
      // ── Siswa → kehadiran (tabel lama, tidak berubah) ───────────────────
      await Attendance.create({
        studentId:    data.studentId,
        guruId:       null,
        userRole:     data.userRole,
        schoolId:     data.schoolId,
        currentClass: data.currentClass,
        status:       'Hadir',
        latitude:     data.latitude,
        longitude:    data.longitude,
        createdAt:    originalTime, // <-- MASUKKAN DISINI
        updatedAt:    originalTime
      });

    }
  },
  {
    connection,
    concurrency: 50
  }
);

worker.on('completed', job => {
  console.log(`[WORKER] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[WORKER] Job ${job?.id} failed:`, err.message);
});