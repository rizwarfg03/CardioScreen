'use strict';
/**
 * Uji jalur utama dari luar, seperti pemakaian sebenarnya:
 * login → daftar pasien → unggah berkas → baca hasil → konfirmasi → riwayat →
 * ringkasan PDF → dashboard → jejak aktivitas admin.
 *
 * Cara pakai (server harus sudah jalan di terminal lain):
 *   npm run dev          # terminal 1
 *   npm run smoke        # terminal 2
 *
 * Data uji yang dibuat memakai NIK berakhiran waktu jalan, jadi bisa diulang
 * tanpa bentrok. Hapus lewat halaman admin kalau tidak diperlukan lagi.
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.SMOKE_BASE || 'http://localhost:4000';
const NURSE = { staffCode: process.env.SMOKE_NURSE_CODE || 'PRW-0001', password: process.env.SMOKE_NURSE_PASS || 'perawat123' };
const ADMIN = { staffCode: process.env.SMOKE_ADMIN_CODE || 'ADM-0001', password: process.env.SMOKE_ADMIN_PASS || 'admin123' };
const SAMPLE = path.resolve(__dirname, '..', '..', 'contoh', 'sinyal-uji-250hz.csv');

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  OK    ${label}`);
  } else {
    failed += 1;
    console.log(`  GAGAL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function call(token, endpoint, options = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  return { res, body: isJson ? await res.json() : null };
}

async function run() {
  console.log(`\nUji jalur CardioSync — ${BASE}\n`);

  // 0. Server hidup
  try {
    const { res } = await call(null, '/api/health');
    check('server merespons /api/health', res.ok);
  } catch (err) {
    console.log(`\nServer tidak bisa dihubungi di ${BASE}. Jalankan "npm run dev" dulu.\n`);
    process.exit(1);
  }

  // 1. Login perawat
  const login = await call(null, '/api/auth/login', {
    method: 'POST',
    body: { ...NURSE, role: 'nurse' },
  });
  check('login perawat berhasil', login.res.ok && Boolean(login.body?.token), login.body?.error);
  const token = login.body?.token;
  if (!token) {
    console.log('\nTidak bisa lanjut tanpa token. Sudah jalankan "npm run seed"?\n');
    process.exit(1);
  }

  // 2. Password salah harus ditolak
  const wrong = await call(null, '/api/auth/login', {
    method: 'POST',
    body: { staffCode: NURSE.staffCode, password: 'password-salah', role: 'nurse' },
  });
  check('password salah ditolak', wrong.res.status === 401);

  // 3. Tanpa token harus ditolak
  const noToken = await call(null, '/api/patients');
  check('akses tanpa token ditolak', noToken.res.status === 401);

  // 4. Daftarkan pasien uji
  const suffix = String(Date.now()).slice(-8);
  const nik = `35789999${suffix}`;
  const created = await call(token, '/api/patients', {
    method: 'POST',
    body: { nik, name: `Pasien Uji ${suffix}`, sex: 'P', birth_date: '1990-05-17' },
  });
  check('pasien baru tersimpan', created.res.status === 201 && Boolean(created.body?.data?.id), created.body?.error);
  const patientId = created.body?.data?.id;

  // 5. NIK kembar harus ditolak
  const duplicate = await call(token, '/api/patients', {
    method: 'POST',
    body: { nik, name: 'Duplikat' },
  });
  check('NIK ganda ditolak', duplicate.res.status === 409);

  // 6. NIK bukan 16 digit harus ditolak
  const badNik = await call(token, '/api/patients', {
    method: 'POST',
    body: { nik: '123', name: 'NIK Pendek' },
  });
  check('NIK kurang dari 16 digit ditolak', badNik.res.status === 400);

  // 7. Unggah berkas sinyal contoh
  if (!fs.existsSync(SAMPLE)) {
    check('berkas contoh ditemukan', false, SAMPLE);
    return;
  }
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(SAMPLE)], { type: 'text/csv' }), 'sinyal-uji-250hz.csv');
  form.append('patientId', String(patientId));
  form.append('sampleRate', '250');

  const upload = await call(token, '/api/ecg/upload', { method: 'POST', body: form });
  const record = upload.body?.data;
  check('berkas terunggah dan terbaca', upload.res.status === 201 && Boolean(record?.id), upload.body?.error);
  check('BPM terhitung wajar (70-90)', record?.bpm >= 70 && record?.bpm <= 90, `dapat ${record?.bpm}`);
  check('klasifikasi terisi', Boolean(record?.classification), String(record?.classification));
  check('sampel sinyal tersimpan', Array.isArray(record?.samples) && record.samples.length > 100);
  check('status awal draft', record?.status === 'draft', String(record?.status));

  // 8. Konfirmasi hasil
  const confirmed = await call(token, `/api/ecg/${record.id}/confirm`, {
    method: 'POST',
    body: { bpm: record.bpm, classification: record.classification, notes: 'Catatan dari uji jalur otomatis.' },
  });
  check('hasil terkonfirmasi', confirmed.body?.data?.status === 'confirmed', confirmed.body?.error);

  // 9. Muncul di riwayat pasien
  const history = await call(token, `/api/patients/${patientId}/records`);
  check('muncul di riwayat pasien', history.body?.data?.some((r) => r.id === record.id));

  // 10. Ringkasan PDF
  const report = await fetch(`${BASE}/api/ecg/${record.id}/report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const pdf = Buffer.from(await report.arrayBuffer());
  check('ringkasan PDF terbuat', report.ok && pdf.subarray(0, 4).toString() === '%PDF', `${pdf.length} byte`);

  // 11. Dashboard menghitung data baru
  const summary = await call(token, '/api/dashboard/summary');
  check('dashboard memuat statistik', summary.res.ok && summary.body?.data?.stats?.totalPatients > 0);
  check('pemeriksaan baru masuk daftar terakhir', summary.body?.data?.recent?.some((r) => r.id === record.id));

  // 12. Perawat tidak boleh masuk area admin
  const forbidden = await call(token, '/api/admin/logs');
  check('perawat ditolak dari endpoint admin', forbidden.res.status === 403);

  // 13. Admin melihat jejak aktivitas
  const adminLogin = await call(null, '/api/auth/login', { method: 'POST', body: { ...ADMIN, role: 'admin' } });
  const adminToken = adminLogin.body?.token;
  check('login admin berhasil', Boolean(adminToken), adminLogin.body?.error);

  if (adminToken) {
    const logs = await call(adminToken, '/api/admin/logs?limit=50');
    check('unggahan tercatat di jejak aktivitas', logs.body?.data?.some((l) => l.action.includes('Unggah ECG')));
    const health = await call(adminToken, '/api/admin/health');
    check('status sistem terbaca', health.body?.data?.database === 'Connected');
  }

  console.log(`\n${passed} lolos, ${failed} gagal\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error('\nUji jalur berhenti karena error:', err.message, '\n');
  process.exit(1);
});
