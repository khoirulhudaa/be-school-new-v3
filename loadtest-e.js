const http = require('http');

const HOST      = 'localhost';
const PORT      = 5005;
const ENDPOINT  = '/pengumuman'; // Endpoint GET yang dituju

// ── Konfigurasi Load Test ──────────────────────────────────────────────────
const TOTAL_REQUESTS = 3000;  
const CONCURRENCY    = 100;   // Batch size ditingkatkan karena GET biasanya lebih ringan
const DELAY_MS       = 5;     

const C = {
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    red:    '\x1b[31m',
    cyan:   '\x1b[36m',
    bold:   '\x1b[1m',
    reset:  '\x1b[0m',
};

// Variabel Counter Global
let success = 0, notFound = 0, serverError = 0, otherFail = 0;
const latencies = [];

// ── Fungsi Request Tunggal (GET) ───────────────────────────────────────────
function singleRequest(index) {
    return new Promise((resolve) => {
        const options = {
            hostname: HOST,
            port:     PORT,
            path:     ENDPOINT,
            method:   'GET', // Method diubah ke GET
            headers: {
                'Accept': 'application/json',
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

        // GET tidak perlu req.write(body)
        req.end();
    });
}

// ── Handler Output Progress ───────────────────────────────────────────────
function handleResult(result) {
    latencies.push(result.latency);
    switch (result.status) {
        case 200: success++; process.stdout.write(`${C.green}✓${C.reset}`); break;
        case 429: tooMany++; process.stdout.write(`${C.yellow}⏳${C.reset}`); break; // Tambahkan ini
        case 500: serverError++; process.stdout.write(`${C.red}💥${C.reset}`); break;
        default: 
            otherFail++; 
            // Munculkan angka statusnya jika bukan yang di atas
            process.stdout.write(`${C.red}${result.status}${C.reset}`); 
    }
}

// ── Main Logic ─────────────────────────────────────────────────────────────
async function main() {
    console.log(`${C.cyan}${C.bold}=============================================${C.reset}`);
    console.log(`${C.cyan}${C.bold}    KIRAPROJECT - GET ENDPOINT LOAD TEST     ${C.reset}`);
    console.log(`${C.cyan}${C.bold}=============================================${C.reset}\n`);
    console.log(`  Target     : http://${HOST}:${PORT}${ENDPOINT}`);
    console.log(`  Method     : GET`);
    console.log(`  Total Req  : ${TOTAL_REQUESTS}`);
    console.log(`  Batch Size : ${CONCURRENCY}\n`);

    const startTime = Date.now();
    let currentBatch = [];

    console.log(`Progress:`);
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        currentBatch.push(singleRequest(i + 1).then(handleResult));

        if (currentBatch.length === CONCURRENCY || i === TOTAL_REQUESTS - 1) {
            await Promise.all(currentBatch);
            currentBatch = [];
            
            if (DELAY_MS > 0) await new Promise(r => setTimeout(r, DELAY_MS));
        }

        if ((i + 1) % 100 === 0) {
            console.log(` [${i + 1}/${TOTAL_REQUESTS}]`);
        }
    }

    // Statistik
    const durationSec  = (Date.now() - startTime) / 1000;
    const avgLatency   = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0);
    const sortedLat    = [...latencies].sort((a, b) => a - b);
    const p95Latency   = sortedLat[Math.floor(latencies.length * 0.95)];
    const reqPerSec    = (TOTAL_REQUESTS / durationSec).toFixed(1);

    console.log(`\n\n${C.cyan}${C.bold}=============================================${C.reset}`);
    console.log(`${C.cyan}${C.bold}             HASIL AKHIR TEST                ${C.reset}`);
    console.log(`${C.cyan}${C.bold}=============================================${C.reset}`);
    console.log(`\n  📊 Status Response:`);
    console.log(`  200 OK           : ${C.green}${success}${C.reset}`);
    console.log(`  404 Not Found    : ${C.yellow}${notFound}${C.reset}`);
    console.log(`  500 Server Err   : ${C.red}${serverError}${C.reset}`);
    console.log(`  Lainnya/Error    : ${C.red}${otherFail}${C.reset}`);
    console.log(`\n  ⚡ Performa:`);
    console.log(`  Total Waktu      : ${durationSec.toFixed(2)} detik`);
    console.log(`  Throughput       : ${reqPerSec} req/detik`);
    console.log(`  Latency Avg      : ${avgLatency}ms`);
    console.log(`  Latency P95      : ${p95Latency}ms`);
    console.log(`${C.cyan}${C.bold}=============================================${C.reset}\n`);
}

main().catch(err => {
    console.error(`\n${C.red}[FATAL] ${err.message}${C.reset}`);
    process.exit(1);
});