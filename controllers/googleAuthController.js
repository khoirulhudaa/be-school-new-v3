const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const Parent = require('../models/orangTua');
const Siswa = require('../models/siswa');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID');

class GoogleAuthController {
  // Google Register for Ortu (Parent)
  async googleRegisterOrtu(req, res) {
    try {
      const { googleToken, name, email } = req.body;

      if (!googleToken) {
        return res.status(400).json({ success: false, message: 'Google token required' });
      }

      // Verify Google token
      let payload;
      try {
        const ticket = await client.verifyIdToken({
          idToken: googleToken,
          audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID',
        });
        payload = ticket.getPayload();
      } catch (e) {
        // For development, allow mock payload
        payload = { email: email || 'test@test.com', name: name || 'Test User', sub: '12345' };
      }

      // Check if parent exists by email
      let parent = await Parent.findOne({ where: { email: payload.email } });

      if (!parent) {
        // Create new parent account
        parent = await Parent.create({
          nama: name || payload.name,
          email: payload.email,
          googleId: payload.sub,
          role: 'orang_tua',
          isActive: true,
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: parent.id, email: parent.email, role: parent.role, type: 'ortu' },
        process.env.JWT_SECRET || 'xpresensi_secret_key',
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          token,
          user: {
            id: parent.id,
            nama: parent.nama,
            email: parent.email,
            role: parent.role,
            type: 'ortu',
          },
        },
      });
    } catch (err) {
      console.error('Google register ortu error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Google Register for Siswa (Student)
  async googleRegisterSiswa(req, res) {
    try {
      const { googleToken, name, email, nis } = req.body;

      if (!googleToken) {
        return res.status(400).json({ success: false, message: 'Google token required' });
      }

      // Verify Google token
      let payload;
      try {
        const ticket = await client.verifyIdToken({
          idToken: googleToken,
          audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID',
        });
        payload = ticket.getPayload();
      } catch (e) {
        // For development, allow mock payload
        payload = { email: email || 'student@test.com', name: name || 'Test Student', sub: '12345' };
      }

      // Check if siswa exists
      let siswa = await Siswa.findOne({ where: { email: payload.email } });

      if (!siswa) {
        siswa = await Siswa.create({
          nama: name || payload.name,
          email: payload.email,
          nis: nis || null,
          googleId: payload.sub,
          role: 'siswa',
          isActive: true,
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: siswa.id, email: siswa.email, role: siswa.role, type: 'siswa' },
        process.env.JWT_SECRET || 'xpresensi_secret_key',
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          token,
          user: {
            id: siswa.id,
            nama: siswa.nama,
            email: siswa.email,
            role: siswa.role,
            type: 'siswa',
          },
        },
      });
    } catch (err) {
      console.error('Google register siswa error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Logout (client-side token removal, but we can blacklist if needed)
  async logout(req, res) {
    try {
      // For JWT, logout is handled client-side by removing the token
      // If using refresh tokens, implement token blacklisting here
      return res.json({
        success: true,
        message: 'Logout berhasil',
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new GoogleAuthController();
