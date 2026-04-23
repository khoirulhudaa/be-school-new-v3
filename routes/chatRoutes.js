const express = require('express');
const router = express.Router();

// Chat routes - placeholder only
// Actual chat server runs on port 4000 as separate service
// This router provides configuration/discovery endpoints

router.get('/config', (req, res) => {
  res.json({
    success: true,
    chatServer: 'separate-service',
    port: 4000,
    message: 'Chat functionality is handled by separate server on port 4000',
  });
});

router.get('/rooms/:userId', (req, res) => {
  // Proxy to port 4000 or return redirect info
  res.json({
    success: true,
    message: 'Redirect to chat server on port 4000',
    endpoint: 'ws://server:4000/rooms/' + req.params.userId,
  });
});

module.exports = router;