const JadwalPelajaran = require('../models/jadwalSD');

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

exports.getJadwalByKelasAndShift = async (req, res) => {
  try {
    const { schoolId } = req.query;
    const { kelas, shift } = req.params;

    if (!schoolId || !kelas || !shift) {
      return res.status(400).json({ success: false, message: 'Parameter tidak lengkap' });
    }

    const jadwal = await JadwalPelajaran.findAll({
      where: {
        schoolId: parseInt(schoolId),
        kelas: parseInt(kelas),
        shift,
        isActive: true,
      },
    });

    // Format response agar menyertakan pelajaran dan seragam per hari
    const formatted = DAYS.reduce((acc, hari) => {
      const found = jadwal.find(j => j.hari === hari);
      acc[hari] = {
        pelajaran: found ? found.jadwal : [],
        seragam: found ? found.seragam : 'Seragam Sekolah'
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: formatted,
      kelas: parseInt(kelas),
      shift,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllJadwal = async (req, res) => {
  try {
    const { schoolId, kelas, shift } = req.query;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId wajib' });
    }

    const where = { schoolId: parseInt(schoolId), isActive: true };

    if (kelas) where.kelas = parseInt(kelas);
    if (shift) where.shift = shift;

    const jadwal = await JadwalPelajaran.findAll({
      where,
      order: [['kelas', 'ASC'], ['shift', 'ASC'], ['hari', 'ASC']],
    });

    res.json({ success: true, data: jadwal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createOrUpdateJadwal = async (req, res) => {
  try {
    const { schoolId, kelas, shift, hari, jadwal, catatan, seragam } = req.body;

    if (!schoolId || !kelas || !shift || !hari || !jadwal) {
      return res.status(400).json({ success: false, message: 'Data wajib diisi' });
    }

    const [record, created] = await JadwalPelajaran.findOrCreate({
      where: {
        schoolId: parseInt(schoolId),
        kelas: parseInt(kelas),
        shift,
        hari,
      },
      defaults: {
        jadwal,
        seragam: seragam || 'Seragam Sekolah',
        catatan: catatan || null,
        isActive: true,
      },
    });

    if (!created) {
      record.jadwal = jadwal;
      if (seragam) record.seragam = seragam;
      if (catatan !== undefined) record.catatan = catatan;
      await record.save();
    }

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Jadwal dibuat' : 'Jadwal diperbarui',
      data: record,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteJadwal = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.query;

    const jadwal = await JadwalPelajaran.findOne({
      where: { id: parseInt(id), schoolId: parseInt(schoolId) },
    });

    if (!jadwal) {
      return res.status(404).json({ success: false, message: 'Data jadwal tidak ditemukan' });
    }

    jadwal.isActive = false;
    await jadwal.save();

    res.json({ success: true, message: 'Jadwal berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};