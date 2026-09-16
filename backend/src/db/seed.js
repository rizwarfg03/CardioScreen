'use strict';
/**
 * Isi database dengan akun & data contoh supaya aplikasi langsung bisa dicoba.
 * Jalankan: npm run seed   (aman diulang, tidak menggandakan data)
 */
const bcrypt = require('bcryptjs');
const db = require('./index');

const USERS = [
  { staff_code: 'PRW-0001', name: 'Ns. Dewi Lestari', role: 'nurse', password: 'perawat123' },
  { staff_code: 'DOK-0001', name: 'dr. Andi Saputra', role: 'doctor', password: 'dokter123' },
  { staff_code: 'ADM-0001', name: 'Admin Posyandu', role: 'admin', password: 'admin123' },
];

const PATIENTS = [
  { nik: '3174092801990001', name: 'Siti Aminah', birth_date: '1999-01-28', sex: 'P', phone: '081234567001' },
  { nik: '3201041512750002', name: 'Budi Hartono', birth_date: '1975-12-15', sex: 'L', phone: '081234567002' },
  { nik: '3329100503680003', name: 'Ahmad Suryadi', birth_date: '1968-03-05', sex: 'L', phone: '081234567003' },
  { nik: '3502111811880004', name: 'Maria Gunawan', birth_date: '1988-11-18', sex: 'P', phone: '081234567004' },
];

const RECORDS = [
  { patientNik: '3174092801990001', bpm: 102, classification: 'Possible AFib', instantAnalysis: 'Possible AFib', systolicBp: 135, diastolicBp: 88, tags: 'Pusing, Berdebar', hoursAgo: 3 },
  { patientNik: '3201041512750002', bpm: 115, classification: 'Tachycardia', instantAnalysis: 'Tachycardia', systolicBp: 140, diastolicBp: 90, tags: 'Setelah jalan cepat', hoursAgo: 4 },
  { patientNik: '3329100503680003', bpm: 72, classification: 'Normal Sinus Rhythm', instantAnalysis: 'Normal', systolicBp: 120, diastolicBp: 80, tags: 'Rutin bulanan', hoursAgo: 5 },
  { patientNik: '3502111811880004', bpm: 68, classification: 'Normal Sinus Rhythm', instantAnalysis: 'Normal', systolicBp: null, diastolicBp: null, tags: null, hoursAgo: 26 },
];

const ABNORMAL = ['afib', 'tachy', 'brady', 'abnormal', 'arrhythmia', 'unclassified'];

function isAbnormal(text) {
  const t = String(text || '').toLowerCase();
  return ABNORMAL.some((k) => t.includes(k)) ? 1 : 0;
}

function isoHoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

function run() {
  const insertUser = db.prepare(
    'INSERT INTO users (staff_code, name, role, password_hash) VALUES (@staff_code, @name, @role, @password_hash)'
  );
  for (const u of USERS) {
    const exists = db.prepare('SELECT id FROM users WHERE staff_code = ?').get(u.staff_code);
    if (exists) continue;
    insertUser.run({
      staff_code: u.staff_code,
      name: u.name,
      role: u.role,
      password_hash: bcrypt.hashSync(u.password + (process.env.PASSWORD_SALT || ''), 10),
    });
    console.log(`+ user  ${u.role.padEnd(6)} ${u.staff_code}  (password: ${u.password})`);
  }

  const nurse = db.prepare("SELECT id FROM users WHERE role = 'nurse' LIMIT 1").get();

  const insertPatient = db.prepare(
    `INSERT INTO patients (nik, name, birth_date, sex, phone, created_by)
     VALUES (@nik, @name, @birth_date, @sex, @phone, @created_by)`
  );
  for (const p of PATIENTS) {
    const exists = db.prepare('SELECT id FROM patients WHERE nik = ?').get(p.nik);
    if (exists) continue;
    insertPatient.run({ ...p, created_by: nurse ? nurse.id : null });
    console.log(`+ pasien ${p.nik}  ${p.name}`);
  }

  const insertRecord = db.prepare(
    `INSERT INTO ecg_records
       (patient_id, uploaded_by, status, bpm, classification, instant_analysis, is_abnormal,
        duration_sec, scale_info, systolic_bp, diastolic_bp, tags, recorded_at, source_device, parse_confidence, notes, created_at, updated_at)
     VALUES
       (@patient_id, @uploaded_by, 'confirmed', @bpm, @classification, @instant_analysis, @is_abnormal,
        30, '25 mm/s, 10 mm/mV', @systolic_bp, @diastolic_bp, @tags, @recorded_at, 'OMRON Complete HEM-7530T', 'device', @notes, @recorded_at, @recorded_at)`
  );
  const recordCount = db.prepare('SELECT COUNT(*) AS n FROM ecg_records').get().n;
  if (recordCount === 0 && nurse) {
    for (const r of RECORDS) {
      const patient = db.prepare('SELECT id FROM patients WHERE nik = ?').get(r.patientNik);
      if (!patient) continue;
      insertRecord.run({
        patient_id: patient.id,
        uploaded_by: nurse.id,
        bpm: r.bpm,
        classification: r.classification,
        instant_analysis: r.instantAnalysis,
        is_abnormal: isAbnormal(r.classification),
        systolic_bp: r.systolicBp,
        diastolic_bp: r.diastolicBp,
        tags: r.tags,
        recorded_at: isoHoursAgo(r.hoursAgo),
        notes: 'Data contoh hasil pemeriksaan OMRON Complete.',
      });
    }
    console.log(`+ ${RECORDS.length} rekaman ECG contoh`);
  }

  console.log('\nSeeding selesai. Database: ' + require('../config').paths.db);
}

run();
