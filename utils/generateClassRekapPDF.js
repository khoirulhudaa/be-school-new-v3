const PDFDocument = require('pdfkit');

/**
 * Generate buffer PDF laporan rekap kelas (untuk Wali Kelas)
 */
const generateClassRekapPDF = (cls, targetDate, schoolName = 'Sekolah') => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - 80;
    const hadirTotal = cls.stats.onTime + cls.stats.late;
    const hadirPct = cls.totalStudents > 0
      ? ((hadirTotal / cls.totalStudents) * 100).toFixed(1)
      : '0';

    // ── HEADER ──────────────────────────────────────────────────
    doc.rect(40, 40, W, 80).fill('#0f4c81');
    doc.fillColor('white')
      .fontSize(15)
      .font('Helvetica-Bold')
      .text(`REKAP KEHADIRAN KELAS ${cls.className}`, 40, 52, { align: 'center', width: W });

    doc.fontSize(10)
      .font('Helvetica')
      .text(schoolName.toUpperCase(), 40, 73, { align: 'center', width: W })
      .text(`Wali Kelas: ${cls.walikelas?.name || '-'}   |   Tanggal: ${targetDate}`, 40, 89, { align: 'center', width: W });

    // PENTING: Set posisi Y setelah header
    doc.y = 135;

    // ── SUMMARY BOXES (PERBAIKAN TANGGA) ─────────────────────────
    const boxW = (W - 20) / 5;
    const boxH = 55;
    const startY = doc.y; // KUNCI POSISI Y DI SINI

    const boxes = [
      { label: 'Total Siswa', value: cls.totalStudents, color: '#2563eb' },
      { label: 'Hadir', value: hadirTotal, color: '#16a34a' },
      { label: 'Izin', value: cls.stats.izin, color: '#d97706' },
      { label: 'Sakit', value: cls.stats.sakit, color: '#0891b2' },
      { label: 'Alpha', value: cls.stats.alpha, color: '#dc2626' },
    ];

    boxes.forEach((box, i) => {
      const bx = 40 + i * (boxW + 5);
      
      // Gambar Kotak
      doc.rect(bx, startY, boxW, boxH).fill(box.color);
      
      // Tulis Angka (Gunakan startY agar tidak bergeser turun)
      doc.fillColor('white')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(String(box.value), bx, startY + 8, { width: boxW, align: 'center' });
        
      // Tulis Label (Gunakan startY + offset)
      doc.fontSize(7)
        .font('Helvetica')
        .text(box.label.toUpperCase(), bx, startY + 35, { width: boxW, align: 'center' });
    });

    // Pindahkan doc.y ke bawah kotak secara manual setelah loop selesai
    doc.y = startY + boxH + 25;

    // ── DETAIL KEHADIRAN (Progress Bar Section) ──────────────────
    doc.fillColor('#0f4c81').fontSize(12).font('Helvetica-Bold')
      .text('DETAIL KEHADIRAN', 40, doc.y);

    doc.moveDown(0.5);

    const detailRows = [
      { label: 'Hadir Tepat Waktu', value: cls.stats.onTime, icon: '✓', color: '#16a34a' },
      { label: 'Hadir Terlambat', value: cls.stats.late, icon: '!', color: '#d97706' },
      { label: 'Izin', value: cls.stats.izin, icon: 'I', color: '#d97706' },
      { label: 'Sakit', value: cls.stats.sakit, icon: 'S', color: '#0891b2' },
      { label: 'Alpha', value: cls.stats.alpha, icon: 'X', color: '#dc2626' },
      { label: 'Belum Hadir', value: cls.stats.belumHadir, icon: '-', color: '#6b7280' },
    ];

    detailRows.forEach((row, idx) => {
      const rowY = doc.y;
      const bgColor = idx % 2 === 0 ? '#f8fafc' : '#ffffff';

      doc.rect(40, rowY, W, 22).fill(bgColor);

      // Icon circle
      doc.circle(60, rowY + 11, 8).fill(row.color);
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
        .text(row.icon, 53, rowY + 7, { width: 14, align: 'center' });

      // Label & Progress Bar
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica')
        .text(row.label, 78, rowY + 6, { width: 200 });

      const barX = 280, barW = W - 250, barH = 8;
      const fillW = cls.totalStudents > 0 ? Math.max(0, (row.value / cls.totalStudents) * barW) : 0;

      doc.rect(barX, rowY + 7, barW, barH).fill('#e2e8f0');
      if (fillW > 0) doc.rect(barX, rowY + 7, fillW, barH).fill(row.color);

      doc.fillColor('#1e293b').font('Helvetica-Bold')
        .text(String(row.value), barX + barW + 6, rowY + 6, { width: 30, align: 'right' });

      doc.y = rowY + 22; // Gerakkan y secara terkontrol
    });

    doc.moveDown(1.5);

    // ── PERSENTASE KEHADIRAN ─────────────────────────────────────
    const currentY = doc.y;
    doc.rect(40, currentY, W, 45).fill('#1e3a5f');
    doc.fillColor('white').fontSize(11).font('Helvetica')
      .text('PERSENTASE KEHADIRAN', 40, currentY + 8, { align: 'center', width: W });

    const colorPct = parseFloat(hadirPct) >= 80 ? '#4ade80' : parseFloat(hadirPct) >= 60 ? '#fbbf24' : '#f87171';
    doc.fontSize(22).font('Helvetica-Bold').fillColor(colorPct)
      .text(`${hadirPct}%`, 40, currentY + 20, { align: 'center', width: W });

    doc.y = currentY + 60;

    // ── FOOTER ───────────────────────────────────────────────────
    doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').moveDown(0.5)
      .text(`Digenerate otomatis oleh KiraProject • ${new Date().toLocaleString('id-ID')}`, { align: 'center' });

    doc.end();
  });
};

module.exports = { generateClassRekapPDF };