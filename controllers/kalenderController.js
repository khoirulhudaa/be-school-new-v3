const CalendarEvent = require('../models/kalender');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAllCalendarEvents = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const events = await CalendarEvent.findAll({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
      order: [['date', 'ASC']],  // Urutkan berdasarkan tanggal terdekat
    });

    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCalendarEvent = async (req, res) => {
  try {
    const { title, date, category, description, location, schoolId } = req.body;

    if (!title || !date || !category || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'title, date, category, dan schoolId wajib diisi' 
      });
    }

    // Validasi format tanggal sederhana (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Format date harus YYYY-MM-DD' 
      });
    }

    let photoUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
      photoUrl = result.secure_url;
    }

    const newEvent = await CalendarEvent.create({ 
      title, 
      date,
      category,
      description: description || null,
      photoUrl,
      location: location || null,
      schoolId: parseInt(schoolId)
    });

    res.status(201).json({ success: true, data: newEvent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, category, description, location } = req.body;

    const event = await CalendarEvent.findByPk(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
    }

    const oldPhotoUrl = event.photoUrl;

    // Update field yang dikirim
    if (title) event.title = title;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: 'Format date harus YYYY-MM-DD' });
      }
      event.date = date;
    }
    if (category) event.category = category;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;

    // Handle photo baru
    if (req.file) {
      // Hapus foto lama jika ada
      if (oldPhotoUrl) {
        const publicId = oldPhotoUrl.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Foto lama dihapus: ${publicId}`);
        } catch (err) {
          console.log(`Gagal hapus foto lama: ${err.message}`);
        }
      }

      // Upload foto baru
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
      event.photoUrl = result.secure_url;
    }

    await event.save();

    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await CalendarEvent.findByPk(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
    }

    // Hapus foto dari Cloudinary jika ada
    if (event.photoUrl) {
      const publicId = event.photoUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Foto dihapus: ${publicId}`);
      } catch (err) {
        console.log(`Gagal hapus foto: ${err.message}`);
      }
    }

    // Soft delete
    event.isActive = false;
    await event.save();

    res.json({ success: true, message: 'Kegiatan berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};