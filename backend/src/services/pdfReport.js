'use strict';
/**
 * Ringkasan pemeriksaan ECG dalam bentuk PDF siap cetak.
 *
 * Dipakai tombol "Unduh PDF" di halaman preview dan ikon PDF di halaman riwayat.
 * Isinya hanya nilai yang benar-benar tersimpan: tidak ada angka tambahan, dan
 * asal setiap nilai (dari alat / hitungan sistem / ketikan petugas) ikut dicetak
 * supaya lembar ini tidak terbaca lebih pasti daripada datanya.
 */
const PDFDocument = require('pdfkit');

const COLOR = {
  primary: '#004ac6',
  text: '#191c1e',
  muted: '#434655',
  line: '#c3c6d7',
  danger: '#ba1a1a',
  ok: '#006329',
  paper: '#f7f9fb',
  gridFine: '#f3c8c8',
  gridBold: '#e4a3a3',
};

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const CONFIDENCE_LABEL = {
  device: 'Tertulis langsung pada laporan alat',
  derived: 'Dihitung sistem, sudah dikonfirmasi petugas',
  manual: 'Diisi manual oleh petugas',
  unknown: 'Tidak terbaca otomatis, diisi petugas',
};

const pad = (n) => String(n).padStart(2, '0');

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${pad(d.getDate())} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${pad(d.getDate())} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** Judul + identitas fasilitas di bagian atas halaman. */
function drawHeader(doc, { facility, left, width }) {
  doc.rect(left, 44, width, 4).fill(COLOR.primary);

  doc.fillColor(COLOR.text).font('Helvetica-Bold').fontSize(18);
  doc.text('Ringkasan Pemeriksaan ECG', left, 64);

  doc.fillColor(COLOR.muted).font('Helvetica').fontSize(10);
  doc.text(facility, left, 86);

  doc.moveTo(left, 106).lineTo(left + width, 106).strokeColor(COLOR.line).lineWidth(1).stroke();
  doc.y = 120;
}

/** Satu pasang label kecil + nilai, dipakai untuk grid identitas dan hasil. */
function drawField(doc, label, value, x, y, width) {
  doc.fillColor(COLOR.muted).font('Helvetica').fontSize(8);
  doc.text(String(label).toUpperCase(), x, y, { width, characterSpacing: 0.4 });
  doc.fillColor(COLOR.text).font('Helvetica-Bold').fontSize(11);
  doc.text(value || '-', x, y + 12, { width });
}

/** Judul bagian dengan garis tipis di bawahnya. */
function drawSectionTitle(doc, title, left, width) {
  const y = doc.y;
  doc.fillColor(COLOR.text).font('Helvetica-Bold').fontSize(12).text(title, left, y);
  doc.moveTo(left, doc.y + 4).lineTo(left + width, doc.y + 4).strokeColor(COLOR.line).lineWidth(0.5).stroke();
  doc.y += 14;
}

/**
 * Gambar sinyal di atas kertas grid. Hanya dipanggil kalau sampel asli ada —
 * berkas tanpa data numerik tidak pernah diganti gelombang buatan.
 */
