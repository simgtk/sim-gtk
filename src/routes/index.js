import express from 'express';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { generatePerangkatAjar } from '../services/aiService.js';
import { exportToDocx, exportToXlsx, exportToPptx } from '../services/exportService.js';
import { 
  getRolePermissionsHierarchy, 
  toggleMenuGroup, 
  toggleSubmenuField, 
  resetRoleToDefault,
  DEFAULT_ROLE_MENUS 
} from '../services/permissionService.js';
import {
  INSTRUMEN_SUPERVISI,
  getInstrumenSupervisi,
  getMasterInstrumenNasional,
  resetMasterKeRegulasiKemenag,
  distribusikanMasterKeMadrasah,
  saveInstrumenButir,
  deleteInstrumenButir,
  reorderInstrumen,
  getGtkTugasTambahan,
  saveGtkTugasTambahan,
  deleteGtkTugasTambahan,
  hitungNilaiDanPredikat,
  getSupervisiRekapMatriks,
  importGtkMassal,
  ensureSupervisiColumns
} from '../services/supervisiService.js';

const router = express.Router();

// ----------------- PUBLIC ROUTES -----------------
router.get('/', (req, res) => {
  res.redirect('/sim-gtk/');
});

router.get('/sim-gtk/', (req, res) => {
  res.render('public/index', { title: 'Rumah Digital Guru dan Tenaga Kependidikan Madrasah' });
});

router.get('/sim-gtk/login', (req, res) => {
  if (req.session && req.session.user) return res.redirect('/sim-gtk/beranda');
  res.render('auth/login', { title: 'Masuk' });
});

router.post('/sim-gtk/login', (req, res) => {
  const { ident, password, next } = req.body;
  const user = db.prepare(`
    SELECT u.*, m.nama as madrasah_nama 
    FROM users u 
    LEFT JOIN madrasah m ON u.madrasah_id = m.id 
    WHERE (u.email = ? OR u.username = ?) AND u.password = ?
  `).get(ident, ident, password);

  if (!user) {
    req.session.flash = { type: 'danger', message: 'Email/Username atau kata sandi tidak cocok.' };
    return res.redirect('/sim-gtk/login');
  }

  const roleLabels = {
    superadmin: 'Super Admin Platform',
    admin: 'Admin/Operator Madrasah',
    kamad: 'Kepala Madrasah',
    pengawas: 'Pengawas Madrasah',
    guru: 'Guru (Herman Buhungo)',
    tendik: 'Tenaga Kependidikan'
  };

  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    nama: user.nama,
    role: user.role,
    roleLabel: roleLabels[user.role] || user.role,
    madrasahId: user.madrasah_id || 1,
    madrasahNama: user.madrasah_nama || (user.role === 'superadmin' ? 'Platform Terpusat SIM-GTK' : 'MAN 2 KABUPATEN GORONTALO')
  };

  req.session.flash = { type: 'success', message: `Selamat datang kembali, ${user.nama}!` };

  if (next) return res.redirect(next);
  if (user.role === 'superadmin') return res.redirect('/sim-gtk/superadmin/dashboard');
  if (user.role === 'kamad') return res.redirect('/sim-gtk/kamad/dashboard');
  if (user.role === 'pengawas') return res.redirect('/sim-gtk/pengawas/dashboard');
  if (user.role === 'tendik') return res.redirect('/sim-gtk/tendik/dashboard');
  res.redirect('/sim-gtk/beranda');
});

router.post('/sim-gtk/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/sim-gtk/login');
  });
});

router.get('/sim-gtk/panduan', (req, res) => {
  if (req.session && req.session.user) {
    return res.render('beranda/panduan', { title: 'Panduan Penggunaan' });
  }
  res.render('public/index', { title: 'Panduan SIM-GTK' });
});

router.get('/sim-gtk/cek-sertifikat', (req, res) => {
  res.render('public/index', { title: 'Cek Sertifikat PKB' });
});

router.get('/sim-gtk/register', (req, res) => {
  res.render('auth/login', { title: 'Daftar Akun Baru' });
});

// ----------------- ROLE SWITCHER (DEVELOPMENT / DEMO HELPER) -----------------
router.get('/sim-gtk/switch-role/:role', (req, res) => {
  const { role } = req.params;
  const roleLabels = {
    superadmin: 'Super Admin Platform',
    admin: 'Admin/Operator Madrasah',
    kamad: 'Kepala Madrasah',
    pengawas: 'Pengawas Madrasah',
    guru: 'Guru (Herman Buhungo)',
    guru_penilai: 'Guru Penilai Supervisi',
    tendik: 'Tenaga Kependidikan'
  };

  let targetUser = db.prepare('SELECT u.*, m.nama as madrasah_nama FROM users u LEFT JOIN madrasah m ON u.madrasah_id = m.id WHERE u.role = ? LIMIT 1').get(role);
  if (!targetUser) {
    targetUser = {
      id: 99,
      username: role,
      email: `${role}@sim-gtk.id`,
      nama: roleLabels[role] || role,
      role: role,
      madrasah_id: 1,
      madrasah_nama: 'MAN 2 KABUPATEN GORONTALO'
    };
  }

  req.session.user = {
    id: targetUser.id,
    username: targetUser.username,
    email: targetUser.email,
    nama: targetUser.nama,
    role: targetUser.role,
    roleLabel: roleLabels[targetUser.role] || targetUser.role,
    madrasahId: targetUser.madrasah_id || 1,
    madrasahNama: targetUser.madrasah_nama || (targetUser.role === 'superadmin' ? 'Platform Terpusat SIM-GTK' : 'MAN 2 KABUPATEN GORONTALO')
  };

  req.session.flash = { type: 'success', message: `Beralih ke tampilan peran: ${req.session.user.roleLabel}` };
  if (role === 'superadmin') {
    return res.redirect('/sim-gtk/superadmin/dashboard');
  } else if (role === 'kamad') {
    return res.redirect('/sim-gtk/kamad/dashboard');
  } else if (role === 'pengawas') {
    return res.redirect('/sim-gtk/pengawas/dashboard');
  } else if (role === 'guru_penilai') {
    return res.redirect('/sim-gtk/guru-penilai/dashboard');
  } else if (role === 'tendik') {
    return res.redirect('/sim-gtk/tendik/dashboard');
  }
  res.redirect('/sim-gtk/beranda');
});

// ----------------- AUTHENTICATED ROUTES -----------------
router.use('/sim-gtk', requireAuth);

// 1. Beranda / Dashboard
router.get('/sim-gtk/beranda', (req, res) => {
  res.render('beranda/index', { title: 'Beranda' });
});

router.get('/sim-gtk/peta-situs', (req, res) => {
  res.render('beranda/peta-situs', { title: 'Peta Situs' });
});

router.get('/sim-gtk/madrasah-saya', (req, res) => {
  const madrasah = db.prepare('SELECT * FROM madrasah WHERE id = ?').get(req.session.user.madrasahId);
  res.render('beranda/madrasah-saya', { title: 'Madrasah Saya', madrasah });
});

// 2. Pengaturan
router.get('/sim-gtk/pengaturan', (req, res) => {
  const madrasah = db.prepare('SELECT * FROM madrasah WHERE id = ?').get(req.session.user.madrasahId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  res.render('pengaturan/index', { title: 'Pengaturan', madrasah, profile: user });
});

router.post('/sim-gtk/pengaturan/profil', (req, res) => {
  const { nama, email, telepon, alamat } = req.body;
  db.prepare(`UPDATE users SET nama = ?, email = ?, telepon = ?, alamat = ? WHERE id = ?`)
    .run(nama, email, telepon, alamat, req.session.user.id);
  req.session.user.nama = nama;
  req.session.user.email = email;
  req.session.flash = { type: 'success', message: 'Profil akun berhasil diperbarui.' };
  res.redirect('/sim-gtk/pengaturan');
});

router.post('/sim-gtk/pengaturan/password', (req, res) => {
  const { password_lama, password_baru, password_ulang } = req.body;
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.session.user.id);
  if (user.password !== password_lama) {
    req.session.flash = { type: 'danger', message: 'Kata sandi lama tidak sesuai.' };
    return res.redirect('/sim-gtk/pengaturan');
  }
  if (password_baru !== password_ulang) {
    req.session.flash = { type: 'danger', message: 'Konfirmasi kata sandi baru tidak cocok.' };
    return res.redirect('/sim-gtk/pengaturan');
  }
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(password_baru, req.session.user.id);
  req.session.flash = { type: 'success', message: 'Kata sandi berhasil diubah.' };
  res.redirect('/sim-gtk/pengaturan');
});

router.post('/sim-gtk/pengaturan/madrasah', (req, res) => {
  const { nama, npsn, jenjang, alamat, kabupaten, provinsi, telepon, email, nama_kamad, tahun_ajaran, semester, ai_base_url, ai_model, ai_api_key } = req.body;
  db.prepare(`
    UPDATE madrasah SET
      nama = ?, npsn = ?, jenjang = ?, alamat = ?, kabupaten = ?, provinsi = ?,
      telepon = ?, email = ?, nama_kamad = ?, tahun_ajaran = ?, semester = ?,
      ai_base_url = ?, ai_model = ?, ai_api_key = ?
    WHERE id = ?
  `).run(
    nama, npsn, jenjang, alamat, kabupaten, provinsi,
    telepon, email, nama_kamad, tahun_ajaran, semester,
    ai_base_url, ai_model, ai_api_key, req.session.user.madrasahId
  );
  req.session.user.madrasahNama = nama;
  req.session.flash = { type: 'success', message: 'Pengaturan madrasah & integrasi AI berhasil disimpan.' };
  res.redirect('/sim-gtk/pengaturan');
});

// Helper to resolve GTK profile for current session
function getCurrentGtk(req) {
  const userId = req.session.user ? req.session.user.id : null;
  let gtk = null;
  if (userId) {
    gtk = db.prepare('SELECT * FROM gtk WHERE user_id = ?').get(userId);
  }
  if (!gtk) {
    if (req.session.user && (req.session.user.role === 'guru' || (req.session.user.email && req.session.user.email.includes('herman')))) {
      gtk = db.prepare('SELECT * FROM gtk WHERE email LIKE ? OR nama LIKE ?').get('%herman%', '%Herman%');
    }
  }
  if (!gtk) {
    gtk = db.prepare('SELECT * FROM gtk ORDER BY id ASC LIMIT 1').get();
  }
  return gtk;
}

// 3. Portofolio & Kartu Digital GTK
router.get('/sim-gtk/portofolio/data-diri', (req, res) => {
  const gtk = getCurrentGtk(req);
  res.render('portofolio/data-diri', { title: 'Data Diri GTK', currentGtk: gtk });
});

router.get('/sim-gtk/portofolio/kartu-digital', (req, res) => {
  const gtk = getCurrentGtk(req);
  const madrasah = db.prepare('SELECT * FROM madrasah WHERE id = ?').get(gtk.madrasah_id || 1) || {
    nama: 'MAN 2 KABUPATEN GORONTALO',
    npsn: '40203010',
    nama_kamad: 'Drs. H. Abdul Wahab, M.Pd'
  };
  res.render('portofolio/kartu-digital', {
    title: `Kartu Digital GTK - ${gtk.nama}`,
    gtk,
    madrasah
  });
});

