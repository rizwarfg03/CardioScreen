'use strict';
const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('../db');
const config = require('../config');
const { authenticate, requireRole } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../utils/http');
const { requireFields, toInt } = require('../utils/validate');
const { generateStaffCode } = require('../utils/staffCode');
const activityLog = require('../services/activityLog');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

const BYTES_IN_GB = 1024 ** 3;

/** GET /api/admin/health — kartu uptime, status database, dan latency API. */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const start = process.hrtime.bigint();
    const dbOk = db.prepare('SELECT 1 AS ok').get().ok === 1;
    const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;

    const dbBytes = fs.existsSync(config.paths.db) ? fs.statSync(config.paths.db).size : 0;
    let uploadBytes = 0;
    if (fs.existsSync(config.paths.uploads)) {
      for (const f of fs.readdirSync(config.paths.uploads)) {
        const stat = fs.statSync(`${config.paths.uploads}/${f}`);
        if (stat.isFile()) uploadBytes += stat.size;
      }
    }

    res.json({
      data: {
        uptimeSeconds: Math.round(process.uptime()),
        database: dbOk ? 'Connected' : 'Disconnected',
        apiLatencyMs: Number(latencyMs.toFixed(2)),
        storage: {
          databaseMb: Number((dbBytes / 1024 / 1024).toFixed(2)),
          uploadsMb: Number((uploadBytes / 1024 / 1024).toFixed(2)),
          totalGb: Number(((dbBytes + uploadBytes) / BYTES_IN_GB).toFixed(4)),
        },
        totals: {
          users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
          patients: db.prepare('SELECT COUNT(*) AS n FROM patients').get().n,
          records: db.prepare('SELECT COUNT(*) AS n FROM ecg_records').get().n,
          recordsToday: db
            .prepare(
              "SELECT COUNT(*) AS n FROM ecg_records WHERE date(created_at) = date('now', 'localtime')"
            )
            .get().n,
        },
        env: config.env,
        serverTime: new Date().toISOString(),
      },
    });
  })
);

/** GET /api/admin/logs?limit=&status= — tabel "Recent Activity Logs". */
router.get(
  '/logs',
  asyncHandler(async (req, res) => {
    const limit = Math.min(toInt(req.query.limit, 25), 200);
    const status = req.query.status;

    const rows = status
      ? db
          .prepare('SELECT * FROM activity_logs WHERE status = ? ORDER BY id DESC LIMIT ?')
          .all(status, limit)
      : db.prepare('SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?').all(limit);

    res.json({ data: rows });
  })
);

/** GET /api/admin/users — daftar petugas. */
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare('SELECT id, staff_code, name, role, is_active, last_login_at, created_at FROM users ORDER BY role, name')
      .all();
    res.json({ data: rows });
  })
);

/** POST /api/admin/users — buat akun perawat / dokter / admin baru.
 *  Kode staf (staff_code) DIBUAT OTOMATIS oleh server, bukan diinput admin —
 *  supaya tidak tabrakan dan tidak dipakai NIK asli sebagai kredensial login. */
router.post(
  '/users',
  asyncHandler(async (req, res) => {
    requireFields(req.body, ['name', 'role', 'password']);
    const { name, role, password } = req.body;

    if (!['nurse', 'doctor', 'admin'].includes(role)) {
      throw new ApiError(400, 'Peran harus nurse, doctor, atau admin.');
    }
    if (String(password).length < 8) throw new ApiError(400, 'Password minimal 8 karakter.');

    const staffCode = generateStaffCode(role);

    const info = db
      .prepare('INSERT INTO users (staff_code, name, role, password_hash) VALUES (?, ?, ?, ?)')
      .run(staffCode, String(name).trim(), role, bcrypt.hashSync(password + (process.env.PASSWORD_SALT || ''), 10));

    activityLog.log({ user: req.user, action: `Membuat akun ${role} untuk ${name} (${staffCode})`, ip: req.ip });
    res.status(201).json({
      data: db
        .prepare('SELECT id, staff_code, name, role, is_active, created_at FROM users WHERE id = ?')
        .get(info.lastInsertRowid),
    });
  })
);

/** PATCH /api/admin/users/:id — aktif / nonaktifkan akun atau reset password. */
router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) throw new ApiError(404, 'Akun tidak ditemukan.');
    if (user.id === req.user.id && req.body.is_active === false) {
      throw new ApiError(400, 'Tidak bisa menonaktifkan akun sendiri.');
    }

    if (req.body.is_active !== undefined) {
      db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(req.body.is_active ? 1 : 0, user.id);
    }
    if (req.body.password) {
      if (String(req.body.password).length < 8) throw new ApiError(400, 'Password minimal 8 karakter.');
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
        bcrypt.hashSync(req.body.password + (process.env.PASSWORD_SALT || ''), 10),
        user.id
      );
    }

    activityLog.log({ user: req.user, action: `Memperbarui akun ${user.name}`, ip: req.ip });
    res.json({
      data: db.prepare('SELECT id, staff_code, name, role, is_active, last_login_at FROM users WHERE id = ?').get(user.id),
    });
  })
);

module.exports = router;
