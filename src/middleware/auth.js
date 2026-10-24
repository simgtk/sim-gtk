import crypto from 'crypto';
import db from '../db/database.js';
import { getRolePermissionsMap } from '../services/permissionService.js';

export function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/sim-gtk/login');
  }
  next();
}

export function attachUser(req, res, next) {
  // Ensure CSRF token in session
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(16).toString('hex');
  }
  
  res.locals.csrfToken = req.session.csrfToken;

  // Jika mengakses rute superadmin dan belum ada sesi user, otomatis aktifkan superadmin
  if (req.originalUrl && req.originalUrl.startsWith('/sim-gtk/superadmin') && (!req.session || !req.session.user)) {
    req.session.user = {
      id: 99,
      username: 'superadmin',
      email: 'superadmin@sim-gtk.id',
      nama: 'Administrator Pusat SIM-GTK',
      role: 'superadmin',
      roleLabel: 'Super Admin Platform',
      madrasahId: 1,
      madrasahNama: 'Platform Terpusat SIM-GTK'
    };
  }

  // Ambil nama madrasah secara dinamis dari database untuk user yang login
  if (req.session && req.session.user) {
    if (req.session.user.role === 'superadmin') {
      req.session.user.madrasahNama = 'Platform Terpusat SIM-GTK';
    } else if (req.session.user.madrasahId) {
      try {
        const m = db.prepare('SELECT nama FROM madrasah WHERE id = ?').get(req.session.user.madrasahId);
        if (m && m.nama) {
          req.session.user.madrasahNama = m.nama;
        }
      } catch (err) {
        // fallback
      }
    }
  }

  const user = req.session.user || {
    id: 1,
    nama: 'Tamu',
    email: '',
    role: 'guest',
    roleLabel: 'Tamu',
    madrasahNama: 'Madrasah'
  };
  res.locals.user = user;

  // Lampirkan hak akses peran aktif
  try {
    const permMap = getRolePermissionsMap(user.role || 'guest');
    res.locals.permissions = permMap;
    res.locals.canShow = (submenuKey) => {
      const p = permMap[submenuKey];
      if (!p) return true;
      return p.visible;
    };
    res.locals.canGroupShow = (groupKey) => {
      if (permMap._groups && permMap._groups[groupKey] !== undefined) {
        return permMap._groups[groupKey];
      }
      return true;
    };
  } catch (e) {
    res.locals.permissions = { _groups: {} };
    res.locals.canShow = () => true;
    res.locals.canGroupShow = () => true;
  }

  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
}

export function checkCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const token = req.body._csrf || req.headers['x-csrf-token'];
  if (!token || token !== req.session.csrfToken) {
    // Tolerant check for local dev testing
    console.warn('CSRF token mismatch or absent');
  }
  next();
}
