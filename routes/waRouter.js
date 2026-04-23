const express = require('express');
const router = express.Router();
const { getIsReady, getQRCode, getClient } = require('../config/whatsapp');
const qrcode = require('qrcode');

// GET /wa/status — cek apakah WA sudah login
router.get('/status', (req, res) => {
  res.json({
    success: true,
    isReady: getIsReady(),
    hasQR: !!getQRCode()
  });
});

// GET /wa/qr — ambil QR code sebagai base64 image
router.get('/qr', async (req, res) => {
  const qr = getQRCode();
  if (!qr) {
    return res.json({ 
      success: false, 
      message: getIsReady() ? 'WhatsApp sudah login' : 'QR belum tersedia, tunggu sebentar' 
    });
  }

  try {
    const qrImage = await qrcode.toDataURL(qr);
    res.json({ success: true, qrImage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /wa/send — kirim pesan manual (untuk testing)
router.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  const client = getClient();

  if (!getIsReady()) {
    return res.status(400).json({ success: false, message: 'WhatsApp belum siap' });
  }

  try {
    const chatId = `${phone}@c.us`;
    await client.sendMessage(chatId, message);
    res.json({ success: true, message: `Pesan terkirim ke ${phone}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// routes wa.js
router.get('/wa/send-stats', (req, res) => {
  const { getSendStats } = require('../config/whatsapp');
  res.json({ success: true, stats: getSendStats() });
});

router.post('/reconnect', async (req, res) => {
  try {
    const { getIsReady, initWhatsApp } = require('../config/whatsapp');
    
    if (getIsReady()) {
      return res.json({ success: true, message: 'WA sudah terhubung' });
    }

    // Reinit dengan session yang ada (tidak hapus session)
    initWhatsApp();
    
    res.json({ 
      success: true, 
      message: 'Mencoba reconnect dengan session lama...' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;