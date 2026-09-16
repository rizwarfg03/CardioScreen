'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { ApiError } = require('../utils/http');

/** Terbitkan token untuk user yang berhasil login. */
function signToken(user) {
  return jwt.sign(
    { sub: user.id, staffCode: user.staff_code, name: user.name, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

/** Wajib login: baca Bearer token, verifikasi, tempel req.user. */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Token tidak ada. Silakan login ulang.'));

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = db
      .prepare('SELECT id, staff_code, name, role, is_active FROM users WHERE id = ?')
      .get(payload.sub);

    if (!user || !user.is_active) {
      return next(new ApiError(401, 'Akun tidak aktif atau sudah dihapus.'));
    }
    req.user = user;
    return next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Sesi habis. Silakan login ulang.'
        : 'Token tidak valid.';
    return next(new ApiError(401, message));
  }
}

/** Batasi akses per peran, mis. requireRole('admin') atau requireRole('nurse', 'doctor'). */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Belum login.'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Akses khusus untuk: ${roles.join(', ')}.`));
    }
    return next();
  };
}

module.exports = { signToken, authenticate, requireRole };
