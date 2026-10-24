import db from '../db/database.js';

/**
 * Service to generate Kurikulum Merdeka teaching documents
 * Supports online LLM API (OpenAI/Compatible) and high-quality offline smart generator
 */
export async function generatePerangkatAjar({
  jenis,
  mapel,
  kelas,
  materi,
  jp = 4,
  jumlah_siswa = 30,
  cp = '',
  gambar = false,
  madrasahId = 1,
  guruNama = 'Herman Susanto Buhungo'
}) {
  const madrasah = db.prepare('SELECT * FROM madrasah WHERE id = ?').get(madrasahId) || {
    nama: 'MAN 2 KABUPATEN GORONTALO',
    tahun_ajaran: '2026/2027',
    semester: '1 (Ganjil)',
    ai_base_url: '',
    ai_api_key: '',
    ai_model: 'gpt-4o-mini'
  };

  // If online AI configured, try it first
  if (madrasah.ai_api_key && madrasah.ai_api_key.trim().length > 5) {
    try {
      const result = await callOnlineAi({
        jenis, mapel, kelas, materi, jp, jumlah_siswa, cp, madrasah, guruNama
      });
      if (result) return result;
    } catch (err) {
      console.warn('Online AI failed, falling back to smart offline generator:', err.message);
    }
  }

  // Smart Offline Generator
  return generateOfflineDoc({
    jenis, mapel, kelas, materi, jp, jumlah_siswa, cp, gambar, madrasah, guruNama
  });
}

async function callOnlineAi({ jenis, mapel, kelas, materi, jp, jumlah_siswa, cp, madrasah, guruNama }) {
  const prompt = `Sebagai pakar kurikulum madrasah (Kurikulum Merdeka Kemenag RI), susun dokumen "${jenis}" lengkap dan profesional untuk:
- Madrasah: ${madrasah.nama}
- Guru Pengampu: ${guruNama}
- Mata Pelajaran: ${mapel}
- Kelas / Fase: ${kelas}
- Materi / Topik: ${materi}
- Alokasi Waktu: ${jp} JP
- Jumlah Siswa: ${jumlah_siswa}
${cp ? `- Konteks / CP Khusus: ${cp}` : ''}

Format output dalam Markdown terstruktur dengan tabel-tabel rapi sesuai standar Kurikulum Merdeka Kementerian Agama.`;

  const baseUrl = madrasah.ai_base_url || 'https://api.openai.com/v1';
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${madrasah.ai_api_key}`
    },
    body: JSON.stringify({
      model: madrasah.ai_model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Anda adalah asisten AI resmi SIM-GTK untuk penyusunan perangkat ajar Kurikulum Merdeka Madrasah Kementerian Agama RI.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  });

  if (!resp.ok) {
    throw new Error(`AI API error: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
  return content;
}

