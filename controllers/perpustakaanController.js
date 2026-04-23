const { Perpustakaan, Peminjaman } = require('../models/perpustakaan');
const { Op } = require('sequelize');

class PerpustakaanController {
  async getAllBuku(req, res) {
    try {
      const { sekolahId, kategori, search } = req.query;
      const where = { isActive: true };
      if (sekolahId) where.sekolahId = parseInt(sekolahId);
      if (kategori) where.kategori = kategori;
      if (search) where.judul = { [Op.like]: `%${search}%` };

      const bukus = await Perpustakaan.findAll({
        where,
        order: [['judul', 'ASC']],
        limit: 100,
      });

      return res.json({ success: true, data: bukus });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getBukuById(req, res) {
    try {
      const { id } = req.params;
      const buku = await Perpustakaan.findByPk(id);
      if (!buku) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });

      return res.json({ success: true, data: buku });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getBukuByKategori(req, res) {
    try {
      const { kategori } = req.params;
      const bukus = await Perpustakaan.findAll({
        where: { kategori, isActive: true },
        order: [['judul', 'ASC']],
      });

      return res.json({ success: true, data: bukus });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createBuku(req, res) {
    try {
      const { sekolahId, isbn, judul, penulis, penerbit, tahun, kategori, jumlah, deskripsi, coverUrl } = req.body;

      const buku = await Perpustakaan.create({
        sekolahId: parseInt(sekolahId),
        isbn,
        judul,
        penulis,
        penerbit,
        tahun: parseInt(tahun),
        kategori,
        jumlah: parseInt(jumlah),
        deskripsi,
        coverUrl,
      });

      return res.json({ success: true, data: buku });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateBuku(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const buku = await Perpustakaan.findByPk(id);
      if (!buku) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) buku[key] = updates[key];
      });
      await buku.save();

      return res.json({ success: true, data: buku });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteBuku(req, res) {
    try {
      const { id } = req.params;
      const buku = await Perpustakaan.findByPk(id);
      if (!buku) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });

      buku.isActive = false;
      await buku.save();

      return res.json({ success: true, message: 'Buku dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAllPeminjaman(req, res) {
    try {
      const { sekolahId, status } = req.query;
      const where = {};
      if (sekolahId) where.sekolahId = parseInt(sekolahId);
      if (status) where.status = status;

      const peminjamans = await Peminjaman.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      return res.json({ success: true, data: peminjamans });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getPeminjamanById(req, res) {
    try {
      const { id } = req.params;
      const peminjaman = await Peminjaman.findByPk(id);
      if (!peminjaman) return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });

      return res.json({ success: true, data: peminjaman });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getPeminjamanBySiswa(req, res) {
    try {
      const { siswaId } = req.params;
      const { status } = req.query;

      const where = { siswaId: parseInt(siswaId) };
      if (status) where.status = status;

      const peminjamans = await Peminjaman.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: peminjamans });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createPeminjaman(req, res) {
    try {
      const { sekolahId, bukuId, siswaId, tanggalPinjam, tanggalKembali } = req.body;

      const peminjaman = await Peminjaman.create({
        sekolahId: parseInt(sekolahId),
        bukuId: parseInt(bukuId),
        siswaId: parseInt(siswaId),
        tanggalPinjam,
        tanggalKembali,
        status: 'dipinjam',
      });

      return res.json({ success: true, data: peminjaman });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async returnBuku(req, res) {
    try {
      const { id } = req.params;

      const peminjaman = await Peminjaman.findByPk(id);
      if (!peminjaman) return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });

      peminjaman.status = 'kembali';
      peminjaman.tanggalKembali = new Date();
      await peminjaman.save();

      return res.json({ success: true, data: peminjaman });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new PerpustakaanController();