'use strict';
const multer = require('multer');
const config = require('../config');
const { ApiError } = require('../utils/http');

const ALLOWED_MIME = new Set([
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel', // beberapa browser mengirim CSV dengan mime ini
]);

const ALLOWED_EXT = /\.(pdf|csv|txt)$/i;

/**
 * File ditampung di memori dulu supaya bisa diparse sebelum diputuskan
 * layak disimpan atau tidak. Nama file di disk dibuat ulang di route.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype) || ALLOWED_EXT.test(file.originalname)) return cb(null, true);
    return cb(new ApiError(400, 'Format tidak didukung. Unggah berkas PDF, CSV, atau TXT.'));
  },
});

module.exports = { upload, ALLOWED_EXT };
