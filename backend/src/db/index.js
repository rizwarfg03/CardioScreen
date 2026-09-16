'use strict';
/**
 * Koneksi database.
 *
 * Dua penggerak (driver) didukung, dipilih otomatis:
 *
 *  1. `node:sqlite` — SQLite bawaan Node. Tidak perlu kompilasi apa pun,
 *     jadi kebal terhadap masalah modul native. Tersedia di Node 24+ langsung,
 *     dan di Node 22.5–23.3 dengan flag --experimental-sqlite.
 *  2. `better-sqlite3` — modul native, dipakai kalau bawaan Node belum ada
 *     (mis. Node 20). Perlu binary yang cocok dengan versi Node.
 *
 * Paksa salah satu lewat .env: DB_DRIVER=node atau DB_DRIVER=better-sqlite3
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');

fs.mkdirSync(config.paths.data, { recursive: true });
fs.mkdirSync(config.paths.uploads, { recursive: true });

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const preferred = process.env.DB_DRIVER || 'auto';

/** SQLite bawaan Node. API-nya mirip better-sqlite3; yang perlu ditambal hanya pragma(). */
function openBuiltin() {
  const { DatabaseSync } = require('node:sqlite');
  const database = new DatabaseSync(config.paths.db);
  return {
    driver: 'node:sqlite',
    prepare: (sql) => database.prepare(sql),
    exec: (sql) => database.exec(sql),
    pragma: (statement) => database.exec(`PRAGMA ${statement};`),
    close: () => database.close(),
  };
}

function openBetterSqlite() {
  const Database = require('better-sqlite3');
  const database = new Database(config.paths.db);
  database.driver = 'better-sqlite3';
  return database;
}

function open() {
  if (preferred === 'better-sqlite3') return openBetterSqlite();
  if (preferred === 'node') return openBuiltin();

  try {
    return openBuiltin();
  } catch (err) {
    try {
      const database = openBetterSqlite();
      console.warn(
        '  [i] SQLite bawaan Node belum tersedia, memakai better-sqlite3.\n' +
          '      Kalau muncul crash "Assertion failed: (env) != nullptr", pasang Node 24 LTS\n' +
          '      atau jalankan dengan flag: node --experimental-sqlite src/server.js\n'
      );
      return database;
    } catch (nativeErr) {
      throw new Error(
        'Tidak ada driver SQLite yang bisa dipakai.\n' +
          `  node:sqlite    -> ${err.message}\n` +
          `  better-sqlite3 -> ${nativeErr.message}\n` +
          'Paling mudah: pasang Node 24 LTS, lalu jalankan ulang perintahnya.'
      );
    }
  }
}

const db = open();

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Skema dijalankan tiap start; semua statement pakai IF NOT EXISTS jadi aman.
db.exec(schema);

// Migrasi kolom tambahan jika tabel ecg_records sudah ada sebelumnya
const columnsToAdd = [
  'ALTER TABLE ecg_records ADD COLUMN instant_analysis TEXT;',
  'ALTER TABLE ecg_records ADD COLUMN scale_info TEXT DEFAULT "25 mm/s, 10 mm/mV";',
  'ALTER TABLE ecg_records ADD COLUMN lead_info TEXT;',
  'ALTER TABLE ecg_records ADD COLUMN systolic_bp INTEGER;',
  'ALTER TABLE ecg_records ADD COLUMN diastolic_bp INTEGER;',
  'ALTER TABLE ecg_records ADD COLUMN tags TEXT;',
  'ALTER TABLE ecg_records ADD COLUMN doctor_name TEXT;',
  'ALTER TABLE ecg_records ADD COLUMN doctor_license TEXT;',
  'ALTER TABLE ecg_records ADD COLUMN doctor_signature TEXT;',
  'ALTER TABLE ecg_records ADD COLUMN verified_at TEXT;',
  'ALTER TABLE ecg_records ADD COLUMN report_status TEXT DEFAULT "draft";',
];


for (const alterSql of columnsToAdd) {
  try {
    db.exec(alterSql);
  } catch (err) {
    // Abaikan jika kolom sudah ada
  }
}

module.exports = db;
