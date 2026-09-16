'use strict';
const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/dashboard/summary
 * Semua angka di kartu "Morning Overview", daftar alert, dan tabel
 * "Recent Examinations" pada dashboard perawat diambil dari sini.
 */
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const totalPatients = db.prepare('SELECT COUNT(*) AS n FROM patients').get().n;

    const checkedToday = db
      .prepare(
        `SELECT COUNT(DISTINCT patient_id) AS n FROM ecg_records
         WHERE status != 'draft' AND date(COALESCE(recorded_at, created_at)) = date('now', 'localtime')`
      )
      .get().n;

    const checkedYesterday = db
      .prepare(
        `SELECT COUNT(DISTINCT patient_id) AS n FROM ecg_records
         WHERE status != 'draft' AND date(COALESCE(recorded_at, created_at)) = date('now', '-1 day', 'localtime')`
      )
      .get().n;

    const abnormalToday = db
      .prepare(
        `SELECT COUNT(*) AS n FROM ecg_records
         WHERE status != 'draft' AND is_abnormal = 1
           AND date(COALESCE(recorded_at, created_at)) = date('now', 'localtime')`
      )
      .get().n;

    const pendingReview = db
      .prepare("SELECT COUNT(*) AS n FROM ecg_records WHERE status = 'confirmed'").get().n;

    // Kartu "Attention Required": hasil abnormal yang belum ditinjau dokter.
    const alerts = db
      .prepare(
        `SELECT e.id, e.bpm, e.classification, e.created_at, e.recorded_at,
                p.id AS patient_id, p.name AS patient_name, p.nik AS patient_nik
         FROM ecg_records e
         JOIN patients p ON p.id = e.patient_id
         WHERE e.is_abnormal = 1 AND e.status = 'confirmed'
         ORDER BY COALESCE(e.recorded_at, e.created_at) DESC
         LIMIT 5`
      )
      .all();

    const recent = db
      .prepare(
        `SELECT e.id, e.bpm, e.classification, e.is_abnormal, e.status,
                COALESCE(e.recorded_at, e.created_at) AS taken_at,
                p.id AS patient_id, p.name AS patient_name, p.nik AS patient_nik
         FROM ecg_records e
         JOIN patients p ON p.id = e.patient_id
         WHERE e.status != 'draft'
         ORDER BY taken_at DESC
         LIMIT 8`
      )
      .all();

    res.json({
      data: {
        stats: {
          totalPatients,
          checkedToday,
          checkedTodayDelta: checkedToday - checkedYesterday,
          abnormalToday,
          pendingReview,
        },
        alerts: alerts.map((a) => ({ ...a, is_abnormal: true })),
        recent: recent.map((r) => ({ ...r, is_abnormal: Boolean(r.is_abnormal) })),
      },
    });
  })
);

/** GET /api/dashboard/trend?days=7 — jumlah pemeriksaan & abnormal per hari. */
router.get(
  '/trend',
  asyncHandler(async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
    const rows = db
      .prepare(
        `SELECT date(COALESCE(recorded_at, created_at)) AS day,
                COUNT(*) AS total,
                SUM(is_abnormal) AS abnormal
         FROM ecg_records
         WHERE status != 'draft'
           AND date(COALESCE(recorded_at, created_at)) >= date('now', ?)
         GROUP BY day ORDER BY day`
      )
      .all(`-${days} day`);
    res.json({ data: rows });
  })
);

module.exports = router;
