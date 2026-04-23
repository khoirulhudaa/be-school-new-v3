const Album = require('../models/album');
const fs = require('fs').promises;
const path = require('path');

exports.getAllAlbums = async (req, res) => {
  try {
    const { schoolId, includeItems } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const where = { 
      schoolId: parseInt(schoolId),
      isActive: true 
    };

    let albums = await Album.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    if (includeItems === 'true') {
      albums = await Promise.all(albums.map(async (album) => {
        const items = await album.getGalleryItems({
          where: { isActive: true },
          order: [['createdAt', 'DESC']],
        });
        return { ...album.dataValues, items: items.map(item => item.dataValues) };
      }));
    }

    res.json({ success: true, data: albums });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAlbum = async (req, res) => {
  try {
    const { title, description, schoolId } = req.body;

    if (!title || !description || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, description, dan schoolId wajib diisi' 
      });
    }

    let coverUrl = null;
    if (req.file) {
      coverUrl = `/uploads/${req.file.filename}`;
    }

    const newAlbum = await Album.create({ 
      title, 
      description, 
      coverUrl,
      schoolId: parseInt(schoolId)  // pastikan integer
    });

    res.json({ success: true, data: newAlbum });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const album = await Album.findByPk(id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album tidak ditemukan' });
    }

    const oldCoverUrl = album.coverUrl;

    // Update field yang dikirim
    if (title) album.title = title;
    if (description) album.description = description;

    // Jika ada file cover baru
    if (req.file) {
      // Hapus file lama JIKA ada dan file benar-benar exist di disk
      if (oldCoverUrl) {
        const oldPath = path.join(__dirname, '..', oldCoverUrl);
        
        try {
          // Cek apakah file benar-benar ada
          await fs.access(oldPath, fs.constants.F_OK);
          // Jika sampai sini berarti file ada → hapus
          await fs.unlink(oldPath);
          console.log(`File lama dihapus: ${oldPath}`);
        } catch (err) {
          // File tidak ada atau tidak bisa diakses → skip dengan aman
          console.log(`File lama tidak ditemukan atau gagal dihapus: ${oldPath}`);
        }
      }

      // Simpan path file baru
      album.coverUrl = `/uploads/${req.file.filename}`;
    }

    await album.save();

    res.json({ success: true, data: album });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Soft Delete Album (update isActive menjadi false)
exports.deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Album.findByPk(id);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album tidak ditemukan' });
    }

    // Soft delete
    album.isActive = false;
    await album.save();

    // Optional: bisa juga hard delete
    // await album.destroy();

    res.json({ success: true, message: 'Album berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};