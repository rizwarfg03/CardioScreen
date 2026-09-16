'use strict';
const db = require('../db');

const insert = db.prepare(
  `INSERT INTO activity_logs (user_id, actor, action, status, ip)
   VALUES (@user_id, @actor, @action, @status, @ip)`
);

/**
 * Catat aktivitas penting (login, upload, hapus data) untuk dashboard admin.
 */
function log({ user, actorFallback = 'System', action, status = 'success', ip = null }) {
  try {
    insert.run({
      user_id: user ? user.id : null,
      actor: user ? `${user.name} (${user.role})` : actorFallback,
      action,
      status,
      ip,
    });
  } catch (err) {
    // Logging tidak boleh menjatuhkan request utama.
    console.error('[activityLog] gagal mencatat:', err.message);
  }
}

module.exports = { log };
