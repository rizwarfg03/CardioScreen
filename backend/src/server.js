'use strict';
const app = require('./app');
const config = require('./config');
const db = require('./db');

const server = app.listen(config.port, () => {
  console.log(`\n  CardioSync API siap`);
  console.log(`  http://localhost:${config.port}/api/health`);
  console.log(`  mode      : ${config.env}`);
  console.log(`  database  : ${config.paths.db}`);
  console.log(`  cors dari : ${config.corsOrigin.join(', ')}\n`);

  if (config.jwtSecret.startsWith('dev-only')) {
    console.warn('  [!] JWT_SECRET masih bawaan. Buat file .env sebelum dipakai di luar localhost.\n');
  }
});

function shutdown(signal) {
  console.log(`\n${signal} diterima, menutup server...`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
