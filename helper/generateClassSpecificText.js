const generateClassSpecificText = (cls, targetDate) => {
  const { stats, totalStudents, className, walikelas } = cls;
  const totalHadir = stats.onTime + stats.late;
  const persentase = totalStudents > 0 
    ? ((totalHadir / totalStudents) * 100).toFixed(1) 
    : '0.0';

  // Tambah warning kalau kelas tidak ada siswanya
  const emptyNote = totalStudents === 0 
    ? '\n⚠️ Tidak ada siswa terdaftar di kelas ini\n' 
    : '';

  return `📚 REKAP KELAS ${className}
📅 ${targetDate}${emptyNote}
━━━━━━━━━━━━━━━━━━━━
✅ Tepat Waktu: ${stats.onTime}
⏰ Terlambat: ${stats.late}
🤒 Sakit: ${stats.sakit}
📝 Izin: ${stats.izin}
❌ Alpha: ${stats.alpha}
⬜ Belum Absen: ${stats.belumHadir}
👥 Total: ${totalStudents}
📊 Kehadiran: ${persentase}%`;
};

module.exports = {
  generateClassSpecificText
}