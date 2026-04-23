// const express = require('express');
// const router = express.Router();
// const scanQrController = require('../controllers/scanQrCodeStatis');
// const scanQrMiddleware = require('../middlewares/scanQrStatis');
// const { strictLimiter } = require('../middlewares/rateLimiter');
// const stressTestMiddleware = require('../middlewares/stressTestMiddleware');

// router.post('/', strictLimiter, scanQrMiddleware, scanQrController.scanSelf);
// // router.post('/double-qr', strictLimiter, scanQrMiddleware, scanQrController.scanSelfDoubleQr);
// router.post(
//     '/double-qr',
//     // strictLimiter,
//     // stressTestMiddleware,
//     // ...(isStressTest ? [] : [scanQrMiddleware]), // skip auth middleware saat stress test
//     scanQrController.scanSelfDoubleQr
// );
// router.post('/login-qr', scanQrController.loginWithQR);   // atau siswaController.loginWithQR
// router.post('/login-qr-new', scanQrMiddleware, scanQrController.loginWithQRNew);   // atau siswaController.loginWithQR

// module.exports = router;


const express = require('express');
const router = express.Router();
const scanQrController = require('../controllers/scanQrCodeStatis');
const scanQrMiddleware = require('../middlewares/scanQrStatis');
const { strictLimiter, globalLimiter } = require('../middlewares/rateLimiter');

router.post('/', scanQrMiddleware, strictLimiter, scanQrController.scanSelf);
router.post('/double-qr', scanQrMiddleware, globalLimiter, scanQrController.scanSelfDoubleQr);
router.post('/login-qr', scanQrController.loginWithQR);   // atau siswaController.loginWithQR
router.post('/login-qr-new', scanQrMiddleware, scanQrController.loginWithQRNew);   // atau siswaController.loginWithQR
router.post('/update-fcm-token', scanQrController.updateFcmToken);

module.exports = router;