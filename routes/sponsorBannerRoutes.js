const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middlewares/protect');
const optionalAuth = require('../middlewares/optionalLimiter');
const SponsorBanners = require('../models/sponsor_banners');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get active banners for siswa app
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { schoolId } = req.query;
    const where = { isActive: 1 };
    if (schoolId) where.schoolId = schoolId;

    const banners = await SponsorBanners.findAll({
      where,
      order: [['displayOrder', 'ASC']],
      limit: 10
    });
    res.json({ success: true, data: banners });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all banners for admin
router.get('/admin', protect, async (req, res) => {
  try {
    const banners = await SponsorBanners.findAll({
      order: [['displayOrder', 'ASC']],
    });
    res.json({ success: true, data: banners });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create banner
router.post('/', protect, upload.single('imageUrl'), async (req, res) => {
  try {
    const { schoolId, title, subtitle, bgColorStart, bgColorEnd, textColor, accentColor, actionUrl, actionLabel, bannerType, displayDurationSeconds, displayOrder, isActive } = req.body;

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/banners/${req.file.originalname}`;
    }

    const banner = await SponsorBanners.create({
      schoolId: schoolId || null,
      title,
      subtitle: subtitle || '',
      bgColorStart: bgColorStart || '#1B5E20',
      bgColorEnd: bgColorEnd || '#2E7D32',
      textColor: textColor || '#FFFFFF',
      accentColor: accentColor || '#FFFFEB3B',
      imageUrl,
      actionUrl: actionUrl || '',
      actionLabel: actionLabel || '',
      bannerType: bannerType || 'sponsor',
      displayDurationSeconds: displayDurationSeconds || 10,
      displayOrder: displayOrder || 0,
      isActive: isActive !== '0' ? 1 : 0
    });

    res.json({ success: true, data: banner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update banner
router.put('/:id', protect, upload.single('imageUrl'), async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await SponsorBanners.findByPk(id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    const { title, subtitle, bgColorStart, bgColorEnd, textColor, accentColor, actionUrl, actionLabel, bannerType, displayDurationSeconds, displayOrder, isActive } = req.body;

    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (bgColorStart !== undefined) banner.bgColorStart = bgColorStart;
    if (bgColorEnd !== undefined) banner.bgColorEnd = bgColorEnd;
    if (textColor !== undefined) banner.textColor = textColor;
    if (accentColor !== undefined) banner.accentColor = accentColor;
    if (actionUrl !== undefined) banner.actionUrl = actionUrl;
    if (actionLabel !== undefined) banner.actionLabel = actionLabel;
    if (bannerType !== undefined) banner.bannerType = bannerType;
    if (displayDurationSeconds !== undefined) banner.displayDurationSeconds = displayDurationSeconds;
    if (displayOrder !== undefined) banner.displayOrder = displayOrder;
    if (isActive !== undefined) banner.isActive = isActive === '1' ? 1 : 0;

    if (req.file) {
      banner.imageUrl = `/uploads/banners/${req.file.originalname}`;
    }

    await banner.save();
    res.json({ success: true, data: banner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete banner
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await SponsorBanners.findByPk(id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    await banner.destroy();
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;