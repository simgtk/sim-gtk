import db from '../db/database.js';

// Definisi 4 Menu & 20 Butir Penilaian Supervisi Akademik Baku Kemenag RI
export const INSTRUMEN_SUPERVISI = {
  administrasi: {
    key: 'administrasi',
    title: '1. Administrasi Pembelajaran',
    desc: 'Kelengkapan dokumen perencanaan tahunan, semesteran, alokasi waktu, dan presensi',
    items: [
      { id: 'A1', label: 'Kalender Pendidikan Madrasah & Analisis Alokasi Waktu Efektif', weight: 1 },
      { id: 'A2', label: 'Program Tahunan (Prota) dan Program Semester (Promes) Lengkap', weight: 1 },
      { id: 'A3', label: 'Dokumen Alur Tujuan Pembelajaran (ATP) / Silabus Terstruktur', weight: 1 },
      { id: 'A4', label: 'Buku Presensi / Daftar Hadir Siswa & Agenda Harian Mengajar', weight: 1 },
      { id: 'A5', label: 'Buku Catatan Karakter, Bimbingan & Perkembangan Siswa', weight: 1 }
    ]
  },
  modul_ajar: {
    key: 'modul_ajar',
    title: '2. Perencanaan Modul Ajar (RPP)',
    desc: 'Desain pembelajaran, tujuan pembelajaran (TP), diferensiasi, dan integrasi P5-PPRA',
    items: [
      { id: 'B1', label: 'Kesesuaian Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP)', weight: 1 },
      { id: 'B2', label: 'Integrasi Nilai Profil Pelajar Pancasila & Rahmatan Lil Alamin (P5-PPRA)', weight: 1 },
      { id: 'B3', label: 'Rancangan Model Pembelajaran Aktif, Kontekstual & Berdiferensiasi', weight: 1 },
      { id: 'B4', label: 'Pemanfaatan Media Pembelajaran, Sumber Belajar & Teknologi Digital', weight: 1 },
      { id: 'B5', label: 'Rencana Instrumen Asesmen Formatif (Awal/Proses) dan Asesmen Sumatif', weight: 1 }
    ]
  },
  pengamatan: {
    key: 'pengamatan',
    title: '3. Pengamatan Pembelajaran (Observasi Kelas)',
    desc: 'Pelaksanaan apersepsi, penguasaan materi, interaksi kelas, dan refleksi akhir',
    items: [
      { id: 'C1', label: 'Keterampilan Membuka Pelajaran, Pengkondisian Kelas, dan Apersepsi', weight: 1 },
      { id: 'C2', label: 'Penguasaan Materi Pembelajaran & Penyampaian yang Jelas dan Kontekstual', weight: 1 },
      { id: 'C3', label: 'Penerapan Pendekatan Diferensiasi & Pelibatan Aktif Partisipasi Siswa', weight: 1 },
      { id: 'C4', label: 'Pengelolaan Waktu, Penggunaan Media/Laboratorium & Suasana Kondusif', weight: 1 },
      { id: 'C5', label: 'Keterampilan Menutup Pembelajaran, Rangkuman & Refleksi Bersama Siswa', weight: 1 }
    ]
  },
  penilaian: {
    key: 'penilaian',
    title: '4. Penilaian Pembelajaran (Asesmen)',
    desc: 'Instrumen asesmen autentik, rubrik penilaian, analisis hasil, dan program tindak lanjut',
    items: [
      { id: 'D1', label: 'Kesesuaian Teknik & Instrumen Asesmen dengan Indikator Ketercapaian TP', weight: 1 },
      { id: 'D2', label: 'Pelaksanaan Asesmen Autentik (Kinerja, Portofolio, Tes Tertulis/Proyek)', weight: 1 },
      { id: 'D3', label: 'Ketersediaan Rubrik / Pedoman Penskoran yang Terukur dan Obyektif', weight: 1 },
      { id: 'D4', label: 'Analisis Hasil Evaluasi, Daya Serap Siswa & Buku Daftar Nilai', weight: 1 },
      { id: 'D5', label: 'Perencanaan dan Pelaksanaan Program Remedial serta Pengayaan', weight: 1 }
    ]
  }
};

