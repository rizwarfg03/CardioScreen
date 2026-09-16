'use strict';
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors((req, cb) => {
    const origin = req.header('Origin');
    // Tanpa origin = request dari curl/Postman/Flutter, tetap diizinkan.
    if (!origin) return cb(null, { origin: true, credentials: true });

    // Origin yang SAMA dengan host request itu sendiri selalu diizinkan.
    // Ini penting saat frontend & API disajikan dari satu server yang sama
    // (lihat blok "frontendDist" di bawah): browser mengirim header Origin
    // untuk file JS bertipe module meski sebenarnya same-origin, dan alamatnya
    // bisa berubah-ubah (localhost, ngrok, domain asli) tanpa perlu ubah
    // CORS_ORIGIN manual tiap kali.
    let originHost;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    const sameOrigin = originHost && originHost === req.headers.host;

    if (sameOrigin || config.corsOrigin.includes(origin)) {
      return cb(null, { origin: true, credentials: true });
    }
    return cb(new Error(`Origin tidak diizinkan: ${origin}`));
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (config.env !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'cardiosync-api', time: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/patients', require('./routes/patients.routes'));
app.use('/api/ecg', require('./routes/ecg.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Kalau frontend sudah di-build (npm run build di folder frontend/), sajikan
// dari sini juga. Ini membuat satu server (satu port) menyajikan frontend +
// API sekaligus — praktis untuk demo cepat lewat ngrok/localtunnel, tanpa
// perlu dua tunnel terpisah atau pusing atur CORS_ORIGIN (semuanya jadi satu
// origin). Tidak memengaruhi setup Docker/dev biasa kalau folder ini belum ada.
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
