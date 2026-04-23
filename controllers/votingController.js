const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Candidate = require('../models/kandidat');
const VoteCode = require('../models/voteCode');

// Helper upload gambar ke Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'osis_voting' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// --- LOGIKA KANDIDAT ---

// Ambil kandidat (Filter by schoolId)
exports.getCandidates = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId required' });

    const data = await Candidate.findAll({ 
      where: { schoolId, isActive: true },
      order: [['id', 'ASC']]
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// createCandidate
exports.createCandidate = async (req, res) => {
  try {
    const { schoolId, mission, ...rest } = req.body;

    if (!schoolId) return res.status(400).json({ success: false, message: "schoolId wajib ada!" });

    let chairmanImg = null;
    let viceChairmanImg = null;

    if (req.files) {
      if (req.files.chairmanImg) {
        const res1 = await uploadToCloudinary(req.files.chairmanImg[0].buffer);
        chairmanImg = res1.secure_url;
      }
      if (req.files.viceChairmanImg) {
        const res2 = await uploadToCloudinary(req.files.viceChairmanImg[0].buffer);
        viceChairmanImg = res2.secure_url;
      }
    }

    // Parse mission jika dikirim sebagai string JSON dari frontend
    let missionArray = [];
    if (typeof mission === 'string') {
      try {
        missionArray = JSON.parse(mission);
      } catch (e) {
        missionArray = mission.split('\n').filter(Boolean); // fallback: split per baris
      }
    } else if (Array.isArray(mission)) {
      missionArray = mission;
    }

    const candidate = await Candidate.create({
      ...rest,
      schoolId,
      mission: missionArray,
      chairmanImageUrl: chairmanImg,
      viceChairmanImageUrl: viceChairmanImg,
    });

    res.status(201).json({ success: true, data: candidate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// updateCandidate
exports.updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByPk(id);
    if (!candidate) return res.status(404).json({ success: false, message: "Kandidat tidak ditemukan" });

    let chairmanImg = candidate.chairmanImageUrl;
    let viceChairmanImg = candidate.viceChairmanImageUrl;

    if (req.files) {
      if (req.files.chairmanImg) {
        const res1 = await uploadToCloudinary(req.files.chairmanImg[0].buffer);
        chairmanImg = res1.secure_url;
      }
      if (req.files.viceChairmanImg) {
        const res2 = await uploadToCloudinary(req.files.viceChairmanImg[0].buffer);
        viceChairmanImg = res2.secure_url;
      }
    }

    // Handle mission sama seperti create
    let missionArray = candidate.mission || [];
    if (req.body.mission) {
      if (typeof req.body.mission === 'string') {
        try {
          missionArray = JSON.parse(req.body.mission);
        } catch {
          missionArray = req.body.mission.split('\n').filter(Boolean);
        }
      } else if (Array.isArray(req.body.mission)) {
        missionArray = req.body.mission;
      }
    }

    await candidate.update({
      ...req.body,
      mission: missionArray,
      chairmanImageUrl: chairmanImg,
      viceChairmanImageUrl: viceChairmanImg,
    });

    res.json({ success: true, data: candidate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Hapus Kandidat (Soft Delete / Hard Delete)
exports.deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    await Candidate.destroy({ where: { id } });
    res.json({ success: true, message: "Kandidat berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- LOGIKA KODE VOTING ---

// Generate Kode Unik per Sekolah
exports.generateCodes = async (req, res) => {
  try {
    const { amount, schoolId } = req.body;
    if (!schoolId || !amount) return res.status(400).json({ success: false, message: "Data tidak lengkap" });

    const codes = [];
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Tanpa huruf/angka membingungkan (O, 0, I, 1)

    for (let i = 0; i < amount; i++) {
      let result = '';
      for (let j = 0; j < 4; j++) { // Sesuai STRING(4) di model Anda
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      codes.push({ code: result, schoolId: schoolId, isActive: true });
    }

    // Menggunakan ignoreDuplicates agar jika ada kode yang sama tidak error
    await VoteCode.bulkCreate(codes, { ignoreDuplicates: true });
    res.json({ success: true, message: `${amount} kode berhasil diproses` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Menampilkan Daftar Kode di Dashboard Admin
exports.listCodes = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId required' });

    const codes = await VoteCode.findAll({
      where: { schoolId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: codes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId required' });

    const candidates = await Candidate.findAll({
      where: { schoolId },
      attributes: ['id', 'chairmanName', 'viceChairmanName', 'votes'],
      order: [['votes', 'DESC']],
    });

    res.json({
      success: true,
      data: candidates.map(c => ({
        id: c.id,
        name: `${c.chairmanName} & ${c.viceChairmanName}`,
        votes: c.votes || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getVotingStatus = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId diperlukan' });
    }

    // Hitung total kode yang dibuat
    const totalCodes = await VoteCode.count({ where: { schoolId } });

    // Hitung kode yang masih aktif (belum dipakai)
    const activeCodes = await VoteCode.count({ 
      where: { schoolId, isActive: true } 
    });

    const usedCodes = totalCodes - activeCodes;
    const percentageUsed = totalCodes > 0 ? Math.round((usedCodes / totalCodes) * 100) : 0;

    // Ambil kandidat dengan suara terbanyak (jika voting sudah selesai)
    let winner = null;
    if (activeCodes === 0 && totalCodes > 0) {
      const topCandidate = await Candidate.findOne({
        where: { schoolId },
        order: [['votes', 'DESC']],
        limit: 1,
      });

      if (topCandidate) {
        winner = {
          id: topCandidate.id,
          chairmanName: topCandidate.chairmanName,
          viceChairmanName: topCandidate.viceChairmanName,
          chairmanImageUrl: topCandidate.chairmanImageUrl,
          viceChairmanImageUrl: topCandidate.viceChairmanImageUrl,
          votes: topCandidate.votes,
          vision: topCandidate.vision,
          mission: topCandidate.mission,
        };
      }
    }

    res.json({
      success: true,
      data: {
        totalCodes,
        usedCodes,
        activeCodes,
        percentageUsed,
        isVotingFinished: activeCodes === 0 && totalCodes > 0,
        winner,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Digunakan oleh siswa saat submit suara
exports.submitVote = async (req, res) => {
  try {
    const { code, candidateId, schoolId } = req.body;

    const validCode = await VoteCode.findOne({ 
      where: { code, schoolId, isActive: true } 
    });

    if (!validCode) {
      return res.status(400).json({ success: false, message: 'Kode tidak valid atau sudah digunakan' });
    }

    const candidate = await Candidate.findOne({ where: { id: candidateId, schoolId } });
    if (!candidate) return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });

    // Update vote dan nonaktifkan kode dalam satu alur
    await candidate.increment('votes', { by: 1 });
    await validCode.update({ isActive: false });

    res.json({ success: true, message: 'Suara berhasil dikirim!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Hapus satu kode berdasarkan ID
exports.deleteCode = async (req, res) => {
  try {
    const { id } = req.params;
    await VoteCode.destroy({ where: { id } });
    res.json({ success: true, message: "Kode berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Hapus semua kode milik satu sekolah (Bulk Delete)
exports.bulkDeleteCodes = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: "schoolId wajib ada!" });

    // Hanya hapus kode milik sekolah yang bersangkutan
    await VoteCode.destroy({ where: { schoolId } });
    res.json({ success: true, message: "Semua kode berhasil dibersihkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Hapus beberapa kode yang dipilih (Selected Delete)
exports.deleteSelectedCodes = async (req, res) => {
  try {
    const { ids } = req.body; // Menerima array [1, 2, 3]

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Tidak ada kode yang dipilih" });
    }

    await VoteCode.destroy({
      where: {
        id: ids
      }
    });

    res.json({ success: true, message: `${ids.length} kode berhasil dihapus` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cek validasi kode tanpa melakukan voting
exports.verifyCode = async (req, res) => {
  try {
    const { code, schoolId } = req.body;

    if (!code || !schoolId) {
      return res.status(400).json({ success: false, message: "Data tidak lengkap" });
    }

    const validCode = await VoteCode.findOne({
      where: { 
        code: code.toUpperCase(), 
        schoolId, 
        isActive: true 
      }
    });

    if (!validCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kode tidak valid atau sudah digunakan' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Kode valid, silakan berikan suara Anda' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};