// Ambil instrumen fleksibel dari database (dengan fallback ke INSTRUMEN_SUPERVISI)
export function getInstrumenSupervisi(madrasahId = 1) {
  try {
    const rows = db.prepare(`
      SELECT * FROM supervisi_instrumen 
      WHERE (madrasah_id = ? OR madrasah_id IS NULL) AND status_aktif = 1
      ORDER BY urutan ASC, id ASC
    `).all(madrasahId);

    if (rows && rows.length > 0) {
      const instrumen = {
        administrasi: { key: 'administrasi', title: '1. Administrasi Pembelajaran', desc: 'Kelengkapan dokumen perencanaan tahunan, semesteran, alokasi waktu, dan presensi', items: [] },
        modul_ajar: { key: 'modul_ajar', title: '2. Perencanaan Modul Ajar (RPP)', desc: 'Desain pembelajaran, tujuan pembelajaran (TP), diferensiasi, dan integrasi P5-PPRA', items: [] },
        pengamatan: { key: 'pengamatan', title: '3. Pengamatan Pembelajaran (Observasi Kelas)', desc: 'Pelaksanaan apersepsi, penguasaan materi, interaksi kelas, dan refleksi akhir', items: [] },
        penilaian: { key: 'penilaian', title: '4. Penilaian Pembelajaran (Asesmen)', desc: 'Instrumen asesmen autentik, rubrik penilaian, analisis hasil, dan program tindak lanjut', items: [] }
      };

      for (const r of rows) {
        if (instrumen[r.domain]) {
          instrumen[r.domain].items.push({
            id: r.kode,
            db_id: r.id,
            label: r.label,
            weight: r.bobot || 1,
            indikator_1: r.indikator_1,
            indikator_2: r.indikator_2,
            indikator_3: r.indikator_3,
            indikator_4: r.indikator_4,
            urutan: r.urutan,
            madrasah_id: r.madrasah_id
          });
        }
      }
      return instrumen;
    }
  } catch (e) {
    console.error('Error fetching dynamic instrumen:', e.message);
  }
  return INSTRUMEN_SUPERVISI;
}

// Hitung skor per menu, skor total (0-100), dan predikat A/B/C/D
export function hitungNilaiDanPredikat(butirScores, madrasahId = 1) {
  const activeInstrumen = getInstrumenSupervisi(madrasahId);
  const categories = ['administrasi', 'modul_ajar', 'pengamatan', 'penilaian'];
  const result = {
    skor_administrasi: 0,
    skor_modul_ajar: 0,
    skor_mengajar: 0, // observasi pengamatan
    skor_penilaian_asesmen: 0,
    skor_total: 0,
    predikat: 'Cukup',
    grade: 'C',
    detail_per_menu: {}
  };

  let totalAllEarned = 0;
  let totalAllMax = 0;

  for (const cat of categories) {
    const items = (activeInstrumen[cat] && activeInstrumen[cat].items) ? activeInstrumen[cat].items : [];
    let catEarned = 0;
    const catMax = Math.max(items.length * 4, 1);

    for (const it of items) {
      const score = parseInt(butirScores[it.id]) || 3; // default 3 jika belum diisi
      catEarned += Math.max(1, Math.min(4, score));
    }

    const catPercent = Math.round((catEarned / catMax) * 100);
    result.detail_per_menu[cat] = {
      earned: catEarned,
      max: catMax,
      percent: catPercent
    };

    if (cat === 'administrasi') result.skor_administrasi = catPercent;
    if (cat === 'modul_ajar') result.skor_modul_ajar = catPercent;
    if (cat === 'pengamatan') result.skor_mengajar = catPercent;
    if (cat === 'penilaian') result.skor_penilaian_asesmen = catPercent;

    totalAllEarned += catEarned;
    totalAllMax += catMax;
  }

  // Skor komprehensif 4 menu (skala 0 - 100)
  result.skor_total = Math.round((totalAllEarned / Math.max(totalAllMax, 1)) * 100);

  // Predikat otomatis berdasarkan ambang madrasah
  if (result.skor_total >= 91) {
    result.predikat = 'Amat Baik';
    result.grade = 'A';
  } else if (result.skor_total >= 81) {
    result.predikat = 'Baik';
    result.grade = 'B';
  } else if (result.skor_total >= 71) {
    result.predikat = 'Cukup';
    result.grade = 'C';
  } else {
    result.predikat = 'Kurang';
    result.grade = 'D';
  }

  return result;
}

