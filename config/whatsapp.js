const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { execSync } = require('child_process');

// Auto-detect path chromium
const getChromiumPath = () => {
  const paths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium', 
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
  ];
  
  for (const p of paths) {
    try {
      execSync(`test -f ${p}`);
      return p;
    } catch {}
  }
  return null;
};

let client = null;
let isReady = false;
let qrCodeData = null;

const initWhatsApp = () => {
  const chromiumPath = getChromiumPath();
  console.log('🔍 Chromium path:', chromiumPath || 'NOT FOUND');

  if (client) {
    console.log('[WA] Client sudah ada, skip re-init');
    return client;
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './wa_session'
    }),
    puppeteer: {
      headless: true,
      // Gunakan path yang ditemukan, atau biarkan default
      ...(chromiumPath && { executablePath: chromiumPath }),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
      ]
    }
  });

  client.on('qr', (qr) => {
    qrCodeData = qr;
    isReady = false;
    qrcode.generate(qr, { small: true });
    console.log('📱 QR Code generated, scan sekarang!');
  });

  client.on('loading_screen', (percent, message) => {
    console.log('⏳ Loading WA:', percent, message);
  });

  client.on('authenticated', () => {
    console.log('🔐 WA Authenticated!');
  });

  client.on('ready', () => {
    isReady = true;
    qrCodeData = null;
    console.log('✅ WhatsApp siap!');
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    qrCodeData = null;
    console.log('❌ WA disconnect:', reason);
    // Hapus session lama sebelum reconnect
    setTimeout(() => initWhatsApp(), 5000);
  });

  client.on('auth_failure', (msg) => {
    isReady = false;
    console.log('❌ Auth failure:', msg);
    // Hapus session agar bisa scan ulang
    const fs = require('fs');
    try {
      fs.rmSync('./wa_session', { recursive: true, force: true });
      console.log('🗑️ Session lama dihapus, akan generate QR baru');
    } catch {}
    setTimeout(() => initWhatsApp(), 3000);
  });

  client.initialize().catch(err => {
    console.error('❌ WA init error:', err.message);
  });

  return client;
};

const waitUntilReady = (timeoutMs = 30000) => {
  return new Promise((resolve, reject) => {
    if (isReady) return resolve(true);
    
    const timer = setTimeout(() => {
      reject(new Error('WA timeout'));
    }, timeoutMs);

    const interval = setInterval(() => {
      if (isReady) {
        clearTimeout(timer);
        clearInterval(interval);
        resolve(true);
      }
    }, 500);
  });
};

// Rate limit tracker
const sendTracker = {
  date: null,
  count: 0,
  MAX_PER_DAY: 50, // maksimal 50 pesan per hari
};

const canSendMessage = () => {
  const today = new Date().toISOString().split('T')[0];
  
  // Reset counter kalau hari baru
  if (sendTracker.date !== today) {
    sendTracker.date = today;
    sendTracker.count = 0;
  }

  return sendTracker.count < sendTracker.MAX_PER_DAY;
};

const incrementSendCount = () => {
  sendTracker.count++;
  console.log(`[WA RateLimit] Pesan terkirim hari ini: ${sendTracker.count}/${sendTracker.MAX_PER_DAY}`);
};

const getSendStats = () => ({
  date: sendTracker.date,
  sent: sendTracker.count,
  remaining: sendTracker.MAX_PER_DAY - sendTracker.count,
  max: sendTracker.MAX_PER_DAY,
});

const getClient = () => client;
const getIsReady = () => isReady;
const getQRCode = () => qrCodeData;

module.exports = { 
  initWhatsApp, getClient, getIsReady, getQRCode, waitUntilReady,
  canSendMessage, incrementSendCount, getSendStats
};