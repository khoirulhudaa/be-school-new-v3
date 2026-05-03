    const express = require('express');
    const router = express.Router();
    const { createAuthLimiter, createAPILimiter } = require('../middlewares/security');

    // Import semua route handlers
console.log("[DEBUG] routes/index.js loaded");
    const albumRouter       = require('./albumRoutes');
    const alumniRouter      = require('./alumniRoutes');
    const galleryRouter     = require('./galleryRoutes');
    const beritaRouter      = require('./beritaRoutes');
    const pengumumanRouter  = require('./pengumumanRoutes');
    const fasilitasRouter   = require('./fasilitasRoutes');
    const profileRouter     = require('./profileSekolahRoutes');
    const tuitionRouter     = require('./tuitionRoutes');   
    const visiMisiRouter     = require('./visiMisiRoutes');   
    const prestasiRouter     = require('./prestasiRoutes');   
    const pramukaRouter     = require('./kegiatanPramukaRoutes');   
    const ekstrakurikulerRouter     = require('./ekstrakurikulerRoutes');   
    const layananRouter = require('./layananRoutes');
    const programRouter = require('./programRoutes');
    const sejarahSekolahRouter = require('./sejarahSekolahRoutes'); 
    const guruTendikRouter = require('./guruTendikRoutes');
    const menuSettingsRouter = require('./menuSettingsRoutes');
const ppdbRouter = require('./ppdbRoutes');
    const osisRouter = require('./osisRoutes');
    const kalenderRouter = require('./kalenderRoutes');
    const jadwalRouter = require('./jadwalRoutes');
    const kurikulumRouter = require('./kurikulumRoutes');
    const ppidRouter = require('./ppidRoutes');
    const ratingRouter = require('./komentarRoutes');
    const organisasiRouter = require('./organisasiRoutes');
    const partnerRouter = require('./partnerRoutes');
    const waRouter = require('./waRouter');
    const votingRouter = require('./votingRoutes');
    const faqRouter = require('./faqRoutes');
    const ruleRouter = require('./ruleRoutes');
    const jadwalSDRouter = require('./jadwalSDRoutes');
    const feedRouter = require('./feedRoutes');
    const registerRouter = require('./registerRoutes');
    const siswaRouter = require('./siswaRoutes');
    const authRouter = require('./authRoutes');
const ortuRouter = require('./ortuDashboardRoutes');
const izinRouter = require('./izinRoutes');
const presenceRouter = require('./presenceRoutes');
const presenceHistoryRouter = require('./presenceHistoryRoutes');
const placesRouter = require('./placesZonesRoutes');
const zonesRouter = require('./zonesRoutes');
const catatanRouter = require('./catatanRoutes');
const materiRouter = require('./materiRoutes');
const kuisRouter = require('./kuisRoutes');
const perpustakaanRouter = require('./perpustakaanRoutes');
const sosRouter = require('./sosRoutes');
const chatRouter = require('./chatRoutes');
const activitiesRouter = require('./activitiesRoutes');
const notificationsRouter = require('./notificationsRoutes');
    const kelasRouter = require('./kelasRoutes');
    const exportExcel = require('./exportExcelAttedancesYearly');
    const dataSekolah = require('./sekolahRoutes');
    const tugasSekolah = require('./tugasRouter');
    const scanQrStatis = require('./scanQrStatis');
    const orangTua = require('./orangTuaRoutes');
    const admin = require('./adminRoutes');
    const faceRouter = require('./face');
    const roleRouter = require('./roleRoutes');
    const healthBridgeRouter = require('./healthBridgeRoutes');
