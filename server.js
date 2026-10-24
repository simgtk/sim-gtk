import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './src/db/database.js';
import { attachUser } from './src/middleware/auth.js';
import routes from './src/routes/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database and seeds
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Trust reverse proxy (Nginx / Cloudflare)
app.set('trust proxy', 1);

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'sim-gtk-super-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true'
  }
}));

// Static files (served under both /sim-gtk and root for compatibility)
app.use('/sim-gtk', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Attach user & CSRF to all views
app.use(attachUser);

// Mount main routes
app.use(routes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('public/index', {
    title: 'Halaman Tidak Ditemukan · SIM-GTK'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send(`Terjadi kesalahan pada server: ${err.message}`);
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SIM-GTK Server berjalan di http://localhost:${PORT}/sim-gtk/`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`======================================================`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Akun Demo untuk Masuk (Development):`);
    console.log(`- Admin Madrasah : admin@man2gorontalo.sch.id / admin123`);
    console.log(`- Guru (Herman)  : herman@man2gorontalo.sch.id / guru123`);
    console.log(`- Pengawas       : pengawas@kemenag.go.id / pengawas123`);
    console.log(`- Super Admin    : superadmin@sim-gtk.id / admin123`);
    console.log(`======================================================\n`);
  }
});
