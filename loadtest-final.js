const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const http = require('http');

const HOST = 'http://localhost:5005';
const ENDPOINT = '/scan-qr/double-qr';
const TOTAL_STUDENTS = 10000;
const SCHOOL_ID = 1;
const JWT_SECRET = 'BESCHOOLNEW';

const CLASSES = [
  'X RPL 1', 'X RPL 2', 'X TKJ 1', 'X TKJ 2',
  'XI RPL 1', 'XI RPL 2', 'XI TKJ 1', 'XI TKJ 2',
  'XII RPL 1', 'XII RPL 2', 'XII TKJ 1', 'XII TKJ 2',
];

const C = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

// Helper: single HTTP request
function singleRequest(token, userId) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      qrCodeData: `SCHOOL_QR_${SCHOOL_ID}_LEFT`,
      userLat: -6.9175,
      userLon: 107.6191,
    });

    const options = {
      hostname: 'localhost',
      port: 5005,
      path: ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ userId, status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ userId, status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => resolve({ userId, status: 0, body: err.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`${C.cyan}${C.bold}=============================================${C.reset}`);
  console.log(`${C.cyan}${C.bold}  KIRAPROJECT - FINAL LOAD TEST ABSENSI QR   ${C.reset}`);
  console.log(`${C.cyan}${C.bold}=============================================${C.reset}\n`);

  // 1. Generate Tokens
  console.log(`${C.yellow}[1/3] Generating ${TOTAL_STUDENTS} JWT tokens...${C.reset}`);
  const tokens = Array.from({ length: TOTAL_STUDENTS }, (_, i) => {
    const studentId = i + 1;
    const kelas = CLASSES[i % CLASSES.length];
    const payload = {
      profile: {
        id: studentId,
        schoolId: SCHOOL_ID,
        name: `Siswa Test ${studentId}`,
        role: 'siswa',
        class: kelas
      }
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
  });
  console.log(`${C.green}      ${TOTAL_STUDENTS} tokens generated.${C.reset}\n`);

  // 2. Flush Redis
  const today = new Date().toISOString().split('T')[0];
  console.log(`${C.yellow}[2/3] Flushing Redis locks...${C.reset}`);
  const redis = new Redis({ host: '127.0.0.1', port: 6379 });
  const pipeline = redis.pipeline();
  for (let i = 1; i <= TOTAL_STUDENTS; i++) {
    pipeline.del(`absensi_check:${SCHOOL_ID}:${i}:${today}`);
    pipeline.del(`absensi_lock:${SCHOOL_ID}:${i}:${today}`);
  }
  await pipeline.exec();
  await redis.quit();
  console.log(`${C.green}      Redis flushed successfully.${C.reset}\n`);

  // ==================== FINAL LOAD TEST ====================
  let success = 0;
  let tooManyRequests = 0;
  let alreadyAbsen = 0;
  let otherFail = 0;
  const startTime = Date.now();

  console.log(`Progress: `);

    for (let i = 0; i < TOTAL_STUDENTS; i++) {
        const result = await singleRequest(tokens[i], i + 1);

        if (result.status === 200) {
        success++;
        process.stdout.write(`${C.green}✓${C.reset}`);
        } else if (result.status === 429) {
        tooManyRequests++;
        process.stdout.write(`${C.yellow}⏳${C.reset}`);
        } else if (result.status === 400) {
        alreadyAbsen++;
        process.stdout.write(`${C.yellow}⛔${C.reset}`);
        } else {
        otherFail++;
        process.stdout.write(`${C.red}✗${C.reset}`);
        }

        // Jeda lebih agresif untuk 3000 siswa (rata-rata 100ms)
        // Supaya test tidak terlalu lama tapi tetap realistis
        const delay = (i % 50 === 0) ? 200 : 80; 
        await new Promise(r => setTimeout(r, delay));

        // Tambahkan baris baru setiap 100 simbol agar tidak meluber di terminal
        if ((i + 1) % 100 === 0) console.log(` [${i + 1}/${TOTAL_STUDENTS}]`);
    }

  const durationSec = (Date.now() - startTime) / 1000;
  const successRate = ((success / TOTAL_STUDENTS) * 100).toFixed(1);
  const avgReqPerSec = (TOTAL_STUDENTS / durationSec).toFixed(1);

  console.log(`\n\n${C.cyan}${C.bold}=============================================${C.reset}`);
  console.log(`${C.cyan}${C.bold}                 HASIL FINAL TEST                ${C.reset}`);
  console.log(`${C.cyan}${C.bold}=============================================${C.reset}`);

  console.log(`  Total Siswa Test       : ${TOTAL_STUDENTS} siswa`);
  console.log(`  Sukses Absen           : ${C.green}${success} (${successRate}%)${C.reset}`);
  console.log(`  Too Many Requests (429): ${C.yellow}${tooManyRequests}${C.reset}`);
  console.log(`  Sudah Absen (400)      : ${C.yellow}${alreadyAbsen}${C.reset}`);
  console.log(`  Gagal Lainnya          : ${C.red}${otherFail}${C.reset}`);
  console.log(`  Durasi Total Test      : ${durationSec.toFixed(1)} detik (± ${Math.round(durationSec/60)} menit)`);
  console.log(`  Kecepatan Rata-rata    : ${avgReqPerSec} siswa per detik`);

  console.log(`\n${C.cyan}Interpretasi Lapangan:${C.reset}`);
  if (successRate >= 95) {
    console.log(`  ${C.green}✓ SISTEM SIAP PRODUCTION! Sangat stabil.${C.reset}`);
    console.log(`    • 1000 siswa bisa absen dalam ±6 menit`);
    console.log(`    • Hampir tidak ada antrian`);
  } else if (successRate >= 85) {
    console.log(`  ${C.yellow}⚠ Cukup baik, tapi masih bisa dioptimasi.${C.reset}`);
  } else {
    console.log(`  ${C.red}✗ Perlu perbaikan lebih lanjut.${C.reset}`);
  }

  console.log(`${C.cyan}${C.bold}=============================================${C.reset}\n`);
}

main().catch(err => {
  console.error(`${C.red}[FATAL] ${err.message}${C.reset}`);
});