// Inisialisasi kolom baru pada tabel supervisi_akademik jika belum ada
export function ensureSupervisiColumns() {
  try {
    const cols = db.prepare('PRAGMA table_info(supervisi_akademik)').all().map(c => c.name);
    if (!cols.includes('skor_modul_ajar')) {
      db.prepare('ALTER TABLE supervisi_akademik ADD COLUMN skor_modul_ajar INTEGER DEFAULT 88').run();
    }
    if (!cols.includes('skor_penilaian_asesmen')) {
      db.prepare('ALTER TABLE supervisi_akademik ADD COLUMN skor_penilaian_asesmen INTEGER DEFAULT 85').run();
    }
    if (!cols.includes('butir_scores_json')) {
      db.prepare('ALTER TABLE supervisi_akademik ADD COLUMN butir_scores_json TEXT').run();
    }
    if (!cols.includes('foto_pengamatan_1')) {
      db.prepare('ALTER TABLE supervisi_akademik ADD COLUMN foto_pengamatan_1 TEXT').run();
    }
    if (!cols.includes('foto_pengamatan_2')) {
      db.prepare('ALTER TABLE supervisi_akademik ADD COLUMN foto_pengamatan_2 TEXT').run();
    }
  } catch (err) {
    console.error('Error ensuring supervisi columns:', err.message);
  }
}

// Ambil statistik dan rekap matriks untuk laporan
export function getSupervisiRekapMatriks(madrasahId) {
  ensureSupervisiColumns();

  const allGtk = db.prepare(`
    SELECT id, nama, nip, nuptk, jabatan, mapel_utama, jenis_kelamin, status_kepegawaian
    FROM gtk
    WHERE madrasah_id = ? AND jabatan LIKE '%Guru%'
    ORDER BY nama ASC
  `).all(madrasahId);

  const supervisiRecords = db.prepare(`
    SELECT sa.*, g.nama as gtk_nama, g.nip as gtk_nip, g.nuptk as gtk_nuptk, g.mapel_utama
    FROM supervisi_akademik sa
    JOIN gtk g ON sa.gtk_id = g.id
    WHERE sa.madrasah_id = ?
    ORDER BY sa.skor_total DESC, sa.tanggal DESC
  `).all(madrasahId);

  const supervisedGtkIds = new Set(supervisiRecords.map(s => s.gtk_id));
  const belumDisupervisi = allGtk.filter(g => !supervisedGtkIds.has(g.id));

  // Peringkat Guru berdasarkan Nilai Akhir
  const peringkatGuru = supervisiRecords.map((s, idx) => ({
    rank: idx + 1,
    ...s
  }));

  // Hitung rata-rata per 4 domain
  let sumAdm = 0, sumMod = 0, sumObs = 0, sumPen = 0, sumTot = 0;
  for (const s of supervisiRecords) {
    sumAdm += (s.skor_administrasi || 85);
    sumMod += (s.skor_modul_ajar || 85);
    sumObs += (s.skor_mengajar || 85);
    sumPen += (s.skor_penilaian_asesmen || 85);
    sumTot += (s.skor_total || 85);
  }
  const count = supervisiRecords.length || 1;

  const rataRata = {
    administrasi: Math.round(sumAdm / count),
    modul_ajar: Math.round(sumMod / count),
    pengamatan: Math.round(sumObs / count),
    penilaian: Math.round(sumPen / count),
    total: Math.round(sumTot / count)
  };

  return {
    allGtkCount: allGtk.length,
    supervisedCount: supervisiRecords.length,
    belumSupervisiCount: belumDisupervisi.length,
    persentaseSelesai: allGtk.length ? Math.round((supervisiRecords.length / allGtk.length) * 100) : 100,
    supervisiRecords,
    peringkatGuru,
    belumDisupervisi,
    rataRata
  };
}