function drawWaveform(doc, samples, sampleRate, x, y, width, height) {
  doc.save();
  doc.rect(x, y, width, height).fillColor('#ffffff').fill();

  doc.lineWidth(0.3).strokeColor(COLOR.gridFine);
  for (let gx = x; gx <= x + width; gx += 8) doc.moveTo(gx, y).lineTo(gx, y + height).stroke();
  for (let gy = y; gy <= y + height; gy += 8) doc.moveTo(x, gy).lineTo(x + width, gy).stroke();

  doc.lineWidth(0.6).strokeColor(COLOR.gridBold);
  for (let gx = x; gx <= x + width; gx += 40) doc.moveTo(gx, y).lineTo(gx, y + height).stroke();
  for (let gy = y; gy <= y + height; gy += 40) doc.moveTo(x, gy).lineTo(x + width, gy).stroke();

  // Titik dijarangkan supaya berkas PDF tidak membengkak.
  const maxPoints = 1200;
  const step = Math.max(1, Math.ceil(samples.length / maxPoints));
  const points = samples.filter((_, i) => i % step === 0);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const padY = 8;
  const usable = height - padY * 2;

  doc.lineWidth(0.9).strokeColor(COLOR.text).lineJoin('round');
  points.forEach((value, i) => {
    const px = x + (i / (points.length - 1)) * width;
    const py = y + padY + usable - ((value - min) / span) * usable;
    if (i === 0) doc.moveTo(px, py);
    else doc.lineTo(px, py);
  });
  doc.stroke();

  doc.rect(x, y, width, height).lineWidth(0.8).strokeColor(COLOR.line).stroke();
  doc.restore();

  const durasi = sampleRate ? (samples.length / sampleRate).toFixed(1) : null;
  doc.fillColor(COLOR.muted).font('Helvetica').fontSize(8);
  doc.text(`25 mm/s · 10 mm/mV${durasi ? ` · ${durasi} detik` : ''}`, x, y + height + 4, {
    width,
    align: 'right',
  });
  doc.y = y + height + 20;
}

/**
 * Rakit dokumen PDF. Pemanggil yang mengatur tujuan aliran datanya
 * (doc.pipe(res)) lalu memanggil doc.end().
 */
