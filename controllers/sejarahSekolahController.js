const SejarahSekolah = require('../models/sejarahSekolah');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadPhoto(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function deletePhoto(photoUrl) {
  if (photoUrl) {
    const publicId = photoUrl.split('/').pop().split('.')[0];
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Photo dihapus dari Cloudinary: ${publicId}`);
    } catch (err) {
      console.log(`Gagal hapus photo: ${err.message}`);
    }
  }
}

exports.getSejarah = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const sejarah = await SejarahSekolah.findOne({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
    });

    if (!sejarah) {
      return res.status(200).json({ success: false, message: [] });
    }

    res.json({ success: true, data: sejarah });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSejarah = async (req, res) => {
  try {
    const { schoolId, deskripsi, tahunBerdiri, jumlahKompetensiKeahlian, timeline, daftarKepalaSekolah } = req.body;

    if (!schoolId || !deskripsi || !tahunBerdiri) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId, deskripsi, dan tahunBerdiri wajib diisi' 
      });
    }

    const existing = await SejarahSekolah.findOne({ where: { schoolId: parseInt(schoolId) } });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sejarah sudah ada untuk schoolId ini' 
      });
    }

    let timelineParsed = timeline ? (typeof timeline === 'string' ? JSON.parse(timeline) : timeline) : null;
    let daftarParsed = daftarKepalaSekolah ? (typeof daftarKepalaSekolah === 'string' ? JSON.parse(daftarKepalaSekolah) : daftarKepalaSekolah) : null;

    // Handle upload foto untuk daftarKepalaSekolah (asumsi files sesuai urutan daftar, dan daftar memiliki fotoUrl: null untuk yang baru)
    if (req.files && req.files.length > 0) {
      if (!daftarParsed || req.files.length !== daftarParsed.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'Jumlah foto harus sesuai dengan jumlah daftar kepala sekolah' 
        });
      }
      for (let i = 0; i < daftarParsed.length; i++) {
        const url = await uploadPhoto(req.files[i].buffer);
        daftarParsed[i].fotoUrl = url;
      }
    }

    const jumlahKepala = daftarParsed ? daftarParsed.length : 0;

    const newSejarah = await SejarahSekolah.create({ 
      schoolId: parseInt(schoolId),
      deskripsi,
      tahunBerdiri: parseInt(tahunBerdiri),
      jumlahKepalaSekolah: jumlahKepala,
      jumlahKompetensiKeahlian: jumlahKompetensiKeahlian ? parseInt(jumlahKompetensiKeahlian) : null,
      timeline: timelineParsed,
      daftarKepalaSekolah: daftarParsed,
    });

    res.json({ success: true, data: newSejarah });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSejarah = async (req, res) => {
  try {
    const { id } = req.params;
    const { deskripsi, tahunBerdiri, jumlahKompetensiKeahlian, timeline, daftarKepalaSekolah, photoIndices } = req.body;

    const sejarah = await SejarahSekolah.findByPk(id);
    if (!sejarah) {
      return res.status(404).json({ success: false, message: 'Sejarah tidak ditemukan' });
    }

    // Update fields dasar
    if (deskripsi) sejarah.deskripsi = deskripsi;
    if (tahunBerdiri) sejarah.tahunBerdiri = parseInt(tahunBerdiri);
    if (jumlahKompetensiKeahlian !== undefined) {
      sejarah.jumlahKompetensiKeahlian = parseInt(jumlahKompetensiKeahlian);
    }

    // Parse array kompleks (timeline & daftar kepsek)
    let timelineParsed = timeline 
      ? (typeof timeline === 'string' ? JSON.parse(timeline) : timeline) 
      : sejarah.timeline;

    let daftarParsed = daftarKepalaSekolah 
      ? (typeof daftarKepalaSekolah === 'string' ? JSON.parse(daftarKepalaSekolah) : daftarKepalaSekolah) 
      : sejarah.daftarKepalaSekolah;

    // Handle partial upload foto kepala sekolah
    if (req.files && req.files.length > 0) {
      // photoIndices bisa string tunggal atau array
      const indices = photoIndices 
        ? (Array.isArray(photoIndices) ? photoIndices : [photoIndices])
        : [];

      if (indices.length !== req.files.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'Jumlah index foto tidak sesuai dengan jumlah file yang diupload' 
        });
      }

      for (let i = 0; i < indices.length; i++) {
        const idx = parseInt(indices[i]);

        // Validasi index
        if (isNaN(idx) || idx < 0 || idx >= daftarParsed.length) {
          console.warn(`Index foto tidak valid: ${idx}`);
          continue;
        }

        // Hapus foto lama jika ada
        if (daftarParsed[idx]?.fotoUrl) {
          await deletePhoto(daftarParsed[idx].fotoUrl);
        }

        // Upload foto baru
        const url = await uploadPhoto(req.files[i].buffer);
        daftarParsed[idx].fotoUrl = url;
      }
    }

    // Hitung ulang jumlah kepala sekolah
    const jumlahKepala = daftarParsed?.length || 0;

    // Simpan perubahan
    sejarah.timeline = timelineParsed;
    sejarah.daftarKepalaSekolah = daftarParsed;
    sejarah.jumlahKepalaSekolah = jumlahKepala;

    await sejarah.save();

    res.json({ success: true, data: sejarah });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan server' });
  }
};

exports.deleteSejarah = async (req, res) => {
  try {
    const { id } = req.params;

    const sejarah = await SejarahSekolah.findByPk(id);
    if (!sejarah) {
      return res.status(404).json({ success: false, message: 'Sejarah tidak ditemukan' });
    }

    // Hapus semua foto dari Cloudinary
    if (sejarah.daftarKepalaSekolah) {
      for (const kepala of sejarah.daftarKepalaSekolah) {
        await deletePhoto(kepala.fotoUrl);
      }
    }

    // Soft delete
    sejarah.isActive = false;
    await sejarah.save();

    res.json({ success: true, message: 'Sejarah berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};