// Impor Data Guru Massal dari CSV/Text
export function importGtkMassal(madrasahId, csvContent) {
  const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let importedCount = 0;

  const insertGtkStmt = db.prepare(`
    INSERT INTO gtk (
      madrasah_id, nama, nip, nuptk, jenis_kelamin, status_kepegawaian, jabatan, mapel_utama, email, no_hp, golongan, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'III/a', datetime('now'))
  `);

  const insertUserStmt = db.prepare(`
    INSERT OR IGNORE INTO users (
      madrasah_id, username, password_hash, nama, email, role, created_at
    ) VALUES (?, ?, 'argon2_dummy_hash_for_login', ?, ?, 'guru', datetime('now'))
  `);

  // Lewati baris header jika ada
  let startIdx = 0;
  if (lines[0].toLowerCase().includes('nama') || lines[0].toLowerCase().includes('nip')) {
    startIdx = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length >= 1 && cols[0]) {
      const nama = cols[0];
      const nip = cols[1] || '-';
      const nuptk = cols[2] || '-';
      const mapel = cols[3] || 'Mata Pelajaran Umum';
      const jk = (cols[4] && cols[4].toUpperCase().startsWith('P')) ? 'P' : 'L';
      const status = cols[5] || 'Non-PNS';
      const email = cols[6] || `${nama.toLowerCase().replace(/[^a-z0-9]/g, '')}@guru.madrasah.id`;
      const noHp = cols[7] || '081234567890';
      const username = cols[8] || nama.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);

      const info = insertGtkStmt.run(madrasahId, nama, nip, nuptk, jk, status, 'Guru Mapel', mapel, email, noHp);
      insertUserStmt.run(madrasahId, username, nama, email);
      importedCount++;
    }
  }

  return importedCount;
}

// Simpan / update butir instrumen supervisi
export function saveInstrumenButir(data) {
  const mId = data.madrasah_id === null || data.madrasah_id === 'null' ? null : (data.madrasah_id !== undefined ? data.madrasah_id : 1);
  if (data.id) {
    const stmt = db.prepare(`
      UPDATE supervisi_instrumen 
      SET domain = ?, kode = ?, label = ?, indikator_1 = ?, indikator_2 = ?, indikator_3 = ?, indikator_4 = ?, bobot = ?
      WHERE id = ?
    `);
    stmt.run(data.domain, data.kode, data.label, data.indikator_1, data.indikator_2, data.indikator_3, data.indikator_4, data.bobot || 1, data.id);
    return data.id;
  } else {
    const maxUrutan = db.prepare('SELECT COALESCE(MAX(urutan), 0) as max_u FROM supervisi_instrumen WHERE domain = ? AND (madrasah_id = ? OR (madrasah_id IS NULL AND ? IS NULL))').get(data.domain, mId, mId);
    const nextUrutan = (maxUrutan ? maxUrutan.max_u : 0) + 1;
    const stmt = db.prepare(`
      INSERT INTO supervisi_instrumen (madrasah_id, domain, kode, label, indikator_1, indikator_2, indikator_3, indikator_4, bobot, urutan, status_aktif, created_by_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const res = stmt.run(mId, data.domain, data.kode, data.label, data.indikator_1, data.indikator_2, data.indikator_3, data.indikator_4, data.bobot || 1, nextUrutan, data.created_by_role || 'kamad');
    return res.lastInsertRowid;
  }
}

// Ambil Master Template Nasional Kemenag (madrasah_id IS NULL)
export function getMasterInstrumenNasional() {
  try {
    const rows = db.prepare(`
      SELECT * FROM supervisi_instrumen 
      WHERE madrasah_id IS NULL AND status_aktif = 1
      ORDER BY urutan ASC, id ASC
    `).all();

    const instrumen = {
      administrasi: { key: 'administrasi', title: '1. Administrasi Pembelajaran', desc: 'Standar Nasional: Kelengkapan dokumen perencanaan tahunan, alokasi waktu & presensi', items: [] },
      modul_ajar: { key: 'modul_ajar', title: '2. Perencanaan Modul Ajar (RPP)', desc: 'Standar Nasional: Desain pembelajaran, tujuan pembelajaran (TP), diferensiasi & P5-PPRA', items: [] },
      pengamatan: { key: 'pengamatan', title: '3. Observasi Kelas (Pengamatan KBM)', desc: 'Standar Nasional: Sintaks pembukaan, penguasaan materi, diferensiasi & refleksi', items: [] },
      penilaian: { key: 'penilaian', title: '4. Penilaian & Asesmen Pembelajaran', desc: 'Standar Nasional: Instrumen autentik, rubrik penilaian, analisis & tindak lanjut', items: [] }
    };

    for (const r of rows) {
      if (instrumen[r.domain]) {
        instrumen[r.domain].items.push({
          id: r.kode,
          db_id: r.id,
          label: r.label,
          weight: r.bobot || 1,
          indikator_1: r.indikator_1,
          indikator_2: r.indikator_2,
          indikator_3: r.indikator_3,
          indikator_4: r.indikator_4,
          urutan: r.urutan,
          madrasah_id: null
        });
      }
    }
    return instrumen;
  } catch (e) {
    console.error('Error fetching master instrumen nasional:', e.message);
    return INSTRUMEN_SUPERVISI;
  }
}

// Reset Master Template Nasional ke Standar Baku Kemenag
export function resetMasterKeRegulasiKemenag() {
  db.prepare('DELETE FROM supervisi_instrumen WHERE madrasah_id IS NULL').run();
  
  const instInsert = db.prepare(`
    INSERT INTO supervisi_instrumen (madrasah_id, domain, kode, label, indikator_1, indikator_2, indikator_3, indikator_4, bobot, urutan, status_aktif, created_by_role)
    VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'superadmin')
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
    instInsert.run(it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], it[8]);
  }
  return true;
}

