'use strict';
require('dotenv').config();
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-jangan-dipakai-di-produksi',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  // CORS_ORIGIN adalah nama utama; FRONTEND_URL didukung juga karena itu yang
  // dipakai di .env.production. Kalau dua-duanya kosong, fallback ke localhost dev.
  corsOrigin: (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  facilityName: process.env.FACILITY_NAME || 'CardioSync Pro',
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024),
  paths: {
    root: ROOT,
    data: path.join(ROOT, 'data'),
    db: path.join(ROOT, 'data', 'cardiosync.db'),
    uploads: path.join(ROOT, 'uploads'),
  },
};