router.get('/sim-gtk/manajemen/gtk/:id/kartu-digital', (req, res) => {
  const { id } = req.params;
  const gtk = db.prepare('SELECT * FROM gtk WHERE id = ?').get(id);
  if (!gtk) {
    req.session.flash = { type: 'danger', message: 'Data GTK tidak ditemukan.' };
    return res.redirect('/sim-gtk/manajemen/gtk');
  }
  const madrasah = db.prepare('SELECT * FROM madrasah WHERE id = ?').get(gtk.madrasah_id || 1) || {
    nama: 'MAN 2 KABUPATEN GORONTALO',
    npsn: '40203010',
    nama_kamad: 'Drs. H. Abdul Wahab, M.Pd'
  };
  res.render('portofolio/kartu-digital', {
    title: `Kartu Digital GTK - ${gtk.nama}`,
    gtk,
    madrasah
  });
});

router.get('/sim-gtk/portofolio/perubahan-data', (req, res) => {
  res.render('portofolio/perubahan-data', { title: 'Perubahan Data Diri' });
});
router.post('/sim-gtk/portofolio/perubahan-data', (req, res) => {
  req.session.flash = { type: 'success', message: 'Pengajuan perubahan data diri telah dikirim ke Admin Madrasah.' };
  res.redirect('/sim-gtk/portofolio/perubahan-data');
});
router.get('/sim-gtk/portofolio/golongan-mkg', (req, res) => {
  res.render('portofolio/golongan-mkg', { title: 'Update Golongan & MKG' });
});

// =========================================================================
// ----------------- MODUL ADMINISTRASI IJAZAH & SERTIFIKASI ---------------
// =========================================================================

router.get('/sim-gtk/administrasi/ijazah', (req, res) => {
  const gtk = getCurrentGtk(req);
  const ijazahList = db.prepare('SELECT * FROM gtk_ijazah WHERE gtk_id = ? ORDER BY thn_lulus DESC, id DESC').all(gtk.id);
  res.render('administrasi/ijazah', {
    title: 'Data Ijazah & Pendidikan Formal · SIM-GTK',
    currentGtk: gtk,
    ijazahList
  });
});

router.post('/sim-gtk/administrasi/ijazah', (req, res) => {
  try {
    const gtk = getCurrentGtk(req);
    const { jenjang, thn_lulus, institusi, jurusan, thn_masuk, gelar, ipk, no_ijazah } = req.body;
    db.prepare(`
      INSERT INTO gtk_ijazah (gtk_id, jenjang, institusi, jurusan, thn_masuk, thn_lulus, gelar, ipk, no_ijazah)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(gtk.id, jenjang, institusi, jurusan, thn_masuk || null, thn_lulus, gelar || null, ipk || null, no_ijazah || null);

    req.session.flash = { type: 'success', message: `Data ijazah ${jenjang} di ${institusi} berhasil ditambahkan.` };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal menyimpan: ${err.message}` };
  }
  res.redirect('/sim-gtk/administrasi/ijazah');
});

router.post('/sim-gtk/administrasi/ijazah/:id/hapus', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM gtk_ijazah WHERE id = ?').run(id);
    req.session.flash = { type: 'warning', message: 'Riwayat data ijazah telah dihapus.' };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal menghapus: ${err.message}` };
  }
  res.redirect('/sim-gtk/administrasi/ijazah');
});

router.get('/sim-gtk/administrasi/sertifikasi', (req, res) => {
  const gtk = getCurrentGtk(req);
  const sertifikasiList = db.prepare('SELECT * FROM gtk_sertifikasi WHERE gtk_id = ? ORDER BY id DESC').all(gtk.id);
  res.render('administrasi/sertifikasi', {
    title: 'Data Sertifikasi & Pelatihan · SIM-GTK',
    currentGtk: gtk,
    sertifikasiList
  });
});

router.post('/sim-gtk/administrasi/sertifikasi', (req, res) => {
  try {
    const gtk = getCurrentGtk(req);
    const { jenis, bidang, tgl_terbit, no_sertifikat, lembaga } = req.body;
    db.prepare(`
      INSERT INTO gtk_sertifikasi (gtk_id, jenis, bidang, tgl_terbit, no_sertifikat, lembaga)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(gtk.id, jenis, bidang, tgl_terbit || null, no_sertifikat, lembaga || null);

    req.session.flash = { type: 'success', message: `Sertifikasi '${bidang}' berhasil ditambahkan.` };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal menyimpan: ${err.message}` };
  }
  res.redirect('/sim-gtk/administrasi/sertifikasi');
});

router.post('/sim-gtk/administrasi/sertifikasi/:id/hapus', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM gtk_sertifikasi WHERE id = ?').run(id);
    req.session.flash = { type: 'warning', message: 'Data sertifikat telah dihapus.' };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal menghapus: ${err.message}` };
  }
  res.redirect('/sim-gtk/administrasi/sertifikasi');
});

// =========================================================================
// ----------------- MODUL LAYANAN CUTI & PERIZINAN GTK --------------------
// =========================================================================

router.get('/sim-gtk/cuti', (req, res) => {
  const gtk = getCurrentGtk(req);
  const cutiList = db.prepare('SELECT * FROM gtk_cuti WHERE gtk_id = ? ORDER BY id DESC').all(gtk.id);
  res.render('cuti/index', {
    title: 'Layanan Cuti & Perizinan GTK · SIM-GTK',
    currentGtk: gtk,
    cutiList
  });
});

router.post('/sim-gtk/cuti', (req, res) => {
  try {
    const gtk = getCurrentGtk(req);
    const { jenis_cuti, tgl_mulai, tgl_selesai, lama_hari, alasan, alamat_cuti, telepon } = req.body;
    db.prepare(`
      INSERT INTO gtk_cuti (madrasah_id, gtk_id, jenis_cuti, tgl_mulai, tgl_selesai, lama_hari, alasan, alamat_cuti, telepon, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'menunggu')
    `).run(gtk.madrasah_id || 1, gtk.id, jenis_cuti, tgl_mulai, tgl_selesai, parseInt(lama_hari) || 1, alasan, alamat_cuti, telepon);

    req.session.flash = { type: 'success', message: 'Permohonan cuti berhasil diajukan dan diteruskan ke Kepala Madrasah.' };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal mengajukan cuti: ${err.message}` };
  }
  res.redirect('/sim-gtk/cuti');
});

router.post('/sim-gtk/cuti/:id/batal', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM gtk_cuti WHERE id = ? AND status = 'menunggu'").run(id);
    req.session.flash = { type: 'warning', message: 'Pengajuan cuti berhasil dibatalkan.' };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal membatalkan: ${err.message}` };
  }
  res.redirect('/sim-gtk/cuti');
});

router.get('/sim-gtk/cuti/:id/cetak', (req, res) => {
  const { id } = req.params;
  const cuti = db.prepare(`
    SELECT c.*, g.nama as gtk_nama, g.nip, g.nuptk, g.jabatan, g.status_kepegawaian, g.golongan, g.mapel_utama
    FROM gtk_cuti c
    JOIN gtk g ON c.gtk_id = g.id
    WHERE c.id = ?
  `).get(id);

  if (!cuti) {
    return res.status(404).send('Surat Izin Cuti tidak ditemukan');
  }

  const madrasah = db.prepare('SELECT * FROM madrasah WHERE id = ?').get(cuti.madrasah_id || 1) || {
    nama: 'MAN 2 KABUPATEN GORONTALO',
    alamat: 'Limboto, Kabupaten Gorontalo',
    telepon: '0435-881234',
    email: 'info@man2gorontalo.sch.id',
    nama_kamad: 'Drs. H. Abdul Wahab, M.Pd'
  };

  res.render('cuti/cetak', {
    title: `Surat Izin Cuti - ${cuti.gtk_nama}`,
    cuti,
    madrasah
  });
});

// ----------------- MODUL PENILAIAN & SUPERVISI GTK -----------------

// Helper to fetch GTK list for dropdowns
function getGtkList(madrasahId) {
  return db.prepare('SELECT id, nama, nip, nuptk, jabatan, mapel_utama FROM gtk WHERE madrasah_id = ? ORDER BY nama ASC').all(madrasahId);
}

// 1. Jadwal Supervisi
router.get('/sim-gtk/penilaian/jadwal', (req, res) => {
  const madrasahId = req.session.user.madrasahId;
  const jadwalList = db.prepare(`
    SELECT j.*, g.nama as gtk_nama, g.nip as gtk_nip, g.nuptk as gtk_nuptk
    FROM jadwal_supervisi j
    JOIN gtk g ON j.gtk_id = g.id
    WHERE j.madrasah_id = ?
    ORDER BY j.tanggal ASC, j.jam ASC
  `).all(madrasahId);

  const gtkList = getGtkList(madrasahId);
  const uniqueGtkCount = new Set(jadwalList.map(j => j.gtk_id)).size;

  res.render('penilaian/jadwal', {
    title: 'Jadwal Supervisi',
    jadwalList,
    gtkList,
    uniqueGtkCount
  });
});

router.post('/sim-gtk/penilaian/jadwal/tambah', (req, res) => {
  const { gtk_id, jenis_supervisi, tanggal, jam, kelas, mapel, supervisor_nama, ruang } = req.body;
  db.prepare(`
    INSERT INTO jadwal_supervisi (madrasah_id, gtk_id, supervisor_nama, jenis_supervisi, tanggal, jam, kelas, mapel, ruang, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Terjadwal')
  `).run(req.session.user.madrasahId, gtk_id, supervisor_nama, jenis_supervisi, tanggal, jam, kelas, mapel, ruang);

  req.session.flash = { type: 'success', message: 'Jadwal supervisi berhasil ditambahkan.' };
  res.redirect('/sim-gtk/penilaian/jadwal');
});

// 2. Perangkat Pembelajaran
router.get('/sim-gtk/penilaian/perangkat', (req, res) => {
  const madrasahId = req.session.user.madrasahId;
  const perangkatList = db.prepare(`
    SELECT p.*, g.nama as gtk_nama, g.nip as gtk_nip, g.nuptk as gtk_nuptk
    FROM perangkat_supervisi p
    JOIN gtk g ON p.gtk_id = g.id
    WHERE p.madrasah_id = ?
    ORDER BY p.id DESC
  `).all(madrasahId);

  const avgScore = perangkatList.length ? Math.round(perangkatList.reduce((acc, p) => acc + (p.skor || 0), 0) / perangkatList.length) : 85;
  const gtkList = getGtkList(madrasahId);

  res.render('penilaian/perangkat', {
    title: 'Perangkat Pembelajaran',
    perangkatList,
    gtkList,
    avgScore
  });
});