// Distribusikan Master Template Nasional ke Seluruh Madrasah
export function distribusikanMasterKeMadrasah() {
  const masterRows = db.prepare('SELECT * FROM supervisi_instrumen WHERE madrasah_id IS NULL AND status_aktif = 1').all();
  const allMadrasah = db.prepare('SELECT id FROM madrasah').all();

  const insertStmt = db.prepare(`
    INSERT INTO supervisi_instrumen (madrasah_id, domain, kode, label, indikator_1, indikator_2, indikator_3, indikator_4, bobot, urutan, status_aktif, created_by_role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'superadmin')
  `);

  const trans = db.transaction(() => {
    for (const m of allMadrasah) {
      db.prepare('DELETE FROM supervisi_instrumen WHERE madrasah_id = ?').run(m.id);
      for (const it of masterRows) {
        insertStmt.run(m.id, it.domain, it.kode, it.label, it.indikator_1, it.indikator_2, it.indikator_3, it.indikator_4, it.bobot, it.urutan);
      }
    }
  });

  trans();
  return allMadrasah.length;
}

// Hapus / nonaktifkan butir
export function deleteInstrumenButir(id) {
  return db.prepare('DELETE FROM supervisi_instrumen WHERE id = ?').run(id);
}

// Reorder butir via drag & drop
export function reorderInstrumen(itemIds) {
  const updateStmt = db.prepare('UPDATE supervisi_instrumen SET urutan = ? WHERE id = ?');
  const trans = db.transaction((ids) => {
    ids.forEach((id, idx) => {
      updateStmt.run(idx + 1, id);
    });
  });
  trans(itemIds);
}

// Tugas Tambahan GTK
export function getGtkTugasTambahan(madrasahId = 1) {
  try {
    return db.prepare(`
      SELECT tt.*, g.nama as gtk_nama, g.nip as gtk_nip, g.mapel_utama
      FROM gtk_tugas_tambahan tt
      JOIN gtk g ON tt.gtk_id = g.id
      WHERE tt.madrasah_id = ?
      ORDER BY tt.id DESC
    `).all(madrasahId);
  } catch (e) {
    return [];
  }
}

export function saveGtkTugasTambahan(data) {
  if (data.id) {
    return db.prepare(`
      UPDATE gtk_tugas_tambahan 
      SET gtk_id = ?, jabatan_tambahan = ?, nomor_sk = ?, tanggal_sk = ?, tmt = ?, ekuivalensi_jtm = ?, keterangan = ?, status = ?
      WHERE id = ?
    `).run(data.gtk_id, data.jabatan_tambahan, data.nomor_sk, data.tanggal_sk, data.tmt, data.ekuivalensi_jtm || 12, data.keterangan, data.status || 'aktif', data.id);
  } else {
    return db.prepare(`
      INSERT INTO gtk_tugas_tambahan (madrasah_id, gtk_id, jabatan_tambahan, nomor_sk, tanggal_sk, tmt, ekuivalensi_jtm, keterangan, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif')
    `).run(data.madrasah_id || 1, data.gtk_id, data.jabatan_tambahan, data.nomor_sk, data.tanggal_sk, data.tmt, data.ekuivalensi_jtm || 12, data.keterangan);
  }
}

export function deleteGtkTugasTambahan(id) {
  return db.prepare('DELETE FROM gtk_tugas_tambahan WHERE id = ?').run(id);
}
