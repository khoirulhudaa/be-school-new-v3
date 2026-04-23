const Osis = require('../models/osis');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Konfigurasi Cloudinary (sebaiknya pindah ke file config terpisah)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, folder = 'osis-photos') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

exports.getOsis = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId wajib disertakan' });
    }

    const osis = await Osis.findOne({
      where: { schoolId: parseInt(schoolId), isActive: true },
    });

    if (!osis) {
      return res.status(200).json({ success: true, data: null });
    }

    res.json({ success: true, data: osis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createOrUpdateOsis = async (req, res) => {
  try {
    const {
      schoolId,
      periodeSaatIni,
      ketuaNama,
      ketuaNipNuptk,
      wakilNama,
      wakilNipNuptk,
      bendaharaNama,
      bendaharaNipNuptk,
      sekretarisNama,
      sekretarisNipNuptk,
      visi,
      misi,
      riwayatKepemimpinan,
      prestasiSaatIni,
    } = req.body;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId wajib diisi' });
    }

    const updates = {
      periodeSaatIni: periodeSaatIni || undefined,
      ketuaNama: ketuaNama || undefined,
      ketuaNipNuptk: ketuaNipNuptk || undefined,
      wakilNama: wakilNama || undefined,
      wakilNipNuptk: wakilNipNuptk || undefined,
      bendaharaNama: bendaharaNama || undefined,
      bendaharaNipNuptk: bendaharaNipNuptk || undefined,
      sekretarisNama: sekretarisNama || undefined,
      sekretarisNipNuptk: sekretarisNipNuptk || undefined,
      visi: visi || undefined,
      misi: misi ? JSON.parse(misi).filter(m => m?.trim()) : undefined,
    };

    if (riwayatKepemimpinan) {
      updates.riwayatKepemimpinan = JSON.parse(riwayatKepemimpinan);
    }
    if (prestasiSaatIni) {
      updates.prestasiSaatIni = JSON.parse(prestasiSaatIni);
    }

    // Handle foto-foto
    const photoMappings = [
      { fileField: 'ketuaFoto', dbField: 'ketuaFotoUrl' },
      { fileField: 'wakilFoto', dbField: 'wakilFotoUrl' },
      { fileField: 'bendaharaFoto', dbField: 'bendaharaFotoUrl' },
      { fileField: 'sekretarisFoto', dbField: 'sekretarisFotoUrl' },
    ];

    for (const { fileField, dbField } of photoMappings) {
      if (req.files?.[fileField]?.[0]) {
        const file = req.files[fileField][0];
        const imageUrl = await uploadToCloudinary(file.buffer);
        updates[dbField] = imageUrl;
      }
    }

    let osis = await Osis.findOne({ where: { schoolId: parseInt(schoolId) } });

    if (osis) {
      // Update hanya field yang dikirim
      Object.assign(osis, updates);
      await osis.save();
    } else {
      osis = await Osis.create({
        schoolId: parseInt(schoolId),
        ...updates,
        riwayatKepemimpinan: updates.riwayatKepemimpinan || [],
        prestasiSaatIni: updates.prestasiSaatIni || [],
        isActive: true,
      });
    }

    res.json({ success: true, data: osis });
  } catch (err) {
    console.error('Error createOrUpdateOsis:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToRiwayat = async (req, res) => {
  try {
    const { schoolId, periode, ketua, wakil } = req.body;

    if (!schoolId || !periode || !ketua || !wakil) {
      return res.status(400).json({ success: false, message: 'schoolId, periode, ketua, wakil wajib' });
    }

    const osis = await Osis.findOne({ where: { schoolId: parseInt(schoolId), isActive: true } });
    if (!osis) {
      return res.status(404).json({ success: false, message: 'Data OSIS tidak ditemukan' });
    }

    const riwayat = osis.riwayatKepemimpinan || [];
    if (riwayat.some(r => r.periode === periode)) {
      return res.status(400).json({ success: false, message: 'Periode sudah ada di riwayat' });
    }

    riwayat.push({ periode, ketua, wakil });
    osis.riwayatKepemimpinan = riwayat;
    await osis.save();

    res.json({ success: true, data: osis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};