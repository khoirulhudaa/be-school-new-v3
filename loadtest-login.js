const http = require('http');

const HOST      = 'localhost';
const PORT      = 5005;
const ENDPOINT  = '/siswa/login'; 
const SCHOOL_ID = 1;

// ── Konfigurasi Load Test ──────────────────────────────────────────────────
const TOTAL_REQUESTS = 5000;  
const CONCURRENCY    = 50;    // Jumlah request yang dikirim SEKALIGUS per batch
const DELAY_MS       = 10;    // Jeda antar batch (ms)

// Generate dummy accounts
const TEST_ACCOUNTS = Array.from({ length: TOTAL_REQUESTS }, (_, i) => ({
    email:    `siswa${i + 1}@test.com`, 
    password: 'sekolah123',
    schoolId: SCHOOL_ID,
}));

const C = {
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    red:    '\x1b[31m',
    cyan:   '\x1b[36m',
    bold:   '\x1b[1m',
    reset:  '\x1b[0m',
};

// Variabel Counter Global
let success = 0, notFound = 0, wrongPassword = 0, tooMany = 0, serverError = 0, otherFail = 0;
const latencies = [];

// ── Fungsi Request Tunggal ─────────────────────────────────────────────────
function singleRequest(account, index) {
    return new Promise((resolve) => {
        const body = JSON.stringify({
            email:    account.email,
            password: account.password,
            schoolId: account.schoolId,
        });

        const options = {
            hostname: HOST,
            port:     PORT,
            path:     ENDPOINT,
            method:   'POST',
            headers: {
                'Content-Type':   'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const startTime = Date.now();

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const latency = Date.now() - startTime;
                let parsedBody;
                try { parsedBody = JSON.parse(data); } catch { parsedBody = data; }
                
                resolve({ index, status: res.statusCode, body: parsedBody, latency });
            });
        });

        req.on('error', (err) => resolve({
            index, status: 0, body: err.message, latency: Date.now() - startTime,
        }));

        req.write(body);
        req.end();
    });
}

// ── Handler Output Progress ───────────────────────────────────────────────
function handleResult(result) {
    latencies.push(result.latency);
    switch (result.status) {
        case 200: success++; process.stdout.write(`${C.green}✓${C.reset}`); break;
        case 404: notFound++; process.stdout.write(`${C.yellow}?${C.reset}`); break;
        case 401: wrongPassword++; process.stdout.write(`${C.yellow}✗${C.reset}`); break;
        case 429: tooMany++; process.stdout.write(`${C.yellow}⏳${C.reset}`); break;
        case 500: serverError++; process.stdout.write(`${C.red}💥${C.reset}`); break;
        default: 
            otherFail++; 
            process.stdout.write(`${C.red}!!${C.reset}`);
            // Log error selain status di atas jika diperlukan
            // console.log(`\nErr ${result.status}: ${JSON.stringify(result.body)}`);
    }
}

// ── Main Logic ─────────────────────────────────────────────────────────────
async function main() {
    console.log(`${C.cyan}${C.bold}=============================================${C.reset}`);
    console.log(`${C.cyan}${C.bold}    KIRAPROJECT - HIGH SPEED LOAD TEST       ${C.reset}`);
    console.log(`${C.cyan}${C.bold}=============================================${C.reset}\n`);
    console.log(`  Target     : http://${HOST}:${PORT}${ENDPOINT}`);
    console.log(`  Total Req  : ${TOTAL_REQUESTS}`);
    console.log(`  Batch Size : ${CONCURRENCY} req sekaligus`);
    console.log(`  Batch Gap  : ${DELAY_MS}ms\n`);

    const startTime = Date.now();
    let currentBatch = [];

    console.log(`Progress:`);

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        // Tambahkan ke antrean batch
        currentBatch.push(singleRequest(TEST_ACCOUNTS[i], i + 1).then(handleResult));

        // Jika batch sudah penuh atau ini request terakhir
        if (currentBatch.length === CONCURRENCY || i === TOTAL_REQUESTS - 1) {
            await Promise.all(currentBatch); // Jalankan semua secara paralel
            currentBatch = []; // Reset batch
            
            // Beri nafas sedikit untuk event loop Node.js
            if (DELAY_MS > 0) await new Promise(r => setTimeout(r, DELAY_MS));
        }

        // Baris baru setiap 100 request agar rapi
        if ((i + 1) % 100 === 0) {
            console.log(` [${i + 1}/${TOTAL_REQUESTS}]`);
        }
    }

    // Kalkulasi Statistik
    const durationSec  = (Date.now() - startTime) / 1000;
    const avgLatency   = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0);
    const sortedLat    = [...latencies].sort((a, b) => a - b);
    const p95Latency   = sortedLat[Math.floor(latencies.length * 0.95)];
    const reqPerSec    = (TOTAL_REQUESTS / durationSec).toFixed(1);

    console.log(`\n\n${C.cyan}${C.bold}=============================================${C.reset}`);
    console.log(`${C.cyan}${C.bold}             HASIL AKHIR TEST                ${C.reset}`);
    console.log(`${C.cyan}${C.bold}=============================================${C.reset}`);

    console.log(`\n  📊 ${C.bold}Status Response:${C.reset}`);
    console.log(`  200 OK           : ${C.green}${success}${C.reset}`);
    console.log(`  404 Not Found    : ${C.yellow}${notFound}${C.reset}`);
    console.log(`  401 Unauthorized : ${C.yellow}${wrongPassword}${C.reset}`);
    console.log(`  429 Rate Limit   : ${C.yellow}${tooMany}${C.reset}`);
    console.log(`  500 Server Err   : ${C.red}${serverError}${C.reset}`);
    console.log(`  Lainnya/Error    : ${C.red}${otherFail}${C.reset}`);

    console.log(`\n  ⚡ ${C.bold}Performa:${C.reset}`);
    console.log(`  Total Waktu      : ${durationSec.toFixed(2)} detik`);
    console.log(`  Throughput       : ${reqPerSec} req/detik`);
    console.log(`  Latency Avg      : ${avgLatency}ms`);
    console.log(`  Latency P95      : ${p95Latency}ms`);

    console.log(`\n  📋 ${C.bold}Analisis:${C.reset}`);
    if (tooMany > 0) console.log(`  ${C.yellow}⚠ Rate Limiter AKTIF (Memblokir ${tooMany} req)${C.reset}`);
    if (serverError > 0) console.log(`  ${C.red}✗ Server CRASH/OVERLOAD (${serverError} error)${C.reset}`);
    if (success > 0 && serverError === 0) console.log(`  ${C.green}✓ Endpoint Stabil under load.${C.reset}`);
    
    console.log(`${C.cyan}${C.bold}=============================================${C.reset}\n`);
}

main().catch(err => {
    console.error(`\n${C.red}[FATAL] ${err.message}${C.reset}`);
    process.exit(1);
});