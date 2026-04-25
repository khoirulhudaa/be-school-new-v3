const BannerPricing = require('../models/BannerPricing');
const SponsorBanners = require('../models/sponsor_banners');

// Default plans — dipakai saat seed atau plan tidak ditemukan
const DEFAULT_PLANS = {
  basic: {
    planId: 'basic',
    name: 'Basic',
    price: 50000,
    period: 'per bulan',
    views: '5.000 views/bulan',
    duration: 5,
    maxBanners: 3,
    commissionFee: 2,
    features: [
      'Tampil di homepage siswa saja',
      'Durasi 5 detik per slide',
      'Maksimal 3 banner aktif',
      'Tidak ada custom warna',
      'Support email only',
    ],
  },
  premium: {
    planId: 'premium',
    name: 'Premium',
    price: 150000,
    period: 'per bulan',
    views: '20.000 views/bulan',
    duration: 10,
    maxBanners: 10,
    commissionFee: 2,
    features: [
      'Tampil di homepage semua role (siswa, guru, ortu)',
      'Durasi 10 detik per slide',
      'Maksimal 10 banner aktif',
      'Custom warna background',
      'Custom CTA button',
      'Support chat & email',
      'Monthly report',
    ],
  },
  platinum: {
    planId: 'platinum',
    name: 'Platinum',
    price: 300000,
    period: 'per bulan',
    views: '100.000 views/bulan',
    duration: 20,
    maxBanners: 999,
    commissionFee: 2,
    features: [
      'Tampil di SEMUA halaman + push notification',
      'Durasi 20 detik per slide',
      'Banner unlimited',
      'Top priority placement (selalu paling atas)',
      'Full analytics dashboard',
      'Custom warna & logo',
      'A/B testing capability',
      'Dedicated account manager',
      'Priority support 24/7',
    ],
  },
};

// ─── Seed default plans jika tabel kosong ────────────────────────────────────
const seedDefaultPlans = async () => {
  const count = await BannerPricing.count();
  if (count === 0) {
    await BannerPricing.bulkCreate(Object.values(DEFAULT_PLANS));
    console.log('[BannerPricing] Default plans seeded.');
  }
};

// ─── GET /banner-pricing ─────────────────────────────────────────────────────
// Return semua plan sebagai object { basic: {...}, premium: {...}, platinum: {...} }
const getAllPricing = async (req, res) => {
  try {
    await seedDefaultPlans();

    const plans = await BannerPricing.findAll({
      where: { isActive: 1 },
      order: [['price', 'ASC']],
    });

    // Ubah array → object by planId agar kompatibel dengan frontend
    const data = {};
    plans.forEach((p) => {
      data[p.planId] = p.toJSON();
    });

    // Jika ada plan default yang belum ada di DB, sertakan dari konstanta
    Object.keys(DEFAULT_PLANS).forEach((key) => {
      if (!data[key]) data[key] = DEFAULT_PLANS[key];
    });

    return res.json({ success: true, data });
  } catch (err) {
    console.error('[getAllPricing]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /banner-pricing/:planId ─────────────────────────────────────────────
const getPricingByPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await BannerPricing.findOne({ where: { planId } });

    if (!plan) {
      // Kembalikan default jika plan tidak ditemukan di DB
      if (DEFAULT_PLANS[planId]) {
        return res.json({ success: true, data: DEFAULT_PLANS[planId] });
      }
      return res.status(404).json({ success: false, message: 'Plan tidak ditemukan' });
    }

    return res.json({ success: true, data: plan });
  } catch (err) {
    console.error('[getPricingByPlan]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Buat plan baru (planId custom, misal: enterprise)
const createPricing = async (req, res) => {
  try {
    const {
      planId,
      name,
      price,
      period,
      views,
      duration,
      maxBanners,
      commissionFee,
      features
    } = req.body;

    if (!planId || !name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'planId, name, dan price wajib diisi'
      });
    }

    const existing = await BannerPricing.findOne({ where: { planId } });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Plan "${planId}" sudah ada. Gunakan PUT untuk update.`
      });
    }

    const plan = await BannerPricing.create({
      planId,
      name,
      price: Number(price),
      period: period || 'per bulan',
      views: views || '',
      duration: Number(duration) || 5,
      maxBanners: Number(maxBanners) || 3,
      commissionFee: Number(commissionFee) || 2,
      features: Array.isArray(features) ? features : [],
      isActive: 1,
    });

    return res.status(201).json({
      success: true,
      data: plan,
      message: 'Plan berhasil dibuat'
    });

  } catch (err) {
    console.error('[createPricing]', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ─── PUT /banner-pricing/:planId ─────────────────────────────────────────────
// Update plan yang sudah ada; jika belum ada, buat baru (upsert)
const updatePricing = async (req, res) => {
  try {
    const { planId } = req.params;
    const { name, price, period, views, duration, maxBanners, commissionFee, features, isActive } = req.body;

    let plan = await BannerPricing.findOne({ where: { planId } });

    if (!plan) {
      // Upsert: buat baru jika belum ada
      plan = await BannerPricing.create({
        planId,
        name: name || planId,
        price: Number(price) || 0,
        period: period || 'per bulan',
        views: views || '',
        duration: Number(duration) || 5,
        maxBanners: Number(maxBanners) || 3,
        commissionFee: Number(commissionFee) || 2,
        features: Array.isArray(features) ? features : [],
        isActive: isActive !== undefined ? Number(isActive) : 1,
      });
      return res.status(201).json({ success: true, data: plan, message: 'Plan dibuat (upsert)' });
    }

    // Update fields yang dikirim saja
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (price !== undefined) updateFields.price = Number(price);
    if (period !== undefined) updateFields.period = period;
    if (views !== undefined) updateFields.views = views;
    if (duration !== undefined) updateFields.duration = Number(duration);
    if (maxBanners !== undefined) updateFields.maxBanners = Number(maxBanners);
    if (commissionFee !== undefined) updateFields.commissionFee = Number(commissionFee);
    if (features !== undefined) updateFields.features = Array.isArray(features) ? features : [];
    if (isActive !== undefined) updateFields.isActive = Number(isActive);

    await plan.update(updateFields);
    await plan.reload();

    return res.json({ success: true, data: plan, message: 'Plan berhasil diperbarui' });
  } catch (err) {
    console.error('[updatePricing]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /banner-pricing/:planId ──────────────────────────────────────────
// Soft delete (isActive = 0), atau hard delete jika ?hard=true
const deletePricing = async (req, res) => {
  try {
    const { planId } = req.params;
    const hard = req.query.hard === 'true';

    const plan = await BannerPricing.findOne({ where: { planId } });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan tidak ditemukan' });
    }

    if (hard) {
      await plan.destroy();
      return res.json({ success: true, message: `Plan "${planId}" dihapus permanen` });
    }

    // Soft delete
    await plan.update({ isActive: 0 });
    return res.json({ success: true, message: `Plan "${planId}" dinonaktifkan` });
  } catch (err) {
    console.error('[deletePricing]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /banner-pricing/reset-defaults ─────────────────────────────────────
// Reset semua plan ke nilai default
const resetToDefaults = async (req, res) => {
  try {
    for (const [planId, defaults] of Object.entries(DEFAULT_PLANS)) {
      await BannerPricing.upsert({ ...defaults });
    }
    return res.json({ success: true, message: 'Semua plan direset ke nilai default' });
  } catch (err) {
    console.error('[resetToDefaults]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllPricing,
  getPricingByPlan,
  createPricing,
  updatePricing,
  deletePricing,
  resetToDefaults,
};