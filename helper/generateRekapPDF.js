// utils/generateRekapPDF.js
const PDFDocument = require('pdfkit');

/**
 * Generate buffer PDF laporan rekap harian (untuk Kepala Sekolah)
 * @param {object} rekapData - { summary, data }
 * @param {string} targetDate - 'YYYY-MM-DD'
 * @param {string} schoolName - nama sekolah
 * @returns {Promise<Buffer>}
 */
const generateRekapPDF = (rekapData, targetDate, schoolName = 'Sekolah') => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { summary, data } = rekapData;
    const W = doc.page.width - 80; // usable width

    // ── HEADER ──────────────────────────────────────────────────
    doc
      .rect(40, 40, W, 70)
      .fill('#1e3a5f');

    doc
      .fillColor('white')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('LAPORAN REKAP KEHADIRAN HARIAN', 40, 55, { align: 'center', width: W });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(schoolName.toUpperCase(), 40, 77, { align: 'center', width: W })
      .text(`Tanggal: ${targetDate}`, 40, 91, { align: 'center', width: W });

    doc.moveDown(0.5);
    doc.y = 125;

    // ── SUMMARY BOX ──────────────────────────────────────────────
    const hadirPct = summary.totalAllStudents > 0
      ? ((summary.totalAllHadir / summary.totalAllStudents) * 100).toFixed(1)
      : '0';

    const boxW = (W - 15) / 4;
    const boxes = [
      { label: 'Total Siswa',   value: summary.totalAllStudents, color: '#2563eb' },
      { label: 'Hadir',         value: summary.totalAllHadir,    color: '#16a34a' },
      { label: 'Tidak Hadir',   value: summary.totalAllBelumHadir, color: '#dc2626' },
      { label: 'Kehadiran',     value: `${hadirPct}%`,           color: '#7c3aed' },
    ];

    // SIMPAN nilai y awal agar semua box punya start yang sama
    const startY = doc.y; 
    const boxHeight = 55;

    boxes.forEach((box, i) => {
      const bx = 40 + i * (boxW + 5);
      
      // Gambar Kotak
      doc.rect(bx, startY, boxW, boxHeight).fill(box.color);
      
      // Tulis Angka (Value)
      doc
        .fillColor('white')
        .fontSize(20) // Sedikit dikecilkan agar aman
        .font('Helvetica-Bold')
        // Gunakan startY + offset agar tidak terpengaruh auto-increment doc.y
        .text(String(box.value), bx, startY + 10, { 
            width: boxW, 
            align: 'center' 
        });
        
      // Tulis Label
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(box.label.toUpperCase(), bx, startY + 35, { 
            width: boxW, 
            align: 'center' 
        });
    });

    // Setelah loop selesai, paksa doc.y pindah ke bawah seluruh kotak
    doc.y = startY + boxHeight + 20;
    doc.moveDown(0.5);

    // ── TABEL HEADER ────────────────────────────────────────────
    doc
      .fillColor('#1e3a5f')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('REKAP PER KELAS', 40, doc.y);

    doc.moveDown(0.4);

    // Kolom: Kelas | Siswa | Tepat | Terlambat | Izin | Sakit | Alpha | Blm Hadir | %Hadir
    const cols = [
      { label: 'Kelas',       x: 40,  w: 100, align: 'left'   },
      { label: 'Siswa',       x: 140, w: 42,  align: 'center' },
      { label: 'Tepat',       x: 182, w: 40,  align: 'center' },
      { label: 'Terlambat',   x: 222, w: 52,  align: 'center' },
      { label: 'Izin',        x: 274, w: 38,  align: 'center' },
      { label: 'Sakit',       x: 312, w: 38,  align: 'center' },
      { label: 'Alpha',       x: 350, w: 38,  align: 'center' },
      { label: 'Blm Hadir',   x: 388, w: 52,  align: 'center' },
      { label: '% Hadir',     x: 440, w: 55,  align: 'center' },
    ];

    const ROW_H = 20;

    const drawTableRow = (cells, isHeader = false, isEven = false) => {
      const rowY = doc.y;

      if (isHeader) {
        doc.rect(40, rowY, W, ROW_H).fill('#1e3a5f');
        doc.fillColor('white');
      } else if (isEven) {
        doc.rect(40, rowY, W, ROW_H).fill('#f1f5f9');
        doc.fillColor('#1e293b');
      } else {
        doc.fillColor('#1e293b');
      }

      cells.forEach((cell, i) => {
        doc
          .fontSize(isHeader ? 7.5 : 9)
          .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
          .text(String(cell), cols[i].x, rowY + (ROW_H - 9) / 2 + 1, {
            width: cols[i].w,
            align: cols[i].align,
            lineBreak: false,
          });
      });

      // Border bawah
      doc
        .moveTo(40, rowY + ROW_H)
        .lineTo(40 + W, rowY + ROW_H)
        .lineWidth(0.3)
        .strokeColor('#cbd5e1')
        .stroke();

      doc.y = rowY + ROW_H;
    };

    // Border tabel
    const tableStartY = doc.y;
    drawTableRow(cols.map(c => c.label), true);

    const sortedData = [...data].sort((a, b) =>
      (a.className || '').localeCompare(b.className || '')
    );

    sortedData.forEach((cls, idx) => {
      // Page break check
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }

      const hadirKls = cls.stats.onTime + cls.stats.late;
      const pctKls = cls.totalStudents > 0
        ? `${((hadirKls / cls.totalStudents) * 100).toFixed(0)}%`
        : '0%';

      drawTableRow([
        cls.className || '-',
        cls.totalStudents,
        cls.stats.onTime,
        cls.stats.late,
        cls.stats.izin,
        cls.stats.sakit,
        cls.stats.alpha,
        cls.stats.belumHadir,
        pctKls,
      ], false, idx % 2 === 0);
    });

    // Border luar tabel
    doc
      .rect(40, tableStartY, W, doc.y - tableStartY)
      .lineWidth(0.5)
      .strokeColor('#94a3b8')
      .stroke();

    doc.moveDown(1.5);

    // ── FOOTER ───────────────────────────────────────────────────
    doc
      .moveTo(40, doc.y)
      .lineTo(40 + W, doc.y)
      .lineWidth(0.5)
      .strokeColor('#cbd5e1')
      .stroke()
      .moveDown(0.4);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text(
        `Digenerate otomatis oleh KiraProject • ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
        { align: 'center' }
      );

    doc.end();
  });
};

module.exports = { generateRekapPDF };