const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');

// Get notifications for current logged user
router.get('/', protect, notificationsController.getMyNotifications);
router.get('/unread-count', protect, notificationsController.getUnreadCount);

// Get by user (legacy support)
router.get('/user/:userId', optionalAuth, notificationsController.getByUser);
router.get('/user/:userId/unread', optionalAuth, notificationsController.getUnread);
router.post('/user/:userId/read-all', protect, notificationsController.markAllRead);
router.post('/:id/read', protect, notificationsController.markRead);
router.post('/read-all', protect, notificationsController.markAllReadMine);
router.post('/send', protect, notificationsController.send);
router.post('/broadcast', protect, notificationsController.broadcast);
router.post('/send-to-user', protect, notificationsController.sendToUser);

const adminFirebase = require('../config/firebase');
const notifMiddleware = require('../middlewares/notifMiddleware');

// Admin subscribe ke topic sekolahnya
// Dipanggil saat: (1) login, (2) browser dapat FCM token baru
router.post('/subscribe-topic', notifMiddleware, async (req, res) => {
  const { fcmToken } = req.body;
  const { schoolId } = req.user; // dari JWT admin

  if (!fcmToken) {
    return res.status(400).json({ success: false, message: 'fcmToken wajib diisi' });
  }

  const topic = `school_absensi_${schoolId}`;

  try {
    await adminFirebase.messaging().subscribeToTopic([fcmToken], topic);
    res.json({ success: true, message: `Subscribed ke topic ${topic}` });
  } catch (err) {
    console.error('Subscribe topic error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin unsubscribe saat logout
router.post('/unsubscribe-topic', notifMiddleware, async (req, res) => {
  const { fcmToken } = req.body;
  const { schoolId } = req.user;

  if (!fcmToken) {
    return res.status(400).json({ success: false, message: 'fcmToken wajib diisi' });
  }

  const topic = `school_absensi_${schoolId}`;

  try {
    await adminFirebase.messaging().unsubscribeFromTopic([fcmToken], topic);
    res.json({ success: true, message: `Unsubscribed dari topic ${topic}` });
  } catch (err) {
    console.error('Unsubscribe topic error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;