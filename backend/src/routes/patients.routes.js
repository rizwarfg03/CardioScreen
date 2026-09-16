'use strict';
const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../utils/http');
const { requireFields, assertName, assertNik, assertPhone, toInt } = require('../utils/validate');
const activityLog = require('../services/activityLog');

const router = express.Router();
router.use(authenticate);

/** GET /api/patients?q=&limit=&offset= — dipakai langkah "Select Patient". */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = `%${String(req.query.q || '').trim()}%`;
    const limit = Math.min(toInt(req.query.limit, 25), 100);
    const offset = Math.max(toInt(req.query.offset, 0), 0);

    const rows = db
      .prepare(
        `SELECT p.*,
                (SELECT COUNT(*) FROM ecg_records e WHERE e.patient_id = p.id) AS record_count,
                (SELECT MAX(created_at) FROM ecg_records e WHERE e.patient_id = p.id) AS last_exam_at
         FROM patients p
         WHERE p.name LIKE @q OR p.nik LIKE @q
         ORDER BY p.name COLLATE NOCASE
         LIMIT @limit OFFSET @offset`
      )
      .all({ q, limit, offset });

    const total = db
      .prepare('SELECT COUNT(*) AS n FROM patients WHERE name LIKE ? OR nik LIKE ?')
      .get(q, q).n;

    res.json({ data: rows, total, limit, offset });
  })
);

/** POST /api/patients — daftarkan pasien baru (perawat & admin). */
router.post(
  '/',
  requireRole('nurse', 'admin'),
  asyncHandler(async (req, res) => {
    requireFields(req.body, ['nik', 'name']);
    const name = assertName(req.body.name);
    const nik = assertNik(req.body.nik);
    const phone = assertPhone(req.body.phone);
    const { birth_date = null, sex = null, address = null } = req.body;

    if (db.prepare('SELECT id FROM patients WHERE nik = ?').get(nik)) {
      throw new ApiError(409, 'Pasien dengan NIK ini sudah terdaftar.');
    }
    if (sex && !['L', 'P'].includes(sex)) {
      throw new ApiError(400, "Jenis kelamin harus 'L' atau 'P'.");
    }

    const info = db
      .prepare(
        `INSERT INTO patients (nik, name, birth_date, sex, phone, address, created_by)
         VALUES (@nik, @name, @birth_date, @sex, @phone, @address, @created_by)`
      )
      .run({ nik, name, birth_date, sex, phone, address, created_by: req.user.id });


    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(info.lastInsertRowid);
    activityLog.log({ user: req.user, action: `Menambah pasien ${patient.name}`, ip: req.ip });

    res.status(201).json({ data: patient });
  })
);

/** GET /api/patients/:id — detail pasien untuk header halaman riwayat. */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!patient) throw new ApiError(404, 'Pasien tidak ditemukan.');

    const stats = db
      .prepare(
        `SELECT COUNT(*) AS total,
                SUM(is_abnormal) AS abnormal,
                MAX(created_at) AS last_exam_at,
                ROUND(AVG(bpm)) AS avg_bpm
         FROM ecg_records WHERE patient_id = ?`
      )
      .get(patient.id);

    activityLog.log({ user: req.user, action: `Melihat data pasien ${patient.name}`, ip: req.ip });
    res.json({ data: { ...patient, stats } });
  })
);

/** PUT /api/patients/:id — perbarui identitas pasien. */
router.put(
  '/:id',
  requireRole('nurse', 'admin'),
  asyncHandler(async (req, res) => {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!patient) throw new ApiError(404, 'Pasien tidak ditemukan.');

    const next = {
      name: req.body.name ?? patient.name,
      birth_date: req.body.birth_date ?? patient.birth_date,
      sex: req.body.sex ?? patient.sex,
      phone: req.body.phone ?? patient.phone,
      address: req.body.address ?? patient.address,
      id: patient.id,
    };

    if (req.body.name !== undefined) {
      next.name = assertName(req.body.name);
    }
    if (req.body.phone !== undefined && req.body.phone !== null && req.body.phone !== '') {
      next.phone = assertPhone(req.body.phone);
    }
    if (next.sex && !['L', 'P'].includes(next.sex)) {
      throw new ApiError(400, "Jenis kelamin harus 'L' atau 'P'.");
    }

    db.prepare(
      `UPDATE patients SET name = @name, birth_date = @birth_date, sex = @sex,
              phone = @phone, address = @address WHERE id = @id`
    ).run(next);


    activityLog.log({ user: req.user, action: `Memperbarui data pasien ${next.name}`, ip: req.ip });
    res.json({ data: db.prepare('SELECT * FROM patients WHERE id = ?').get(patient.id) });
  })
);

/** GET /api/patients/:id/records — riwayat ECG satu pasien (halaman Riwayat). */
router.get(
  '/:id/records',
  asyncHandler(async (req, res) => {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!patient) throw new ApiError(404, 'Pasien tidak ditemukan.');

    const limit = Math.min(toInt(req.query.limit, 50), 200);
    const rows = db
      .prepare(
        `SELECT e.id, e.status, e.bpm, e.classification, e.is_abnormal, e.duration_sec,
                e.recorded_at, e.notes, e.created_at, e.file_name, e.parse_confidence,
                u.name AS uploaded_by_name
         FROM ecg_records e
         JOIN users u ON u.id = e.uploaded_by
         WHERE e.patient_id = ? AND e.status != 'draft'
         ORDER BY COALESCE(e.recorded_at, e.created_at) DESC
         LIMIT ?`
      )
      .all(patient.id, limit);

    activityLog.log({
      user: req.user,
      action: `Membuka riwayat ECG pasien ${patient.name}`,
      ip: req.ip,
    });
    res.json({ data: rows, patient });
  })
);

module.exports = router;