const debugRoutes = require('./debugRoutes');
const makananRouter = require('./makananRoutes');
const authRoutesNew = require('./authRoutes_new');
const nutrisiRouter = require('./nutrisiRoutes');
const deviceRouter = require('./deviceRoutes');
const contentRouter = require('./contentRoutes');
const kepalaRouter = require('./kepalaRoutes');
const tenantRouter = require('./tenantRoutes'); // Tenant management
const permohonanRouter = require('./permohonanRoutes'); // Permohonan surat
const kelulusanRouter = require('./kelulusanRoutes'); // Kelulusan siswa
const appreciateRouter = require('./apresiasiRoutes'); // Apresiasi siswa
const raporRouter = require('./raporRoutes'); // Rapor siswa
const userSiswaRouter = require('./userSiswaRoutes'); // user-siswa alias
const biodataSiswaRouter = require('./biodataSiswaRoutes'); // biodata-siswa-new
const barcodeAbsenRouter = require('./barcodeAbsenRoutes'); // create-barcode-absen
const attendancesRouter = require('./attendancesRoutes'); // attendances
const manualAttendanceRouter = require('./manualAttendanceRoutes'); // absen-masuk/pulang-manual
const tvRouter = require('./tvRoutes'); // Presence TV heartbeat & status
const mataPelajaranRouter = require('./mataPelajaranRoutes'); // mata-pelajaran

    router.use('/auth', require('./authRoutes'));
    router.use('/profile', require('./updateProfileRouter'));

    // ── Mount routes dengan limiter khusus ────────────────────────────────

    // Route sensitif (create/update banyak) → pakai strictLimiter
    router.use('/berita', beritaRouter);
    router.use('/pengumuman', pengumumanRouter);
    router.use('/alumni', alumniRouter);
    router.use('/pramuka', pramukaRouter);
    router.use('/siswa', siswaRouter);
    router.use('/ekstrakurikuler', ekstrakurikulerRouter);
    router.use('/layanan', layananRouter);
    router.use('/program', programRouter);
    router.use('/sejarah', sejarahSekolahRouter);
    router.use('/admin', admin);
    router.use('/roles', roleRouter);
    router.use('/guruTendik', guruTendikRouter);
    router.use('/guru-mapel', guruTendikRouter); // Alias for guru-mapel endpoint
    router.use('/ppdb', ppdbRouter);
    router.use('/osis', osisRouter);
    router.use('/wa', waRouter);
    router.use('/kalender', kalenderRouter);
    router.use('/jadwal', jadwalRouter);
    router.use('/kurikulum', kurikulumRouter);
    router.use('/ppid', ppidRouter);
    router.use('/rating', ratingRouter);
    router.use('/organisasi', organisasiRouter);
    router.use('/partner', partnerRouter);
    router.use('/premium-banners', require('./sponsorBannerRoutes'));
    router.use('/alumni-jejak', require('./alumniJejakRoutes'));
    router.use('/voting', votingRouter);
    router.use('/faq', faqRouter);
    router.use('/tata-tertib', ruleRouter);
    router.use('/jadwal-sd', jadwalSDRouter);
    router.use('/feed', feedRouter);
    router.use('/akun', registerRouter);
    router.use('/kelas', kelasRouter);
    router.use('/export-excel', exportExcel);
    router.use('/sekolah', dataSekolah);
    router.use('/tugas', tugasSekolah);
    router.use('/scan-qr', scanQrStatis);
    router.use('/orang-tua', orangTua);
    router.use('/face', faceRouter);
    router.use('/makanan', makananRouter);
    router.use('/nutrisi', nutrisiRouter);
    router.use('/health-bridge', healthBridgeRouter);
    router.use('/debug', debugRoutes);
    router.use('/auth-new', authRoutesNew);
    router.use('/devices', deviceRouter);
    router.use('/content', contentRouter);
    router.use('/kepala', kepalaRouter);
    // router.use('/guru', guruRouter); // DISABLED: siswaController missing, Soal model missing
    router.use('/auth-app', authRouter);
    router.use('/ortu', ortuRouter);

    // ── Tenant Management (Admin only) ──────────────────────────
    router.use('/tenant', tenantRouter);
    router.use('/permohonan', permohonanRouter); // Permohonan surat
    router.use('/menu-settings', menuSettingsRouter);
    router.use('/kelulusan', kelulusanRouter); // Kelulusan siswa
    router.use('/apresiasi', appreciateRouter); // Apresiasi siswa
    router.use('/rapor', raporRouter); // Rapor siswa
    router.use('/user-siswa', userSiswaRouter); // user-siswa alias for admin
    router.use('/get-biodata-siswa-new', biodataSiswaRouter); // biodata siswa for attendance
    router.use('/create-barcode-absen', barcodeAbsenRouter); // QR barcode attendance
    router.use('/attendances', attendancesRouter); // attendances/monthly, daily
    router.use('/absen-masuk-manual', manualAttendanceRouter); // manual check-in
    router.use('/absen-pulang-manual', manualAttendanceRouter); // manual check-out
    router.use('/mata-pelajaran', mataPelajaranRouter); // mata pelajaran / guru-mapel
    router.use('/tv', tvRouter); // Presence TV heartbeat & status
    router.use('/izin', izinRouter);
    router.use('/presence', presenceRouter);
    router.use('/presence', presenceHistoryRouter); // /presence/history, /presence/stats
    router.use('/places', placesRouter);
    router.use('/zones', zonesRouter);
    router.use('/catatan', catatanRouter);
    router.use('/catatan-sikap', catatanRouter); // Alias for admin dashboard
    router.use('/materi', materiRouter);
    router.use('/kuis', kuisRouter);
    router.use('/perpustakaan', perpustakaanRouter);
    router.use('/sos', sosRouter);
    router.use('/chat', chatRouter);
    router.use('/activities', activitiesRouter);
    router.use('/notifications', notificationsRouter);
    
    // Route dengan upload/file berat → pakai uploadLimiter
    router.use('/gallery', galleryRouter);
    router.use('/fasilitas', fasilitasRouter);
    router.use('/albums', albumRouter);
    router.use('/profileSekolah', profileRouter);
    router.use('/tuitions', tuitionRouter);
    router.use('/visi-misi', visiMisiRouter);
    router.use('/prestasi', prestasiRouter);
    router.use('/attendance', require('./attendanceValidateRoutes'));
    router.use('/student-location', require('./studentLocationRoutes'));

    // Route testing (hanya ikut global limiter dari app.js)
    router.get('/testing', (req, res) => {
      res.json({
        success: true,
        message: 'API SEKOLAH (1.0.2)',
        timestamp: new Date().toISOString()
      });
    });

    module.exports = router;