function generateOfflineDoc({ jenis, mapel, kelas, materi, jp, jumlah_siswa, cp, gambar, madrasah, guruNama }) {
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const fase = kelas.includes('X') ? 'Fase E' : 'Fase F';

  if (jenis === 'Modul Ajar') {
    return `# MODUL AJAR KURIKULUM MERDEKA
## ${mapel.toUpperCase()} — ${kelas} (${fase})
**${madrasah.nama}** &middot; Tahun Ajaran ${madrasah.tahun_ajaran}

---

### I. INFORMASI UMUM

| Komponen | Deskripsi |
| :--- | :--- |
| **Nama Penyusun** | ${guruNama} |
| **Satuan Pendidikan** | ${madrasah.nama} |
| **Mata Pelajaran** | ${mapel} |
| **Fase / Kelas / Semester** | ${fase} / ${kelas} / ${madrasah.semester} |
| **Alokasi Waktu** | ${jp} Jam Pelajaran (${jp * 45} Menit) |
| **Jumlah Peserta Didik** | ${jumlah_siswa} Peserta Didik |
| **Materi Pokok** | ${materi} |
| **Model Pembelajaran** | *Problem-Based Learning (PBL)* / Pembelajaran Berdiferensiasi |
| **Metode** | Diskusi kelompok, eksplorasi digital, presentasi, dan tanya jawab |
| **Profil Pelajar Pancasila** | Beriman & Bertakwa, Bernalar Kritis, Gotong Royong, Kreatif |
| **Profil Pelajar Rahmatan Lil Alamin** | Berkeadaban (*Ta'addub*), Keteladanan (*Qudwah*), Musyawarah (*Syura*) |
| **Sarana & Prasarana** | LCD Proyektor, laptop/gawai, LKPD, modul ajar, koneksi internet |

---

### II. KOMPONEN INTI

#### A. Capaian Pembelajaran (CP)
${cp || `Peserta didik mampu memahami konsep fundamental materi **${materi}**, menganalisis keterkaitan teori dengan realitas kontekstual madrasah dan kehidupan sehari-hari, serta mampu mengomunikasikan hasil telaah secara kritis, kolaboratif, dan berakhlak mulia.`}

#### B. Tujuan Pembelajaran (TP)
1. Melalui kegiatan literasi dan tayangan interaktif, peserta didik mampu mengidentifikasi konsep dasar **${materi}** dengan benar.
2. Melalui diskusi kelompok, peserta didik mampu menganalisis studi kasus terkait **${materi}** secara kritis.
3. Peserta didik mampu mempresentasikan solusi atau kesimpulan hasil kerja kelompok dengan percaya diri dan komunikatif.

#### C. Pemahaman Bermakna
Pemahaman terhadap **${materi}** membekali peserta didik dengan kecakapan hidup, ketajaman berpikir logis, serta pembiasaan nilai-nilai religius dan etika islami dalam menghadapi tantangan zaman.

#### D. Pertanyaan Pemantik
1. Apa yang terlintas dalam pikiran kalian ketika mendengar istilah **${materi}**?
2. Bagaimana penerapan konsep **${materi}** dalam kehidupan kita sehari-hari di madrasah dan lingkungan masyarakat?

---

### III. LANGKAH-LANGKAH PEMBELAJARAN

#### Pertemuan 1 (${jp} JP)

| Tahapan | Kegiatan Pembelajaran | Waktu |
| :--- | :--- | :---: |
| **Pendahuluan** | 1. Guru membuka kelas dengan salam, doa bersama, dan tadarus singkat.<br>2. Guru memeriksa presensi peserta didik dan kesiapan ruang kelas.<br>3. Guru melakukan apersepsi dan mengajukan pertanyaan pemantik mengenai **${materi}**.<br>4. Guru menyampaikan tujuan pembelajaran dan teknis kegiatan asesmen. | 15 menit |
| **Kegiatan Inti** | **Fase 1: Orientasi Masalah**<br>- Peserta didik mencermati studi kasus/tayangan tentang ${materi}.<br><br>**Fase 2: Mengorganisasikan Siswa**<br>- Guru membagi kelas ke dalam kelompok heterogen (4–5 orang per kelompok) dengan diferensiasi proses.<br><br>**Fase 3: Membimbing Penyelidikan**<br>- Setiap kelompok mengkaji LKPD dan bahan bacaan.<br>- Guru berkeliling memfasilitasi kelompok yang memerlukan bimbingan tambahan.<br><br>**Fase 4: Mengembangkan & Menyajikan Hasil**<br>- Setiap kelompok menyusun laporan mini/resume digital.<br>- Perwakilan kelompok mempresentasikan hasil kajian di depan kelas.<br><br>**Fase 5: Analisis & Evaluasi**<br>- Guru dan siswa bersama-sama menarik benang merah dan klarifikasi materi. | ${jp * 45 - 30} menit |
| **Penutup** | 1. Guru bersama peserta didik merumuskan kesimpulan pembelajaran.<br>2. Melakukan refleksi pembelajaran bersama (apa yang telah dipahami & kendala yang dihadapi).<br>3. Guru memberikan apresiasi kepada kelompok dengan kolaborasi terbaik.<br>4. Doa penutup dan salam. | 15 menit |

---

### IV. ASESMEN & EVALUASI

1. **Asesmen Diagnostik**: Tanya jawab lisan di awal pembelajaran untuk memetakan kesiapan belajar.
2. **Asesmen Formatif**: Observasi sikap gotong-royong, partisipasi diskusi, dan ketercapaian pengerjaan LKPD.
3. **Asesmen Sumatif**: Tes tertulis pilihan ganda dan uraian kontekstual pada akhir materi.

#### Rubrik Penilaian Kinerja Diskusi & Presentasi

| Aspek Penilaian | Skor 4 (Sangat Baik) | Skor 3 (Baik) | Skor 2 (Cukup) | Skor 1 (Perlu Bimbingan) |
| :--- | :--- | :--- | :--- | :--- |
| **Penguasaan Materi** | Menjelaskan konsep ${materi} secara mendalam, akurat, dan runtut | Menjelaskan konsep dengan akurat namun kurang mendalam | Menjelaskan konsep dengan beberapa kekeliruan | Belum mampu menjelaskan konsep secara mandiri |
| **Keaktifan Diskusi** | Sangat aktif memberikan ide dan memotivasi anggota kelompok | Aktif berdiskusi dan menyelesaikan tugas | Cukup aktif jika diarahkan guru | Pasif dalam diskusi |
| **Komunikasi / Presentasi** | Suara jelas, percaya diri, kontak mata baik, santun | Suara jelas, cukup percaya diri, santun | Terbata-bata, kurang kontak mata | Sangat ragu-ragu dan tidak fokus |

---

Gorontalo, ${dateStr}

Mengetahui,  
**Kepala Madrasah**  
  
  
**${madrasah.nama_kamad || 'Drs. H. Abdul Wahab, M.Pd'}**  
NIP. 196805121994031002  

**Guru Mata Pelajaran**  
  
  
**${guruNama}**  
NIP/NUPTK. 198504122020011005
`;
  }

  if (jenis === 'LKPD' || jenis === 'LKM') {
    return `# LEMBAR KERJA PESERTA DIDIK (LKPD)
## ${mapel.toUpperCase()} — ${materi.toUpperCase()}
**${madrasah.nama}** &middot; Kelas: **${kelas}**

**Nama Kelompok / Peserta Didik:** ___________________________  
**Kelas / Absen:** ___________________________  
**Hari / Tanggal:** ${dateStr}  

---

### A. Capaian & Indikator
Peserta didik mampu menelaah dan memecahkan permasalahan kontekstual mengenai **${materi}** secara sistematis, kritis, dan berkolaborasi dengan rekan sekelompok.

### B. Petunjuk Pengerjaan
1. Bacalah bismillah sebelum memulai kegiatan belajar.
2. Pelajari rangkuman materi dan bahan tayang yang disajikan guru.
3. Diskusikan pertanyaan-pertanyaan studi kasus di bawah ini bersama anggota kelompokmu.
4. Tuliskan jawaban dengan rapi pada lembar kerja yang tersedia.

---

### C. Stimulus / Kasus Kontekstual
Perhatikan studi kasus berikut terkait penerapan **${materi}**:
> Di lingkungan madrasah, pengelolaan dan implementasi **${materi}** memegang peranan krusial bagi terciptanya efektivitas pembelajaran modern. Namun seringkali ditemukan kendala pemahaman konseptual dan kesiapan sarana. Bagaimanakah solusi solutif dan terukur yang dapat Anda tawarkan?

---

### D. Aktivitas Belajar & Soal Eksplorasi

1. **Identifikasi Konsep**: Tuliskan pengertian dan minimal 3 (tiga) pilar utama dari **${materi}**!
   - *Jawaban:* __________________________________________________________________________________
   - ____________________________________________________________________________________________

2. **Analisis Masalah**: Menurut kelompok kalian, apa tantangan terbesar yang sering dihadapi dalam materi **${materi}**? Jelaskan argumen kalian!
   - *Jawaban:* __________________________________________________________________________________
   - ____________________________________________________________________________________________

3. **Tabel Analisis Karakteristik**: Lengkapi tabel berikut:

| No | Komponen ${materi} | Karakteristik / Fungsi | Contoh Nyata di Madrasah |
| :-: | :--- | :--- | :--- |
| 1 | Komponen Utama A | ............................................................ | ............................................................ |
| 2 | Komponen Pendukung B | ............................................................ | ............................................................ |
| 3 | Komponen Evaluasi C | ............................................................ | ............................................................ |

4. **Kesimpulan & Solusi Aksi Nyata**: Berdasarkan telaah kelompok kalian, simpulkan langkah aksi yang tepat!
   - *Kesimpulan:* _______________________________________________________________________________

---

**Paraf Guru:** ____________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Nilai / Catatan:** ____________
`;
  }

  if (jenis === 'Soal Asesmen') {
    return `# PAKET SOAL ASESMEN SUMATIF
## Mata Pelajaran: ${mapel} &middot; Materi: ${materi}
**${madrasah.nama}** &middot; Kelas: **${kelas}** (${fase})

---

### KISI-KISI SOAL

| No | Indikator Soal | Level Kognitif | Bentuk Soal | No. Soal |
| :-: | :--- | :---: | :---: | :-: |
| 1 | Menjelaskan definisi dan konsep dasar ${materi} | C2 (Pemahaman) | Pilihan Ganda | 1 |
| 2 | Mengklasifikasikan komponen pokok dalam ${materi} | C3 (Aplikasi) | Pilihan Ganda | 2 |
| 3 | Menganalisis studi kasus terkait ${materi} di lingkungan madrasah | C4 (Analisis) | Pilihan Ganda | 3 |
| 4 | Mengevaluasi efektivitas penerapan ${materi} | C5 (Evaluasi) | Pilihan Ganda | 4 |
| 5 | Merumuskan solusi komprehensif atas permasalahan ${materi} | C6 (Kreasi) | Uraian | 5 |

---

### BAGIAN I: PILIHAN GANDA
*Pilihlah salah satu jawaban yang paling tepat (A, B, C, D, atau E)!*

**1.** Konsep fundamental yang paling tepat menggambarkan **${materi}** dalam perspektif pembelajaran modern adalah...  
A. Kumpulan aturan statis tanpa relevansi praktis  
B. Pendekatan sistematis dan adaptif untuk mencapai pemahaman optimal  
C. Prosedur administratif pelengkap tanpa implikasi nyata  
D. Hanya berlaku untuk jenjang pendidikan tinggi  
E. Menyerahkan seluruh proses pembelajaran tanpa bimbingan guru  
*Kunci: B*

**2.** Salah satu karakteristik utama dari implementasi **${materi}** adalah...  
A. Berorientasi pada kebutuhan peserta didik dan profil pelajar Pancasila  
B. Menyeragamkan semua kemampuan siswa tanpa diferensiasi  
C. Mengabaikan aspek akhlak dan religiusitas  
D. Membatasi kreativitas peserta didik di dalam kelas  
E. Tidak memerlukan evaluasi berkala  
*Kunci: A*

**3.** Apabila dalam pelaksanaan **${materi}** ditemukan kendala keterbatasan sarana, langkah prioritas yang bijak bagi seorang pendidik madrasah adalah...  
A. Menunda pembelajaran sampai seluruh fasilitas serba baru  
B. Berinovasi memanfaatkan media alternatif yang relevan dan kontekstual  
C. Menghapus materi tersebut dari kurikulum  
D. Membebankan biaya sepenuhnya kepada siswa  
E. Memberikan tugas mandiri tanpa panduan  
*Kunci: B*

**4.** Nilai Profil Pelajar Rahmatan Lil Alamin yang paling tercermin saat peserta didik berdiskusi memecahkan problem **${materi}** adalah...  
A. *Tasyaddud* (ekstremisme)  
B. *Syura* (musyawarah) dan *Ta'addub* (berkeadaban)  
C. *Ta'ashub* (fanatisme buta)  
D. *Infirad* (individualistis)  
E. *Ihmal* (pengabaian)  
*Kunci: B*

---

### BAGIAN II: SOAL URAIAN

**5.** Jelaskan bagaimana keterkaitan antara penguasaan materi **${materi}** dengan peningkatan kompetensi dan karakter peserta didik di madrasah! Berikan contoh nyata penerapannya!  
*Pedoman Penskoran:*  
- Jawaban memuat definisi yang tepat (skor 5)  
- Jawaban memuat 2 argumen logis dan mendalam (skor 10)  
- Jawaban menyertakan contoh konkret kontekstual (skor 5)  
- Total Skor Maksimal = 20 poin.
`;
  }

  // Default: Prota, Prosem, ATP, KKTP
  return `# DOKUMEN PERANGKAT AJAR: ${jenis.toUpperCase()}
## ${mapel.toUpperCase()} — ${kelas}
**${madrasah.nama}** &middot; Tahun Ajaran ${madrasah.tahun_ajaran}

### Ringkasan Dokumen
- **Jenis Dokumen:** ${jenis}
- **Materi Pokok:** ${materi}
- **Fase / Kelas:** ${fase} / ${kelas}
- **Alokasi Jam:** ${jp} JP
- **Penyusun:** ${guruNama}

---

### Distribusi Alokasi & Alur Pembelajaran

| Pekan / Pertemuan | Alur Tujuan Pembelajaran (ATP) | Materi Pokok | Alokasi Waktu | Asesmen |
| :-: | :--- | :--- | :-: | :--- |
| **Pekan 1** | Memahami konsep dasar dan terminologi ${materi} | Konsep Dasar & Definisi | 2 JP | Formatif Awal |
| **Pekan 2** | Menganalisis karakteristik dan prinsip utama ${materi} | Karakteristik & Pilar Utama | 2 JP | Observasi & LKPD |
| **Pekan 3** | Mengaplikasikan konsep dalam studi kasus kontekstual | Praktik & Telaah Kasus | 2 JP | Unjuk Kerja |
| **Pekan 4** | Mengevaluasi dan mempresentasikan karya/kesimpulan | Asesmen Sumatif & Refleksi | 2 JP | Tes Sumatif |

---

Gorontalo, ${dateStr}  
Mengetahui,  
**Kepala Madrasah**  
  
**${madrasah.nama_kamad}**  

**Guru Pengampu**  
  
**${guruNama}**
`;
}
