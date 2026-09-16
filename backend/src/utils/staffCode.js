'use strict';
const db = require('../db');

// Prefix per peran. Diurut naik per peran supaya gampang dikenali di lapangan
// (mis. "kode PRW itu perawat") tanpa perlu buka sistem dulu.
const ROLE_PREFIX = { nurse: 'PRW', doctor: 'DOK', admin: 'ADM' };
const STAFF_CODE_PATTERN = /^(PRW|DOK|ADM)-\d{4}$/;

/**
 * Buat kode staf baru yang belum dipakai untuk peran tertentu, mis. "PRW-0007".
 * Nomor urut dihitung dari kode dengan prefix yang sama yang terbesar saat ini,
 * jadi tidak akan tabrakan meski ada akun yang sudah dinonaktifkan/dihapus.
 */
function generateStaffCode(role) {
  const prefix = ROLE_PREFIX[role];
  if (!prefix) throw new Error(`Peran tidak dikenal: ${role}`);

  const row = db
    .prepare('SELECT staff_code FROM users WHERE staff_code LIKE ? ORDER BY staff_code DESC LIMIT 1')
    .get(`${prefix}-%`);

  let next = 1;
  if (row) {
    const n = Number.parseInt(row.staff_code.split('-')[1], 10);
    if (Number.isFinite(n)) next = n + 1;
  }
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

module.exports = { ROLE_PREFIX, STAFF_CODE_PATTERN, generateStaffCode };
