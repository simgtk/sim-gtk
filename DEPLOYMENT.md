# 🚀 Panduan Deployment SIM-GTK ke VPS Linux (Ubuntu + Nginx + PM2)

Panduan ini mencakup langkah demi langkah mulai dari persiapan VPS baru hingga aplikasi siap diakses menggunakan domain dan SSL (HTTPS).

---

## 📋 Ringkasan Spesifikasi Server yang Disarankan
- **Sistem Operasi**: Ubuntu 22.04 LTS atau Ubuntu 24.04 LTS
- **RAM**: Minimal 1 GB (Disarankan 2 GB jika ada aktivitas export dokumen Word/PPTX bersamaan)
- **CPU**: 1 Core vCPU (Cukup untuk penggunaan madrasah)
- **Disk**: Minimal 20 GB SSD

---

## 🛠️ Langkah 1: Persiapan Server VPS

Hubungkan ke VPS Anda melalui terminal (SSH):
```bash
ssh root@IP_SERVER_ANDA
```

Update repositori dan paket sistem:
```bash
sudo apt update && sudo apt upgrade -y
```

Install compiler & tools yang dibutuhkan (Wajib untuk kompilasi modul C++ `better-sqlite3`):
```bash
sudo apt install -y curl wget git build-essential python3
```

---

## 📦 Langkah 2: Instalasi Node.js 20 LTS & PM2

Pasang Node.js v20 (LTS):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifikasi versi:
```bash
node -v   # Harus v20.x
npm -v
```

Pasang PM2 (Process Manager) secara global:
```bash
sudo npm install -g pm2
```

---

## 📂 Langkah 3: Setup Repositori & Aplikasi SIM-GTK

Buat folder direktori web di `/var/www/sim-gtk`:
```bash
sudo mkdir -p /var/www/sim-gtk
sudo chown -R $USER:$USER /var/www/sim-gtk
```

Clone repositori aplikasi Anda:
```bash
git clone URL_REPOSITORY_ANDA.git /var/www/sim-gtk
cd /var/www/sim-gtk
```

Install dependensi:
```bash
npm install --production
```

Buat dan atur file `.env` di server:
```bash
cp .env.example .env
nano .env
```
Isi konfigurasi produksi:
```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=buat_kunci_acak_yang_sangat_panjang_minimal_32_karakter_disini
COOKIE_SECURE=false  # Ubah ke true setelah domain dipasangi SSL (HTTPS)
```
*(Tekan `Ctrl+O` lalu `Enter` untuk menyimpan, lalu `Ctrl+X` untuk keluar dari nano)*

Pastikan folder data dan uploads memiliki izin yang benar:
```bash
mkdir -p data public/uploads
chmod -R 775 data public/uploads
```

---

## 🚀 Langkah 4: Menjalankan Aplikasi dengan PM2

Jalankan aplikasi menggunakan file konfigurasi `ecosystem.config.cjs`:
```bash
pm2 start ecosystem.config.cjs --env production
```

Cek status aplikasi:
```bash
pm2 status
pm2 logs sim-gtk --lines 20
```

Konfigurasikan agar PM2 otomatis berjalan saat server restart / reboot:
```bash
pm2 startup
# Jalankan perintah yang muncul di terminal (jika ada)
pm2 save
```

---

## 🌐 Langkah 5: Konfigurasi Nginx (Reverse Proxy)

Pasang web server Nginx:
```bash
sudo apt install -y nginx
```

Buat file konfigurasi virtual host Nginx:
```bash
sudo nano /etc/nginx/sites-available/sim-gtk
```

Masukkan konfigurasi berikut (Ganti `nama-domain.sch.id` dengan domain Anda, atau gunakan `_` jika baru menggunakan IP VPS):
```nginx
server {
    listen 80;
    server_name nama-domain.sch.id www.nama-domain.sch.id;

    # Batas ukuran upload file (misal dokumen SK/tugas s/d 50MB)
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi dan restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/sim-gtk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Langkah 6: Pasang SSL Gratis (HTTPS) dengan Certbot

Pastikan Domain Anda sudah diarahkan (A-Record) ke IP VPS. Lalu jalankan:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nama-domain.sch.id -d www.nama-domain.sch.id
```
Ikuti petunjuk di layar (masukkan email dan setujui ToS). Certbot akan otomatis mengonfigurasi HTTPS dan perpanjangan otomatis.

Setelah HTTPS aktif, aktifkan cookie secure di `.env`:
```bash
cd /var/www/sim-gtk
nano .env
# Ubah: COOKIE_SECURE=true
pm2 reload sim-gtk
```

---

## 🔄 Langkah 7: Alur Update Fitur di Masa Depan

Setiap kali Anda selesai mengembangkan fitur baru di laptop dan sudah di-push ke GitHub/GitLab, untuk menerapkannya di VPS cukup jalankan:

```bash
cd /var/www/sim-gtk
git pull
npm install --production    # Jika ada library baru
pm2 reload sim-gtk          # Reload aplikasi (zero-downtime)
```

---

## 💾 Langkah 8: Backup Database SQLite Otomatis (Cron Job)

Database SQLite `sim_gtk.db` sangat mudah dibackup karena berbentuk file.
Buat folder backup:
```bash
mkdir -p /var/backups/sim-gtk
```

Buka cron table:
```bash
crontab -e
```
Tambahkan baris berikut di bagian paling bawah untuk backup setiap jam 02:00 malam:
```cron
0 2 * * * cp /var/www/sim-gtk/data/sim_gtk.db /var/backups/sim-gtk/sim_gtk_$(date +\%Y\%m\%d_\%H\%M\%S).db
```
Untuk menghapus backup yang lebih lama dari 30 hari secara otomatis:
```cron
0 3 * * * find /var/backups/sim-gtk/ -type f -name "*.db" -mtime +30 -delete
```
