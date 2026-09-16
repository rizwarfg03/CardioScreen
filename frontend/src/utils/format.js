/** Pemformat tanggal & teks yang dipakai bersama di beberapa halaman. */

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelative(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  const yesterday = new Date(today.getTime() - 86400000).toDateString() === date.toDateString();
  const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  if (sameDay) return `Hari ini, ${time}`;
  if (yesterday) return `Kemarin, ${time}`;
  return formatDateTime(value);
}

export function maskNik(nik) {
  if (!nik) return '-';
  return `${String(nik).slice(0, 8)}xxxxxxxx`;
}

export function formatUptime(seconds) {
  if (seconds === null || seconds === undefined) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d) return `${d}h ${h}j`;
  if (h) return `${h}j ${m}m`;
  return `${m}m`;
}

export const ROLE_LABEL = { nurse: 'Perawat', doctor: 'Dokter', admin: 'Admin' };