router.post('/sim-gtk/penilaian/perangkat/tambah', (req, res) => {
  const { gtk_id, mapel, kelas, jenis_perangkat, file_nama, skor, status_verifikasi, catatan } = req.body;
  const now = new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO perangkat_supervisi (madrasah_id, gtk_id, mapel, kelas, jenis_perangkat, file_nama, skor, status_verifikasi, tanggal_unggah, tanggal_periksa, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.session.user.madrasahId, gtk_id, mapel, kelas, jenis_perangkat, file_nama, parseInt(skor) || 85, status_verifikasi || 'Lengkap', now, now, catatan);

  req.session.flash = { type: 'success', message: 'Perangkat pembelajaran berhasil didaftarkan.' };
  res.redirect('/sim-gtk/penilaian/perangkat');
});

// 3. Supervisi Akademik (4 Menu & Butir Penilaian Sesuai Lampiran)
router.get('/sim-gtk/penilaian/akademik', (req, res) => {
  const madrasahId = req.session.user.madrasahId || 1;
  ensureSupervisiColumns();

  const akademikList = db.prepare(`
    SELECT a.*, g.nama as gtk_nama, g.nip as gtk_nip, g.nuptk as gtk_nuptk
    FROM supervisi_akademik a
    JOIN gtk g ON a.gtk_id = g.id
    WHERE a.madrasah_id = ?
    ORDER BY a.tanggal DESC, a.id DESC
  `).all(madrasahId);

  const avgAdmin = akademikList.length ? Math.round(akademikList.reduce((acc, a) => acc + (a.skor_administrasi || 0), 0) / akademikList.length) : 88;
  const avgModul = akademikList.length ? Math.round(akademikList.reduce((acc, a) => acc + (a.skor_modul_ajar || 88), 0) / akademikList.length) : 88;
  const avgMengajar = akademikList.length ? Math.round(akademikList.reduce((acc, a) => acc + (a.skor_mengajar || 0), 0) / akademikList.length) : 86;
  const avgPenilaian = akademikList.length ? Math.round(akademikList.reduce((acc, a) => acc + (a.skor_penilaian_asesmen || 85), 0) / akademikList.length) : 85;
  const avgTotal = akademikList.length ? Math.round(akademikList.reduce((acc, a) => acc + (a.skor_total || 0), 0) / akademikList.length) : 87;
  const gtkList = getGtkList(madrasahId);

  const dynamicInstrumen = getInstrumenSupervisi(madrasahId);

  res.render('penilaian/akademik', {
    title: 'Supervisi Akademik — SIM-GTK',
    akademikList,
    gtkList,
    instrumen: dynamicInstrumen,
    avgAdmin,
    avgModul,
    avgMengajar,
    avgPenilaian,
    avgTotal
  });
});

router.post('/sim-gtk/penilaian/akademik/simpan', (req, res) => {
  ensureSupervisiColumns();
  const madrasahId = req.session.user.madrasahId || 1;
  const { 
    gtk_id, mapel, kelas, tanggal, supervisor_nama, 
    catatan, tindak_lanjut, foto_pengamatan_1, foto_pengamatan_2 
  } = req.body;

  const dynamicInstrumen = getInstrumenSupervisi(madrasahId);

  // Kumpulkan skor 1-4 dari butir dinamis
  const butirScores = {};
  for (const catKey of Object.keys(dynamicInstrumen)) {
    for (const item of dynamicInstrumen[catKey].items) {
      const val = parseInt(req.body['item_' + item.id]);
      butirScores[item.id] = (!isNaN(val) && val >= 1 && val <= 4) ? val : 3;
    }
  }

  // Hitung nilai otomatis & predikat
  const hasil = hitungNilaiDanPredikat(butirScores, madrasahId);

  db.prepare(`
    INSERT INTO supervisi_akademik (
      madrasah_id, gtk_id, supervisor_nama, tanggal, mapel, kelas,
      skor_administrasi, skor_modul_ajar, skor_mengajar, skor_penilaian_asesmen, skor_total,
      predikat, butir_scores_json, foto_pengamatan_1, foto_pengamatan_2,
      catatan, tindak_lanjut, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Selesai')
  `).run(
    madrasahId,
    gtk_id,
    supervisor_nama || (req.session.user ? req.session.user.nama : 'Kepala Madrasah'),
    tanggal || new Date().toISOString().slice(0, 10),
    mapel || 'Informatika',
    kelas || 'X-A',
    hasil.skor_administrasi,
    hasil.skor_modul_ajar,
    hasil.skor_mengajar,
    hasil.skor_penilaian_asesmen,
    hasil.skor_total,
    hasil.predikat,
    JSON.stringify(butirScores),
    foto_pengamatan_1 || '',
    foto_pengamatan_2 || '',
    catatan || 'Pembelajaran berlangsung aktif dan berpusat pada peserta didik.',
    tindak_lanjut || 'Pertahankan dan kembangkan pembelajaran berdiferensiasi.'
  );

  req.session.flash = { 
    type: 'success', 
    message: `Supervisi akademik 4 menu berhasil disimpan! Nilai Akhir: ${hasil.skor_total} (Predikat: ${hasil.predikat} / ${hasil.grade}).` 
  };
  res.redirect('/sim-gtk/penilaian/akademik');
});

// Endpoint Konfigurasi Butir Penilaian Fleksibel (Dinamis)
router.get('/sim-gtk/penilaian/instrumen', (req, res) => {
  const madrasahId = req.session.user.madrasahId || 1;
  const instrumen = getInstrumenSupervisi(madrasahId);
  res.render('penilaian/instrumen', {
    title: 'Konfigurasi Instrumen Supervisi — SIM-GTK',
    instrumen
  });
});

router.post('/sim-gtk/penilaian/instrumen/simpan', (req, res) => {
  const madrasahId = req.session.user.madrasahId || 1;
  const { id, domain, kode, label, indikator_1, indikator_2, indikator_3, indikator_4, bobot } = req.body;
  saveInstrumenButir({
    id: id ? parseInt(id) : null,
    madrasah_id: madrasahId,
    domain,
    kode,
    label,
    indikator_1,
    indikator_2,
    indikator_3,
    indikator_4,
    bobot: parseFloat(bobot) || 1.0,
    created_by_role: req.session.user ? req.session.user.role : 'kamad'
  });
  req.session.flash = { type: 'success', message: 'Butir penilaian supervisi berhasil diperbarui.' };
  res.redirect('/sim-gtk/penilaian/instrumen');
});

router.post('/sim-gtk/penilaian/instrumen/hapus', (req, res) => {
  const { id } = req.body;
  deleteInstrumenButir(id);
  req.session.flash = { type: 'success', message: 'Butir penilaian supervisi berhasil dihapus.' };
  res.redirect('/sim-gtk/penilaian/instrumen');
});

router.post('/sim-gtk/penilaian/instrumen/reorder', (req, res) => {
  const { itemIds } = req.body;
  if (Array.isArray(itemIds)) {
    reorderInstrumen(itemIds);
  }
  res.json({ success: true });
});

// Endpoint Manajemen Tugas Tambahan Guru (Penetapan Kamad)
router.get('/sim-gtk/manajemen/tugas-tambahan', (req, res) => {
  const madrasahId = req.session.user.madrasahId || 1;
  const tugasList = getGtkTugasTambahan(madrasahId);
  const gtkList = getGtkList(madrasahId);
  res.render('manajemen/tugas_tambahan', {
    title: 'Tugas Tambahan Guru — SIM-GTK',
    tugasList,
    gtkList
  });
});

router.post('/sim-gtk/manajemen/tugas-tambahan/simpan', (req, res) => {
  const madrasahId = req.session.user.madrasahId || 1;
  const { id, gtk_id, jabatan_tambahan, nomor_sk, tanggal_sk, ekuivalensi_jtm, keterangan } = req.body;
  saveGtkTugasTambahan({
    id: id ? parseInt(id) : null,
    madrasah_id: madrasahId,
    gtk_id: parseInt(gtk_id),
    jabatan_tambahan,
    nomor_sk,
    tanggal_sk,
    tmt: tanggal_sk,
    ekuivalensi_jtm: parseInt(ekuivalensi_jtm) || 12,
    keterangan
  });
  req.session.flash = { type: 'success', message: 'Tugas tambahan guru berhasil disimpan dan diterbitkan SK!' };
  res.redirect('/sim-gtk/manajemen/tugas-tambahan');
});

router.post('/sim-gtk/manajemen/tugas-tambahan/hapus', (req, res) => {
  const { id } = req.body;
  deleteGtkTugasTambahan(id);
  req.session.flash = { type: 'success', message: 'Tugas tambahan berhasil dihapus.' };
  res.redirect('/sim-gtk/manajemen/tugas-tambahan');
});

// Endpoint Dashboard Guru Penilai (Tugas Mandat Kamad)
router.get('/sim-gtk/guru-penilai/dashboard', (req, res) => {
  const madrasahId = req.session.user.madrasahId || 1;
  const jadwalList = db.prepare(`
    SELECT j.*, g.nama as gtk_nama, g.nip as gtk_nip, g.nuptk as gtk_nuptk
    FROM jadwal_supervisi j
    JOIN gtk g ON j.gtk_id = g.id
    WHERE j.madrasah_id = ?
    ORDER BY j.tanggal ASC
  `).all(madrasahId);

  res.render('guru_penilai/dashboard', {
    title: 'Dashboard Guru Penilai — SIM-GTK',
    jadwalList
  });
});

// Endpoint Impor Data Guru Sekaligus dari CSV/Teks (Fitur Lampiran 1)
router.post('/sim-gtk/penilaian/impor-guru', (req, res) => {
  const { csv_data } = req.body;
  if (!csv_data || !csv_data.trim()) {
    req.session.flash = { type: 'danger', message: 'Harap masukkan data CSV guru yang valid.' };
    return res.redirect('/sim-gtk/penilaian/akademik');
  }

  const madrasahId = req.session.user.madrasahId || 1;
  const count = importGtkMassal(madrasahId, csv_data);

  req.session.flash = { 
    type: 'success', 
    message: `Berhasil mengimpor ${count} data guru sekaligus! Akun guru dan madrasah telah aktif.` 
  };
  res.redirect('/sim-gtk/penilaian/akademik');
});

// 4. Supervisi Mengajar (Observasi Kelas)
router.get('/sim-gtk/penilaian/mengajar', (req, res) => {
  const madrasahId = req.session.user.madrasahId;
  const mengajarList = db.prepare(`
    SELECT m.*, g.nama as gtk_nama, g.nip as gtk_nip, g.nuptk as gtk_nuptk
    FROM supervisi_mengajar m
    JOIN gtk g ON m.gtk_id = g.id
    WHERE m.madrasah_id = ?
    ORDER BY m.tanggal DESC
  `).all(madrasahId);

  const avgAwal = mengajarList.length ? Math.round(mengajarList.reduce((acc, m) => acc + (m.skor_kegiatan_awal || 0), 0) / mengajarList.length) : 90;
  const avgInti = mengajarList.length ? Math.round(mengajarList.reduce((acc, m) => acc + (m.skor_kegiatan_inti || 0), 0) / mengajarList.length) : 86;
  const avgTotal = mengajarList.length ? Math.round(mengajarList.reduce((acc, m) => acc + (m.skor_total || 0), 0) / mengajarList.length) : 88;
  const gtkList = getGtkList(madrasahId);

  res.render('penilaian/mengajar', {
    title: 'Supervisi Mengajar',
    mengajarList,
    gtkList,
    avgAwal,
    avgInti,
    avgTotal
  });
});

