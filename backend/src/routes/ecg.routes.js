'use strict';
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const config = require('../config');
const { authenticate, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { ApiError, asyncHandler } = require('../utils/http');
const { toInt } = require('../utils/validate');
const { parseEcgFile, classifyFromBpm } = require('../services/ecgParser');
const { buildEcgReport } = require('../services/pdfReport');
const activityLog = require('../services/activityLog');

const router = express.Router();
router.use(authenticate);

// Kata kunci klasifikasi yang dianggap perlu tindak lanjut.
const ABNORMAL_PATTERN = /afib|fibrillation|tachy|brady|unclassified|abnormal|arrhythmia/i;

const RECORD_SELECT = `
  SELECT e.*, p.name AS patient_name, p.nik AS patient_nik, p.birth_date AS patient_birth_date,
         p.sex AS patient_sex, p.phone AS patient_phone, p.address AS patient_address,
         u.name AS uploaded_by_name, r.name AS reviewed_by_name
  FROM ecg_records e
  JOIN patients p ON p.id = e.patient_id
  JOIN users u ON u.id = e.uploaded_by
  LEFT JOIN users r ON r.id = e.reviewed_by
`;

/** Ubah baris DB jadi bentuk yang dipakai frontend (samples di-parse ke array). */
function present(row) {
  if (!row) return null;
  const { samples_json, parse_warnings, ...rest } = row;
  const hasBp = row.systolic_bp != null || row.diastolic_bp != null;
  return {
    ...rest,
    instant_analysis: row.instant_analysis || row.classification || 'Normal',
    scale_info: row.scale_info || '25 mm/s, 10 mm/mV',
    lead_info: row.lead_info || null,
    systolic_bp: row.systolic_bp ?? null,
    diastolic_bp: row.diastolic_bp ?? null,
    tags: row.tags || null,
    doctor_name: row.doctor_name || null,
    doctor_license: row.doctor_license || null,
    doctor_signature: row.doctor_signature || null,
    verified_at: row.verified_at || null,
    report_status: row.report_status || (row.verified_at ? 'verified' : 'draft'),
    patient_phone: row.patient_phone || null,
    patient_address: row.patient_address || null,
    patient_birth_date: row.patient_birth_date || null,
    patient_sex: row.patient_sex || null,
    bp_source: hasBp ? 'Manual Entry' : null,
    ecg_source: 'From ECG PDF',
    is_abnormal: Boolean(row.is_abnormal),
    samples: samples_json ? JSON.parse(samples_json) : null,
    warnings: parse_warnings ? JSON.parse(parse_warnings) : [],
  };
}


function getRecordOr404(id) {
  const row = db.prepare(`${RECORD_SELECT} WHERE e.id = ?`).get(id);
  if (!row) throw new ApiError(404, 'Rekaman ECG tidak ditemukan.');
  return row;
}

/**
 * POST /api/ecg/upload — multipart: file, patientId, systolicBp, diastolicBp, tags, notes.
 * Berkas dibaca, nilainya diekstrak, lalu disimpan untuk dicek/diarsipkan.
 */
router.post(
  '/upload',
  requireRole('nurse', 'admin'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Berkas ECG belum dipilih.');

    const parsed = await parseEcgFile({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalName: req.file.originalname,
      sampleRate: req.body.sampleRate,
    });

    let patientId = toInt(req.body.patientId);
    let patient = patientId && db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);

    // Jika patientId tidak diberikan, coba cari pasien berdasarkan nama yang terbaca di PDF
    if (!patient && parsed.patientName) {
      patient = db.prepare('SELECT * FROM patients WHERE LOWER(name) = LOWER(?) LIMIT 1').get(parsed.patientName);
      if (!patient) {
        // Buat data pasien otomatis dari nama yang tertera di PDF
        const genNik = `99${Date.now().toString().slice(-14)}`;
        const ins = db
          .prepare('INSERT INTO patients (nik, name, created_by) VALUES (?, ?, ?)')
          .run(genNik, parsed.patientName, req.user.id);
        patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(ins.lastInsertRowid);
      }
    }

    if (!patient) {
      throw new ApiError(400, 'Pasien tidak valid. Pilih pasien atau pastikan PDF memuat nama pasien.');
    }

    // Simpan berkas asli dengan nama unik; nama asli tetap dicatat di DB.
    const ext = path.extname(req.file.originalname).toLowerCase().slice(0, 10) || '.pdf';
    const storedName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const storedPath = path.join(config.paths.uploads, storedName);
    fs.writeFileSync(storedPath, req.file.buffer);

    const systolicBp = req.body.systolicBp !== undefined && req.body.systolicBp !== '' ? toInt(req.body.systolicBp) : null;
    const diastolicBp = req.body.diastolicBp !== undefined && req.body.diastolicBp !== '' ? toInt(req.body.diastolicBp) : null;
    const tags = req.body.tags || parsed.tags || null;
    const notes = req.body.notes || parsed.notes || null;

    const info = db
      .prepare(
        `INSERT INTO ecg_records
           (patient_id, uploaded_by, status, bpm, classification, instant_analysis, is_abnormal,
            duration_sec, recorded_at, source_device, parse_confidence, parse_warnings,
            samples_json, sample_rate, scale_info, lead_info, systolic_bp, diastolic_bp, tags, notes,
            file_name, file_path, file_mime, file_size)
         VALUES
           (@patient_id, @uploaded_by, 'confirmed', @bpm, @classification, @instant_analysis, @is_abnormal,
            @duration_sec, @recorded_at, @source_device, @parse_confidence, @parse_warnings,
            @samples_json, @sample_rate, @scale_info, @lead_info, @systolic_bp, @diastolic_bp, @tags, @notes,
            @file_name, @file_path, @file_mime, @file_size)`
      )
      .run({
        patient_id: patient.id,
        uploaded_by: req.user.id,
        bpm: parsed.bpm,
        classification: parsed.classification,
        instant_analysis: parsed.instantAnalysis || parsed.classification,
        is_abnormal: parsed.isAbnormal ? 1 : 0,
        duration_sec: parsed.durationSec,
        recorded_at: parsed.recordedAt || new Date().toISOString(),
        source_device: parsed.sourceDevice || 'OMRON Complete HEM-7530T',
        parse_confidence: parsed.confidence,
        parse_warnings: JSON.stringify(parsed.warnings || []),
        samples_json: parsed.samples ? JSON.stringify(parsed.samples) : null,
        sample_rate: parsed.sampleRate,
        scale_info: parsed.scaleInfo || '25 mm/s, 10 mm/mV',
        lead_info: parsed.leadInfo || null,
        systolic_bp: systolicBp,
        diastolic_bp: diastolicBp,
        tags: tags,
        notes: notes,
        file_name: req.file.originalname,
        file_path: storedName,
        file_mime: req.file.mimetype,
        file_size: req.file.size,
      });


    activityLog.log({
      user: req.user,
      action: `Unggah ECG PDF untuk ${patient.name} (${req.file.originalname})`,
      ip: req.ip,
    });

    res.status(201).json({ data: present(getRecordOr404(info.lastInsertRowid)) });
  })
);

