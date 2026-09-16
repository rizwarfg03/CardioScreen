'use strict';
const assert = require('assert');
const { parseReportText } = require('../src/services/ecgParser');
const db = require('../src/db');

console.log('=== Memulai Pengujian Fitur OMRON Complete HEM-7530T ===\n');

// 1. Uji ekstraksi teks PDF OMRON
const samplePdfText = `
Patient: Mas Amin
Recorded: 27/08/2026 2.46 PM
Heart Rate: 79 bpm
Duration: 30s
Instant Analysis: Normal
(C) Copyright 2024,AliveCor,Inc.OMRON connect 012.001.00001, UUID:ec3158bb-9da2-45ab-bd2c-4d5fa2824322 1 of 1
Enhanced Filter, Mains Filter: 50 Hz Scale: 25mm/s, 10mm/mV
`;

const parsed = parseReportText(samplePdfText);

console.log('1. Hasil Ekstraksi Metadata PDF:');
console.log('   - Patient Name     :', parsed.patientName);
console.log('   - Heart Rate / BPM :', parsed.bpm, 'bpm');
console.log('   - Instant Analysis :', parsed.instantAnalysis);
console.log('   - Recorded At      :', parsed.recordedAt);
console.log('   - Duration         :', parsed.durationSec, 'detik');
console.log('   - Paper Scale      :', parsed.scaleInfo);
console.log('   - Device Detected  :', parsed.sourceDevice);
console.log('   - Tags             :', parsed.tags || '(Tidak tersedia / null)');
console.log('   - Notes            :', parsed.notes || '(Tidak tersedia / null)');

assert.strictEqual(parsed.patientName, 'Mas Amin', 'Patient Name harus cocok');
assert.strictEqual(parsed.bpm, 79, 'BPM harus 79');
assert.strictEqual(parsed.instantAnalysis, 'Normal', 'Instant Analysis harus Normal');
assert.strictEqual(parsed.durationSec, 30, 'Duration harus 30s');
assert.strictEqual(parsed.scaleInfo, '25mm/s, 10mm/mV', 'Scale harus 25mm/s, 10mm/mV');
assert.strictEqual(parsed.sourceDevice, 'OMRON Complete HEM-7530T', 'Device harus OMRON Complete');
assert.strictEqual(parsed.tags, null, 'Tags yang tidak ada di PDF tidak boleh dikarang');
assert.strictEqual(parsed.notes, null, 'Notes yang tidak ada di PDF tidak boleh dikarang');

console.log('\n[✓] Ekstraksi Metadata PDF BERHASIL & Akurat (Tidak ada data fiktif).\n');

// 2. Uji Database Record & Pemisahan Data Manual Blood Pressure
const nurse = db.prepare("SELECT id FROM users WHERE role = 'nurse' LIMIT 1").get();
const patient = db.prepare("SELECT id, name FROM patients LIMIT 1").get();

const ins = db.prepare(`
  INSERT INTO ecg_records
    (patient_id, uploaded_by, status, bpm, classification, instant_analysis, is_abnormal,
     duration_sec, scale_info, systolic_bp, diastolic_bp, tags, recorded_at, source_device,
     parse_confidence, notes, file_name, file_path, file_mime, file_size)
  VALUES
    (?, ?, 'confirmed', ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 'device', ?, 'omron-sample.pdf', 'test-file.pdf', 'application/pdf', 102400)
`).run(
  patient.id,
  nurse.id,
  parsed.bpm,
  parsed.classification,
  parsed.instantAnalysis,
  parsed.durationSec,
  parsed.scaleInfo,
  120, // Systolic manual
  80,  // Diastolic manual
  'Pemeriksaan Posyandu',
  parsed.recordedAt,
  parsed.sourceDevice,
  'Pasien merasa sehat saat pemeriksaan.'
);

const insertedId = ins.lastInsertRowid;
const row = db.prepare('SELECT * FROM ecg_records WHERE id = ?').get(insertedId);

console.log('2. Verifikasi Penyimpanan Database:');
console.log('   - ID Record         :', row.id);
console.log('   - BPM (From PDF)    :', row.bpm);
console.log('   - Analysis (From PDF):', row.instant_analysis);
console.log('   - Scale (From PDF)  :', row.scale_info);
console.log('   - Systolic (Manual) :', row.systolic_bp, 'mmHg');
console.log('   - Diastolic (Manual):', row.diastolic_bp, 'mmHg');
console.log('   - Notes (Manual)    :', row.notes);

assert.strictEqual(row.bpm, 79);
assert.strictEqual(row.systolic_bp, 120);
assert.strictEqual(row.diastolic_bp, 80);

console.log('\n[✓] Database Record & Pemisahan Data Manual vs PDF BERHASIL.');

// 3. Uji Query Pencarian Arsip
const searchResults = db.prepare(`
  SELECT e.*, p.name AS patient_name, p.nik AS patient_nik
  FROM ecg_records e
  JOIN patients p ON p.id = e.patient_id
  WHERE p.name LIKE ? OR e.classification LIKE ?
`).all('%' + patient.name + '%', '%Normal%');

console.log('\n3. Verifikasi Pencarian Arsip ECG:');
console.log('   - Ditemukan Record   :', searchResults.length);
assert(searchResults.length > 0, 'Harus menemukan record yang cocok');

console.log('\n[✓] Query Arsip & Filter BERHASIL.');
console.log('\n==================================================');
console.log('SEMUA PENGUJIAN OMRON ECG SELESAI DENGAN SUKSES [OK]');
console.log('==================================================\n');
