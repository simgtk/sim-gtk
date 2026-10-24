import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, 'sim_gtk.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS madrasah (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      npsn TEXT,
      nama TEXT NOT NULL,
      jenjang TEXT DEFAULT 'MA',
      alamat TEXT,
      kabupaten TEXT,
      provinsi TEXT,
      telepon TEXT,
      email TEXT,
      nama_kamad TEXT,
      tahun_ajaran TEXT DEFAULT '2026/2027',
      semester TEXT DEFAULT '1 (Ganjil)',
      ai_base_url TEXT DEFAULT 'https://api.openai.com/v1',
      ai_model TEXT DEFAULT 'gpt-4o-mini',
      ai_api_key TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nama TEXT NOT NULL,
      role TEXT NOT NULL, /* admin, guru, pengawas, superadmin */
      madrasah_id INTEGER,
      telepon TEXT,
      alamat TEXT,
      status TEXT DEFAULT 'aktif',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS gtk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      madrasah_id INTEGER NOT NULL,
      nama TEXT NOT NULL,
      nip TEXT,
      nuptk TEXT,
      nik TEXT,
      jenis_kelamin TEXT,
      tempat_lahir TEXT,
      tanggal_lahir TEXT,
      agama TEXT DEFAULT 'Islam',
      telepon TEXT,
      email TEXT,
      alamat TEXT,
      jabatan TEXT DEFAULT 'Guru',
      status_kepegawaian TEXT DEFAULT 'PNS', /* PNS, PPPK, Non-PNS */
      golongan TEXT DEFAULT 'III/a',
      tmt_golongan TEXT,
      mkg_tahun INTEGER DEFAULT 0,
      mkg_bulan INTEGER DEFAULT 0,
      pendidikan_terakhir TEXT DEFAULT 'S1',
      prodi TEXT,
      kampus TEXT,
      tahun_lulus INTEGER,
      mapel_utama TEXT,
      sertifikasi_status TEXT DEFAULT 'Belum', /* Sudah, Belum, Dalam Proses */
      nrg TEXT,
      kelengkapan_persen INTEGER DEFAULT 75,
      status_aktif TEXT DEFAULT 'aktif',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS kelas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      tingkat TEXT,
      nama TEXT NOT NULL,
      wali_kelas_gtk_id INTEGER,
      jumlah_siswa INTEGER DEFAULT 30,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS siswa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      kelas_id INTEGER NOT NULL,
      nis TEXT,
      nisn TEXT,
      nama TEXT NOT NULL,
      jenis_kelamin TEXT,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mapel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      kode TEXT,
      nama TEXT NOT NULL,
      kelompok TEXT,
      jtm_default INTEGER DEFAULT 2,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jadwal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      kelas_id INTEGER NOT NULL,
      mapel_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      hari TEXT NOT NULL,
      jam_ke TEXT,
      jam_mulai TEXT,
      jam_selesai TEXT,
      ruang TEXT,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
      FOREIGN KEY (mapel_id) REFERENCES mapel(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS absensi_siswa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      jadwal_id INTEGER NOT NULL,
      siswa_id INTEGER NOT NULL,
      tanggal TEXT NOT NULL,
      status TEXT NOT NULL, /* H, S, I, A */
      keterangan TEXT,
      UNIQUE(jadwal_id, siswa_id, tanggal),
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jurnal_mengajar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      jadwal_id INTEGER,
      gtk_id INTEGER NOT NULL,
      tanggal TEXT NOT NULL,
      kelas_id INTEGER,
      mapel_id INTEGER,
      materi TEXT NOT NULL,
      kegiatan TEXT,
      kehadiran_info TEXT,
      catatan TEXT,
      file_lampiran TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS supervisi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      supervisor_user_id INTEGER,
      jenis TEXT DEFAULT 'Supervisi Akademik',
      tanggal TEXT NOT NULL,
      skor_total INTEGER,
      predikat TEXT,
      catatan_supervisor TEXT,
      tindak_lanjut TEXT,
      status TEXT DEFAULT 'Terjadwal', /* Terjadwal, Selesai */
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dokumen_ai (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER,
      jenis TEXT NOT NULL,
      mapel TEXT NOT NULL,
      kelas TEXT NOT NULL,
      materi TEXT NOT NULL,
      jp INTEGER DEFAULT 4,
      jumlah_siswa INTEGER DEFAULT 30,
      cp TEXT,
      konten_markdown TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS persetujuan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      jenis TEXT NOT NULL,
      judul TEXT NOT NULL,
      detail TEXT,
      status TEXT DEFAULT 'pending', /* pending, disetujui, ditolak */
      catatan_admin TEXT,
      tanggal_pengajuan TEXT,
      tanggal_proses TEXT,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS presensi_gtk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      tanggal TEXT NOT NULL,
      jam_masuk TEXT,
      jam_pulang TEXT,
      status TEXT DEFAULT 'H', /* H, S, I, A, DL */
      keterangan TEXT,
      UNIQUE(gtk_id, tanggal),
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    /* --- TABEL MODUL PENILAIAN & SUPERVISI GTK --- */
    CREATE TABLE IF NOT EXISTS jadwal_supervisi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      supervisor_nama TEXT NOT NULL,
      jenis_supervisi TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      jam TEXT,
      kelas TEXT,
      mapel TEXT,
      ruang TEXT,
      status TEXT DEFAULT 'Terjadwal', /* Terjadwal, Selesai, Ditunda */
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS perangkat_supervisi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      mapel TEXT NOT NULL,
      kelas TEXT NOT NULL,
      jenis_perangkat TEXT NOT NULL, /* Modul Ajar, ATP, Prota, Prosem, LKPD, KKTP, Asesmen */
      file_nama TEXT,
      skor INTEGER DEFAULT 85,
      status_verifikasi TEXT DEFAULT 'Lengkap', /* Lengkap, Perlu Revisi, Belum Diperiksa */
      tanggal_unggah TEXT,
      tanggal_periksa TEXT,
      catatan TEXT,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS supervisi_akademik (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      supervisor_nama TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      mapel TEXT NOT NULL,
      kelas TEXT NOT NULL,
      skor_administrasi INTEGER DEFAULT 88,
      skor_mengajar INTEGER DEFAULT 86,
      skor_total INTEGER DEFAULT 87,
      predikat TEXT DEFAULT 'Amat Baik', /* Amat Baik, Baik, Cukup, Sedang */
      catatan TEXT,
      tindak_lanjut TEXT,
      status TEXT DEFAULT 'Selesai',
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS supervisi_mengajar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      supervisor_nama TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      mapel TEXT NOT NULL,
      kelas TEXT NOT NULL,
      materi TEXT NOT NULL,
      skor_kegiatan_awal INTEGER DEFAULT 90,
      skor_kegiatan_inti INTEGER DEFAULT 85,
      skor_kegiatan_penutup INTEGER DEFAULT 85,
      skor_total INTEGER DEFAULT 86,
      predikat TEXT DEFAULT 'Baik',
      catatan TEXT,
      rekomendasi TEXT,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS supervisi_manajerial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      tugas_tambahan TEXT NOT NULL, /* Kepala Laboratorium, Kepala Perpustakaan, Wakamad Kurikulum, Pembina OSIS, dll. */
      supervisor_nama TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      skor_program INTEGER DEFAULT 90,
      skor_pelaksanaan INTEGER DEFAULT 88,
      skor_evaluasi INTEGER DEFAULT 85,
      skor_total INTEGER DEFAULT 88,
      predikat TEXT DEFAULT 'Amat Baik',
      catatan TEXT,
      rekomendasi TEXT,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daftar_hadir_supervisi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      tanggal TEXT NOT NULL,
      supervisor_nama TEXT NOT NULL,
      jenis_supervisi TEXT NOT NULL,
      status_kehadiran TEXT DEFAULT 'Hadir', /* Hadir, Izin, Sakit */
      jam_hadir TEXT DEFAULT '07:30',
      tanda_tangan TEXT DEFAULT 'Sudah Tervalidasi',
      keterangan TEXT,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    /* --- BUTIR PENILAIAN SUPERVISI FLEKSIBEL (DINAMIS) --- */
    CREATE TABLE IF NOT EXISTS supervisi_instrumen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER, /* NULL untuk template nasional/kemenag, atau id madrasah khusus */
      domain TEXT NOT NULL, /* administrasi, modul_ajar, pengamatan, penilaian */
      kode TEXT NOT NULL, /* A1, B1, dst */
      label TEXT NOT NULL,
      indikator_1 TEXT,
      indikator_2 TEXT,
      indikator_3 TEXT,
      indikator_4 TEXT,
      bobot REAL DEFAULT 1.0,
      urutan INTEGER DEFAULT 1,
      status_aktif INTEGER DEFAULT 1,
      created_by_role TEXT DEFAULT 'superadmin', /* superadmin, pengawas, kamad */
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    /* --- TUGAS TAMBAHAN GTK (DIBERIKAN KEPALA MADRASAH) --- */
    CREATE TABLE IF NOT EXISTS gtk_tugas_tambahan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      jabatan_tambahan TEXT NOT NULL, /* Wakamad Kurikulum, Kepala Lab, Kepala Perpus, Guru Penilai, Pembina OSIS, Wali Kelas */
      nomor_sk TEXT,
      tanggal_sk TEXT,
      tmt TEXT,
      ekuivalensi_jtm INTEGER DEFAULT 12,
      keterangan TEXT,
      status TEXT DEFAULT 'aktif', /* aktif, selesai, dicabut */
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    /* --- TABEL PLATFORM SUPERADMIN --- */
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_nama TEXT NOT NULL,
      role TEXT NOT NULL,
      aksi TEXT NOT NULL,
      modul TEXT NOT NULL,
      detail TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      status TEXT DEFAULT 'success', /* success, warning, danger */
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS access_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipe_insiden TEXT NOT NULL,
      identifier TEXT NOT NULL,
      ip_address TEXT DEFAULT '182.1.22.84',
      tingkat_bahaya TEXT DEFAULT 'Sedang', /* Rendah, Sedang, Kritis */
      keterangan TEXT,
      status TEXT DEFAULT 'Baru', /* Baru, Diinvestigasi, Tertangani, Diblokir */
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS platform_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kunci TEXT UNIQUE NOT NULL,
      nilai TEXT NOT NULL,
      kategori TEXT NOT NULL, /* platform, modul, kategori, keamanan */
      deskripsi TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_paket TEXT NOT NULL,
      max_gtk INTEGER NOT NULL,
      max_storage_mb INTEGER NOT NULL,
      ai_token_per_bulan INTEGER NOT NULL,
      biaya TEXT,
      status TEXT DEFAULT 'aktif',
      keterangan TEXT
    );

    /* --- TABEL PENUGASAN PENGAWAS BINAAN & TINDAK LANJUT --- */
    CREATE TABLE IF NOT EXISTS pengawas_penugasan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pengawas_id INTEGER NOT NULL,
      madrasah_id INTEGER NOT NULL,
      wilayah TEXT DEFAULT 'Kabupaten Gorontalo',
      nomor_sk TEXT,
      tanggal_mulai TEXT,
      tanggal_selesai TEXT,
      status TEXT DEFAULT 'aktif', /* menunggu, aktif, berakhir, dicabut */
      catatan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pengawas_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rekomendasi_tindak_lanjut (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pengawas_id INTEGER,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER,
      judul_rekomendasi TEXT NOT NULL,
      aspek TEXT DEFAULT 'Akademik', /* Akademik, Manajerial, Sarpras, Tata Kelola */
      deskripsi TEXT NOT NULL,
      target_perbaikan TEXT,
      penanggung_jawab TEXT,
      tenggat_waktu TEXT,
      bukti_tindak_lanjut TEXT,
      status TEXT DEFAULT 'Belum dimulai', /* Belum dimulai, Dalam proses, Menunggu verifikasi, Selesai, Perlu perbaikan */
      catatan_pengawas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS program_pengawasan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pengawas_id INTEGER NOT NULL,
      tahun_ajaran TEXT DEFAULT '2026/2027',
      semester TEXT DEFAULT '1 (Ganjil)',
      nama_program TEXT NOT NULL,
      jenis_program TEXT NOT NULL, /* Tahunan, Semester, Pembinaan Khusus */
      tujuan TEXT,
      sasaran_binaan TEXT,
      jadwal_rencana TEXT,
      target_capaian TEXT,
      status TEXT DEFAULT 'Aktif',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pengawas_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS backup_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_file TEXT NOT NULL,
      ukuran_mb REAL NOT NULL,
      tipe TEXT DEFAULT 'Otomatis', /* Otomatis, Manual */
      status TEXT DEFAULT 'Tersedia', /* Tersedia, Dipulihkan, Diarsipkan */
      hash_checksum TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pengumuman (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER,
      judul TEXT NOT NULL,
      isi TEXT NOT NULL,
      target_role TEXT DEFAULT 'semua', /* semua, guru, tendik, admin */
      penulis TEXT DEFAULT 'Kepala Madrasah',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      menu_group_key TEXT NOT NULL,
      menu_group_label TEXT NOT NULL,
      menu_group_active INTEGER DEFAULT 1,
      submenu_key TEXT NOT NULL,
      submenu_label TEXT NOT NULL,
      submenu_url TEXT NOT NULL,
      submenu_icon TEXT DEFAULT 'i-grid',
      submenu_active INTEGER DEFAULT 1,
      can_view INTEGER DEFAULT 1,
      can_edit INTEGER DEFAULT 1,
      can_download INTEGER DEFAULT 1,
      can_delete INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role, submenu_key)
    );

    CREATE TABLE IF NOT EXISTS gtk_ijazah (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gtk_id INTEGER NOT NULL,
      jenjang TEXT NOT NULL,
      institusi TEXT NOT NULL,
      jurusan TEXT,
      thn_masuk INTEGER,
      thn_lulus INTEGER,
      gelar TEXT,
      ipk TEXT,
      no_ijazah TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gtk_sertifikasi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gtk_id INTEGER NOT NULL,
      jenis TEXT NOT NULL,
      bidang TEXT,
      tgl_terbit TEXT,
      no_sertifikat TEXT NOT NULL,
      lembaga TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gtk_cuti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      madrasah_id INTEGER NOT NULL,
      gtk_id INTEGER NOT NULL,
      jenis_cuti TEXT NOT NULL,
      tgl_mulai DATE NOT NULL,
      tgl_selesai DATE NOT NULL,
      lama_hari INTEGER NOT NULL,
      alasan TEXT NOT NULL,
      alamat_cuti TEXT,
      telepon TEXT,
      lampiran TEXT,
      status TEXT DEFAULT 'menunggu', /* menunggu, disetujui, ditolak */
      catatan_kamad TEXT,
      tgl_disetujui DATETIME,
      disetujui_oleh TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gtk_id) REFERENCES gtk(id) ON DELETE CASCADE,
      FOREIGN KEY (madrasah_id) REFERENCES madrasah(id) ON DELETE CASCADE
    );
  `);

  // Migrate madrasah table columns if needed
  try {
    const cols = db.prepare(`PRAGMA table_info(madrasah)`).all().map(c => c.name);
    if (!cols.includes('status')) db.prepare(`ALTER TABLE madrasah ADD COLUMN status TEXT DEFAULT 'aktif'`).run();
    if (!cols.includes('kapasitas_gtk')) db.prepare(`ALTER TABLE madrasah ADD COLUMN kapasitas_gtk INTEGER DEFAULT 100`).run();
    if (!cols.includes('storage_mb')) db.prepare(`ALTER TABLE madrasah ADD COLUMN storage_mb INTEGER DEFAULT 2048`).run();
    if (!cols.includes('ai_quota')) db.prepare(`ALTER TABLE madrasah ADD COLUMN ai_quota INTEGER DEFAULT 500000`).run();
    if (!cols.includes('paket_layanan')) db.prepare(`ALTER TABLE madrasah ADD COLUMN paket_layanan TEXT DEFAULT 'Standard Madrasah'`).run();
    if (!cols.includes('created_at')) db.prepare(`ALTER TABLE madrasah ADD COLUMN created_at DATETIME`).run();
  } catch (err) {
    // Column already exists or table locked
  }

  seedPenilaianData();
  seedPlatformData();
  seedBinaanAndRolesData();
  seedData();
  ensureEssentialUsers();
  ensureExtendedFeatures();
}

function ensureEssentialUsers() {
  const users = [
    { username: 'superadmin', email: 'superadmin@sim-gtk.id', password: 'admin123', nama: 'Administrator Pusat SIM-GTK', role: 'superadmin', madrasah_id: 1, telepon: '081200001111', alamat: 'Kemenag RI Jakarta' },
    { username: 'admin_man2', email: 'admin@man2gorontalo.sch.id', password: 'admin123', nama: 'Siti Rahmawati, S.Kom', role: 'admin', madrasah_id: 1, telepon: '081242843901', alamat: 'Limboto, Gorontalo' },
    { username: 'kamad', email: 'kamad@man2gorontalo.sch.id', password: 'kamad123', nama: 'Drs. H. Abdul Wahab, M.Pd', role: 'kamad', madrasah_id: 1, telepon: '081242001122', alamat: 'Limboto, Gorontalo' },
    { username: 'pengawas', email: 'pengawas@kemenag.go.id', password: 'pengawas123', nama: 'Dr. Hj. Nurul Aini, M.Pd', role: 'pengawas', madrasah_id: 1, telepon: '081198765432', alamat: 'Kanwil Kemenag Gorontalo' },
    { username: 'herman', email: 'herman@man2gorontalo.sch.id', password: 'guru123', nama: 'Herman Susanto Buhungo', role: 'guru', madrasah_id: 1, telepon: '081356789012', alamat: 'Kecamatan Limboto, Gorontalo' },
    { username: 'guru_penilai', email: 'penilai@man2gorontalo.sch.id', password: 'penilai123', nama: 'Herman Susanto Buhungo (Guru Penilai)', role: 'guru_penilai', madrasah_id: 1, telepon: '081356789012', alamat: 'Kecamatan Limboto, Gorontalo' },
    { username: 'tendik', email: 'tendik@man2gorontalo.sch.id', password: 'tendik123', nama: 'Samsudin Mahmud, A.Ma', role: 'tendik', madrasah_id: 1, telepon: '081289012346', alamat: 'Limboto, Gorontalo' }
  ];

  const stmtCheck = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?');
  const stmtInsert = db.prepare(`
    INSERT INTO users (username, email, password, nama, role, madrasah_id, telepon, alamat, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif')
  `);
  const stmtUpdateRole = db.prepare('UPDATE users SET role = ?, password = ? WHERE id = ?');

  for (const u of users) {
    const existing = stmtCheck.get(u.email, u.username);
    if (!existing) {
      stmtInsert.run(u.username, u.email, u.password, u.nama, u.role, u.madrasah_id, u.telepon, u.alamat);
    } else {
      stmtUpdateRole.run(u.role, u.password, existing.id);
    }
  }
}

function ensureExtendedFeatures() {
  // 1. Seed instrumen supervisi fleksibel jika belum ada
  const countInst = db.prepare('SELECT count(*) as count FROM supervisi_instrumen').get();
  if (countInst.count === 0) {
    const instInsert = db.prepare(`
      INSERT INTO supervisi_instrumen (madrasah_id, domain, kode, label, indikator_1, indikator_2, indikator_3, indikator_4, bobot, urutan, status_aktif, created_by_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const items = [
      ['administrasi', 'A1', 'Kalender Pendidikan Madrasah & Analisis Alokasi Waktu Efektif', 'Tidak tersedia kalender', 'Ada kalender tanpa alokasi', 'Lengkap alokasi waktu', 'Lengkap terstruktur & disahkan Kamad', 1, 1],
      ['administrasi', 'A2', 'Program Tahunan (Prota) dan Program Semester (Promes) Lengkap', 'Belum disusun', 'Disusun sebagian', 'Lengkap belum disahkan', 'Lengkap & selaras kalender pendidikan', 1, 2],
      ['administrasi', 'A3', 'Dokumen Alur Tujuan Pembelajaran (ATP) / Silabus Terstruktur', 'Belum tersedia', 'Mengadopsi tanpa modifikasi', 'Disusun sistematis', 'Sangat mendalam & kontekstual', 1, 3],
      ['administrasi', 'A4', 'Buku Presensi / Daftar Hadir Siswa & Agenda Harian Mengajar', 'Tidak ada buku agenda', 'Ada tidak teratur', 'Terisi lengkap', 'Terisi rapi & memuat catatan refleksi', 1, 4],
      ['administrasi', 'A5', 'Buku Catatan Karakter, Bimbingan & Perkembangan Siswa', 'Tidak memiliki catatan', 'Catatan tidak rutin', 'Terdokumentasi baik', 'Komprehensif memuat tindak lanjut BK', 1, 5],

      ['modul_ajar', 'B1', 'Kesesuaian Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP)', 'TP tidak relevan CP', 'Sebagian selaras', 'Selaras dengan fase murid', 'Sangat spesifik, terukur & terintegrasi', 1, 1],
      ['modul_ajar', 'B2', 'Integrasi Nilai Profil Pelajar Pancasila & Rahmatan Lil Alamin (P5-PPRA)', 'Belum terintegrasi', 'Hanya tertulis formalitas', 'Terintegrasi dalam aktivitas', 'Sangat hidup dalam seluruh sintaks', 1, 2],
      ['modul_ajar', 'B3', 'Rancangan Model Pembelajaran Aktif, Kontekstual & Berdiferensiasi', 'Masih dominan ceramah', 'Variasi metode terbatas', 'Memuat diferensiasi konten/proses', 'Inovatif, PBL/PjBL terarah', 1, 3],
      ['modul_ajar', 'B4', 'Pemanfaatan Media Pembelajaran, Sumber Belajar & Teknologi Digital', 'Tanpa media relevan', 'Media cetak standar', 'Memakai multimedia/TPACK', 'Interaktif digital, LMS & hands-on', 1, 4],
      ['modul_ajar', 'B5', 'Rencana Instrumen Asesmen Formatif (Awal/Proses) dan Asesmen Sumatif', 'Hanya tes akhir', 'Formatif belum terstruktur', 'Formatif & sumatif terencana', 'Rubrik autentik & panduan skor jelas', 1, 5],

      ['pengamatan', 'C1', 'Keterampilan Membuka Pelajaran, Pengkondisian Kelas, dan Apersepsi', 'Langsung ke materi', 'Apersepsi singkat', 'Mengaitkan materi & tujuan jelas', 'Menstimulasi rasa ingin tahu siswa', 1, 1],
      ['pengamatan', 'C2', 'Penguasaan Materi Pembelajaran & Penyampaian yang Jelas dan Kontekstual', 'Materi kurang dikuasai', 'Cukup menguasai teks', 'Menguasai konsep esensial', 'Lancar, kontekstual & bebas miskonsepsi', 1, 2],
      ['pengamatan', 'C3', 'Penerapan Pendekatan Diferensiasi & Pelibatan Aktif Partisipasi Siswa', 'Pasif searah', 'Hanya beberapa siswa aktif', 'Sebagian besar terlibat', 'Diferensiasi hidup, semua siswa aktif', 1, 3],
      ['pengamatan', 'C4', 'Pengelolaan Waktu, Penggunaan Media/Laboratorium & Suasana Kondusif', 'Waktu tidak tertib', 'Cukup teratur', 'Waktu & media efektif', 'Kondusif, aman, nyaman & tepat waktu', 1, 4],
      ['pengamatan', 'C5', 'Keterampilan Menutup Pembelajaran, Rangkuman & Refleksi Bersama Siswa', 'Berhenti mendadak', 'Rangkuman sepihak guru', 'Melibatkan siswa menyimpulkan', 'Refleksi mendalam & pesan inspiratif', 1, 5],

      ['penilaian', 'D1', 'Kesesuaian Teknik & Instrumen Asesmen dengan Indikator Ketercapaian TP', 'Instrumen tidak sesuai', 'Sebagian sesuai', 'Selaras dengan TP', 'Sangat representatif mengukur kompetensi', 1, 1],
      ['penilaian', 'D2', 'Pelaksanaan Asesmen Autentik (Kinerja, Portofolio, Tes Tertulis/Proyek)', 'Hanya tes tertulis', 'Ada 2 ragam asesmen', 'Mencakup asesmen kinerja/proses', 'Autentik komprehensif & berkeadilan', 1, 2],
      ['penilaian', 'D3', 'Ketersediaan Rubrik / Pedoman Penskoran yang Terukur dan Obyektif', 'Tidak ada rubrik', 'Rubrik belum spesifik', 'Rubrik terukur & jelas', 'Rubrik holistik/analitik sangat objektif', 1, 3],
      ['penilaian', 'D4', 'Analisis Hasil Evaluasi, Daya Serap Siswa & Buku Daftar Nilai', 'Nilai belum diolah', 'Daftar nilai ada tanpa analisis', 'Analisis ketuntasan tersedia', 'Analisis butir soal & daya serap tuntas', 1, 4],
      ['penilaian', 'D5', 'Perencanaan dan Pelaksanaan Program Remedial serta Pengayaan', 'Belum direncanakan', 'Ada rencana belum terlaksana', 'Terlaksana bagi siswa terkait', 'Terdokumentasi lengkap dengan progres', 1, 5]
    ];

    for (const it of items) {
      instInsert.run(null, it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], 'superadmin');
      instInsert.run(1, it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8], 'kamad');
    }
  }

  // 2. Seed tugas tambahan GTK jika belum ada
  const countTugas = db.prepare('SELECT count(*) as count FROM gtk_tugas_tambahan').get();
  if (countTugas.count === 0) {
    const tugasInsert = db.prepare(`
      INSERT INTO gtk_tugas_tambahan (madrasah_id, gtk_id, jabatan_tambahan, nomor_sk, tanggal_sk, tmt, ekuivalensi_jtm, keterangan, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif')
    `);

    tugasInsert.run(1, 1, 'Kepala Laboratorium Komputer', 'Kd.30.01/1/PP.00/142/2026', '2026-07-15', '2026-07-15', 12, 'SK Pengangkatan Kepala Lab Komputer & Multimedia');
    tugasInsert.run(1, 1, 'Guru Penilai Supervisi Pembelajaran', 'Kd.30.01/1/PP.00/177/2026', '2026-08-01', '2026-08-01', 2, 'Mandat Kepala Madrasah sebagai Guru Pamong / Supervisor Sejawat');
    tugasInsert.run(1, 2, 'Kepala Perpustakaan Madrasah', 'Kd.30.01/1/PP.00/145/2026', '2026-07-15', '2026-07-15', 12, 'SK Pengelola Unit Perpustakaan Digital');
    tugasInsert.run(1, 3, 'Wali Kelas XII-MIPA 1', 'Kd.30.01/1/PP.00/150/2026', '2026-07-15', '2026-07-15', 2, 'Pembinaan akademik dan karakter kelas binaan');
    tugasInsert.run(1, 4, 'Pembina OSIS & Ekstrakurikuler', 'Kd.30.01/1/PP.00/155/2026', '2026-07-15', '2026-07-15', 2, 'Pengembangan minat bakat siswa madrasah');
  }

  // 3. Seed Ijazah GTK jika belum ada
  const countIjazah = db.prepare('SELECT count(*) as count FROM gtk_ijazah').get();
  if (countIjazah.count === 0) {
    const ijzStmt = db.prepare(`
      INSERT INTO gtk_ijazah (gtk_id, jenjang, institusi, jurusan, thn_masuk, thn_lulus, gelar, ipk, no_ijazah)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    ijzStmt.run(5, 'S1', 'Universitas Negeri Gorontalo', 'Pendidikan Informatika & Komputer', 2004, 2008, 'S.Pd', '3.65', 'UNG-FT-2008-0842');
    ijzStmt.run(5, 'S2', 'Universitas Terbuka', 'Magister Pendidikan Teknologi Pembelajaran', 2018, 2021, 'M.Pd', '3.82', 'UT-PASCA-2021-1205');
    ijzStmt.run(1, 'S1', 'Universitas Negeri Gorontalo', 'Sistem Informasi', 2008, 2012, 'S.Kom', '3.58', 'UNG-FT-2012-0457');
  }

  // 4. Seed Sertifikasi GTK jika belum ada
  const countSert = db.prepare('SELECT count(*) as count FROM gtk_sertifikasi').get();
  if (countSert.count === 0) {
    const srtStmt = db.prepare(`
      INSERT INTO gtk_sertifikasi (gtk_id, jenis, bidang, tgl_terbit, no_sertifikat, lembaga)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    srtStmt.run(5, 'Sertifikasi Pendidik (PPG)', 'Informatika & Komputer', '2021-12-15', 'SER-PPG-2021-75010045', 'Kementerian Agama RI / LPTK UNG');
    srtStmt.run(5, 'Sertifikat PKB', 'Pemanfaatan AI Generatif dalam Pembelajaran Kurikulum Merdeka', '2024-05-20', 'PKB-BDK-MDO-2024-883', 'Balai Diklat Keagamaan Manado');
    srtStmt.run(2, 'Sertifikasi Pendidik (PPG)', 'Al-Qur\'an Hadis', '2016-11-28', 'SER-PPG-2016-75010012', 'Kementerian Agama RI / LPTK UIN Alauddin');
  }

  // 5. Seed Pengajuan Cuti GTK jika belum ada
  const countCuti = db.prepare('SELECT count(*) as count FROM gtk_cuti').get();
  if (countCuti.count === 0) {
    const cutiStmt = db.prepare(`
      INSERT INTO gtk_cuti (madrasah_id, gtk_id, jenis_cuti, tgl_mulai, tgl_selesai, lama_hari, alasan, alamat_cuti, telepon, status, catatan_kamad, tgl_disetujui, disetujui_oleh)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    cutiStmt.run(1, 5, 'Cuti Alasan Penting', '2026-09-10', '2026-09-12', 3, 'Mendampingi orang tua rawat inap di Rumah Sakit Aloei Saboe', 'Jl. Trans Sulawesi, Limboto', '081356789012', 'disetujui', 'Disetujui. Semoga lekas sembuh, koordinasikan modul ajar dengan guru piket.', '2026-09-09 14:20:00', 'Drs. H. Abdul Wahab, M.Pd');
    cutiStmt.run(1, 3, 'Cuti Melahirkan', '2026-07-01', '2026-09-30', 90, 'Persalinan anak kedua (Cuti Bersalin 3 Bulan)', 'Kecamatan Telaga, Kab. Gorontalo', '081345678902', 'disetujui', 'Disetujui sesuai hak cuti melahirkan 3 bulan.', '2026-06-25 10:15:00', 'Drs. H. Abdul Wahab, M.Pd');
    cutiStmt.run(1, 8, 'Cuti Tahunan', '2026-11-02', '2026-11-06', 5, 'Keperluan keluarga di luar daerah dan urusan administrasi tanah warisan', 'Kota Kotamobagu, Sulawesi Utara', '081289012346', 'menunggu', null, null, null);
  }
}

function seedData() {
  const madrasahCount = db.prepare('SELECT count(*) as count FROM madrasah').get();
  if (madrasahCount.count > 0) return; // already seeded

  console.log('Seeding initial SIM-GTK database...');

  // 1. Madrasah
  const mStmt = db.prepare(`
    INSERT INTO madrasah (npsn, nama, jenjang, alamat, kabupaten, provinsi, telepon, email, nama_kamad, tahun_ajaran, semester, ai_base_url, ai_model)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const mRes = mStmt.run(
    '40401234',
    'MAN 2 KABUPATEN GORONTALO',
    'MA',
    'Jl. Taman Pendidikan No. 12, Limboto',
    'Kabupaten Gorontalo',
    'Gorontalo',
    '0435-881234',
    'man2gorontalo@kemenag.go.id',
    'Drs. H. Abdul Wahab, M.Pd',
    '2026/2027',
    '1 (Ganjil)',
    'https://api.openai.com/v1',
    'gpt-4o-mini'
  );
  const madrasahId = mRes.lastInsertRowid;

  // 2. Users (Admin, Guru Herman, Pengawas, Super Admin)
  const uStmt = db.prepare(`
    INSERT INTO users (username, email, password, nama, role, madrasah_id, telepon, alamat, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const adminUser = uStmt.run('admin_man2', 'admin@man2gorontalo.sch.id', 'admin123', 'Siti Rahmawati, S.Kom', 'admin', madrasahId, '081242843901', 'Kec. Limboto, Gorontalo', 'aktif');
  const guruUser = uStmt.run('herman', 'herman@man2gorontalo.sch.id', 'guru123', 'Herman Susanto Buhungo', 'guru', madrasahId, '081356789012', 'Gorontalo', 'aktif');
  const pengawasUser = uStmt.run('pengawas', 'pengawas@kemenag.go.id', 'pengawas123', 'Dr. Hj. Nurul Aini, M.Pd', 'pengawas', madrasahId, '081198765432', 'Kanwil Kemenag Gorontalo', 'aktif');
  const superUser = uStmt.run('superadmin', 'superadmin@sim-gtk.id', 'admin123', 'Administrator Pusat SIM-GTK', 'superadmin', madrasahId, '081200001111', 'Jakarta', 'aktif');

  // 3. GTK List (8 GTK from the original website)
  const gtkStmt = db.prepare(`
    INSERT INTO gtk (user_id, madrasah_id, nama, nip, nuptk, nik, jenis_kelamin, tempat_lahir, tanggal_lahir, telepon, email, alamat, jabatan, status_kepegawaian, golongan, tmt_golongan, mkg_tahun, mkg_bulan, pendidikan_terakhir, prodi, kampus, mapel_utama, sertifikasi_status, nrg, kelengkapan_persen, status_aktif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  gtkStmt.run(adminUser.lastInsertRowid, madrasahId, 'Siti Rahmawati, S.Kom', '-', '-', '7501015502900001', 'Perempuan', 'Gorontalo', '1990-02-15', '081242843901', 'admin@man2gorontalo.sch.id', 'Limboto', 'Admin Madrasah', 'PNS', 'III/a', '2018-04-01', 8, 4, 'S1', 'Sistem Informasi', 'Universitas Negeri Gorontalo', 'Informatika', 'Belum', '', 67, 'aktif');
  gtkStmt.run(null, madrasahId, 'Ahmad Fauzi, S.Ag', '198203052008011004', '2345678901234567', '7501010503820002', 'Laki-laki', 'Gorontalo', '1982-03-05', '081245678901', 'fauzi@man2gorontalo.sch.id', 'Limboto', 'Guru', 'PNS', 'III/d', '2016-10-01', 8, 4, 'S1', 'Pendidikan Agama Islam', 'IAIN Sultan Amai', 'Al-Qur\'an Hadis', 'Sudah', '123456789012', 100, 'aktif');
  gtkStmt.run(null, madrasahId, 'Dewi Kartika, S.Pd', '199107152019032008', '3456789012345678', '7501015507910003', 'Perempuan', 'Gorontalo', '1991-07-15', '081345678902', 'dewi@man2gorontalo.sch.id', 'Telaga', 'Guru', 'PPPK', 'III/b', '2019-03-01', 8, 4, 'S1', 'Pendidikan Bahasa Inggris', 'Universitas Negeri Gorontalo', 'Bahasa Inggris', 'Sudah', '234567890123', 83, 'aktif');
  gtkStmt.run(null, madrasahId, 'Fatimah Zahra, S.Pd', '198806222012012005', '5678901234567890', '7501016206880004', 'Perempuan', 'Gorontalo', '1988-06-22', '081256789013', 'fatimah@man2gorontalo.sch.id', 'Limboto Barat', 'Guru', 'PNS', 'III/c', '2017-04-01', 8, 4, 'S1', 'Pendidikan Bahasa Arab', 'IAIN Sultan Amai', 'Bahasa Arab', 'Sudah', '345678901234', 100, 'aktif');
  const hermanGtk = gtkStmt.run(guruUser.lastInsertRowid, madrasahId, 'Herman Susanto Buhungo', '-', '1234567890123456', '7501011204850005', 'Laki-laki', 'Gorontalo', '1985-04-12', '081356789012', 'herman@man2gorontalo.sch.id', 'Kecamatan Limboto, Gorontalo', 'Guru', 'Non-PNS', 'III/a', '2020-01-01', 8, 4, 'S1', 'Pendidikan Informatika', 'Universitas Negeri Gorontalo', 'Informatika', 'Sudah', '456789012345', 90, 'aktif');
  gtkStmt.run(null, madrasahId, 'Nurhayati, S.Pd', '198511202010012015', '6789012345678901', '7501016011850006', 'Perempuan', 'Gorontalo', '1985-11-20', '081367890124', 'nurhayati@man2gorontalo.sch.id', 'Tibawa', 'Guru', 'PNS', 'III/d', '2015-10-01', 8, 4, 'S1', 'Pendidikan Matematika', 'Universitas Negeri Gorontalo', 'Matematika', 'Sudah', '567890123456', 95, 'aktif');
  gtkStmt.run(null, madrasahId, 'Rahmat Hidayat, S.Pd.I', '-', '7890123456789012', '7501011508920007', 'Laki-laki', 'Gorontalo', '1992-08-15', '081278901235', 'rahmat@man2gorontalo.sch.id', 'Pulubala', 'Guru', 'Non-PNS', 'II/b', '2021-07-01', 8, 4, 'S1', 'Sejarah Peradaban Islam', 'IAIN Sultan Amai', 'Sejarah Kebudayaan Islam', 'Belum', '', 70, 'aktif');
  gtkStmt.run(null, madrasahId, 'Samsudin Mahmud, A.Ma', '-', '8901234567890123', '7501011010800008', 'Laki-laki', 'Gorontalo', '1980-10-10', '081289012346', 'samsudin@man2gorontalo.sch.id', 'Limboto', 'Tenaga Kependidikan', 'Non-PNS', 'II/a', '2019-01-01', 8, 4, 'D2', 'Perpustakaan', 'Universitas Terbuka', 'Kepustakaan', 'Belum', '', 65, 'aktif');

  // 4. Classes
  const kStmt = db.prepare(`INSERT INTO kelas (madrasah_id, tingkat, nama, jumlah_siswa) VALUES (?, ?, ?, ?)`);
  const c1 = kStmt.run(madrasahId, 'X', 'X IPA 1', 32);
  const c2 = kStmt.run(madrasahId, 'X', 'X IPA 2', 30);
  const c3 = kStmt.run(madrasahId, 'XI', 'XI IPA 1', 31);
  const c4 = kStmt.run(madrasahId, 'XI', 'XI IPS 1', 28);
  const c5 = kStmt.run(madrasahId, 'XII', 'XII IPA 1', 30);
  const c6 = kStmt.run(madrasahId, 'XII', 'XII IPS 1', 29);

  // 5. Subjects
  const mapelStmt = db.prepare(`INSERT INTO mapel (madrasah_id, kode, nama, kelompok, jtm_default) VALUES (?, ?, ?, ?, ?)`);
  mapelStmt.run(madrasahId, 'INFO', 'Informatika', 'Umum', 3);
  mapelStmt.run(madrasahId, 'QH', 'Al-Qur\'an Hadis', 'Agama', 2);
  mapelStmt.run(madrasahId, 'AA', 'Akidah Akhlak', 'Agama', 2);
  mapelStmt.run(madrasahId, 'FIQ', 'Fikih', 'Agama', 2);
  mapelStmt.run(madrasahId, 'SKI', 'Sejarah Kebudayaan Islam', 'Agama', 2);
  mapelStmt.run(madrasahId, 'BAR', 'Bahasa Arab', 'Agama', 2);
  mapelStmt.run(madrasahId, 'MTK', 'Matematika', 'Umum', 4);
  mapelStmt.run(madrasahId, 'BING', 'Bahasa Inggris', 'Umum', 3);
  mapelStmt.run(madrasahId, 'BIND', 'Bahasa Indonesia', 'Umum', 4);

  // 6. Sample Students for XII IPA 1
  const sStmt = db.prepare(`INSERT INTO siswa (madrasah_id, kelas_id, nis, nisn, nama, jenis_kelamin) VALUES (?, ?, ?, ?, ?, ?)`);
  const sampleStudents = [
    ['20290503', '0081234001', 'Abdul Dunggio', 'Laki-laki'],
    ['20290513', '0081234002', 'Abdul Ibrahim', 'Laki-laki'],
    ['20290520', '0081234003', 'Ahmad Rizky Pratama', 'Laki-laki'],
    ['20290525', '0081234004', 'Aisyah Putri Humairah', 'Perempuan'],
    ['20290531', '0081234005', 'Annisa Zahra Ramadhani', 'Perempuan'],
    ['20290544', '0081234006', 'Bilal Al-Farisi', 'Laki-laki'],
    ['20290550', '0081234007', 'Chairunnisah Mokodompit', 'Perempuan'],
    ['20290562', '0081234008', 'Daffa Muhammad Al-Habsyi', 'Laki-laki'],
    ['20290575', '0081234009', 'Fadhilah Nur Insani', 'Perempuan'],
    ['20290588', '0081234010', 'Hafizh Abdillah', 'Laki-laki']
  ];
  for (const s of sampleStudents) {
    sStmt.run(madrasahId, c5.lastInsertRowid, s[0], s[1], s[2], s[3]);
  }

  // 7. Schedules
  const jStmt = db.prepare(`INSERT INTO jadwal (madrasah_id, kelas_id, mapel_id, gtk_id, hari, jam_ke, jam_mulai, jam_selesai, ruang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  jStmt.run(madrasahId, c5.lastInsertRowid, 7, 6, 'Jumat', '1-2', '07:00', '08:30', 'Ruang R-101');
  jStmt.run(madrasahId, c6.lastInsertRowid, 8, 3, 'Jumat', '3-4', '08:30', '10:00', 'Ruang R-102');
  jStmt.run(madrasahId, c1.lastInsertRowid, 5, 7, 'Jumat', '5-6', '10:15', '11:45', 'Ruang R-201');
  jStmt.run(madrasahId, c5.lastInsertRowid, 1, hermanGtk.lastInsertRowid, 'Senin', '1-3', '07:30', '09:45', 'Lab Komputer');

  // 8. Supervisi records
  const supStmt = db.prepare(`INSERT INTO supervisi (madrasah_id, gtk_id, supervisor_user_id, jenis, tanggal, skor_total, predikat, catatan_supervisor, tindak_lanjut, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  supStmt.run(madrasahId, hermanGtk.lastInsertRowid, pengawasUser.lastInsertRowid, 'Supervisi Manajerial (Pengawas)', '2026-10-23', null, null, 'Supervisi terjadwal observasi kelas', 'Tindak lanjut disiapkan setelah observasi', 'Terjadwal');
  supStmt.run(madrasahId, 3, pengawasUser.lastInsertRowid, 'Supervisi Akademik', '2026-10-03', 69, 'Cukup', 'Penyusunan modul ajar perlu penambahan asesmen formatif', 'Pelatihan mandiri di PMM', 'Selesai');
  supStmt.run(madrasahId, 6, 2, 'Supervisi Akademik', '2026-09-23', 91, 'Amat Baik', 'Pembelajaran berdiferensiasi terlaksana sangat baik', 'Bisa menjadi tutor sebaya bagi guru lain', 'Selesai');
  supStmt.run(madrasahId, hermanGtk.lastInsertRowid, 2, 'Supervisi Akademik', '2026-09-08', 81, 'Baik', 'Penggunaan media TIK interaktif dalam pembelajaran materi informatika sangat relevan', 'Pertahankan dan kembangkan LKPD berbasis proyek', 'Selesai');

  // 9. Persetujuan / Verifikasi items (6 items from the badge)
  const pStmt = db.prepare(`INSERT INTO persetujuan (madrasah_id, gtk_id, jenis, judul, detail, status, tanggal_pengajuan) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  pStmt.run(madrasahId, hermanGtk.lastInsertRowid, 'Golongan', 'Kenaikan Golongan ke III/b', 'SK Kenaikan Pangkat Penata Muda Tk. I', 'pending', '2026-10-18');
  pStmt.run(madrasahId, 3, 'Ijazah', 'Penyesuaian Ijazah S2 Magister Pendidikan', 'Ijazah S2 Universitas Negeri Gorontalo', 'pending', '2026-10-15');
  pStmt.run(madrasahId, 7, 'NUPTK', 'Pengajuan Klaim NUPTK Baru', 'Surat rekomendasi Kanwil Kemenag', 'pending', '2026-10-12');
  pStmt.run(madrasahId, 4, 'Sertifikasi', 'Update Nomor NRG & Sertifikat Pendidik', 'Sertifikat Pendidik PPG Daljab 2026', 'pending', '2026-10-10');
  pStmt.run(madrasahId, 6, 'SKMT', 'Pengajuan SKMT Semester Ganjil 2026/2027', 'Beban kerja 24 JTM terpenuhi', 'pending', '2026-10-05');
  pStmt.run(madrasahId, hermanGtk.lastInsertRowid, 'Tugas Tambahan', 'Ekuivalensi Kepala Lab Komputer', 'SK Kepala Madrasah Pembagian Tugas Tambahan', 'pending', '2026-10-02');

  console.log('Seed completed successfully!');
}

function seedPenilaianData() {
  const count = db.prepare('SELECT count(*) as count FROM jadwal_supervisi').get();
  if (count.count > 0) return;

  console.log('Seeding Penilaian & Supervisi GTK data...');
  const madrasahId = 1;
  const herman = db.prepare("SELECT id FROM gtk WHERE nama LIKE '%Herman%'").get() || { id: 5 };
  const fauzi = db.prepare("SELECT id FROM gtk WHERE nama LIKE '%Ahmad Fauzi%'").get() || { id: 2 };
  const dewi = db.prepare("SELECT id FROM gtk WHERE nama LIKE '%Dewi Kartika%'").get() || { id: 3 };
  const nurhayati = db.prepare("SELECT id FROM gtk WHERE nama LIKE '%Nurhayati%'").get() || { id: 6 };
  const samsudin = db.prepare("SELECT id FROM gtk WHERE nama LIKE '%Samsudin%'").get() || { id: 8 };

  // 1. Jadwal Supervisi
  const jStmt = db.prepare(`
    INSERT INTO jadwal_supervisi (madrasah_id, gtk_id, supervisor_nama, jenis_supervisi, tanggal, jam, kelas, mapel, ruang, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  jStmt.run(madrasahId, herman.id, 'Dr. Hj. Nurul Aini, M.Pd (Pengawas)', 'Supervisi Akademik (Administrasi & Mengajar)', '2026-10-24', '08:00 - 09:30', 'X IPA 1', 'Informatika', 'Lab Komputer 1', 'Terjadwal');
  jStmt.run(madrasahId, herman.id, 'Drs. H. Abdul Wahab, M.Pd (Kepala Madrasah)', 'Supervisi Manajerial (Kepala Lab Komputer)', '2026-10-28', '10:00 - 11:30', '-', 'Manajerial Lab', 'Ruang Kepala Lab', 'Terjadwal');
  jStmt.run(madrasahId, dewi.id, 'Dr. Hj. Nurul Aini, M.Pd (Pengawas)', 'Supervisi Mengajar (Observasi Kelas)', '2026-10-26', '09:00 - 10:30', 'XII IPS 1', 'Bahasa Inggris', 'Ruang R-102', 'Terjadwal');
  jStmt.run(madrasahId, fauzi.id, 'Drs. H. Abdul Wahab, M.Pd (Kepala Madrasah)', 'Supervisi Akademik', '2026-10-27', '07:30 - 09:00', 'XI IPA 1', 'Al-Qur\'an Hadis', 'Ruang R-201', 'Terjadwal');
  jStmt.run(madrasahId, nurhayati.id, 'Drs. H. Abdul Wahab, M.Pd (Kepala Madrasah)', 'Perangkat Pembelajaran', '2026-10-25', '10:00 - 11:30', 'XII IPA 1', 'Matematika', 'Ruang Guru', 'Terjadwal');

  // 2. Perangkat Supervisi
  const pStmt = db.prepare(`
    INSERT INTO perangkat_supervisi (madrasah_id, gtk_id, mapel, kelas, jenis_perangkat, file_nama, skor, status_verifikasi, tanggal_unggah, tanggal_periksa, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  pStmt.run(madrasahId, herman.id, 'Informatika', 'X IPA 1', 'Modul Ajar Kurikulum Merdeka', 'Modul_Ajar_Informatika_X.docx', 92, 'Lengkap', '2026-10-20', '2026-10-21', 'Komponen lengkap, asesmen diferensiasi tercantum jelas');
  pStmt.run(madrasahId, herman.id, 'Informatika', 'X IPA 1', 'Alur Tujuan Pembelajaran (ATP)', 'ATP_Informatika_Fase_E.docx', 90, 'Lengkap', '2026-10-20', '2026-10-21', 'Alur runtut dan terpadu');
  pStmt.run(madrasahId, herman.id, 'Informatika', 'X IPA 1', 'LKPD & Lembar Kerja Siswa', 'LKPD_Algoritma_Searching.docx', 88, 'Lengkap', '2026-10-20', '2026-10-21', 'Sangat aplikatif dan kontekstual');
  pStmt.run(madrasahId, dewi.id, 'Bahasa Inggris', 'XII IPS 1', 'Modul Ajar', 'Modul_BING_XII.docx', 86, 'Lengkap', '2026-10-18', '2026-10-19', 'Lengkap, tambahkan rubrik speaking');
  pStmt.run(madrasahId, fauzi.id, 'Al-Qur\'an Hadis', 'XI IPA 1', 'Modul Ajar & Soal KKTP', 'Modul_QH_XI.docx', 94, 'Lengkap', '2026-10-17', '2026-10-18', 'Sangat rapi dan mendalam');

  // 3. Supervisi Akademik (Administrasi dan Mengajar)
  const aStmt = db.prepare(`
    INSERT INTO supervisi_akademik (madrasah_id, gtk_id, supervisor_nama, tanggal, mapel, kelas, skor_administrasi, skor_mengajar, skor_total, predikat, catatan, tindak_lanjut)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  aStmt.run(madrasahId, herman.id, 'Dr. Hj. Nurul Aini, M.Pd', '2026-09-08', 'Informatika', 'X IPA 1', 92, 88, 90, 'Amat Baik', 'Pemanfaatan media komputer interaktif sangat efektif mengaktifkan siswa.', 'Disarankan menyusun modul proyek penguatan profil pelajar (P5-PPRA).');
  aStmt.run(madrasahId, dewi.id, 'Dr. Hj. Nurul Aini, M.Pd', '2026-10-03', 'Bahasa Inggris', 'XII IPS 1', 84, 82, 83, 'Baik', 'Pelaksanaan pembelajaran berjalan tertib dan komunikatif.', 'Perbanyak latihan conversation kelompok kecil.');
  aStmt.run(madrasahId, nurhayati.id, 'Ahmad Fauzi, S.Ag', '2026-09-23', 'Matematika', 'XII IPA 1', 94, 92, 93, 'Amat Baik', 'Metode pemecahan masalah (Problem Based Learning) diterapkan secara konsisten.', 'Jadikan praktik baik (best practice) madrasah.');

  // 4. Supervisi Mengajar (Observasi Kelas)
  const mStmt = db.prepare(`
    INSERT INTO supervisi_mengajar (madrasah_id, gtk_id, supervisor_nama, tanggal, mapel, kelas, materi, skor_kegiatan_awal, skor_kegiatan_inti, skor_kegiatan_penutup, skor_total, predikat, catatan, rekomendasi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  mStmt.run(madrasahId, herman.id, 'Dr. Hj. Nurul Aini, M.Pd', '2026-09-08', 'Informatika', 'X IPA 1', 'Algoritma Searching & Sorting', 92, 88, 88, 89, 'Baik', 'Apersepsi menarik dengan simulasi nyata antrean belanja.', 'Berikan umpan balik langsung pada kelompok yang selesai lebih awal.');
  mStmt.run(madrasahId, fauzi.id, 'Drs. H. Abdul Wahab, M.Pd', '2026-09-15', 'Al-Qur\'an Hadis', 'XI IPA 1', 'Kaidah Tajwid Nun Mati & Tanwin', 95, 92, 90, 92, 'Amat Baik', 'Penguasaan materi sangat mantap dan melibatkan seluruh peserta didik.', 'Pertahankan metode tutor sebaya.');

  // 5. Supervisi Manajerial (Tugas Tambahan)
  const manStmt = db.prepare(`
    INSERT INTO supervisi_manajerial (madrasah_id, gtk_id, tugas_tambahan, supervisor_nama, tanggal, skor_program, skor_pelaksanaan, skor_evaluasi, skor_total, predikat, catatan, rekomendasi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  manStmt.run(madrasahId, herman.id, 'Kepala Laboratorium Komputer', 'Dr. Hj. Nurul Aini, M.Pd', '2026-10-15', 92, 90, 88, 90, 'Amat Baik', 'Jadwal pemakaian laboratorium tertata rapi, inventarisasi hardware lengkap dan berlabel.', 'Tingkatkan perawatan pendingin ruangan (AC) dan cadangan daya UPS.');
  manStmt.run(madrasahId, samsudin.id, 'Kepala Perpustakaan Madrasah', 'Drs. H. Abdul Wahab, M.Pd', '2026-10-12', 88, 85, 84, 86, 'Baik', 'Katalogisasi buku Kurikulum Merdeka telah terdata baik.', 'Rencanakan digitalisasi kartu perpustakaan peserta didik.');

  // 6. Daftar Hadir Supervisi
  const dhStmt = db.prepare(`
    INSERT INTO daftar_hadir_supervisi (madrasah_id, gtk_id, tanggal, supervisor_nama, jenis_supervisi, status_kehadiran, jam_hadir, tanda_tangan, keterangan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  dhStmt.run(madrasahId, herman.id, '2026-10-24', 'Dr. Hj. Nurul Aini, M.Pd', 'Supervisi Akademik', 'Hadir', '07:45', 'Tervalidasi Digital', 'Tepat waktu dan berkas lengkap');
  dhStmt.run(madrasahId, herman.id, '2026-10-15', 'Dr. Hj. Nurul Aini, M.Pd', 'Supervisi Manajerial Lab', 'Hadir', '09:50', 'Tervalidasi Digital', 'Hadir di Laboratorium');
  dhStmt.run(madrasahId, dewi.id, '2026-10-03', 'Dr. Hj. Nurul Aini, M.Pd', 'Supervisi Akademik', 'Hadir', '08:15', 'Tervalidasi Digital', 'Observasi kelas XII IPS 1');
  dhStmt.run(madrasahId, fauzi.id, '2026-09-15', 'Drs. H. Abdul Wahab, M.Pd', 'Supervisi Mengajar', 'Hadir', '07:25', 'Tervalidasi Digital', 'Sangat siap');
  dhStmt.run(madrasahId, nurhayati.id, '2026-09-23', 'Ahmad Fauzi, S.Ag', 'Supervisi Akademik', 'Hadir', '07:30', 'Tervalidasi Digital', 'Pelaksanaan lancar');

  console.log('Penilaian & Supervisi data seeded successfully!');
}

function seedPlatformData() {
  const cfgCount = db.prepare('SELECT count(*) as count FROM platform_config').get();
  if (cfgCount.count > 0) return; // already seeded

  console.log('Seeding Platform Superadmin demo data...');

  // 1. Tambah Lembaga / Madrasah baru untuk simulasi multi-lembaga
  const mCheck = db.prepare('SELECT count(*) as count FROM madrasah WHERE npsn = ?');
  const addMadrasah = db.prepare(`
    INSERT INTO madrasah (npsn, nama, jenjang, alamat, kabupaten, provinsi, telepon, email, nama_kamad, tahun_ajaran, semester, status, kapasitas_gtk, storage_mb, ai_quota, paket_layanan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (!mCheck.get('40405678').count) {
    const m2 = addMadrasah.run(
      '40405678', 'MTsN 1 KABUPATEN GORONTALO', 'MTs', 'Jl. Trans Sulawesi No. 45, Limboto',
      'Kabupaten Gorontalo', 'Gorontalo', '0435-882345', 'mtsn1gorontalo@kemenag.go.id',
      'Hj. Yanti Mahmud, M.Pd', '2026/2027', '1 (Ganjil)', 'aktif', 80, 2048, 400000, 'Standard Madrasah'
    );
    // User admin MTsN 1
    db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password, nama, role, madrasah_id, telepon, alamat, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('admin_mtsn1', 'admin@mtsn1gorontalo.sch.id', 'admin123', 'Rizal Koni, S.Kom', 'admin', m2.lastInsertRowid, '081242998811', 'Limboto', 'aktif');
  }

  if (!mCheck.get('40409988').count) {
    const m3 = addMadrasah.run(
      '40409988', 'MAN 1 KOTA GORONTALO', 'MA', 'Jl. Poigar No. 10, Kota Gorontalo',
      'Kota Gorontalo', 'Gorontalo', '0435-821908', 'man1kotagorontalo@kemenag.go.id',
      'Dr. H. Waris Masuara, M.HI', '2026/2027', '1 (Ganjil)', 'aktif', 150, 4096, 1000000, 'Enterprise Kanwil'
    );
    db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password, nama, role, madrasah_id, telepon, alamat, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('admin_man1', 'admin@man1kotagorontalo.sch.id', 'admin123', 'Fitriani Mohamad, S.T', 'admin', m3.lastInsertRowid, '081342776655', 'Kota Gorontalo', 'aktif');
  }

  if (!mCheck.get('69823456').count) {
    const m4 = addMadrasah.run(
      '69823456', 'MAS AL-KHAIRAAT TILAMUTA', 'MA', 'Jl. Trans Tilamuta Boalemo',
      'Kabupaten Boalemo', 'Gorontalo', '0435-890123', 'mas.alkhairaat@gmail.com',
      'Ust. Ismail Katili, S.Ag', '2026/2027', '1 (Ganjil)', 'menunggu_verifikasi', 50, 1024, 250000, 'Starter Madrasah Swasta'
    );
    db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password, nama, role, madrasah_id, telepon, alamat, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('admin_alkhairaat', 'admin@alkhairaat-tilamuta.sch.id', 'admin123', 'Mansur Gani, S.Pd', 'admin', m4.lastInsertRowid, '081299882233', 'Tilamuta', 'menunggu_verifikasi');
  }

  if (!mCheck.get('69781122').count) {
    const m5 = addMadrasah.run(
      '69781122', 'MIS NURUL HUDA BONE BOLANGO', 'MI', 'Desa Taludaa, Bone Pantai',
      'Kabupaten Bone Bolango', 'Gorontalo', '0435-871234', 'misnurulhuda@kemenag.go.id',
      'Siti Maryam, S.Pd.I', '2026/2027', '1 (Ganjil)', 'ditangguhkan', 30, 512, 100000, 'Starter Madrasah Swasta'
    );
    db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password, nama, role, madrasah_id, telepon, alamat, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('admin_nurulhuda', 'admin@nurulhuda.sch.id', 'admin123', 'Taufik Gobel, S.Pd', 'admin', m5.lastInsertRowid, '081266554433', 'Bone Bolango', 'nonaktif');
  }

  // 2. Konfigurasi Global Platform
  const cfgStmt = db.prepare(`INSERT OR REPLACE INTO platform_config (kunci, nilai, kategori, deskripsi) VALUES (?, ?, ?, ?)`);
  cfgStmt.run('platform_nama', 'SIM-GTK Digital Education Platform', 'platform', 'Nama resmi platform SIM-GTK terpusat');
  cfgStmt.run('platform_versi', 'v3.5.0-LTS Enterprise', 'platform', 'Versi build aplikasi saat ini');
  cfgStmt.run('kontak_support', 'pusatbantuan@sim-gtk.id / 0811-9988-7766', 'platform', 'Saluran bantuan dan pelaporan kendala teknis');
  cfgStmt.run('tahun_ajaran_default', '2026/2027', 'platform', 'Tahun ajaran operasional default seluruh lembaga');
  cfgStmt.run('semester_default', '1 (Ganjil)', 'platform', 'Semester akademik yang sedang berjalan');
  cfgStmt.run('maintenance_mode', 'false', 'platform', 'Status pemeliharaan darurat platform');
  
  // Modul
  cfgStmt.run('modul_penilaian', 'aktif', 'modul', 'Fitur Supervisi Akademik, Mengajar, Manajerial & Berita Acara');
  cfgStmt.run('modul_perangkat_ai', 'aktif', 'modul', 'Penyusun Modul Ajar, ATP, dan Program menggunakan AI');
  cfgStmt.run('modul_presensi_harian', 'aktif', 'modul', 'Pencatatan kehadiran harian GTK berbasis geolokasi/QR');
  cfgStmt.run('modul_portofolio', 'aktif', 'modul', 'Pembaruan data diri dan berkas sertifikasi GTK');
  cfgStmt.run('modul_jurnal_mengajar', 'aktif', 'modul', 'Jurnal mengajar dan agenda tatap muka kelas');
  
  // Keamanan
  cfgStmt.run('sesi_timeout_menit', '180', 'keamanan', 'Durasi masa berlaku sesi login tanpa aktivitas');
  cfgStmt.run('max_login_attempts', '5', 'keamanan', 'Batas maksimal gagal login sebelum akun dikunci');
  cfgStmt.run('password_min_length', '8', 'keamanan', 'Panjang minimal karakter kata sandi');
  cfgStmt.run('force_strong_password', 'aktif', 'keamanan', 'Wajib kombinasi huruf besar, angka, dan karakter khusus');
  cfgStmt.run('csrf_protection', 'aktif', 'keamanan', 'Perlindungan token anti Cross-Site Request Forgery');

  // Kategori Umum
  cfgStmt.run('kategori_jenjang', 'RA,MI,MTs,MA,MAK', 'kategori', 'Daftar jenjang satuan pendidikan binaan Kemenag');
  cfgStmt.run('kategori_mapel', 'Agama,Umum,Peminatan,Muatan Lokal,BK', 'kategori', 'Kelompok rumpun mata pelajaran');

  // 3. Paket & Pengelolaan Layanan (Service Plans)
  const planStmt = db.prepare(`INSERT OR REPLACE INTO service_plans (nama_paket, max_gtk, max_storage_mb, ai_token_per_bulan, biaya, status, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  planStmt.run('Starter Madrasah Swasta', 40, 1024, 150000, 'Gratis / Kuota Subsidi', 'aktif', 'Dikhususkan untuk madrasah rintisan & swasta dengan kapasitas terbatas.');
  planStmt.run('Standard Madrasah Negeri', 120, 4096, 600000, 'DIPA Satker Kemenag', 'aktif', 'Paket standar madrasah negeri berdaya tampung menengah dan fitur supervisi penuh.');
  planStmt.run('Enterprise Kanwil Kemenag', 350, 20480, 2500000, 'Anggaran Provinsi/Pusat', 'aktif', 'Kapasitas maksimal untuk MAN Model, MTsN Terpadu, atau klaster madrasah unggulan.');

  // 4. Audit Logs (Log Aktivitas Pengguna)
  const logStmt = db.prepare(`INSERT INTO audit_logs (user_nama, role, aksi, modul, detail, ip_address, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`);
  logStmt.run('Administrator Pusat SIM-GTK', 'superadmin', 'Aktivasi Lembaga', 'Manajemen Lembaga', 'Mengaktifkan status lembaga MTsN 1 Kabupaten Gorontalo', '10.10.0.1', 'success', '-1 hour');
  logStmt.run('Dr. Hj. Nurul Aini, M.Pd', 'pengawas', 'Input Nilai Supervisi', 'Penilaian', 'Menyimpan nilai supervisi akademik guru Herman Susanto Buhungo (Skor: 90)', '180.254.12.9', 'success', '-2 hours');
  logStmt.run('Siti Rahmawati, S.Kom', 'admin', 'Jadwal Supervisi Baru', 'Penilaian', 'Menambahkan jadwal supervisi tatap muka kelas X IPA 1', '125.160.88.2', 'success', '-3 hours');
  logStmt.run('Herman Susanto Buhungo', 'guru', 'Unggah Perangkat Pembelajaran', 'Penilaian', 'Mengunggah Modul Ajar Informatika Fase E format DOCX', '114.125.45.19', 'success', '-5 hours');
  logStmt.run('Administrator Pusat SIM-GTK', 'superadmin', 'Konfigurasi Keamanan', 'Konfigurasi Global', 'Memperbarui durasi sesi login menjadi 180 menit', '10.10.0.1', 'success', '-8 hours');
  logStmt.run('Mansur Gani, S.Pd', 'admin', 'Registrasi Lembaga Baru', 'Manajemen Lembaga', 'Pendaftaran baru MAS Al-Khairaat Tilamuta status Menunggu Verifikasi', '182.1.22.84', 'warning', '-12 hours');
  logStmt.run('System Background Worker', 'system', 'Backup Otomatis Database', 'System Core', 'Backup berkala database SQLite sim_gtk.db berhasil (Size: 3.2MB)', '127.0.0.1', 'success', '-1 day');

  // 5. Insiden Akses & Monitoring
  const incStmt = db.prepare(`INSERT INTO access_incidents (tipe_insiden, identifier, ip_address, tingkat_bahaya, keterangan, status, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))`);
  incStmt.run('Percobaan Brute Force Login', 'admin@kemenag.go.id', '194.26.29.112', 'Kritis', '5 kali percobaan password keliru dalam tempo 45 detik. IP diblokir otomatis oleh firewall.', 'Diblokir', '-40 minutes');
  incStmt.run('Akses Unauthorized Modul Superadmin', 'herman@man2gorontalo.sch.id', '114.125.45.19', 'Rendah', 'Mencoba mengakses /sim-gtk/superadmin/konfigurasi tanpa kredensial superadmin.', 'Tertangani', '-3 hours');
  incStmt.run('AI Token Quota Exceeded', 'misnurulhuda@kemenag.go.id', '182.1.22.84', 'Sedang', 'Permintaan penyusunan RPP AI melebihi kuota bulanan paket Starter.', 'Diinvestigasi', '-7 hours');
  incStmt.run('CSRF Token Mismatch', 'session_guest_temp', '36.88.120.5', 'Sedang', 'Token CSRF form kirim data tidak valid atau kedaluwarsa.', 'Tertangani', '-1 day');

  console.log('Platform Superadmin data seeded successfully!');
}

function seedBinaanAndRolesData() {
  const pCount = db.prepare('SELECT count(*) as count FROM pengawas_penugasan').get();
  if (pCount.count > 0) return; // already seeded

  console.log('Seeding Pengawas Binaan, Kepala Madrasah & Tendik roles data...');

  // 1. Akun Kepala Madrasah & Tendik jika belum ada
  const uCheck = db.prepare('SELECT id FROM users WHERE username = ?');
  const uAdd = db.prepare(`
    INSERT INTO users (username, email, password, nama, role, madrasah_id, telepon, alamat, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let kamadUser = uCheck.get('kamad');
  if (!kamadUser) {
    const kRes = uAdd.run('kamad', 'kamad@man2gorontalo.sch.id', 'kamad123', 'Drs. H. Abdul Wahab, M.Pd', 'kamad', 1, '081242001122', 'Limboto, Gorontalo', 'aktif');
    kamadUser = { id: kRes.lastInsertRowid };
  }

  let tendikUser = uCheck.get('tendik');
  if (!tendikUser) {
    const tRes = uAdd.run('tendik', 'tendik@man2gorontalo.sch.id', 'tendik123', 'Samsudin Mahmud, A.Ma', 'tendik', 1, '081289012346', 'Limboto', 'aktif');
    tendikUser = { id: tRes.lastInsertRowid };
  }

  // Cari user pengawas
  const pengawas = db.prepare("SELECT id FROM users WHERE role = 'pengawas' LIMIT 1").get();
  const pengawasId = pengawas ? pengawas.id : 3;

  // 2. Data Penugasan Pengawas Binaan (Many-to-Many Pengawas -> Madrasah)
  const penugasanStmt = db.prepare(`
    INSERT INTO pengawas_penugasan (pengawas_id, madrasah_id, wilayah, nomor_sk, tanggal_mulai, tanggal_selesai, status, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  penugasanStmt.run(pengawasId, 1, 'Kabupaten Gorontalo Barat', 'B-1204/Kk.75.01/KP.02/07/2026', '2026-07-01', '2027-06-30', 'aktif', 'Penugasan Pembinaan Utama Jenjang Aliyah');
  penugasanStmt.run(pengawasId, 2, 'Kabupaten Gorontalo Timur', 'B-1204/Kk.75.01/KP.02/07/2026', '2026-07-01', '2027-06-30', 'aktif', 'Pembinaan Kurikulum Merdeka Terintegrasi');
  penugasanStmt.run(pengawasId, 4, 'Kabupaten Boalemo', 'B-1422/Kk.75.02/KP.02/08/2026', '2026-08-01', '2027-06-30', 'aktif', 'Pendampingan Akreditasi & Tata Kelola Swasta');

  // 3. Program Pengawasan Pengawas
  const progStmt = db.prepare(`
    INSERT INTO program_pengawasan (pengawas_id, tahun_ajaran, semester, nama_program, jenis_program, tujuan, sasaran_binaan, jadwal_rencana, target_capaian, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  progStmt.run(
    pengawasId, '2026/2027', '1 (Ganjil)',
    'Program Pembinaan Mutu Perangkat Ajar & Pembelajaran Berdiferensiasi',
    'Tahunan',
    'Meningkatkan kompetensi guru dalam merancang modul ajar dan asesmen autentik Kurikulum Merdeka.',
    'MAN 2 Kab. Gorontalo, MTsN 1 Kab. Gorontalo, MAS Al-Khairaat',
    'Juli 2026 - Desember 2026',
    '100% GTK sasaran menyusun ATP dan Modul Ajar tervalidasi.',
    'Aktif'
  );
  progStmt.run(
    pengawasId, '2026/2027', '1 (Ganjil)',
    'Supervisi Manajerial Tata Kelola Laboratorium & Perpustakaan Madrasah',
    'Semester',
    'Memastikan sarana penunjang praktikum dan literasi terkelola sesuai standar akreditasi BAN-PDM.',
    'MAN 2 Kab. Gorontalo',
    'Oktober - November 2026',
    'SOP Laboratorium Komputer dan SLIMS perpustakaan beroperasi 100%.',
    'Aktif'
  );

  // 4. Rekomendasi & Tindak Lanjut Hasil Supervisi Pengawas
  const rekStmt = db.prepare(`
    INSERT INTO rekomendasi_tindak_lanjut (pengawas_id, madrasah_id, gtk_id, judul_rekomendasi, aspek, deskripsi, target_perbaikan, penanggung_jawab, tenggat_waktu, bukti_tindak_lanjut, status, catatan_pengawas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  rekStmt.run(
    pengawasId, 1, 5,
    'Penyusunan Rubrik Penilaian Portofolio Digital Informatika',
    'Akademik',
    'Guru disarankan melengkapi asesmen dengan instrumen rubrik penilaian analitik dan portofolio coding siswa.',
    'Tersedianya berkas rubrik asesmen formatif & sumatif dalam modul ajar Fase E.',
    'Herman Susanto Buhungo',
    '2026-11-10',
    'Rubrik_Asesmen_Informatika_FaseE.pdf',
    'Menunggu verifikasi',
    'Dokumen perbaikan telah diunggah guru, siap diperiksa pengawas pada kunjungan berikutnya.'
  );

  rekStmt.run(
    pengawasId, 1, 5,
    'Peremajaan Cadangan Daya UPS dan SOP Pemakaian Lab Komputer',
    'Manajerial',
    'Memastikan cadangan daya darurat (UPS) pada server laboratorium komputer dalam kondisi prima dan SOP inventarisasi tertempel jelas.',
    'Pemasangan 2 unit UPS baru dan papan display alur penggunaan laboratorium.',
    'Herman Susanto Buhungo (Kepala Lab)',
    '2026-11-15',
    'Laporan_Pengadaan_UPS_Lab.pdf',
    'Dalam proses',
    'Pengajuan DIPA madrasah telah disetujui Kepala Madrasah, sedang proses instalasi unit.'
  );

  rekStmt.run(
    pengawasId, 1, 8,
    'Digitalisasi Sistem Katalogisasi Perpustakaan Madrasah Berbasis SLIMS',
    'Manajerial',
    'Migrasi pencatatan buku dari buku induk manual ke sistem otomasi perpustakaan (SLIMS Akasia).',
    'Database 1.500 judul buku pelajaran terinput dalam OPAC lokal perpustakaan.',
    'Samsudin Mahmud, A.Ma (Kepala Perpustakaan)',
    '2026-11-30',
    '',
    'Belum dimulai',
    'Menunggu pelaksanaan workshop teknis pengelola perpustakaan dari Kanwil.'
  );

  rekStmt.run(
    pengawasId, 1, 3,
    'Penyempurnaan Latihan Percakapan Kelompok Kecil (Speaking Practice)',
    'Akademik',
    'Menambahkan durasi dialog interaktif siswa dalam modul ajar Bahasa Inggris kelas XII.',
    'Penerapan lembar tugas role-play berkelompok pada materi Job Interview.',
    'Dewi Kartika, S.Pd',
    '2026-10-20',
    'Modul_Ajar_Revisi_Speaking.docx',
    'Selesai',
    'Telah diverifikasi tuntas oleh pengawas pada tanggal 21 Oktober 2026.'
  );

  rekStmt.run(
    pengawasId, 4, null,
    'Pembaruan Kelengkapan Dokumen Kurikulum Operasional Madrasah (KOM)',
    'Tata Kelola',
    'Menyelaraskan struktur kurikulum muatan lokal dengan regulasi Kepdirjen Pendis terbaru.',
    'Dokumen KOM 2026/2027 disahkan oleh Kepala Kantor Kemenag Kabupaten Boalemo.',
    'Kepala Madrasah & Tim Pengembang Kurikulum',
    '2026-11-05',
    'Draft_KOM_2026.pdf',
    'Perlu perbaikan',
    'Perlu revisi pada bagian pengorganisasian pembelajaran intrakurikuler dan kokurikuler P5.'
  );

  // 5. Pencadangan Sistem (Backup Logs)
  const bkStmt = db.prepare(`
    INSERT INTO backup_logs (nama_file, ukuran_mb, tipe, status, hash_checksum, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);
  bkStmt.run('sim_gtk_backup_20261023_040000.db.gz', 3.4, 'Otomatis', 'Tersedia', 'sha256-8a7f0e9b1c2d3e4f', '-17 hours');
  bkStmt.run('sim_gtk_backup_20261022_040000.db.gz', 3.2, 'Otomatis', 'Tersedia', 'sha256-4b2c1d0e9f8a7e6d', '-1 day');
  bkStmt.run('sim_gtk_snapshot_manual_pre_update.db.gz', 3.1, 'Manual', 'Tersedia', 'sha256-1a2b3c4d5e6f7a8b', '-3 days');

  // 6. Pengumuman Resmi
  const pgmStmt = db.prepare(`
    INSERT INTO pengumuman (madrasah_id, judul, isi, target_role, penulis, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);
  pgmStmt.run(
    1,
    'Jadwal Supervisi Akademik & Observasi Kelas Semester Ganjil 2026/2027',
    'Diberitahukan kepada seluruh Bapak/Ibu Guru MAN 2 Kabupaten Gorontalo bahwa pelaksanaan supervisi observasi kelas bersama Tim Pengawas Pembina akan dimulai tanggal 24 Oktober s.d. 15 November 2026. Mohon menyiapkan modul ajar dan jurnal mengajar terkini.',
    'guru',
    'Drs. H. Abdul Wahab, M.Pd (Kepala Madrasah)',
    '-2 hours'
  );
  pgmStmt.run(
    1,
    'Pemberitahuan Rekonsiliasi Presensi & Kelengkapan Berkas Kepegawaian',
    'Bagi seluruh Guru dan Tenaga Kependidikan, mohon memeriksa rekap kehadiran fingerprint dan mengunggah SK berkala terbaru pada menu Profil sebelum tanggal 30 bulan berjalan.',
    'semua',
    'Siti Rahmawati, S.Kom (Admin Madrasah)',
    '-1 day'
  );

  console.log('Pengawas Binaan, Kepala Madrasah & Tendik roles data seeded successfully!');
}

export default db;