/** GET /api/ecg?status=&abnormal=&patientId=&q=&limit= — daftar arsip pemeriksaan. */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const clauses = [];
    const params = {};

    if (req.query.status) {
      clauses.push('e.status = @status');
      params.status = req.query.status;
    }
    if (req.query.abnormal === 'true') clauses.push('e.is_abnormal = 1');
    if (req.query.patientId) {
      clauses.push('e.patient_id = @patientId');
      params.patientId = toInt(req.query.patientId);
    }
    if (req.query.q) {
      clauses.push('(p.name LIKE @search OR p.nik LIKE @search OR e.classification LIKE @search OR e.instant_analysis LIKE @search)');
      params.search = `%${req.query.q.trim()}%`;
    }
    params.limit = Math.min(toInt(req.query.limit, 50), 200);

    const rows = db
      .prepare(
        `${RECORD_SELECT}
         ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
         ORDER BY COALESCE(e.recorded_at, e.created_at) DESC
         LIMIT @limit`
      )
      .all(params);

    res.json({ data: rows.map((r) => ({ ...present(r), samples: undefined })) });
  })
);

/** GET /api/ecg/:id — detail lengkap untuk halaman preview. */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const record = getRecordOr404(req.params.id);
    activityLog.log({
      user: req.user,
      action: `Melihat detail ECG #${record.id} (${record.patient_name})`,
      ip: req.ip,
    });
    res.json({ data: present(record) });
  })
);

