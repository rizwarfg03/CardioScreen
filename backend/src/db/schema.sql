-- Skema database CardioSync Pro (SQLite)
PRAGMA foreign_keys = ON;

-- Petugas yang login ke sistem: nurse / doctor / admin.
-- Login pakai staff_code (kode internal, BUKAN NIK) — supaya kredensial login
-- staf terpisah dari data pribadi (NIK) dan bisa diganti tanpa mengganti NIK asli.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_code    TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('nurse', 'doctor', 'admin')),
  password_hash TEXT NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pasien (identitas dasar, dikunci oleh NIK 16 digit)
CREATE TABLE IF NOT EXISTS patients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nik           TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  birth_date    TEXT,
  sex           TEXT CHECK (sex IN ('L', 'P')),
  phone         TEXT,
  address       TEXT,
  created_by    INTEGER REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Hasil pemeriksaan ECG. status: draft (baru diparse) -> confirmed (disimpan perawat) -> reviewed (dicek dokter)
CREATE TABLE IF NOT EXISTS ecg_records (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id       INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by      INTEGER NOT NULL REFERENCES users(id),
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'reviewed')),
  bpm              INTEGER,
  classification   TEXT,
  instant_analysis TEXT,
  is_abnormal      INTEGER NOT NULL DEFAULT 0,
  duration_sec     INTEGER,
  recorded_at      TEXT,
  source_device    TEXT,
  parse_confidence TEXT CHECK (parse_confidence IN ('device', 'derived', 'manual', 'unknown')),
  parse_warnings   TEXT,
  samples_json     TEXT,
  sample_rate      INTEGER,
  scale_info       TEXT DEFAULT '25 mm/s, 10 mm/mV',
  lead_info        TEXT,
  systolic_bp      INTEGER,

  diastolic_bp     INTEGER,
  tags             TEXT,
  notes            TEXT,
  doctor_name      TEXT,
  doctor_license   TEXT,
  doctor_signature TEXT,
  verified_at      TEXT,
  report_status    TEXT NOT NULL DEFAULT 'draft' CHECK (report_status IN ('draft', 'verified', 'printed')),
  file_name        TEXT,
  file_path        TEXT,
  file_mime        TEXT,
  file_size        INTEGER,
  reviewed_by      INTEGER REFERENCES users(id),
  reviewed_at      TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Jejak aktivitas untuk halaman admin
CREATE TABLE IF NOT EXISTS activity_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES users(id),
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  ip         TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ecg_patient   ON ecg_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_ecg_created   ON ecg_records(created_at);
CREATE INDEX IF NOT EXISTS idx_ecg_status    ON ecg_records(status);
CREATE INDEX IF NOT EXISTS idx_patients_nik  ON patients(nik);
CREATE INDEX IF NOT EXISTS idx_logs_created  ON activity_logs(created_at);
