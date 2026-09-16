'use strict';
/**
 * Buat akun petugas langsung dari terminal, atau reset password akun yang ada.
 *
 * Berguna saat belum punya akun sama sekali, atau saat password admin lupa dan
 * tidak ada yang bisa masuk ke halaman Sistem & Admin.
 *
 * Kode staf (staff_code) dibuat OTOMATIS oleh sistem — bukan NIK — supaya
 * kredensial login tidak sama dengan data pribadi staf. Catat kode yang
 * ditampilkan setelah akun dibuat, itu yang dipakai untuk login.
 *
 * Contoh:
 *   npm run create-user -- nurse "Ns. Rina" rahasia123
 *   npm run create-user -- reset PRW-0007 passwordbaru123
 *
 * Peran yang tersedia: nurse, doctor, admin
 */
const bcrypt = require('bcryptjs');
const db = require('../src/db');
const { ROLE_PREFIX, generateStaffCode } = require('../src/utils/staffCode');

const ROLES = Object.keys(ROLE_PREFIX);
const USAGE = `
Cara pakai:
  Buat akun baru   : npm run create-user -- <peran> "<Nama Lengkap>" <password>
  Reset password   : npm run create-user -- reset <kode_staf> <password_baru>

Peran : ${ROLES.join(' | ')}
`;

function fail(message) {
  console.error(`\n${message}\n${USAGE}`);
  process.exit(1);
}

const args = process.argv.slice(2);

if (args[0] === 'reset') {
  const [, staffCode, newPassword] = args;
  if (!staffCode || !newPassword) fail('Argumen belum lengkap.');
  if (newPassword.length < 8) fail('Password minimal 8 karakter.');

  const existing = db.prepare('SELECT id, name, role FROM users WHERE staff_code = ?').get(staffCode.toUpperCase());
  if (!existing) fail(`Kode staf "${staffCode}" tidak ditemukan.`);

  const hash = bcrypt.hashSync(newPassword + (process.env.PASSWORD_SALT || ''), 10);
  db.prepare('UPDATE users SET password_hash = ?, is_active = 1 WHERE id = ?').run(hash, existing.id);
  db.prepare("INSERT INTO activity_logs (actor, action, status) VALUES (?, ?, 'success')").run(
    'Terminal',
    `Reset password akun ${existing.name} (${existing.role})`
  );
  console.log(`\nPassword akun ${existing.name} (${existing.role}, kode ${staffCode.toUpperCase()}) sudah diganti.\n`);
  db.close();
  process.exit(0);
}

const [role, name, password] = args;

if (!role || !name || !password) fail('Argumen belum lengkap.');
if (!ROLES.includes(role)) fail(`Peran "${role}" tidak dikenal.`);
if (password.length < 8) fail('Password minimal 8 karakter.');

const staffCode = generateStaffCode(role);
const hash = bcrypt.hashSync(password + (process.env.PASSWORD_SALT || ''), 10);

db.prepare('INSERT INTO users (staff_code, name, role, password_hash) VALUES (?, ?, ?, ?)').run(
  staffCode,
  name,
  role,
  hash
);
db.prepare("INSERT INTO activity_logs (actor, action, status) VALUES (?, ?, 'success')").run(
  'Terminal',
  `Membuat akun ${name} (${role}) lewat terminal (${staffCode})`
);

console.log(
  `\nAkun dibuat: ${name} (${role})\nKode staf : ${staffCode}\n` +
    `Masuk lewat http://localhost:5173 dengan tab peran yang sesuai, pakai kode staf di atas sebagai kredensial login.\n`
);
db.close();