/** GET /api/ecg/:id/file — kirim berkas asli (dipakai iframe PDF & tombol unduh). */
router.get(
  '/:id/file',
  asyncHandler(async (req, res) => {
    const record = getRecordOr404(req.params.id);
    if (!record.file_path) throw new ApiError(404, 'Berkas asli tidak tersimpan.');

    const filePath = path.join(config.paths.uploads, path.basename(record.file_path));
    if (!fs.existsSync(filePath)) throw new ApiError(404, 'Berkas tidak ada di penyimpanan.');

    const isDownload = req.query.download === '1';
    res.setHeader('Content-Type', record.file_mime || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${record.file_name}"`
    );

    activityLog.log({
      user: req.user,
      action: `${isDownload ? 'Mengunduh' : 'Membuka'} berkas asli ECG #${record.id} (${
        record.patient_name
      })`,
      ip: req.ip,
    });
    fs.createReadStream(filePath).pipe(res);
  })
);

/** GET /api/ecg/:id/report — ringkasan PDF siap cetak untuk pasien atau arsip. */
router.get(
  '/:id/report',
  asyncHandler(async (req, res) => {
    const record = present(getRecordOr404(req.params.id));
    const safeName = String(record.patient_name).replace(/[^a-zA-Z0-9]+/g, '-');
    const doc = buildEcgReport(record, { facility: config.facilityName, printedBy: req.user });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ECG-${safeName}-${record.id}.pdf"`);
    doc.pipe(res);
    doc.end();

    activityLog.log({ user: req.user, action: `Mengunduh ringkasan PDF ECG #${record.id}`, ip: req.ip });
  })
);

/** PATCH /api/ecg/:id — koreksi manual BPM / klasifikasi / tekanan darah / tags / catatan. */
router.patch(
  '/:id',
  requireRole('nurse', 'doctor', 'admin'),
  asyncHandler(async (req, res) => {
    const record = getRecordOr404(req.params.id);
    const bpm = req.body.bpm !== undefined && req.body.bpm !== '' ? toInt(req.body.bpm) : record.bpm;

    if (bpm !== null && (bpm < 20 || bpm > 300)) {
      throw new ApiError(400, 'Nilai BPM di luar rentang wajar (20-300).');
    }

    const manualEdit = req.body.bpm !== undefined || req.body.classification !== undefined;
    const classification =
      req.body.classification !== undefined
        ? req.body.classification
        : req.body.bpm !== undefined
        ? classifyFromBpm(bpm).label
        : record.classification;

    const instantAnalysis = req.body.instantAnalysis !== undefined ? req.body.instantAnalysis : (req.body.classification || record.instant_analysis || classification);

    const isAbnormal =
      req.body.classification !== undefined
        ? ABNORMAL_PATTERN.test(classification || '')
        : classifyFromBpm(bpm).abnormal;

    const systolicBp = req.body.systolicBp !== undefined ? (req.body.systolicBp === '' || req.body.systolicBp === null ? null : toInt(req.body.systolicBp)) : record.systolic_bp;
    const diastolicBp = req.body.diastolicBp !== undefined ? (req.body.diastolicBp === '' || req.body.diastolicBp === null ? null : toInt(req.body.diastolicBp)) : record.diastolic_bp;
    const tags = req.body.tags !== undefined ? req.body.tags : record.tags;
    const notes = req.body.notes !== undefined ? req.body.notes : record.notes;

    db.prepare(
      `UPDATE ecg_records
       SET bpm = @bpm, classification = @classification, instant_analysis = @instant_analysis,
           is_abnormal = @is_abnormal, systolic_bp = @systolic_bp, diastolic_bp = @diastolic_bp,
           tags = @tags, notes = @notes, parse_confidence = @confidence, updated_at = datetime('now')
       WHERE id = @id`
    ).run({
      bpm,
      classification,
      instant_analysis: instantAnalysis,
      is_abnormal: isAbnormal ? 1 : 0,
      systolic_bp: systolicBp,
      diastolic_bp: diastolicBp,
      tags,
      notes,
      confidence: manualEdit ? 'manual' : record.parse_confidence,
      id: record.id,
    });

    activityLog.log({ user: req.user, action: `Menyunting hasil ECG #${record.id}`, ip: req.ip });
    res.json({ data: present(getRecordOr404(record.id)) });
  })
);

