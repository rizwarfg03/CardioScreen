'use strict';
const { ApiError } = require('./http');

const NIK_PATTERN = /^\d{16}$/;
const NAME_PATTERN = /^[a-zA-Z\s]+$/;

function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length) {
    throw new ApiError(400, `Field wajib belum diisi: ${missing.join(', ')}`, { missing });
  }
}

function assertName(name, label = 'Nama Pasien') {
  if (!name || !String(name).trim()) {
    throw new ApiError(400, `${label} tidak boleh kosong.`);
  }
  const trimmed = String(name).trim();
  if (!NAME_PATTERN.test(trimmed)) {
    throw new ApiError(400, `${label} hanya boleh berisi huruf alfabet dan spasi.`);
  }
  return trimmed;
}

function assertNik(nik, label = 'NIK') {
  if (!NIK_PATTERN.test(String(nik || '').trim())) {
    throw new ApiError(400, `${label} harus 16 digit angka.`);
  }
  return String(nik).trim();
}

function assertPhone(phone, label = 'Nomor Telepon') {
  if (!phone) return null;
  const cleaned = String(phone).trim();
  if (!/^\d{8,16}$/.test(cleaned)) {
    throw new ApiError(400, `${label} harus berupa angka (8-16 digit).`);
  }
  return cleaned;
}

function toInt(value, fallback = null) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = { requireFields, assertName, assertNik, assertPhone, toInt, NIK_PATTERN, NAME_PATTERN };

