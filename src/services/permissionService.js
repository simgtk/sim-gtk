import db from '../db/database.js';

// Definisi Struktur Menu Utama, Submenu/Fitur & Aksi Baku untuk 6 Peran SIM-GTK
export const DEFAULT_ROLE_MENUS = {
  superadmin: [
    {
      groupKey: 'NAV_UTAMA',
      groupLabel: 'Menu Utama',
      items: [
        { key: 'dashboard', label: 'Dashboard Platform', url: '/sim-gtk/superadmin/dashboard', icon: 'i-home', view: 1, edit: 1, download: 1, delete: 1 }
      ]
    },
    {
      groupKey: 'TATA_KELOLA',
      groupLabel: 'Tata Kelola Lembaga',
      items: [
        { key: 'lembaga', label: 'Manajemen Sekolah/Madrasah', url: '/sim-gtk/superadmin/lembaga', icon: 'i-school', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'pengawas_binaan', label: 'Wilayah & Pengawas Binaan', url: '/sim-gtk/superadmin/pengawas-binaan', icon: 'i-map-pin', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'master_supervisi', label: 'Master Template Supervisi Nasional', url: '/sim-gtk/superadmin/master-supervisi', icon: 'i-award', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'laporan', label: 'Laporan Platform', url: '/sim-gtk/superadmin/laporan', icon: 'i-print', view: 1, edit: 0, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'PENGGUNA_KEAMANAN',
      groupLabel: 'Pengguna & Keamanan',
      items: [
        { key: 'admin_lembaga', label: 'Manajemen Pengguna', url: '/sim-gtk/superadmin/admin-lembaga', icon: 'i-users', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'hak_akses', label: 'Hak Akses & Peran (RBAC)', url: '/sim-gtk/superadmin/hak-akses', icon: 'i-lock', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'monitoring_audit', label: 'Monitoring & Audit', url: '/sim-gtk/superadmin/monitoring-audit', icon: 'i-check-circle', view: 1, edit: 1, download: 1, delete: 1 }
      ]
    },
    {
      groupKey: 'SISTEM_LAYANAN',
      groupLabel: 'Sistem & Layanan',
      items: [
        { key: 'konfigurasi', label: 'Konfigurasi Sistem', url: '/sim-gtk/superadmin/konfigurasi', icon: 'i-settings', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'layanan', label: 'Pengelolaan Layanan', url: '/sim-gtk/superadmin/layanan', icon: 'i-bar-chart', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'backup', label: 'Pencadangan & Pemulihan', url: '/sim-gtk/superadmin/backup', icon: 'i-save', view: 1, edit: 1, download: 1, delete: 1 }
      ]
    }
  ],

  admin: [
    {
      groupKey: 'NAV_UTAMA',
      groupLabel: 'Menu Utama',
      items: [
        { key: 'dashboard', label: 'Dashboard Lembaga', url: '/sim-gtk/beranda', icon: 'i-home', view: 1, edit: 0, download: 1, delete: 0 },
        { key: 'madrasah_saya', label: 'Profil Lembaga', url: '/sim-gtk/madrasah-saya', icon: 'i-school', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'DATA_GTK',
      groupLabel: 'Data Kepegawaian GTK',
      items: [
        { key: 'manajemen_gtk', label: 'Data Pokok GTK', url: '/sim-gtk/manajemen/gtk', icon: 'i-users', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'dokumen_kepegawaian', label: 'Dokumen Kepegawaian', url: '/sim-gtk/portofolio/perubahan-data', icon: 'i-folder', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'akun_pengguna', label: 'Akun & Keanggotaan GTK', url: '/sim-gtk/manajemen/pengguna', icon: 'i-user', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'kompetensi_gtk', label: 'Kompetensi & Pelatihan PKB', url: '/sim-gtk/portofolio/golongan-mkg', icon: 'i-trending', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'OPERASIONAL',
      groupLabel: 'Operasional Madrasah',
      items: [
        { key: 'presensi_gtk', label: 'Kehadiran & Izin', url: '/sim-gtk/manajemen/presensi', icon: 'i-check-circle', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'jadwal_tugas', label: 'Jadwal & Pembagian Tugas', url: '/sim-gtk/manajemen/jadwal', icon: 'i-calendar', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'absensi_siswa', label: 'Absensi Siswa Harian', url: '/sim-gtk/pembelajaran/absensi', icon: 'i-user-check', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'jurnal_mengajar', label: 'Jurnal Mengajar Kelas', url: '/sim-gtk/pembelajaran/jurnal', icon: 'i-notebook', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'ai_perangkat', label: 'Generator AI Perangkat Ajar', url: '/sim-gtk/pembelajaran/ai', icon: 'i-sparkles', view: 1, edit: 1, download: 1, delete: 1 }
      ]
    },
    {
      groupKey: 'PENILAIAN',
      groupLabel: 'Penilaian & Supervisi',
      items: [
        { key: 'jadwal_supervisi', label: 'Jadwal Supervisi', url: '/sim-gtk/penilaian/jadwal', icon: 'i-calendar', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'perangkat_supervisi', label: 'Perangkat Pembelajaran', url: '/sim-gtk/penilaian/perangkat', icon: 'i-folder', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'supervisi_akademik', label: 'Supervisi Akademik', url: '/sim-gtk/penilaian/akademik', icon: 'i-check-square', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'supervisi_mengajar', label: 'Supervisi Mengajar', url: '/sim-gtk/penilaian/mengajar', icon: 'i-presentation', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'supervisi_manajerial', label: 'Supervisi Manajerial', url: '/sim-gtk/penilaian/manajerial', icon: 'i-clipboard', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'daftar_hadir_supervisi', label: 'Daftar Hadir Supervisi', url: '/sim-gtk/penilaian/daftar-hadir', icon: 'i-user-check', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'laporan_supervisi', label: 'Laporan & Cetak Hasil', url: '/sim-gtk/penilaian/laporan', icon: 'i-print', view: 1, edit: 0, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'LAYANAN',
      groupLabel: 'Layanan & Pengaturan',
      items: [
        { key: 'persetujuan', label: 'Layanan Administrasi', url: '/sim-gtk/manajemen/persetujuan', icon: 'i-check-square', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'pengumuman', label: 'Pengumuman Lembaga', url: '/sim-gtk/beranda', icon: 'i-bell', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'pengaturan', label: 'Pengaturan Lembaga', url: '/sim-gtk/pengaturan', icon: 'i-settings', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    }
  ],

  kamad: [
    {
      groupKey: 'NAV_UTAMA',
      groupLabel: 'Menu Utama',
      items: [
        { key: 'dashboard', label: 'Dashboard Kepala Madrasah', url: '/sim-gtk/kamad/dashboard', icon: 'i-home', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'DATA_GTK_DISIPLIN',
      groupLabel: 'Data GTK & Disiplin',
      items: [
        { key: 'gtk_profil', label: 'Data GTK & Profil Madrasah', url: '/sim-gtk/manajemen/gtk', icon: 'i-school', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'kehadiran_disiplin', label: 'Kehadiran & Disiplin GTK', url: '/sim-gtk/referensi/presensi', icon: 'i-check-circle', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'jadwal_beban', label: 'Jadwal & Beban Kerja', url: '/sim-gtk/pembelajaran/jadwal', icon: 'i-calendar', view: 1, edit: 0, download: 1, delete: 0 },
        { key: 'pengembangan_kompetensi', label: 'Pengembangan Kompetensi', url: '/sim-gtk/portofolio/golongan-mkg', icon: 'i-trending', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'SUPERVISI_MUTU',
      groupLabel: 'Supervisi & Mutu',
      items: [
        { key: 'supervisi_guru', label: 'Supervisi Guru', url: '/sim-gtk/penilaian/jadwal', icon: 'i-award', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'evaluasi_tendik', label: 'Evaluasi Tenaga Kependidikan', url: '/sim-gtk/penilaian/manajerial', icon: 'i-clipboard', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'pembinaan_tindak_lanjut', label: 'Pembinaan & Tindak Lanjut', url: '/sim-gtk/kamad/dashboard', icon: 'i-refresh', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'laporan_analitik', label: 'Laporan & Analitik Mutu', url: '/sim-gtk/penilaian/laporan', icon: 'i-print', view: 1, edit: 0, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'KEBIJAKAN_LAYANAN',
      groupLabel: 'Kebijakan & Layanan',
      items: [
        { key: 'persetujuan_izin', label: 'Persetujuan & Perizinan', url: '/sim-gtk/kamad/dashboard', icon: 'i-check-square', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'pengumuman_agenda', label: 'Pengumuman & Agenda Lembaga', url: '/sim-gtk/kamad/dashboard', icon: 'i-bell', view: 1, edit: 1, download: 1, delete: 1 }
      ]
    }
  ],

  pengawas: [
    {
      groupKey: 'NAV_UTAMA',
      groupLabel: 'Menu Utama',
      items: [
        { key: 'dashboard', label: 'Dashboard Pengawas', url: '/sim-gtk/pengawas/dashboard', icon: 'i-home', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'BINAAN_PROGRAM',
      groupLabel: 'Binaan & Program',
      items: [
        { key: 'sekolah_binaan', label: 'Sekolah / Madrasah Binaan', url: '/sim-gtk/pengawas/binaan', icon: 'i-school', view: 1, edit: 0, download: 1, delete: 0 },
        { key: 'peta_penugasan', label: 'Peta & Penugasan Binaan', url: '/sim-gtk/pengawas/binaan', icon: 'i-map-pin', view: 1, edit: 0, download: 1, delete: 0 },
        { key: 'program_pengawasan', label: 'Program Pengawasan Tahunan', url: '/sim-gtk/pengawas/dashboard', icon: 'i-book', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'agenda_notifikasi', label: 'Agenda & Notifikasi', url: '/sim-gtk/pengawas/dashboard', icon: 'i-bell', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'SUPERVISI_PEMBINAAN',
      groupLabel: 'Supervisi & Pembinaan',
      items: [
        { key: 'jadwal_supervisi', label: 'Jadwal Supervisi Binaan', url: '/sim-gtk/penilaian/jadwal', icon: 'i-calendar', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'supervisi_manajerial', label: 'Supervisi Manajerial Lembaga', url: '/sim-gtk/penilaian/manajerial', icon: 'i-clipboard', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'supervisi_akademik', label: 'Supervisi Akademik Guru', url: '/sim-gtk/penilaian/akademik', icon: 'i-presentation', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'supervisi_mengajar', label: 'Supervisi Observasi Mengajar', url: '/sim-gtk/penilaian/mengajar', icon: 'i-eye', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'instrumen_hasil', label: 'Instrumen & Hasil Supervisi', url: '/sim-gtk/penilaian/perangkat', icon: 'i-folder', view: 1, edit: 1, download: 1, delete: 1 }
      ]
    },
    {
      groupKey: 'EVALUASI_TINDAK_LANJUT',
      groupLabel: 'Evaluasi & Tindak Lanjut',
      items: [
        { key: 'rekomendasi_tindak_lanjut', label: 'Rekomendasi & Tindak Lanjut', url: '/sim-gtk/pengawas/rekomendasi', icon: 'i-check-square', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'laporan_pengawasan', label: 'Laporan Pengawasan Binaan', url: '/sim-gtk/penilaian/laporan', icon: 'i-print', view: 1, edit: 0, download: 1, delete: 0 },
        { key: 'portofolio_pembinaan', label: 'Portofolio & Riwayat Pembinaan', url: '/sim-gtk/pengawas/dashboard', icon: 'i-bookmark', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    }
  ],

  guru: [
    {
      groupKey: 'NAV_UTAMA',
      groupLabel: 'Menu Utama',
      items: [
        { key: 'dashboard', label: 'Dashboard Guru', url: '/sim-gtk/beranda', icon: 'i-home', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'PROFIL_PORTOFOLIO',
      groupLabel: 'Profil & Portofolio',
      items: [
        { key: 'profil_saya', label: 'Profil Saya', url: '/sim-gtk/portofolio/data-diri', icon: 'i-id-card', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'riwayat_golongan', label: 'Riwayat Golongan & Diklat', url: '/sim-gtk/portofolio/golongan-mkg', icon: 'i-trending', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'layanan_admin', label: 'Layanan Administrasi & Usulan', url: '/sim-gtk/portofolio/perubahan-data', icon: 'i-edit', view: 1, edit: 1, download: 1, delete: 1 }
      ]
    },
    {
      groupKey: 'PEMBELAJARAN_KELAS',
      groupLabel: 'Pembelajaran & Kelas',
      items: [
        { key: 'jadwal_mengajar', label: 'Jadwal & Tugas Mengajar', url: '/sim-gtk/pembelajaran/jadwal', icon: 'i-calendar', view: 1, edit: 0, download: 1, delete: 0 },
        { key: 'kehadiran_siswa', label: 'Kehadiran & Absensi Siswa', url: '/sim-gtk/pembelajaran/absensi', icon: 'i-user-check', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'jurnal_mengajar', label: 'Jurnal Mengajar & Refleksi', url: '/sim-gtk/pembelajaran/jurnal', icon: 'i-notebook', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'ai_perangkat', label: 'AI Generator Perangkat Ajar', url: '/sim-gtk/pembelajaran/ai', icon: 'i-sparkles', view: 1, edit: 1, download: 1, delete: 1 }
      ]
    },
    {
      groupKey: 'SUPERVISI_RAPOR',
      groupLabel: 'Supervisi & Rapor',
      items: [
        { key: 'perangkat_pembelajaran', label: 'Perangkat Pembelajaran', url: '/sim-gtk/penilaian/perangkat', icon: 'i-folder', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'hasil_supervisi', label: 'Hasil Supervisi Guru', url: '/sim-gtk/penilaian/akademik', icon: 'i-check-square', view: 1, edit: 0, download: 1, delete: 0 },
        { key: 'supervisi_tugas_tambahan', label: 'Supervisi Tugas Tambahan', url: '/sim-gtk/penilaian/manajerial', icon: 'i-clipboard', view: 1, edit: 0, download: 1, delete: 0 },
        { key: 'laporan_rapor', label: 'Laporan & Rapor Supervisi', url: '/sim-gtk/penilaian/laporan', icon: 'i-print', view: 1, edit: 0, download: 1, delete: 0 }
      ]
    }
  ],

  tendik: [
    {
      groupKey: 'NAV_UTAMA',
      groupLabel: 'Menu Utama',
      items: [
        { key: 'dashboard', label: 'Dashboard Saya', url: '/sim-gtk/tendik/dashboard', icon: 'i-home', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'DATA_DIRI_BERKAS',
      groupLabel: 'Data Diri & Berkas',
      items: [
        { key: 'profil_saya', label: 'Profil Saya', url: '/sim-gtk/portofolio/data-diri', icon: 'i-id-card', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'dokumen_kepegawaian', label: 'Dokumen Kepegawaian', url: '/sim-gtk/portofolio/perubahan-data', icon: 'i-folder', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'pengembangan_kompetensi', label: 'Pengembangan Kompetensi', url: '/sim-gtk/portofolio/golongan-mkg', icon: 'i-trending', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'layanan_admin', label: 'Layanan Administrasi Tendik', url: '/sim-gtk/portofolio/perubahan-data', icon: 'i-file-text', view: 1, edit: 1, download: 1, delete: 1 }
      ]
    },
    {
      groupKey: 'TUGAS_UNIT_KINERJA',
      groupLabel: 'Tugas Unit & Kinerja',
      items: [
        { key: 'kehadiran_izin', label: 'Kehadiran & Izin', url: '/sim-gtk/referensi/presensi', icon: 'i-check-circle', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'jadwal_tugas', label: 'Jadwal & Tugas Unit', url: '/sim-gtk/tendik/dashboard', icon: 'i-calendar', view: 1, edit: 1, download: 1, delete: 0 },
        { key: 'kinerja_evaluasi', label: 'Kinerja & Evaluasi Tendik', url: '/sim-gtk/penilaian/manajerial', icon: 'i-award', view: 1, edit: 0, download: 1, delete: 0 },
        { key: 'pengumuman_resmi', label: 'Pengumuman Resmi Satker', url: '/sim-gtk/tendik/dashboard', icon: 'i-bell', view: 1, edit: 0, download: 1, delete: 0 },
        { key: 'riwayat_laporan', label: 'Riwayat & Laporan Tugas', url: '/sim-gtk/tendik/dashboard', icon: 'i-print', view: 1, edit: 0, download: 1, delete: 0 }
      ]
    }
  ],

  guru_penilai: [
    {
      groupKey: 'NAV_UTAMA',
      groupLabel: 'Menu Utama',
      items: [
        { key: 'dashboard', label: 'Dashboard Guru Penilai', url: '/sim-gtk/guru-penilai/dashboard', icon: 'i-home', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'SUPERVISI_MANDAT',
      groupLabel: 'Supervisi Pembelajaran (Mandat Kamad)',
      items: [
        { key: 'jadwal_observasi', label: 'Jadwal Observasi Guru', url: '/sim-gtk/penilaian/jadwal', icon: 'i-calendar', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'observasi_mengajar', label: 'Observasi Praktik Mengajar', url: '/sim-gtk/penilaian/mengajar', icon: 'i-presentation', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'telaah_modul', label: 'Telaah Modul Ajar / RPP', url: '/sim-gtk/penilaian/perangkat', icon: 'i-folder', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'supervisi_akademik_form', label: 'Input Skor 4 Menu Terpadu', url: '/sim-gtk/penilaian/akademik', icon: 'i-check-square', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'presensi_supervisi', label: 'Daftar Hadir Supervisi', url: '/sim-gtk/penilaian/daftar-hadir', icon: 'i-user-check', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'laporan_hasil', label: 'Berita Acara & Cetak Hasil', url: '/sim-gtk/penilaian/laporan', icon: 'i-print', view: 1, edit: 0, download: 1, delete: 0 }
      ]
    },
    {
      groupKey: 'PEMBELAJARAN_SAYA',
      groupLabel: 'Tugas Mengajar Pribadi',
      items: [
        { key: 'jurnal_guru', label: 'Jurnal Mengajar Saya', url: '/sim-gtk/pembelajaran/jurnal', icon: 'i-notebook', view: 1, edit: 1, download: 1, delete: 1 },
        { key: 'profil_diri', label: 'Profil & Tugas Tambahan', url: '/sim-gtk/portofolio/data-diri', icon: 'i-user', view: 1, edit: 1, download: 1, delete: 0 }
      ]
    }
  ]
};

// Inisialisasi tabel role_permissions
export function initPermissionsTable() {
  db.exec(`
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
  `);

  seedDefaultPermissionsIfEmpty();
}

// Seed default data jika tabel masih kosong
export function seedDefaultPermissionsIfEmpty() {
  const count = db.prepare('SELECT count(*) as c FROM role_permissions').get().c;
  if (count > 0) return;

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO role_permissions (
      role, menu_group_key, menu_group_label, menu_group_active,
      submenu_key, submenu_label, submenu_url, submenu_icon, submenu_active,
      can_view, can_edit, can_download, can_delete, order_index
    ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
  `);

  let order = 0;
  for (const [role, groups] of Object.entries(DEFAULT_ROLE_MENUS)) {
    for (const group of groups) {
      for (const item of group.items) {
        order++;
        insertStmt.run(
          role,
          group.groupKey,
          group.groupLabel,
          item.key,
          item.label,
          item.url,
          item.icon || 'i-grid',
          item.view !== undefined ? item.view : 1,
          item.edit !== undefined ? item.edit : 1,
          item.download !== undefined ? item.download : 1,
          item.delete !== undefined ? item.delete : 1,
          order
        );
      }
    }
  }
}

// Ambil struktur hierarkis permissions untuk suatu peran
export function getRolePermissionsHierarchy(role) {
  initPermissionsTable();

  const rows = db.prepare(`
    SELECT * FROM role_permissions 
    WHERE role = ? 
    ORDER BY order_index ASC, id ASC
  `).all(role);

  // Jika belum ada di db untuk role ini, seed ulang role tersebut
  if (rows.length === 0 && DEFAULT_ROLE_MENUS[role]) {
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO role_permissions (
        role, menu_group_key, menu_group_label, menu_group_active,
        submenu_key, submenu_label, submenu_url, submenu_icon, submenu_active,
        can_view, can_edit, can_download, can_delete, order_index
      ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `);
    let ord = 0;
    for (const group of DEFAULT_ROLE_MENUS[role]) {
      for (const item of group.items) {
        ord++;
        insertStmt.run(
          role, group.groupKey, group.groupLabel, item.key, item.label, item.url, item.icon || 'i-grid',
          item.view !== undefined ? item.view : 1,
          item.edit !== undefined ? item.edit : 1,
          item.download !== undefined ? item.download : 1,
          item.delete !== undefined ? item.delete : 1,
          ord
        );
      }
    }
    return getRolePermissionsHierarchy(role);
  }

  // Kelompokkan per menu_group_key
  const groupsMap = {};
  for (const r of rows) {
    if (!groupsMap[r.menu_group_key]) {
      groupsMap[r.menu_group_key] = {
        key: r.menu_group_key,
        label: r.menu_group_label,
        active: r.menu_group_active === 1,
        items: []
      };
    }
    groupsMap[r.menu_group_key].items.push({
      id: r.id,
      key: r.submenu_key,
      label: r.submenu_label,
      url: r.submenu_url,
      icon: r.submenu_icon,
      active: r.submenu_active === 1,
      canView: r.can_view === 1,
      canEdit: r.can_edit === 1,
      canDownload: r.can_download === 1,
      canDelete: r.can_delete === 1
    });
  }

  return Object.values(groupsMap);
}

// Ambil lookup map izin peran untuk evaluasi cepat di sidebar & view
export function getRolePermissionsMap(role) {
  initPermissionsTable();

  const rows = db.prepare(`
    SELECT menu_group_key, menu_group_active, submenu_key, submenu_active, can_view, can_edit, can_download, can_delete 
    FROM role_permissions 
    WHERE role = ?
  `).all(role);

  const map = {
    _groups: {}
  };

  for (const r of rows) {
    map._groups[r.menu_group_key] = r.menu_group_active === 1;
    map[r.submenu_key] = {
      groupActive: r.menu_group_active === 1,
      active: r.submenu_active === 1,
      canView: r.can_view === 1,
      canEdit: r.can_edit === 1,
      canDownload: r.can_download === 1,
      canDelete: r.can_delete === 1,
      visible: r.menu_group_active === 1 && r.submenu_active === 1 && r.can_view === 1
    };
  }

  return map;
}

// Toggle status ON/OFF level Menu Utama (Grup Menu)
export function toggleMenuGroup(role, menuGroupKey, isActive) {
  initPermissionsTable();
  const val = isActive ? 1 : 0;
  db.prepare(`
    UPDATE role_permissions 
    SET menu_group_active = ?, updated_at = datetime('now')
    WHERE role = ? AND menu_group_key = ?
  `).run(val, role, menuGroupKey);
}

// Toggle status ON/OFF spesifik Submenu atau Aksi
export function toggleSubmenuField(role, submenuKey, field, value) {
  initPermissionsTable();
  const fieldMap = {
    'active': 'submenu_active',
    'submenu_active': 'submenu_active',
    'can_view': 'can_view',
    'can_edit': 'can_edit',
    'can_download': 'can_download',
    'can_delete': 'can_delete'
  };
  const targetCol = fieldMap[field];
  if (!targetCol) {
    throw new Error('Field tidak diizinkan: ' + field);
  }
  const val = value ? 1 : 0;
  db.prepare(`
    UPDATE role_permissions 
    SET ${targetCol} = ?, updated_at = datetime('now')
    WHERE role = ? AND submenu_key = ?
  `).run(val, role, submenuKey);
}

// Reset hak akses suatu peran ke konfigurasi standar Kemenag
export function resetRoleToDefault(role) {
  initPermissionsTable();
  if (!DEFAULT_ROLE_MENUS[role]) return;

  db.prepare('DELETE FROM role_permissions WHERE role = ?').run(role);
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO role_permissions (
      role, menu_group_key, menu_group_label, menu_group_active,
      submenu_key, submenu_label, submenu_url, submenu_icon, submenu_active,
      can_view, can_edit, can_download, can_delete, order_index
    ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
  `);

  let ord = 0;
  for (const group of DEFAULT_ROLE_MENUS[role]) {
    for (const item of group.items) {
      ord++;
      insertStmt.run(
        role, group.groupKey, group.groupLabel, item.key, item.label, item.url, item.icon || 'i-grid',
        item.view !== undefined ? item.view : 1,
        item.edit !== undefined ? item.edit : 1,
        item.download !== undefined ? item.download : 1,
        item.delete !== undefined ? item.delete : 1,
        ord
      );
    }
  }
}