/** POST /api/ecg/:id/confirm — tombol "Konfirmasi & Simpan" di halaman preview. */
router.post(
  '/:id/confirm',
  requireRole('nurse', 'admin'),
  asyncHandler(async (req, res) => {
    const record = getRecordOr404(req.params.id);
    if (record.bpm === null && !req.body.bpm) {
      throw new ApiError(400, 'BPM masih kosong. Isi nilainya sebelum menyimpan.');
    }

    const bpm = req.body.bpm !== undefined && req.body.bpm !== '' ? toInt(req.body.bpm) : record.bpm;
    const classification = req.body.classification || record.classification;
    const instantAnalysis = req.body.instantAnalysis || record.instant_analysis || classification;
    const systolicBp = req.body.systolicBp !== undefined ? (req.body.systolicBp === '' || req.body.systolicBp === null ? null : toInt(req.body.systolicBp)) : record.systolic_bp;
    const diastolicBp = req.body.diastolicBp !== undefined ? (req.body.diastolicBp === '' || req.body.diastolicBp === null ? null : toInt(req.body.diastolicBp)) : record.diastolic_bp;
    const tags = req.body.tags !== undefined ? req.body.tags : record.tags;
    const notes = req.body.notes !== undefined ? req.body.notes : record.notes;

    db.prepare(
      `UPDATE ecg_records
       SET status = 'confirmed', bpm = @bpm, classification = @classification,
           instant_analysis = @instant_analysis, systolic_bp = @systolic_bp, diastolic_bp = @diastolic_bp,
           tags = @tags, is_abnormal = @is_abnormal, notes = @notes, updated_at = datetime('now')
       WHERE id = @id`
    ).run({
      bpm,
      classification,
      instant_analysis: instantAnalysis,
      systolic_bp: systolicBp,
      diastolic_bp: diastolicBp,
      tags,
      is_abnormal: ABNORMAL_PATTERN.test(classification || '') ? 1 : 0,
      notes,
      id: record.id,
    });

    activityLog.log({
      user: req.user,
      action: `Konfirmasi hasil ECG #${record.id} (${record.patient_name})`,
      ip: req.ip,
    });
    res.json({ data: present(getRecordOr404(record.id)) });
  })
);

/** POST /api/ecg/:id/verify-doctor — Verifikasi pemeriksaan oleh dokter dan simpan tanda tangan digital. */
router.post(
  '/:id/verify-doctor',
  requireRole('doctor', 'admin'),
  asyncHandler(async (req, res) => {
    const record = getRecordOr404(req.params.id);
    const doctorName = req.body.doctorName?.trim() || req.user.name;
    const doctorLicense = req.body.doctorLicense?.trim() || null;
    const doctorSignature = req.body.doctorSignature || null;
    const notes = req.body.notes !== undefined ? req.body.notes : record.notes;

    db.prepare(
      `UPDATE ecg_records
       SET status = 'reviewed', report_status = 'verified', reviewed_by = @reviewer,
           doctor_name = @doctor_name, doctor_license = @doctor_license,
           doctor_signature = @doctor_signature, verified_at = datetime('now'),
           notes = @notes, updated_at = datetime('now')
       WHERE id = @id`
    ).run({
      reviewer: req.user.id,
      doctor_name: doctorName,
      doctor_license: doctorLicense,
      doctor_signature: doctorSignature,
      notes,
      id: record.id,
    });

    activityLog.log({
      user: req.user,
      action: `Dokter ${doctorName} memverifikasi hasil ECG #${record.id} (${record.patient_name})`,
      ip: req.ip,
    });

    res.json({ data: present(getRecordOr404(record.id)) });
  })
);

/** PATCH /api/ecg/:id/print-status — Tandai laporan sudah dicetak / diserahkan ke pasien. */
router.patch(
  '/:id/print-status',
  asyncHandler(async (req, res) => {
    const record = getRecordOr404(req.params.id);
    db.prepare(
      `UPDATE ecg_records
       SET report_status = 'printed', updated_at = datetime('now')
       WHERE id = @id`
    ).run({ id: record.id });

    activityLog.log({
      user: req.user,
      action: `Mencetak lembar hasil ECG pasien #${record.id} (${record.patient_name})`,
      ip: req.ip,
    });

    res.json({ data: present(getRecordOr404(record.id)) });
  })
);

/** DELETE /api/ecg/:id — hanya admin; berkas fisik ikut dihapus. */
router.delete(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const record = getRecordOr404(req.params.id);
    if (record.file_path) {
      fs.rmSync(path.join(config.paths.uploads, path.basename(record.file_path)), { force: true });
    }
    db.prepare('DELETE FROM ecg_records WHERE id = ?').run(record.id);
    activityLog.log({ user: req.user, action: `Menghapus rekaman ECG #${record.id}`, ip: req.ip });
    res.json({ ok: true });
  })
);

module.exports = router;
