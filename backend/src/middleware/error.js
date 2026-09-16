'use strict';
const multer = require('multer');
const config = require('../config');
const { ApiError } = require('../utils/http');

function notFound(req, res, next) {
  next(new ApiError(404, `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Terjadi kesalahan di server.';

  if (err instanceof multer.MulterError) {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `Ukuran berkas melebihi batas ${Math.round(config.maxUploadBytes / 1024 / 1024)}MB.`
        : `Upload gagal: ${err.message}`;
  }

  if (status >= 500) console.error('[error]', err);

  res.status(status).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
    ...(config.env === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