function buildEcgReport(record, { facility = 'CardioSync Pro', printedBy } = {}) {
  const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true });
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const half = (width - 16) / 2;

  drawHeader(doc, { facility, left, width });

  // --- Identitas pasien -----------------------------------------------------
  drawSectionTitle(doc, 'Identitas pasien', left, width);
  let y = doc.y;
  drawField(doc, 'Nama', record.patient_name, left, y, half);
  drawField(doc, 'NIK', record.patient_nik, left + half + 16, y, half);
  y += 38;
  drawField(doc, 'Tanggal lahir', formatDate(record.patient_birth_date), left, y, half);
  drawField(
    doc,
    'Jenis kelamin',
    record.patient_sex === 'L' ? 'Laki-laki' : record.patient_sex === 'P' ? 'Perempuan' : '-',
    left + half + 16,
    y,
    half
  );
  doc.y = y + 44;

  // --- Hasil pemeriksaan ----------------------------------------------------
  drawSectionTitle(doc, 'Hasil pemeriksaan', left, width);
  y = doc.y;

  const boxHeight = 76;
  doc.rect(left, y, half, boxHeight).fillColor(COLOR.paper).fill();
  doc.fillColor(COLOR.muted).font('Helvetica').fontSize(8).text('DETAK JANTUNG', left + 12, y + 12);
  doc
    .fillColor(record.is_abnormal ? COLOR.danger : COLOR.text)
    .font('Helvetica-Bold')
    .fontSize(34)
    .text(record.bpm !== null && record.bpm !== undefined ? String(record.bpm) : '-', left + 12, y + 26);
  doc.fillColor(COLOR.muted).font('Helvetica').fontSize(10).text('BPM', left + 12, y + 58);

  const rightX = left + half + 16;
  doc.rect(rightX, y, half, boxHeight).fillColor(COLOR.paper).fill();
  doc.fillColor(COLOR.muted).font('Helvetica').fontSize(8).text('KLASIFIKASI', rightX + 12, y + 12);
  doc
    .fillColor(record.is_abnormal ? COLOR.danger : COLOR.ok)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(record.classification || 'Unclassified', rightX + 12, y + 28, { width: half - 24 });
  doc
    .fillColor(COLOR.muted)
    .font('Helvetica')
    .fontSize(8)
    .text(CONFIDENCE_LABEL[record.parse_confidence] || CONFIDENCE_LABEL.unknown, rightX + 12, y + 56, {
      width: half - 24,
    });

  y += boxHeight + 16;
  drawField(doc, 'Waktu rekam', formatDateTime(record.recorded_at), left, y, half);
  drawField(
    doc,
    'Durasi',
    record.duration_sec ? `${record.duration_sec} detik` : 'Tidak tercatat',
    left + half + 16,
    y,
    half
  );
  y += 38;
  drawField(doc, 'Alat', record.source_device || 'Tidak terdeteksi', left, y, half);
  drawField(doc, 'Berkas sumber', record.file_name || '-', left + half + 16, y, half);
  doc.y = y + 44;

  // --- Tekanan Darah (Manual Entry) -----------------------------------------
  drawSectionTitle(doc, 'Tekanan Darah (Blood Pressure)', left, width);
  y = doc.y;
  const bpText = record.systolic_bp != null && record.diastolic_bp != null
    ? `${record.systolic_bp} / ${record.diastolic_bp} mmHg`
    : '-';
  drawField(doc, 'Sistolik / Diastolik', bpText, left, y, half);
  drawField(doc, 'Sumber Data', record.systolic_bp != null ? 'Manual Entry' : '-', left + half + 16, y, half);
  doc.y = y + 44;

  // --- Gelombang ------------------------------------------------------------
  const leadTitle = record.lead_info ? `Gelombang (${record.lead_info})` : 'Hasil Morfologi Gelombang ECG';
  drawSectionTitle(doc, leadTitle, left, width);
  if (record.samples && record.samples.length > 1) {


    drawWaveform(doc, record.samples, record.sample_rate, left, doc.y, width, 150);
  } else {
    doc.fillColor(COLOR.muted).font('Helvetica').fontSize(10);
    doc.text(
      `Berkas ${record.file_name || 'sumber'} tidak memuat data sinyal numerik, jadi gelombang tidak dicetak ulang di sini. Lihat berkas asli dari alat untuk tampilan gelombangnya.`,
      left,
      doc.y,
      { width }
    );
    doc.y += 16;
  }

  // --- Catatan petugas ------------------------------------------------------
  drawSectionTitle(doc, 'Catatan petugas', left, width);
  doc.fillColor(COLOR.text).font('Helvetica').fontSize(10);
  doc.text(record.notes || 'Tidak ada catatan.', left, doc.y, { width, align: 'left' });
  doc.y += 24;

  // --- Tanda tangan ---------------------------------------------------------
  const signY = Math.min(doc.y + 20, doc.page.height - 190);
  doc.fillColor(COLOR.muted).font('Helvetica').fontSize(9);
  doc.text('Petugas pemeriksa,', left + width - 180, signY, { width: 180 });
  doc.moveTo(left + width - 180, signY + 54).lineTo(left + width, signY + 54).strokeColor(COLOR.line).lineWidth(0.8).stroke();
  doc.fillColor(COLOR.text).font('Helvetica-Bold').fontSize(10);
  doc.text(record.uploaded_by_name || '-', left + width - 180, signY + 60, { width: 180 });

  // --- Catatan kaki ---------------------------------------------------------
  const footY = doc.page.height - 96;
  doc.moveTo(left, footY).lineTo(left + width, footY).strokeColor(COLOR.line).lineWidth(0.5).stroke();
  doc.fillColor(COLOR.muted).font('Helvetica').fontSize(8);
  doc.text(
    'Lembar ini dihasilkan otomatis dari berkas alat dan bukan diagnosis. Klasifikasi irama merupakan pembacaan alat atau perhitungan sistem; penilaian akhir tetap oleh tenaga medis.',
    left,
    footY + 8,
    { width }
  );
  doc.text(
    `Dicetak oleh ${printedBy ? `${printedBy.name} (${printedBy.role})` : 'sistem'} pada ${formatDateTime(new Date())} · ID rekaman #${record.id}`,
    left,
    footY + 32,
    { width }
  );

  return doc;
}

module.exports = { buildEcgReport };
