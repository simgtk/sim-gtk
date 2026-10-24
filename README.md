# SIM-GTK — Rumah Digital Guru dan Tenaga Kependidikan Madrasah

Aplikasi manajemen dan administrasi terpadu untuk Guru, Tenaga Kependidikan, Admin Madrasah, dan Pengawas di lingkungan Kementerian Agama Republik Indonesia.

Aplikasi ini direkonstruksi dan dikembangkan secara lokal dari [https://hermanbuhungo.vibecoder.co.id/sim-gtk/](https://hermanbuhungo.vibecoder.co.id/sim-gtk/) dengan penambahan arsitektur database modern, generator perangkat ajar berbasis AI, serta dukungan ekspor dokumen lengkap (Word, Excel, PowerPoint, dan PDF).

---

## 🚀 Fitur Unggulan

### 1. 🤖 AI Perangkat Ajar (Kurikulum Merdeka)
- **Generator Dokumen Otomatis**:
  - Modul Ajar (Identitas, CP/TP, Pertanyaan Pemantik, Kegiatan Berdiferensiasi, Asesmen & Rubrik)
  - ATP (Alur Tujuan Pembelajaran)
  - Prota (Program Tahunan) & Prosem (Program Semester)
  - LKPD (Lembar Kerja Peserta Didik) & LKM (Lembar Kerja Murid)
  - Paket Soal Asesmen (Kisi-kisi, Pilihan Ganda, Uraian, Kunci Jawaban & Rubrik Penskoran)
  - KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)
- **Dual Mode (Online & Offline)**:
  - **Online**: Kompatibel dengan API OpenAI / DeepSeek / Groq / Gemini (cukup isi Base URL & API Key pada menu Pengaturan).
  - **Smart Offline**: 100% dapat berjalan tanpa internet maupun tanpa API key dengan template Kurikulum Merdeka yang kaya dan terstruktur rapi.
- **Ekspor Dokumen**:
  - 📄 **Word (.docx)**
  - 📊 **Excel (.xlsx)**
  - 📽️ **PowerPoint (.pptx)**
  - 🖨️ **Cetak Langsung / PDF Siap Cetak**

### 2. 📝 Modul Penilaian & Supervisi GTK (Fitur Baru)
- **Jadwal Supervisi**: Penjadwalan observasi akademik dan manajerial guru dengan status pelaksanaan
- **Perangkat Pembelajaran**: Telaah dan verifikasi berkas Modul Ajar, ATP, Prota, Prosem, LKPD, dan Asesmen Kurikulum Merdeka
- **Supervisi Akademik**: Penilaian terpadu Administrasi Perencanaan Pembelajaran (40%) dan Praktik Mengajar (60%)
- **Supervisi Mengajar**: Observasi kelas langsung (kegiatan awal/apersepsi, kegiatan inti berdiferensiasi, dan penutup)
- **Supervisi Manajerial**: Evaluasi kinerja manajerial bagi guru bertugas tambahan (Kepala Laboratorium, Kepala Perpustakaan, Wakamad, Pembina OSIS/Ekstra)
- **Daftar Hadir Supervisi**: Presensi kehadiran guru dan supervisor saat supervisi beserta validasi tanda tangan digital
- **Laporan dan Cetak Hasil**: Lembar Berita Acara Supervisi resmi ber-KOP surat madrasah, rekapitulasi nilai, dan rekomendasi tindak lanjut siap cetak / PDF

### 3. 👥 Portofolio GTK
- Portofolio Lengkap GTK (Data diri, NUPTK, NIP, NIK, Riwayat Pendidikan, Mapel Utama)
- Pengajuan Perubahan Data Diri dengan alur persetujuan Admin Madrasah
- Update Golongan & Masa Kerja Golongan (MKG)

### 4. 📚 Pembelajaran & Absensi Siswa
- Absensi Siswa interaktif per jadwal mengajar (Hadir, Sakit, Izin, Alpa) dengan fitur tombol satu klik *Tandai Semua Hadir*
- Jurnal Mengajar Harian guru terstruktur siap menjadi bukti fisik supervisi
- Jadwal Mingguan Pelajaran

### 5. 🛡️ Platform Super Admin (Fitur Baru Tingkat Wilayah / Pusat)
- **Dashboard Platform**: Statistik agregat lembaga nasional, akun GTK & admin aktif, pemanfaatan storage dokumen & kuota AI, serta notifikasi teknis real-time
- **Manajemen Lembaga**: Registrasi satuan madrasah baru, verifikasi berkas pendaftaran lembaga, aktivasi, penangguhan (suspensi akses), dan pembaruan identitas profil madrasah
- **Manajemen Admin Lembaga**: Pembuatan akun admin lembaga, pemulihan akses (reset kata sandi instan), dan pengaturan status akses (aktif/nonaktif/kunci akses)
- **Konfigurasi Global**: Parameter platform terpusat, aktivasi/deaktivasi modul aplikasi (feature flags), master kategori umum (jenjang & mapel), dan kebijakan keamanan sistem
- **Monitoring & Audit**: Audit trail aktivitas pengguna, pelacakan & resolusi insiden keamanan akses, riwayat kegagalan proses/error log, dan diagnostik kesehatan runtime server
- **Pengelolaan Layanan**: Pengaturan alokasi kapasitas lembaga (kuota GTK, storage, token AI), penetapan status mode operasional platform (normal/maintenance/read-only), serta matriks paket tingkat layanan

