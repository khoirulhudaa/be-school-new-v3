const GalleryItem = require('../models/galleryItem');
const Album = require('../models/album');
const fs = require('fs').promises;
const path = require('path');

exports.getGalleryItems = async (req, res) => {
  try {
    const { albumId, isActive } = req.query;
    if (!albumId) {
      return res.status(400).json({ success: false, message: 'albumId wajib' });
    }

    const where = { albumId: parseInt(albumId) };
    if (isActive === 'true') where.isActive = true;

    const items = await GalleryItem.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createGalleryItem = async (req, res) => {
  try {
    const { albumId, title, description } = req.body;
    if (!albumId || !title || !description || !req.file) {
      return res.status(400).json({ success: false, message: 'Semua field wajib + image' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const newItem = await GalleryItem.create({ albumId, title, description, imageUrl });

    // Update counter album
    await Album.increment('itemCount', { where: { id: albumId } });

    res.json({ success: true, data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Gallery Item
exports.updateGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const item = await GalleryItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item galeri tidak ditemukan' });
    }

    const oldImageUrl = item.imageUrl;

    if (title) item.title = title;
    if (description) item.description = description;

    if (req.file) {
      // Hapus file lama jika ada dan benar-benar exist
      if (oldImageUrl) {
        const oldPath = path.join(__dirname, '..', oldImageUrl);
        
        try {
          await fs.access(oldPath, fs.constants.F_OK);
          await fs.unlink(oldPath);
          console.log(`File lama dihapus: ${oldPath}`);
        } catch (err) {
          console.log(`File lama tidak ditemukan atau gagal dihapus: ${oldPath}`);
        }
      }

      item.imageUrl = `/uploads/${req.file.filename}`;
    }

    await item.save();

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Soft Delete Gallery Item
exports.deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await GalleryItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item galeri tidak ditemukan' });
    }

    // Soft delete
    item.isActive = false;
    await item.save();

    // Kurangi counter album (opsional, tapi direkomendasikan)
    await Album.decrement('itemCount', { where: { id: item.albumId } });

    // Optional: hard delete
    // await item.destroy();

    res.json({ success: true, message: 'Item galeri berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};