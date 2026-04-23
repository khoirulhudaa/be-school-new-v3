const Setting = require('../models/settingRating');

exports.getSettings = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId required' });

    const [setting] = await Setting.findOrCreate({
      where: { schoolId: parseInt(schoolId) },
      defaults: { showRatingStats: true }
    });

    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { schoolId, showRatingStats } = req.body;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId required' });

    // upsert akan mengupdate jika ID ada, atau membuat jika tidak ada
    await Setting.upsert({
      schoolId: parseInt(schoolId),
      showRatingStats: showRatingStats
    });

    res.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};