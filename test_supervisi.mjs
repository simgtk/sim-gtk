async function testSupervisi() {
  const switchRes = await fetch('http://localhost:3000/sim-gtk/switch-role/kamad', {
    redirect: 'manual'
  });
  const cookie = switchRes.headers.get('set-cookie');
  const cookieHeader = cookie ? cookie.split(';')[0] : '';
  console.log('Logged in as Kamad. Cookie:', !!cookieHeader);

  const urls = [
    '/sim-gtk/penilaian/akademik',
    '/sim-gtk/penilaian/jadwal',
    '/sim-gtk/penilaian/perangkat',
    '/sim-gtk/penilaian/mengajar',
    '/sim-gtk/penilaian/manajerial',
    '/sim-gtk/penilaian/daftar-hadir',
    '/sim-gtk/penilaian/laporan'
  ];

  for (const url of urls) {
    const res = await fetch('http://localhost:3000' + url, {
      headers: { Cookie: cookieHeader }
    });
    const html = await res.text();
    console.log(`URL ${url} -> Status: ${res.status}, Length: ${html.length}, Has Error: ${html.includes('Internal Server Error') || html.includes('ReferenceError') || html.includes('TypeError')}`);
  }

  // Test POST save supervisi
  console.log('\n--- Testing POST Simpan Supervisi Akademik ---');
  const postBody = new URLSearchParams({
    gtk_id: '1',
    semester: 'Ganjil',
    tahun_ajaran: '2025/2026',
    tanggal_supervisi: '2026-10-23',
    mata_pelajaran: 'Teknologi Informasi & Informatika',
    supervisor_nama: 'Drs. H. Pengawas Madrasah, M.Pd.',
    foto_pengamatan_1: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop',
    foto_pengamatan_2: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop',
    catatan_rekomendasi: 'Metode pembelajaran sangat interaktif dan berbasis teknologi digital.',
    // Scores for 4 domains (A1-A5, B1-B5, C1-C5, D1-D5)
    'skor_A1': '4', 'skor_A2': '4', 'skor_A3': '3', 'skor_A4': '4', 'skor_A5': '4',
    'skor_B1': '4', 'skor_B2': '4', 'skor_B3': '4', 'skor_B4': '3', 'skor_B5': '4',
    'skor_C1': '4', 'skor_C2': '4', 'skor_C3': '4', 'skor_C4': '4', 'skor_C5': '4',
    'skor_D1': '3', 'skor_D2': '4', 'skor_D3': '4', 'skor_D4': '3', 'skor_D5': '4'
  });

  const saveRes = await fetch('http://localhost:3000/sim-gtk/penilaian/akademik/simpan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader
    },
    body: postBody.toString(),
    redirect: 'manual'
  });
  console.log('Simpan status:', saveRes.status, 'Location:', saveRes.headers.get('location'));

  // Test Laporan again to check if matrix rekap includes the new scores
  const lapRes = await fetch('http://localhost:3000/sim-gtk/penilaian/laporan', {
    headers: { Cookie: cookieHeader }
  });
  const lapHtml = await lapRes.text();
  console.log('Laporan rekap updated. Contains ranking & matrix:', lapHtml.includes('Matriks Ketercapaian') && lapHtml.includes('Tabel Peringkat'));
}

testSupervisi().catch(console.error);
