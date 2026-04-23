const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middlewares/protect');
const optionalAuthMiddleware = require('../middlewares/optionalLimiter');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get featured alumni (spotlight)
router.get('/featured', optionalAuthMiddleware, async (req, res) => {
  try {
    const { schoolId, limit = 5 } = req.query;
    const { Alumni } = require('../models');

    const where = { isFeatured: true, isActive: true };
    if (schoolId) where.schoolId = schoolId;

    const alumni = await Alumni.findAll({
      where,
      order: [['graduationYear', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ success: true, data: alumni });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get alumni stats
router.get('/stats', optionalAuthMiddleware, async (req, res) => {
  try {
    const { schoolId } = req.query;
    const { Alumni } = require('../models');

    const where = { isActive: true };
    if (schoolId) where.schoolId = schoolId;

    const totalAlumni = await Alumni.count({ where });

    // Get stats by graduation year
    const byYear = await Alumni.findAll({
      where,
      attributes: ['graduationYear'],
      group: ['graduationYear'],
      order: [['graduationYear', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        totalAlumni,
        byYear: byYear.map(y => ({ year: y.graduationYear, count: y.count }))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get alumni contributors (alumni with stories)
router.get('/contributors', optionalAuthMiddleware, async (req, res) => {
  try {
    const { schoolId, limit = 20, page = 1 } = req.query;
    const { Alumni } = require('../models');

    const where = { isActive: true, hasStory: true };
    if (schoolId) where.schoolId = schoolId;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Alumni.findAndCountAll({
      where,
      order: [['graduationYear', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get alumni by ID
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { Alumni } = require('../models');

    const alumni = await Alumni.findByPk(id);
    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni not found' });
    }

    res.json({ success: true, data: alumni });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit alumni contribution/story
router.post('/contribute', upload.single('photoUrl'), async (req, res) => {
  try {
    const { schoolId, name, graduationYear, university, currentJob, story, contact } = req.body;
    const { Alumni } = require('../models');

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/alumni/${req.file.originalname}`;
    }

    const alumni = await Alumni.create({
      schoolId: schoolId || null,
      name,
      graduationYear: parseInt(graduationYear),
      university: university || '',
      currentJob: currentJob || '',
      story: story || '',
      contact: contact || '',
      photoUrl: imageUrl,
      isActive: false, // Need admin approval
      isFeatured: false,
      hasStory: story ? true : false
    });

    res.json({ success: true, data: alumni, message: 'Contribution submitted for review' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;