### 6. 🏫 Portal Satuan Madrasah & Multi-Role
- **Admin Madrasah**: Pengelolaan data GTK, verifikasi pengajuan, penjadwalan supervisi, kelas & siswa, jadwal, presensi GTK, dan cetak laporan
- **Guru**: Portofolio, penyusunan perangkat ajar AI, absensi siswa, jurnal mengajar, presensi supervisi, dan cetak lembar hasil penilaian
- **Pengawas**: Supervisi akademik & manajerial madrasah binaan, penilaian instrumen, validasi tanda tangan daftar hadir, dan cetak laporan pendampingan
- **Super Admin**: Akses penuh pusat kendali platform multi-madrasah

---

## 🛠️ Arsitektur & Teknologi

- **Backend**: Node.js (ES Module), Express.js
- **Database**: SQLite dengan `better-sqlite3` (cepat, tanpa setup server database terpisah, file tersimpan di `data/sim_gtk.db`)
- **Template Engine**: EJS (Server-Side Rendering)
- **Styling**: Vanilla CSS responsif dengan palet warna resmi Kemenag/EmisGTK, micro-animations, dan tata letak padat informatif
- **Generator Dokumen**: `docx`, `xlsx`, `pptxgenjs`

---

## 💻 Cara Menjalankan Aplikasi Secara Lokal

### 1. Prasyarat
- Node.js versi 18 ke atas (disarankan versi LTS atau Node v20/v24).

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server
Mode pengembangan (auto-reload):
```bash
npm run dev
```
Atau mode standar:
```bash
npm start
```

Aplikasi akan berjalan di:
👉 **[http://localhost:3000/sim-gtk/](http://localhost:3000/sim-gtk/)**

---

## 🔑 Akun Demo untuk Pengujian

| Peran | Email / Username | Kata Sandi |
| :--- | :--- | :--- |
| **Admin Madrasah** | `admin@man2gorontalo.sch.id` | `admin123` |
| **Guru (Herman)** | `herman@man2gorontalo.sch.id` | `guru123` |
| **Pengawas Madrasah** | `pengawas@kemenag.go.id` | `pengawas123` |
| **Super Admin** | `superadmin@sim-gtk.id` | `admin123` |

---

## 📁 Struktur Folder

```text
d:\SIM-GTK/
├── data/
│   └── sim_gtk.db             # Database SQLite lokal
├── public/
│   ├── css/
│   │   └── style.css          # Styling & tema SIM-GTK
│   └── js/
│       └── app.js             # Skrip interaksi UI
├── src/
│   ├── db/
│   │   └── database.js        # Skema tabel & seed data awal
│   ├── middleware/
│   │   └── auth.js            # Sesi & keamanan CSRF
│   ├── routes/
│   │   └── index.js           # Pengendali rute & alur data
│   └── services/
│       ├── aiService.js       # Generator perangkat ajar (Online/Offline)
│       └── exportService.js   # Generator Word (.docx), Excel (.xlsx), PPTX (.pptx)
├── views/
│   ├── partials/              # Header, footer, topbar, sidebar, icons
│   ├── auth/                  # Halaman Login
│   ├── public/                # Halaman Depan & Cek Sertifikat
│   ├── beranda/               # Dashboard, Peta Situs, Madrasah Saya, Panduan
│   ├── portofolio/            # Data Diri, Golongan, Perubahan Data
│   ├── administrasi/          # NUPTK, Ijazah, Sertifikasi, NRG, Satminkal
│   ├── diklat/                # PKB, Pelatihan Nasional, AKG, AKGTK
│   ├── beban-kerja/           # Tugas Tambahan, Jadwal Mengajar, JTM
│   ├── tunjangan/             # SKMT, SKBK, Dispensasi JTM
│   ├── referensi/             # Presensi, Libur, Pengawas
│   ├── pembelajaran/          # Absensi, Jurnal, Jadwal, AI Perangkat Ajar
│   ├── manajemen/             # GTK, Persetujuan, Kelas, Mapel, Supervisi, Akun
│   └── pengaturan/            # Profil Akun, Sandi, Konfigurasi Madrasah & AI
├── .env                       # Konfigurasi Port & Secret
├── package.json
├── server.js                  # Entrypoint server aplikasi
└── README.md
```

---

&copy; 2026 SIM-GTK &middot; Rumah Digital Guru dan Tenaga Kependidikan Madrasah