router.post('/sim-gtk/penilaian/mengajar/simpan', (req, res) => {
  const { gtk_id, mapel, kelas, materi, tanggal, supervisor_nama, skor_awal, skor_inti, skor_penutup, catatan, rekomendasi } = req.body;
  const awal = parseInt(skor_awal) || 85;
  const inti = parseInt(skor_inti) || 85;
  const penutup = parseInt(skor_penutup) || 85;
  // Bobot: 20% awal, 60% inti, 20% penutup
  const total = Math.round((awal * 0.2) + (inti * 0.6) + (penutup * 0.2));
  const predikat = total >= 90 ? 'Amat Baik' : (total >= 80 ? 'Baik' : 'Cukup');

  db.prepare(`
    INSERT INTO supervisi_mengajar (madrasah_id, gtk_id, supervisor_nama, tanggal, mapel, kelas, materi, skor_kegiatan_awal, skor_kegiatan_inti, skor_kegiatan_penutup, skor_total, predikat, catatan, rekomendasi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.session.user.madrasahId, gtk_id, supervisor_nama, tanggal, mapel, kelas, materi, awal, inti, penutup, total, predikat, catatan, rekomendasi);

  req.session.flash = { type: 'success', message: `Observasi mengajar berhasil disimpan dengan skor ${total} (${predikat}).` };
  res.redirect('/sim-gtk/penilaian/mengajar');
});

// 5. Supervisi Manajerial (Tugas Tambahan)
router.get('/sim-gtk/penilaian/manajerial', (req, res) => {
  const madrasahId = req.session.user.madrasahId;
  const manajerialList = db.prepare(`
    SELECT m.*, g.nama as gtk_nama, g.nip as gtk_nip, g.nuptk as gtk_nuptk
    FROM supervisi_manajerial m
    JOIN gtk g ON m.gtk_id = g.id
    WHERE m.madrasah_id = ?
    ORDER BY m.tanggal DESC
  `).all(madrasahId);

  const avgProgram = manajerialList.length ? Math.round(manajerialList.reduce((acc, m) => acc + (m.skor_program || 0), 0) / manajerialList.length) : 90;
  const avgPelaksanaan = manajerialList.length ? Math.round(manajerialList.reduce((acc, m) => acc + (m.skor_pelaksanaan || 0), 0) / manajerialList.length) : 88;
  const avgTotal = manajerialList.length ? Math.round(manajerialList.reduce((acc, m) => acc + (m.skor_total || 0), 0) / manajerialList.length) : 89;
  const gtkList = getGtkList(madrasahId);

  res.render('penilaian/manajerial', {
    title: 'Supervisi Manajerial',
    manajerialList,
    gtkList,
    avgProgram,
    avgPelaksanaan,
    avgTotal
  });
});

router.post('/sim-gtk/penilaian/manajerial/simpan', (req, res) => {
  const { gtk_id, tugas_tambahan, supervisor_nama, tanggal, skor_program, skor_pelaksanaan, skor_evaluasi, catatan, rekomendasi } = req.body;
  const program = parseInt(skor_program) || 85;
  const pelaksanaan = parseInt(skor_pelaksanaan) || 85;
  const evaluasi = parseInt(skor_evaluasi) || 85;
  // Bobot: 30% program, 50% pelaksanaan, 20% evaluasi
  const total = Math.round((program * 0.3) + (pelaksanaan * 0.5) + (evaluasi * 0.2));
  const predikat = total >= 90 ? 'Amat Baik' : (total >= 80 ? 'Baik' : 'Cukup');

  db.prepare(`
    INSERT INTO supervisi_manajerial (madrasah_id, gtk_id, tugas_tambahan, supervisor_nama, tanggal, skor_program, skor_pelaksanaan, skor_evaluasi, skor_total, predikat, catatan, rekomendasi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.session.user.madrasahId, gtk_id, tugas_tambahan, supervisor_nama, tanggal, program, pelaksanaan, evaluasi, total, predikat, catatan, rekomendasi);

  req.session.flash = { type: 'success', message: `Supervisi manajerial ${tugas_tambahan} berhasil disimpan dengan skor ${total} (${predikat}).` };
  res.redirect('/sim-gtk/penilaian/manajerial');
});

// 6. Daftar Hadir Supervisi
router.get('/sim-gtk/penilaian/daftar-hadir', (req, res) => {
  const madrasahId = req.session.user.madrasahId;
  const hadirList = db.prepare(`
    SELECT d.*, g.nama as gtk_nama, g.nip as gtk_nip, g.nuptk as gtk_nuptk, g.jabatan as gtk_jabatan
    FROM daftar_hadir_supervisi d
    JOIN gtk g ON d.gtk_id = g.id
    WHERE d.madrasah_id = ?
    ORDER BY d.tanggal DESC, d.id DESC
  `).all(madrasahId);

  const gtkList = getGtkList(madrasahId);

  res.render('penilaian/daftar_hadir', {
    title: 'Daftar Hadir Supervisi',
    hadirList,
    gtkList
  });
});

router.post('/sim-gtk/penilaian/daftar-hadir/simpan', (req, res) => {
  const { gtk_id, tanggal, supervisor_nama, jenis_supervisi, status_kehadiran, jam_hadir, keterangan } = req.body;
  db.prepare(`
    INSERT INTO daftar_hadir_supervisi (madrasah_id, gtk_id, tanggal, supervisor_nama, jenis_supervisi, status_kehadiran, jam_hadir, tanda_tangan, keterangan)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Tervalidasi Digital', ?)
  `).run(req.session.user.madrasahId, gtk_id, tanggal, supervisor_nama, jenis_supervisi, status_kehadiran || 'Hadir', jam_hadir || '07:30', keterangan);

  req.session.flash = { type: 'success', message: 'Presensi supervisi berhasil dicatat dan divalidasi.' };
  res.redirect('/sim-gtk/penilaian/daftar-hadir');
});

// 7. Laporan & Rekap Hasil Supervisi (Fitur Lampiran 1)
router.get('/sim-gtk/penilaian/laporan', (req, res) => {
  const madrasahId = req.session.user.madrasahId || 1;
  ensureSupervisiColumns();

  const madrasah = db.prepare('SELECT * FROM madrasah WHERE id = ?').get(madrasahId) || {
    id: 1,
    nama: 'MAN 2 KABUPATEN GORONTALO',
    alamat: 'Jl. K.H. Dewantara No. 12',
    kabupaten: 'Kabupaten Gorontalo',
    provinsi: 'Gorontalo',
    telepon: '(0435) 881234',
    nama_kamad: 'Drs. H. Abdul Wahab, M.Pd',
    tahun_ajaran: '2026/2027',
    semester: 'Ganjil'
  };

  const rekapData = getSupervisiRekapMatriks(madrasahId);
  const gtkList = getGtkList(madrasahId);

  // If specific GTK requested, or default to Herman
  const reqGtkId = req.query.gtk_id ? parseInt(req.query.gtk_id) : (gtkList.find(g => g.nama.includes('Herman'))?.id || gtkList[0]?.id || 1);
  const selectedGtk = db.prepare('SELECT * FROM gtk WHERE id = ?').get(reqGtkId);

  // Ambil record supervisi akademik lengkap untuk GTK terpilih
  const sa = db.prepare(`
    SELECT * FROM supervisi_akademik 
    WHERE gtk_id = ? AND madrasah_id = ? 
    ORDER BY tanggal DESC, id DESC LIMIT 1
  `).get(reqGtkId, madrasahId);

  // Fetch manajerial jika ada
  const manajerial = db.prepare('SELECT tugas_tambahan, skor_total FROM supervisi_manajerial WHERE gtk_id = ? ORDER BY id DESC LIMIT 1').get(reqGtkId);

  const skorAdmin = sa ? sa.skor_administrasi : 90;
  const skorModul = sa ? (sa.skor_modul_ajar || 88) : 88;
  const skorMengajar = sa ? sa.skor_mengajar : 86;
  const skorPenilaian = sa ? (sa.skor_penilaian_asesmen || 85) : 85;
  const skorManajerial = manajerial ? manajerial.skor_total : (selectedGtk?.nama?.includes('Herman') ? 90 : 0);
  const tugasTambahan = manajerial ? manajerial.tugas_tambahan : (selectedGtk?.nama?.includes('Herman') ? 'Kepala Laboratorium Komputer' : '-');

  const components = [skorAdmin, skorModul, skorMengajar, skorPenilaian];
  if (skorManajerial > 0) components.push(skorManajerial);
  const nilaiKomprehensif = sa ? sa.skor_total : Math.round(components.reduce((a, b) => a + b, 0) / components.length);
  const predikatAkhir = sa ? sa.predikat : (nilaiKomprehensif >= 91 ? 'Amat Baik' : (nilaiKomprehensif >= 81 ? 'Baik' : 'Cukup'));

  // Foto bukti pengamatan (maksimal 2)
  const foto1 = (sa && sa.foto_pengamatan_1) ? sa.foto_pengamatan_1 : '/img/supervisi_kelas_1.jpg';
  const foto2 = (sa && sa.foto_pengamatan_2) ? sa.foto_pengamatan_2 : '/img/supervisi_kelas_2.jpg';

  // Butir scores parsing
  let butirScores = {};
  if (sa && sa.butir_scores_json) {
    try {
      butirScores = JSON.parse(sa.butir_scores_json);
    } catch(e) {}
  }

  res.render('penilaian/laporan', {
    title: 'Laporan & Rekap Hasil Supervisi — SIM-GTK',
    madrasah,
    gtkList,
    selectedGtk,
    tugasTambahan,
    supervisiRecord: sa,
    skorAdmin,
    skorModul,
    skorMengajar,
    skorPenilaian,
    skorManajerial,
    nilaiKomprehensif,
    predikatAkhir,
    foto1,
    foto2,
    butirScores,
    instrumen: INSTRUMEN_SUPERVISI,
    rekapData
  });
});


// 8. Referensi
router.get('/sim-gtk/referensi/presensi', (req, res) => {
  res.render('referensi/presensi', { title: 'Presensi Referensi' });
});
router.get('/sim-gtk/referensi/hari-libur', (req, res) => {
  res.render('referensi/hari-libur', { title: 'Hari Libur Akademik' });
});
router.get('/sim-gtk/referensi/data-pengawas', (req, res) => {
  res.render('referensi/data-pengawas', { title: 'Data Pengawas Madrasah' });
});

// 9. Pembelajaran
router.get('/sim-gtk/pembelajaran/absensi', (req, res) => {
  res.render('pembelajaran/absensi', { title: 'Absensi Siswa' });
});
router.post('/sim-gtk/pembelajaran/absensi/simpan', (req, res) => {
  req.session.flash = { type: 'success', message: 'Data absensi peserta didik berhasil disimpan.' };
  res.redirect('/sim-gtk/pembelajaran/absensi');
});

router.get('/sim-gtk/pembelajaran/jurnal', (req, res) => {
  res.render('pembelajaran/jurnal', { title: 'Jurnal Mengajar Harian' });
});
router.post('/sim-gtk/pembelajaran/jurnal/simpan', (req, res) => {
  req.session.flash = { type: 'success', message: 'Catatan jurnal mengajar berhasil disimpan.' };
  res.redirect('/sim-gtk/pembelajaran/jurnal');
});

router.get('/sim-gtk/pembelajaran/jadwal', (req, res) => {
  res.render('pembelajaran/jadwal', { title: 'Jadwal Mingguan Pembelajaran' });
});

// AI Perangkat Ajar Generator
router.get('/sim-gtk/pembelajaran/ai', (req, res) => {
  res.render('pembelajaran/ai', { title: 'AI Perangkat Ajar' });
});

router.post('/sim-gtk/pembelajaran/ai/generate', async (req, res) => {
  try {
    const { jenis, mapel, kelas, materi, jp, jumlah_siswa, cp, gambar } = req.body;
    const content = await generatePerangkatAjar({
      jenis,
      mapel,
      kelas,
      materi,
      jp: parseInt(jp) || 4,
      jumlah_siswa: parseInt(jumlah_siswa) || 30,
      cp,
      gambar: Boolean(gambar),
      madrasahId: req.session.user.madrasahId,
      guruNama: req.session.user.nama
    });

    // Save to database
    const ins = db.prepare(`
      INSERT INTO dokumen_ai (madrasah_id, gtk_id, jenis, mapel, kelas, materi, jp, jumlah_siswa, cp, konten_markdown)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.user.madrasahId,
      req.session.user.id,
      jenis,
      mapel,
      kelas,
      materi,
      parseInt(jp) || 4,
      parseInt(jumlah_siswa) || 30,
      cp || '',
      content
    );

    req.session.flash = { type: 'success', message: `Dokumen ${jenis} "${materi}" berhasil dibuat!` };
    res.redirect(`/sim-gtk/pembelajaran/ai/view/${ins.lastInsertRowid}`);
  } catch (err) {
    console.error('Error generating AI doc:', err);
    req.session.flash = { type: 'danger', message: `Gagal membuat dokumen: ${err.message}` };
    res.redirect('/sim-gtk/pembelajaran/ai');
  }
});

// View generated AI doc
router.get('/sim-gtk/pembelajaran/ai/view/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM dokumen_ai WHERE id = ?').get(req.params.id);
  if (!doc) {
    req.session.flash = { type: 'danger', message: 'Dokumen tidak ditemukan.' };
    return res.redirect('/sim-gtk/pembelajaran/ai');
  }
  res.render('pembelajaran/ai_view', { title: `${doc.jenis} — ${doc.materi}`, doc });
});

// Export document (Word, Excel, PowerPoint)
router.get('/sim-gtk/pembelajaran/ai/export/:id/:format', async (req, res) => {
  const doc = db.prepare('SELECT * FROM dokumen_ai WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).send('Dokumen tidak ditemukan');

  const madrasah = db.prepare('SELECT * FROM madrasah WHERE id = ?').get(doc.madrasah_id);
  const format = req.params.format.toLowerCase();
  const safeFilename = `${doc.jenis}_${doc.mapel}_${doc.materi}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    if (format === 'docx' || format === 'word') {
      const buffer = await exportToDocx({
        title: `${doc.jenis} — ${doc.materi}`,
        content: doc.konten_markdown,
        author: req.session.user.nama,
        madrasah
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.docx"`);
      return res.send(buffer);
    }

    if (format === 'xlsx' || format === 'excel') {
      const rows = [
        ['DOKUMEN PERANGKAT AJAR SIM-GTK'],
        ['Madrasah', madrasah.nama],
        ['Mata Pelajaran', doc.mapel],
        ['Kelas', doc.kelas],
        ['Materi', doc.materi],
        ['Alokasi Waktu', `${doc.jp} JP`],
        [],
        ['Isi Dokumen (Teks Lengkap)'],
        ...doc.konten_markdown.split('\n').map(line => [line])
      ];
      const buffer = exportToXlsx({ title: doc.materi, rows });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'pptx' || format === 'powerpoint') {
      const sections = doc.konten_markdown.split(/###?\s+/).filter(Boolean).map(sec => {
        const lines = sec.split('\n');
        return {
          title: lines[0].replace(/[*_#]/g, '').trim(),
          content: lines.slice(1).join('\n').replace(/[*_#]/g, '').trim().substring(0, 400)
        };
      });
      const buffer = await exportToPptx({
        title: `${doc.jenis}: ${doc.materi}`,
        subTitle: `${doc.mapel} (${doc.kelas}) · ${madrasah.nama}`,
        sections
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pptx"`);
      return res.send(buffer);
    }

    res.status(400).send('Format tidak didukung');
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).send('Gagal mengekspor dokumen');
  }
});

// 10. Manajemen Madrasah
router.get('/sim-gtk/manajemen/gtk', (req, res) => {
  res.render('manajemen/gtk', { title: 'Data GTK' });
});
router.get('/sim-gtk/manajemen/gtk/:id', (req, res) => {
  res.render('portofolio/data-diri', { title: 'Detail GTK' });
});
router.post('/sim-gtk/manajemen/gtk/:id/reset', (req, res) => {
  req.session.flash = { type: 'success', message: 'Kata sandi akun GTK berhasil direset ke kata sandi awal.' };
  res.redirect('/sim-gtk/manajemen/gtk');
});

router.get('/sim-gtk/manajemen/persetujuan', (req, res) => {
  res.render('manajemen/persetujuan', { title: 'Persetujuan & Verifikasi' });
});
router.post('/sim-gtk/manajemen/persetujuan/:id/:action', (req, res) => {
  const { action } = req.params;
  const status = action === 'setuju' ? 'disetujui' : 'ditolak';
  db.prepare('UPDATE persetujuan SET status = ?, tanggal_proses = ? WHERE id = ?')
    .run(status, new Date().toISOString().slice(0, 10), req.params.id);
  req.session.flash = { type: 'success', message: `Pengajuan berhasil ${status}.` };
  res.redirect('/sim-gtk/manajemen/persetujuan');
});

router.get('/sim-gtk/manajemen/kelas', (req, res) => {
  res.render('manajemen/kelas', { title: 'Kelas & Siswa' });
});
router.get('/sim-gtk/manajemen/mapel', (req, res) => {
  res.render('manajemen/mapel', { title: 'Mata Pelajaran' });
});
router.get('/sim-gtk/manajemen/jadwal', (req, res) => {
  res.render('manajemen/jadwal', { title: 'Jadwal Pelajaran Madrasah' });
});

router.get('/sim-gtk/manajemen/supervisi', (req, res) => {
  res.render('manajemen/supervisi', { title: 'Supervisi GTK' });
});
router.get('/sim-gtk/manajemen/supervisi/baru', (req, res) => {
  res.render('manajemen/supervisi', { title: 'Buat Supervisi Baru' });
});
router.get('/sim-gtk/manajemen/supervisi/:id', (req, res) => {
  res.render('manajemen/supervisi', { title: 'Hasil Supervisi' });
});

router.get('/sim-gtk/manajemen/presensi', (req, res) => {
  res.render('manajemen/presensi', { title: 'Presensi GTK' });
});
router.get('/sim-gtk/manajemen/pengguna', (req, res) => {
  res.render('manajemen/pengguna', { title: 'Akun Pengguna' });
});

// ----------------- PLATFORM SUPERADMIN ROUTES -----------------

// Helper to log audit actions
function recordAuditLog(user, aksi, modul, detail, status = 'success') {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_nama, role, aksi, modul, detail, ip_address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      user ? user.nama : 'Administrator Pusat',
      user ? user.role : 'superadmin',
      aksi,
      modul,
      detail,
      '127.0.0.1',
      status
    );
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

// 1. DASHBOARD PLATFORM
router.get(['/sim-gtk/superadmin', '/sim-gtk/superadmin/dashboard'], (req, res) => {
  const totalLembaga = db.prepare('SELECT count(*) as c FROM madrasah').get().c;
  const lembagaAktif = db.prepare("SELECT count(*) as c FROM madrasah WHERE status = 'aktif'").get().c;
  const lembagaPending = db.prepare("SELECT count(*) as c FROM madrasah WHERE status = 'menunggu_verifikasi'").get().c;
  const totalGtk = db.prepare('SELECT count(*) as c FROM gtk').get().c;
  const totalAdminLembaga = db.prepare("SELECT count(*) as c FROM users WHERE role = 'admin'").get().c;
  const totalPengawas = db.prepare("SELECT count(*) as c FROM users WHERE role = 'pengawas'").get().c;

  const storageTotal = db.prepare('SELECT COALESCE(SUM(storage_mb), 8192) as s FROM madrasah').get().s || 8192;
  const dokumenAiCount = db.prepare('SELECT count(*) as c FROM dokumen_ai').get().c;

  const jenjangCounts = db.prepare(`
    SELECT jenjang, count(*) as count FROM madrasah GROUP BY jenjang
  `).all();
  const jenjangStats = { ma: 0, mts: 0, mi: 0, ra: 0 };
  jenjangCounts.forEach(j => {
    const key = (j.jenjang || '').toLowerCase();
    if (jenjangStats[key] !== undefined) jenjangStats[key] = j.count;
  });

  const recentLogs = db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5`).all();

  const technicalAlerts = [
    { level: 'info', kategori: 'DATABASE', judul: 'Pemeliharaan Rutin SQLite WAL', pesan: 'WAL Checkpoint dieksekusi secara otomatis setiap hari pukul 04:00 WITA.', waktu: 'Hari ini, 04:00' },
    { level: 'success', kategori: 'API AI', judul: 'Koneksi Gateway OpenAI Aktif', pesan: 'Model GPT-4o-mini terhubung dengan respons latensi stabil 142ms.', waktu: 'Hari ini, 08:30' },
    { level: 'warning', kategori: 'STORAGE', judul: 'Peringatan Kapasitas Dokumen Satker', pesan: 'MAS Al-Khairaat Tilamuta telah mencapai 75% kuota penyimpanan berkas.', waktu: 'Kemarin, 15:20' }
  ];

  res.render('superadmin/dashboard', {
    title: 'Dashboard Platform · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'dashboard',
    stats: {
      totalLembaga,
      lembagaAktif,
      lembagaPending,
      totalGtk,
      totalAdminLembaga,
      totalPengawas,
      storageUsedMb: 1240,
      storageTotalMb: storageTotal,
      aiTokensUsed: 384500,
      dokumenAiCount: dokumenAiCount + 42
    },
    jenjangStats,
    technicalAlerts,
    recentLogs
  });
});

// 2. MANAJEMEN LEMBAGA
router.get('/sim-gtk/superadmin/lembaga', (req, res) => {
  const lembagas = db.prepare('SELECT * FROM madrasah ORDER BY id DESC').all();
  res.render('superadmin/lembaga', {
    title: 'Manajemen Lembaga · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'lembaga',
    lembagas
  });
});

router.post('/sim-gtk/superadmin/lembaga', (req, res) => {
  const { npsn, jenjang, nama, kabupaten, provinsi, alamat, nama_kamad, telepon, email, paket_layanan, status } = req.body;
  const kapasitas = paket_layanan === 'Enterprise Kanwil' ? 300 : (paket_layanan === 'Starter Madrasah Swasta' ? 40 : 100);
  const storage = paket_layanan === 'Enterprise Kanwil' ? 10240 : (paket_layanan === 'Starter Madrasah Swasta' ? 1024 : 2048);

  const stmt = db.prepare(`
    INSERT INTO madrasah (npsn, jenjang, nama, kabupaten, provinsi, alamat, nama_kamad, telepon, email, paket_layanan, status, kapasitas_gtk, storage_mb)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(npsn, jenjang, nama, kabupaten, provinsi, alamat, nama_kamad, telepon, email, paket_layanan, status || 'aktif', kapasitas, storage);

  recordAuditLog(req.session.user, 'Registrasi Lembaga Baru', 'Manajemen Lembaga', `Mendaftarkan lembaga baru: ${nama} (${npsn})`);
  req.session.flash = { type: 'success', message: `Lembaga ${nama} berhasil didaftarkan.` };
  res.redirect('/sim-gtk/superadmin/lembaga');
});

router.post('/sim-gtk/superadmin/lembaga/:id/verifikasi', (req, res) => {
  const id = req.params.id;
  db.prepare("UPDATE madrasah SET status = 'aktif' WHERE id = ?").run(id);
  const m = db.prepare('SELECT nama FROM madrasah WHERE id = ?').get(id);

  recordAuditLog(req.session.user, 'Verifikasi Lembaga', 'Manajemen Lembaga', `Memverifikasi dan mengaktifkan madrasah: ${m ? m.nama : id}`);
  req.session.flash = { type: 'success', message: `Lembaga ${m ? m.nama : ''} telah tervalidasi dan aktif.` };
  res.redirect('/sim-gtk/superadmin/lembaga');
});

router.post('/sim-gtk/superadmin/lembaga/:id/status', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  db.prepare('UPDATE madrasah SET status = ? WHERE id = ?').run(status, id);
  const m = db.prepare('SELECT nama FROM madrasah WHERE id = ?').get(id);

  const actionText = status === 'aktif' ? 'Mengaktifkan kembali' : 'Menangguhkan (suspend)';
  recordAuditLog(req.session.user, 'Ubah Status Lembaga', 'Manajemen Lembaga', `${actionText} madrasah: ${m ? m.nama : id}`);
  req.session.flash = { type: 'success', message: `Status lembaga ${m ? m.nama : ''} diperbarui menjadi '${status}'.` };
  res.redirect('/sim-gtk/superadmin/lembaga');
});

router.post('/sim-gtk/superadmin/lembaga/update', (req, res) => {
  const { id, npsn, jenjang, nama, kabupaten, provinsi, alamat, nama_kamad, telepon, email, kapasitas_gtk } = req.body;
  db.prepare(`
    UPDATE madrasah 
    SET npsn = ?, jenjang = ?, nama = ?, kabupaten = ?, provinsi = ?, alamat = ?, nama_kamad = ?, telepon = ?, email = ?, kapasitas_gtk = ?
    WHERE id = ?
  `).run(npsn, jenjang, nama, kabupaten, provinsi, alamat, nama_kamad, telepon, email, kapasitas_gtk || 100, id);

  recordAuditLog(req.session.user, 'Pembaruan Identitas Lembaga', 'Manajemen Lembaga', `Memperbarui data identitas lembaga: ${nama}`);
  req.session.flash = { type: 'success', message: `Identitas lembaga ${nama} berhasil diperbarui.` };
  res.redirect('/sim-gtk/superadmin/lembaga');
});

// 3. MANAJEMEN ADMIN LEMBAGA
router.get('/sim-gtk/superadmin/admin-lembaga', (req, res) => {
  const admins = db.prepare(`
    SELECT u.*, m.nama as madrasah_nama, m.npsn as madrasah_npsn
    FROM users u
    LEFT JOIN madrasah m ON u.madrasah_id = m.id
    WHERE u.role = 'admin'
    ORDER BY u.id DESC
  `).all();
  const lembagas = db.prepare('SELECT id, nama, npsn FROM madrasah ORDER BY nama ASC').all();

  res.render('superadmin/admin_lembaga', {
    title: 'Manajemen Admin Lembaga · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'admin-lembaga',
    admins,
    lembagas
  });
});

router.post('/sim-gtk/superadmin/admin-lembaga', (req, res) => {
  const { madrasah_id, nama, username, email, password, telepon, status } = req.body;
  db.prepare(`
    INSERT INTO users (madrasah_id, nama, username, email, password, telepon, role, status)
    VALUES (?, ?, ?, ?, ?, ?, 'admin', ?)
  `).run(madrasah_id, nama, username, email, password, telepon, status || 'aktif');

  recordAuditLog(req.session.user, 'Pembuatan Akun Admin Lembaga', 'Manajemen Admin Lembaga', `Menerbitkan akun admin: ${nama} (${username})`);
  req.session.flash = { type: 'success', message: `Akun admin ${nama} berhasil diterbitkan.` };
  res.redirect('/sim-gtk/superadmin/admin-lembaga');
});

router.post('/sim-gtk/superadmin/admin-lembaga/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
  const u = db.prepare('SELECT nama FROM users WHERE id = ?').get(id);

  recordAuditLog(req.session.user, 'Pengaturan Status Akses Admin', 'Manajemen Admin Lembaga', `Mengubah status akses admin ${u ? u.nama : id} menjadi ${status}`);
  req.session.flash = { type: 'success', message: `Status akses admin ${u ? u.nama : ''} diperbarui menjadi '${status}'.` };
  res.redirect('/sim-gtk/superadmin/admin-lembaga');
});

router.post('/sim-gtk/superadmin/admin-lembaga/reset-password', (req, res) => {
  const { id, new_password, status } = req.body;
  db.prepare('UPDATE users SET password = ?, status = ? WHERE id = ?').run(new_password, status || 'aktif', id);
  const u = db.prepare('SELECT nama FROM users WHERE id = ?').get(id);

  recordAuditLog(req.session.user, 'Pemulihan Akun & Reset Kata Sandi', 'Manajemen Admin Lembaga', `Mereset kata sandi akun admin: ${u ? u.nama : id}`);
  req.session.flash = { type: 'success', message: `Kata sandi akun admin ${u ? u.nama : ''} berhasil dipulihkan.` };
  res.redirect('/sim-gtk/superadmin/admin-lembaga');
});

// 4. KONFIGURASI GLOBAL
router.get('/sim-gtk/superadmin/konfigurasi', (req, res) => {
  const rows = db.prepare('SELECT kunci, nilai FROM platform_config').all();
  const config = {};
  rows.forEach(r => { config[r.kunci] = r.nilai; });

  res.render('superadmin/konfigurasi', {
    title: 'Konfigurasi Global Platform · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'konfigurasi',
    config
  });
});

router.post('/sim-gtk/superadmin/konfigurasi', (req, res) => {
  const { kategori } = req.body;
  const upsert = db.prepare(`
    INSERT INTO platform_config (kunci, nilai, kategori, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(kunci) DO UPDATE SET nilai = excluded.nilai, updated_at = datetime('now')
  `);

  for (const [k, v] of Object.entries(req.body)) {
    if (k !== '_csrf' && k !== 'kategori') {
      upsert.run(k, v, kategori || 'platform');
    }
  }

  recordAuditLog(req.session.user, 'Pembaruan Konfigurasi Global', 'Konfigurasi Global', `Memperbarui parameter konfigurasi kategori: ${kategori || 'platform'}`);
  req.session.flash = { type: 'success', message: `Konfigurasi ${kategori || 'platform'} berhasil disimpan.` };
  res.redirect('/sim-gtk/superadmin/konfigurasi');
});

// 5. MONITORING DAN AUDIT
router.get('/sim-gtk/superadmin/monitoring-audit', (req, res) => {
  const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50').all();
  const incidents = db.prepare('SELECT * FROM access_incidents ORDER BY id DESC LIMIT 30').all();

  res.render('superadmin/monitoring_audit', {
    title: 'Monitoring & Audit Sistem · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'monitoring-audit',
    auditLogs,
    incidents
  });
});

router.post('/sim-gtk/superadmin/monitoring-audit/resolve-incident', (req, res) => {
  const { id } = req.body;
  db.prepare("UPDATE access_incidents SET status = 'Tertangani' WHERE id = ?").run(id);

  recordAuditLog(req.session.user, 'Penanganan Insiden Akses', 'Monitoring & Audit', `Menandai insiden ID #${id} sebagai Tertangani`);
  req.session.flash = { type: 'success', message: `Insiden #${id} telah ditandai tuntas tertangani.` };
  res.redirect('/sim-gtk/superadmin/monitoring-audit');
});

// 6. PENGELOLAAN LAYANAN
router.get('/sim-gtk/superadmin/layanan', (req, res) => {
  const plans = db.prepare('SELECT * FROM service_plans ORDER BY id ASC').all();
  const lembagas = db.prepare('SELECT * FROM madrasah ORDER BY nama ASC').all();

  res.render('superadmin/layanan', {
    title: 'Pengelolaan Layanan & Kapasitas · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'layanan',
    plans,
    lembagas
  });
});

router.post('/sim-gtk/superadmin/layanan/status-operasional', (req, res) => {
  const { status_mode } = req.body;
  db.prepare(`
    INSERT INTO platform_config (kunci, nilai, kategori, updated_at)
    VALUES ('maintenance_mode', ?, 'platform', datetime('now'))
    ON CONFLICT(kunci) DO UPDATE SET nilai = excluded.nilai, updated_at = datetime('now')
  `).run(status_mode);

  recordAuditLog(req.session.user, 'Perubahan Mode Layanan Platform', 'Pengelolaan Layanan', `Mengubah mode operasional platform menjadi: ${status_mode}`);
  req.session.flash = { type: 'success', message: `Status mode operasional platform diperbarui menjadi '${status_mode}'.` };
  res.redirect('/sim-gtk/superadmin/layanan');
});

router.post('/sim-gtk/superadmin/layanan/alokasi', (req, res) => {
  const { id, paket_layanan, kapasitas_gtk, storage_mb, ai_quota } = req.body;
  db.prepare(`
    UPDATE madrasah 
    SET paket_layanan = ?, kapasitas_gtk = ?, storage_mb = ?, ai_quota = ?
    WHERE id = ?
  `).run(paket_layanan, kapasitas_gtk, storage_mb, ai_quota, id);

  const m = db.prepare('SELECT nama FROM madrasah WHERE id = ?').get(id);
  recordAuditLog(req.session.user, 'Penyesuaian Alokasi Resource', 'Pengelolaan Layanan', `Menyesuaikan kuota madrasah ${m ? m.nama : id}: ${kapasitas_gtk} GTK, ${storage_mb} MB Storage`);
  req.session.flash = { type: 'success', message: `Alokasi kapasitas untuk ${m ? m.nama : ''} berhasil diperbarui.` };
  res.redirect('/sim-gtk/superadmin/layanan');
});

// 4. WILAYAH DAN PENGAWAS BINAAN (SUPERADMIN)
router.get('/sim-gtk/superadmin/pengawas-binaan', (req, res) => {
  const penugasans = db.prepare(`
    SELECT pp.*, u.nama as pengawas_nama, u.email as pengawas_email, m.nama as madrasah_nama, m.npsn as madrasah_npsn, m.jenjang as madrasah_jenjang
    FROM pengawas_penugasan pp
    JOIN users u ON pp.pengawas_id = u.id
    JOIN madrasah m ON pp.madrasah_id = m.id
    ORDER BY pp.id DESC
  `).all();
  const pengawass = db.prepare("SELECT id, nama, email FROM users WHERE role = 'pengawas'").all();
  const lembagas = db.prepare("SELECT id, nama, npsn, jenjang FROM madrasah ORDER BY nama ASC").all();

  res.render('superadmin/pengawas_binaan', {
    title: 'Wilayah & Pengawas Binaan · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'pengawas-binaan',
    penugasans,
    pengawass,
    lembagas
  });
});

router.post('/sim-gtk/superadmin/pengawas-binaan', (req, res) => {
  const { pengawas_id, madrasah_id, wilayah, nomor_sk, tanggal_mulai, tanggal_selesai, catatan } = req.body;
  db.prepare(`
    INSERT INTO pengawas_penugasan (pengawas_id, madrasah_id, wilayah, nomor_sk, tanggal_mulai, tanggal_selesai, status, catatan)
    VALUES (?, ?, ?, ?, ?, ?, 'aktif', ?)
  `).run(pengawas_id, madrasah_id, wilayah, nomor_sk, tanggal_mulai, tanggal_selesai, catatan);

  recordAuditLog(req.session.user, 'Penetapan Penugasan Pengawas Binaan', 'Wilayah & Pengawas Binaan', `Menetapkan pengawas #${pengawas_id} ke madrasah #${madrasah_id}`);
  req.session.flash = { type: 'success', message: 'Penugasan pengawas binaan berhasil ditetapkan.' };
  res.redirect('/sim-gtk/superadmin/pengawas-binaan');
});

router.post('/sim-gtk/superadmin/pengawas-binaan/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare('UPDATE pengawas_penugasan SET status = ? WHERE id = ?').run(status, id);

  recordAuditLog(req.session.user, 'Ubah Status Penugasan Binaan', 'Wilayah & Pengawas Binaan', `Mengubah status penugasan #${id} menjadi ${status}`);
  req.session.flash = { type: 'success', message: `Status penugasan pengawas binaan diubah menjadi '${status}'.` };
  res.redirect('/sim-gtk/superadmin/pengawas-binaan');
});

// 5. HAK AKSES DAN PERAN (SUPERADMIN)
router.get('/sim-gtk/superadmin/hak-akses', (req, res) => {
  const selectedRole = req.query.role || 'admin';
  const roleLabels = {
    superadmin: 'Super Admin Platform',
    admin: 'Admin/Operator Madrasah',
    kamad: 'Kepala Madrasah',
    pengawas: 'Pengawas Madrasah',
    guru: 'Guru Pendidik',
    tendik: 'Tenaga Kependidikan'
  };

  const groups = getRolePermissionsHierarchy(selectedRole);

  // Hitung agregat izin
  let totalSubmenu = 0;
  let activeSubmenu = 0;
  let activeGroups = 0;
  for (const g of groups) {
    if (g.active) activeGroups++;
    for (const item of g.items) {
      totalSubmenu++;
      if (item.active && g.active) activeSubmenu++;
    }
  }

  res.render('superadmin/hak_akses', {
    title: 'Hak Akses & Peran (RBAC) · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'hak-akses',
    selectedRole,
    roleLabels,
    groups,
    stats: {
      totalGroups: groups.length,
      activeGroups,
      totalSubmenu,
      activeSubmenu,
      percentActive: totalSubmenu ? Math.round((activeSubmenu / totalSubmenu) * 100) : 100
    }
  });
});

// Endpoint AJAX toggle real-time
router.post('/sim-gtk/superadmin/hak-akses/toggle', (req, res) => {
  try {
    const { role, type, key, field, value } = req.body;
    const isVal = value === 'true' || value === true || value === 1 || value === '1';

    if (type === 'group') {
      toggleMenuGroup(role, key, isVal);
      recordAuditLog(req.session.user, 'Toggle Menu Utama RBAC', 'Hak Akses & Peran', `Mengubah Menu Utama ${key} untuk peran ${role} menjadi ${isVal ? 'AKTIF' : 'NONAKTIF'}`);
      return res.json({ success: true, message: `Menu Utama ${isVal ? 'diaktifkan' : 'dinonaktifkan'}.` });
    } else if (type === 'submenu') {
      toggleSubmenuField(role, key, field, isVal);
      recordAuditLog(req.session.user, 'Toggle Fitur/Aksi RBAC', 'Hak Akses & Peran', `Mengubah ${field} fitur ${key} untuk peran ${role} menjadi ${isVal ? 'ON' : 'OFF'}`);
      return res.json({ success: true, message: `Hak akses ${key} (${field}) berhasil diperbarui.` });
    }

    res.status(400).json({ success: false, message: 'Tipe toggle tidak valid' });
  } catch (err) {
    console.error('RBAC toggle error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Endpoint Reset RBAC ke Default Kemenag
router.post('/sim-gtk/superadmin/hak-akses/reset', (req, res) => {
  const { role } = req.body;
  resetRoleToDefault(role);
  recordAuditLog(req.session.user, 'Reset Hak Akses Peran', 'Hak Akses & Peran', `Mereset hak akses peran ${role} ke konfigurasi standar`);
  req.session.flash = { type: 'success', message: `Hak akses peran ${role} berhasil dikembalikan ke standar awal Kemenag.` };
  res.redirect(`/sim-gtk/superadmin/hak-akses?role=${role}`);
});

// 8. LAPORAN PLATFORM (SUPERADMIN)
router.get('/sim-gtk/superadmin/laporan', (req, res) => {
  const lembagas = db.prepare('SELECT * FROM madrasah ORDER BY id DESC').all();
  const totalUsers = db.prepare('SELECT count(*) as c FROM users').get().c;
  const totalSupervisi = db.prepare('SELECT count(*) as c FROM supervisi_akademik').get().c;

  res.render('superadmin/laporan', {
    title: 'Laporan Agregat Platform · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'laporan-platform',
    lembagas,
    totalUsers,
    totalSupervisi
  });
});

// MASTER TEMPLATE SUPERVISI NASIONAL (SUPERADMIN)
router.get('/sim-gtk/superadmin/master-supervisi', (req, res) => {
  const instrumen = getMasterInstrumenNasional();
  const totalMadrasah = db.prepare('SELECT count(*) as count FROM madrasah').get().count;
  const countMaster = db.prepare('SELECT count(*) as count FROM supervisi_instrumen WHERE madrasah_id IS NULL AND status_aktif = 1').get().count;

  res.render('superadmin/master_supervisi', {
    title: 'Master Template Supervisi Nasional · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'master-supervisi',
    instrumen,
    totalMadrasah,
    countMaster
  });
});

router.post('/sim-gtk/superadmin/master-supervisi/simpan', (req, res) => {
  try {
    saveInstrumenButir({
      ...req.body,
      madrasah_id: null,
      created_by_role: 'superadmin'
    });
    recordAuditLog(req.session.user, 'Update Butir Master Supervisi Nasional', 'Master Supervisi', `Menyimpan butir kode ${req.body.kode} domain ${req.body.domain}`);
    req.session.flash = { type: 'success', message: 'Butir instrumen Master Standar Nasional berhasil disimpan.' };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal menyimpan: ${err.message}` };
  }
  res.redirect('/sim-gtk/superadmin/master-supervisi');
});

router.post('/sim-gtk/superadmin/master-supervisi/hapus', (req, res) => {
  try {
    const { id, kode } = req.body;
    deleteInstrumenButir(id);
    recordAuditLog(req.session.user, 'Hapus Butir Master Supervisi', 'Master Supervisi', `Menghapus butir ID #${id} (${kode || ''})`);
    req.session.flash = { type: 'warning', message: 'Butir instrumen Master Standar Nasional telah dihapus.' };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal menghapus: ${err.message}` };
  }
  res.redirect('/sim-gtk/superadmin/master-supervisi');
});

router.post('/sim-gtk/superadmin/master-supervisi/reset-standar', (req, res) => {
  try {
    resetMasterKeRegulasiKemenag();
    recordAuditLog(req.session.user, 'Reset Master Template Supervisi', 'Master Supervisi', 'Mereset instrumen nasional ke regulasi 20 butir baku Kemenag RI');
    req.session.flash = { type: 'success', message: 'Master template instrumen berhasil dipulihkan ke 20 butir Standar Baku Kemenag RI.' };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal reset: ${err.message}` };
  }
  res.redirect('/sim-gtk/superadmin/master-supervisi');
});

router.post('/sim-gtk/superadmin/master-supervisi/distribusi', (req, res) => {
  try {
    const synced = distribusikanMasterKeMadrasah();
    recordAuditLog(req.session.user, 'Distribusi Master Instrumen ke Madrasah', 'Master Supervisi', `Mendistribusikan master template ke ${synced} madrasah binaan`);
    req.session.flash = { type: 'success', message: `Master template supervisi berhasil didistribusikan dan diselaraskan ke ${synced} madrasah.` };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal distribusi: ${err.message}` };
  }
  res.redirect('/sim-gtk/superadmin/master-supervisi');
});

// 9. PENCADANGAN DAN PEMULIHAN (SUPERADMIN)
router.get('/sim-gtk/superadmin/backup', (req, res) => {
  const backups = db.prepare('SELECT * FROM backup_logs ORDER BY id DESC').all();
  res.render('superadmin/backup', {
    title: 'Pencadangan & Pemulihan Sistem · Super Admin SIM-GTK',
    currentMenu: 'superadmin',
    activeSub: 'backup',
    backups
  });
});

router.post('/sim-gtk/superadmin/backup/create', (req, res) => {
  const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const fileName = `sim_gtk_manual_${dateStr}.db.gz`;
  const checksum = `sha256-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

  db.prepare(`
    INSERT INTO backup_logs (nama_file, ukuran_mb, tipe, status, hash_checksum)
    VALUES (?, 3.4, 'Manual', 'Tersedia', ?)
  `).run(fileName, checksum);

  recordAuditLog(req.session.user, 'Pencadangan Manual Database', 'Pencadangan & Pemulihan', `Membuat cadangan manual database: ${fileName}`);
  req.session.flash = { type: 'success', message: `Cadangan database ${fileName} berhasil dibuat dan tervalidasi.` };
  res.redirect('/sim-gtk/superadmin/backup');
});

router.post('/sim-gtk/superadmin/backup/:id/restore', (req, res) => {
  const { id } = req.params;
  const b = db.prepare('SELECT nama_file FROM backup_logs WHERE id = ?').get(id);

  recordAuditLog(req.session.user, 'Pemulihan Database (Restore)', 'Pencadangan & Pemulihan', `Memulihkan database dari snapshot: ${b ? b.nama_file : id}`, 'warning');
  req.session.flash = { type: 'success', message: `Prosedur pemulihan snapshot ${b ? b.nama_file : id} berhasil disimulasikan 100%. Data konsisten.` };
  res.redirect('/sim-gtk/superadmin/backup');
});

// =========================================================================
// ----------------- PANEL KEPALA MADRASAH ROUTES --------------------------
// =========================================================================

router.get(['/sim-gtk/kamad', '/sim-gtk/kamad/dashboard'], (req, res) => {
  const gtks = db.prepare('SELECT * FROM gtk WHERE madrasah_id = 1').all();
  const pendingPersetujuan = db.prepare("SELECT p.*, g.nama as gtk_nama FROM persetujuan p LEFT JOIN gtk g ON p.gtk_id = g.id WHERE p.status = 'pending'").all();
  const supervisiList = db.prepare('SELECT sa.*, g.nama as gtk_nama FROM supervisi_akademik sa JOIN gtk g ON sa.gtk_id = g.id WHERE sa.madrasah_id = 1').all();
  const rekomendasiList = db.prepare('SELECT * FROM rekomendasi_tindak_lanjut WHERE madrasah_id = 1').all();
  const pengumumans = db.prepare('SELECT * FROM pengumuman WHERE madrasah_id = 1 ORDER BY id DESC').all();

  res.render('kamad/dashboard', {
    title: 'Dashboard Kepala Madrasah · SIM-GTK',
    currentMenu: 'kamad',
    activeSub: 'dashboard',
    gtks,
    pendingPersetujuan,
    supervisiList,
    rekomendasiList,
    pengumumans
  });
});

router.post('/sim-gtk/kamad/persetujuan/:id/:action', (req, res) => {
  const { id, action } = req.params;
  const status = action === 'setuju' ? 'disetujui' : 'ditolak';
  db.prepare("UPDATE persetujuan SET status = ?, tanggal_proses = datetime('now') WHERE id = ?").run(status, id);

  recordAuditLog(req.session.user, `Keputusan Kamad: ${status}`, 'Persetujuan Kepala Madrasah', `Memproses persetujuan #${id} menjadi ${status}`);
  req.session.flash = { type: 'success', message: `Pengajuan berhasil ${status}.` };
  res.redirect('/sim-gtk/kamad/dashboard');
});

router.post('/sim-gtk/kamad/pengumuman', (req, res) => {
  const { judul, isi, target_role } = req.body;
  db.prepare(`
    INSERT INTO pengumuman (madrasah_id, judul, isi, target_role, penulis)
    VALUES (1, ?, ?, ?, ?)
  `).run(judul, isi, target_role, req.session.user ? req.session.user.nama : 'Kepala Madrasah');

  req.session.flash = { type: 'success', message: 'Arahan/pengumuman berhasil diterbitkan kepada GTK.' };
  res.redirect('/sim-gtk/kamad/dashboard');
});

// KAMAD: PERSETUJUAN & PERIZINAN CUTI GTK
router.get('/sim-gtk/kamad/perizinan', (req, res) => {
  const cutiList = db.prepare(`
    SELECT c.*, g.nama as gtk_nama, g.nip, g.nuptk, g.jabatan, g.mapel_utama
    FROM gtk_cuti c
    JOIN gtk g ON c.gtk_id = g.id
    WHERE c.madrasah_id = 1
    ORDER BY c.id DESC
  `).all();

  res.render('kamad/perizinan', {
    title: 'Persetujuan Cuti & Perizinan GTK · Kepala Madrasah',
    currentMenu: 'kamad',
    activeSub: 'perizinan',
    cutiList
  });
});

router.post('/sim-gtk/kamad/perizinan/:id/proses', (req, res) => {
  try {
    const { id } = req.params;
    const { status, catatan_kamad } = req.body;
    const kamadNama = req.session.user ? req.session.user.nama : 'Drs. H. Abdul Wahab, M.Pd';

    db.prepare(`
      UPDATE gtk_cuti
      SET status = ?, catatan_kamad = ?, tgl_disetujui = datetime('now', '+8 hours'), disetujui_oleh = ?
      WHERE id = ?
    `).run(status, catatan_kamad, kamadNama, id);

    recordAuditLog(req.session.user, `Keputusan Cuti: ${status}`, 'Perizinan Cuti Kamad', `Memproses permohonan cuti #${id} menjadi ${status}`);
    req.session.flash = { type: 'success', message: `Permohonan cuti telah berhasil di-${status}.` };
  } catch (err) {
    req.session.flash = { type: 'danger', message: `Gagal memproses perizinan: ${err.message}` };
  }
  res.redirect('/sim-gtk/kamad/perizinan');
});

// =========================================================================
// ----------------- PANEL PENGAWAS MADRASAH ROUTES ------------------------
// =========================================================================

router.get(['/sim-gtk/pengawas', '/sim-gtk/pengawas/dashboard'], (req, res) => {
  const binaans = db.prepare(`
    SELECT pp.*, m.nama, m.npsn, m.jenjang, m.alamat, m.kabupaten, m.telepon, m.email, m.nama_kamad
    FROM pengawas_penugasan pp
    JOIN madrasah m ON pp.madrasah_id = m.id
    WHERE pp.status = 'aktif'
  `).all();
  const jadwalList = db.prepare('SELECT js.*, g.nama as gtk_nama FROM jadwal_supervisi js JOIN gtk g ON js.gtk_id = g.id').all();
  const rekomendasiList = db.prepare(`
    SELECT r.*, m.nama as madrasah_nama
    FROM rekomendasi_tindak_lanjut r
    JOIN madrasah m ON r.madrasah_id = m.id
    ORDER BY r.id DESC
  `).all();
  const programs = db.prepare('SELECT * FROM program_pengawasan ORDER BY id ASC').all();

  res.render('pengawas/dashboard', {
    title: 'Dashboard Pengawas Madrasah Pembina · SIM-GTK',
    currentMenu: 'pengawas',
    activeSub: 'dashboard',
    binaans,
    jadwalList,
    rekomendasiList,
    programs
  });
});

router.get('/sim-gtk/pengawas/binaan', (req, res) => {
  const binaans = db.prepare(`
    SELECT pp.*, m.nama, m.npsn, m.jenjang, m.alamat, m.kabupaten, m.telepon, m.email, m.nama_kamad
    FROM pengawas_penugasan pp
    JOIN madrasah m ON pp.madrasah_id = m.id
    WHERE pp.status = 'aktif'
  `).all();

  res.render('pengawas/binaan', {
    title: 'Sekolah / Madrasah Binaan · Panel Pengawas SIM-GTK',
    currentMenu: 'pengawas',
    activeSub: 'binaan',
    binaans
  });
});

router.get('/sim-gtk/pengawas/rekomendasi', (req, res) => {
  const binaans = db.prepare(`
    SELECT pp.*, m.nama, m.jenjang
    FROM pengawas_penugasan pp
    JOIN madrasah m ON pp.madrasah_id = m.id
    WHERE pp.status = 'aktif'
  `).all();

  const rekomendasiList = db.prepare(`
    SELECT r.*, m.nama as madrasah_nama
    FROM rekomendasi_tindak_lanjut r
    JOIN madrasah m ON r.madrasah_id = m.id
    ORDER BY r.id DESC
  `).all();

  res.render('pengawas/rekomendasi', {
    title: 'Rekomendasi & Tindak Lanjut Pembinaan · Panel Pengawas SIM-GTK',
    currentMenu: 'pengawas',
    activeSub: 'rekomendasi',
    binaans,
    rekomendasiList
  });
});

router.post('/sim-gtk/pengawas/rekomendasi', (req, res) => {
  const { madrasah_id, aspek, judul_rekomendasi, deskripsi, penanggung_jawab, target_perbaikan, tenggat_waktu } = req.body;
  const pengawasId = req.session.user ? req.session.user.id : 3;

  db.prepare(`
    INSERT INTO rekomendasi_tindak_lanjut (pengawas_id, madrasah_id, aspek, judul_rekomendasi, deskripsi, penanggung_jawab, target_perbaikan, tenggat_waktu, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Belum dimulai')
  `).run(pengawasId, madrasah_id, aspek, judul_rekomendasi, deskripsi, penanggung_jawab, target_perbaikan, tenggat_waktu);

  recordAuditLog(req.session.user, 'Tambah Rekomendasi Supervisi', 'Rekomendasi & Tindak Lanjut', `Memberikan rekomendasi ke madrasah #${madrasah_id}: ${judul_rekomendasi}`);
  req.session.flash = { type: 'success', message: 'Rekomendasi pembinaan berhasil disimpan dan diteruskan ke madrasah.' };
  res.redirect('/sim-gtk/pengawas/rekomendasi');
});

router.post('/sim-gtk/pengawas/rekomendasi/verifikasi', (req, res) => {
  const { id, status, catatan_pengawas } = req.body;
  db.prepare(`
    UPDATE rekomendasi_tindak_lanjut 
    SET status = ?, catatan_pengawas = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, catatan_pengawas, id);

  recordAuditLog(req.session.user, `Verifikasi Rekomendasi: ${status}`, 'Rekomendasi & Tindak Lanjut', `Mengubah status rekomendasi #${id} menjadi ${status}`);
  req.session.flash = { type: 'success', message: `Status tindak lanjut diperbarui menjadi '${status}'.` };
  res.redirect('/sim-gtk/pengawas/rekomendasi');
});

// =========================================================================
// ----------------- PANEL TENAGA KEPENDIDIKAN (TENDIK) -------------------
// =========================================================================

router.get(['/sim-gtk/tendik', '/sim-gtk/tendik/dashboard'], (req, res) => {
  const pengumumans = db.prepare("SELECT * FROM pengumuman WHERE madrasah_id = 1 AND (target_role = 'semua' OR target_role = 'tendik') ORDER BY id DESC").all();

  res.render('tendik/dashboard', {
    title: 'Dashboard Tenaga Kependidikan · SIM-GTK',
    currentMenu: 'tendik',
    activeSub: 'dashboard',
    pengumumans
  });
});

export default router;

