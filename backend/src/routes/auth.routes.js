'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { signToken, authenticate } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../utils/http');
const { requireFields } = require('../utils/validate');
const activityLog = require('../services/activityLog');

const router = express.Router();

// Rem percobaan login supaya kode staf tidak bisa ditebak brute force.
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 10 menit.' },
});

const publicUser = (u) => ({ id: u.id, staffCode: u.staff_code, name: u.name, role: u.role });

/** POST /api/auth/login — body: { staffCode, password, role } */
router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    requireFields(req.body, ['staffCode', 'password']);
    const staffCode = String(req.body.staffCode).trim().toUpperCase();
    const { password, role } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE staff_code = ?').get(staffCode);
    const passwordOk = user && bcrypt.compareSync(password + (process.env.PASSWORD_SALT || ''), user.password_hash);

    if (!user || !passwordOk) {
      activityLog.log({
        actorFallback: `Kode staf ${staffCode}`,
        action: 'Percobaan login gagal',
        status: 'failed',
        ip: req.ip,
      });
      throw new ApiError(401, 'Kode staf atau password salah.');
    }

    if (!user.is_active) throw new ApiError(403, 'Akun dinonaktifkan. Hubungi admin.');

    // Tab peran di halaman login harus cocok dengan peran akun.
    if (role && role !== user.role) {
      activityLog.log({
        user,
        action: `Login ditolak: peran dipilih "${role}", peran akun "${user.role}"`,
        status: 'failed',
        ip: req.ip,
      });
      throw new ApiError(403, `Akun ini terdaftar sebagai ${user.role}, bukan ${role}.`);
    }

    db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);
    activityLog.log({ user, action: 'Login berhasil', ip: req.ip });

    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

/** GET /api/auth/me — cek token masih valid & ambil profil. */
router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

/** POST /api/auth/logout — hanya untuk jejak audit; token dibuang di sisi klien. */
router.post('/logout', authenticate, (req, res) => {
  activityLog.log({ user: req.user, action: 'Logout', ip: req.ip });
  res.json({ ok: true });
});

/** POST /api/auth/change-password — body: { currentPassword, newPassword } */
router.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req, res) => {
    requireFields(req.body, ['currentPassword', 'newPassword']);
    const { currentPassword, newPassword } = req.body;

    if (String(newPassword).length < 8) {
      throw new ApiError(400, 'Password baru minimal 8 karakter.');
    }

    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword + (process.env.PASSWORD_SALT || ''), row.password_hash)) {
      throw new ApiError(401, 'Password lama tidak cocok.');
    }

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
      bcrypt.hashSync(newPassword + (process.env.PASSWORD_SALT || ''), 10),
      req.user.id
    );
    activityLog.log({ user: req.user, action: 'Ganti password', ip: req.ip });
    res.json({ ok: true });
  })
);

module.exports = router;
