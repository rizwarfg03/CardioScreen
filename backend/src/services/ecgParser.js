'use strict';
/**
 * Pembaca berkas hasil ECG.
 *
 * Dua format yang didukung:
 *  1. PDF laporan alat (mis. Omron Complete HEM-7530T) -> teksnya dibaca,
 *     nilai BPM / klasifikasi / tanggal diambil dengan pola regex.
 *  2. CSV / TXT berisi sampel sinyal (satu angka mV per baris, atau "waktu,mV")
 *     -> sampel disimpan supaya grafik di halaman preview menampilkan sinyal asli.
 *
 * Catatan penting: modul ini TIDAK PERNAH mengarang bentuk gelombang. Kalau
 * berkas hanya berisi gambar (PDF tanpa data numerik), samples dikembalikan null
 * dan frontend menampilkan berkas aslinya, bukan grafik tiruan.
 */

const DEVICE_HINTS = [
  { pattern: /omron|alivecor|kardia/i, label: 'OMRON Complete HEM-7530T' },
  { pattern: /wellue|checkme/i, label: 'Wellue Checkme' },
];

// Urutan penting: pola yang lebih spesifik diperiksa lebih dulu.
const CLASSIFICATION_HINTS = [
  { pattern: /atrial\s*fibrillation|possible\s*afib|\bafib\b|fibrilasi\s*atrium/i, label: 'Possible AFib', abnormal: true },
  { pattern: /tachycardia|takikardia/i, label: 'Tachycardia', abnormal: true },
  { pattern: /bradycardia|bradikardia/i, label: 'Bradycardia', abnormal: true },
  { pattern: /unclassified|tidak\s*terklasifikasi/i, label: 'Unclassified', abnormal: true },
  { pattern: /normal\s*sinus\s*rhythm|sinus\s*normal|irama\s*normal|\bnormal\b/i, label: 'Normal Sinus Rhythm', abnormal: false },
];

const BPM_PATTERNS = [
  /heart\s*rate\s*:\s*(\d{2,3})\s*(?:bpm|\/min)?/i,
  /(?:heart\s*rate|detak\s*jantung|pulse|nadi|hr)\D{0,15}(\d{2,3})\s*(?:bpm|\/min)?/i,
  /(\d{2,3})\s*bpm/i,
];

const BPM_MIN = 25;
const BPM_MAX = 250;

function detectPatientName(text) {
  const m = text.match(/patient(?:\s*name)?\s*:\s*([^\r\n]+)/i);
  if (m) {
    const val = m[1].trim();
    if (val && !/^(tidak|none|null|undefined|-)$/i.test(val)) return val;
  }
  return null;
}

function detectInstantAnalysis(text) {
  const m = text.match(/instant\s*analysis\s*:\s*([^\r\n]+)/i);
  if (m) {
    const val = m[1].trim();
    if (val) return val;
  }
  return null;
}

function detectLeadInfo(text) {
  // Hanya ambil jika benar-benar tertulis di PDF, jangan mengarang lead
  const m = text.match(/(?:lead|channel|leads|saluran)\s*:\s*([^\r\n]+)/i) ||
            text.match(/\b(Lead\s+(?:I|II|III|aVR|aVL|aVF|V[1-6])|Single\s*Lead|1-Lead)\b/i);
  if (m) {
    const val = (m[1] || m[0]).trim();
    if (val && !/^(tidak|none|null|undefined|-)$/i.test(val)) return val;
  }
  return null;
}


function detectScale(text) {
  const m = text.match(/scale\s*:\s*([^\r\n,]+(?:\s*,\s*[^\r\n]+)?)/i);
  if (m) {
    const val = m[1].trim();
    if (val) return val;
  }
  return '25 mm/s, 10 mm/mV';
}


function detectTags(text) {
  const m = text.match(/tags?\s*:\s*([^\r\n]+)/i);
  if (m) {
    const val = m[1].trim();
    if (val && !/^(tidak|none|null|undefined|-)$/i.test(val)) return val;
  }
  return null;
}

function detectNotes(text) {
  const m = text.match(/notes?\s*:\s*([^\r\n]+)/i);
  if (m) {
    const val = m[1].trim();
    if (val && !/^(tidak|none|null|undefined|-)$/i.test(val)) return val;
  }
  return null;
}

function detectDevice(text) {
  const hit = DEVICE_HINTS.find((d) => d.pattern.test(text));
  return hit ? hit.label : null;
}

function detectClassification(text) {
  const instant = detectInstantAnalysis(text);
  if (instant) {
    const hit = CLASSIFICATION_HINTS.find((c) => c.pattern.test(instant));
    return hit ? { label: hit.label, raw: instant, abnormal: hit.abnormal } : { label: instant, raw: instant, abnormal: /afib|fibrillation|tachy|brady|unclassified|abnormal/i.test(instant) };
  }
  const hit = CLASSIFICATION_HINTS.find((c) => c.pattern.test(text));
  return hit ? { label: hit.label, raw: hit.label, abnormal: hit.abnormal } : null;
}

function detectBpm(text) {
  for (const pattern of BPM_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = Number.parseInt(match[1], 10);
    if (value >= BPM_MIN && value <= BPM_MAX) return value;
  }
  return null;
}

function detectRecordedAt(text) {
  // Format khusus OMRON: Recorded: 27/08/2026 2.46 PM atau 27/08/2026 14:46
  const recordedMatch = text.match(/recorded(?:\s*date)?\s*:\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2})[\.:](\d{2})(?:\s*(AM|PM))?/i);
  if (recordedMatch) {
    const day = Number.parseInt(recordedMatch[1], 10);
    const month = Number.parseInt(recordedMatch[2], 10);
    const year = Number.parseInt(recordedMatch[3], 10);
    let hour = Number.parseInt(recordedMatch[4], 10);
    const minute = Number.parseInt(recordedMatch[5], 10);
    const ampm = recordedMatch[6] ? recordedMatch[6].toUpperCase() : null;

    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const pad = (n) => String(n).padStart(2, '0');
    const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  // Format umum lain
  const DATE_PATTERNS = [
    /(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/,          // 2026-08-22 09:15
    /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/,           // 22/08/2026 09:15
  ];
  for (const pattern of DATE_PATTERNS) {
    const m = text.match(pattern);
    if (!m) continue;
    const iso =
      m[1].length === 4
        ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00`
        : `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00`;
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function detectDuration(text) {
  const m = text.match(/(?:duration|durasi)\s*:\s*(\d{1,3})\s*(?:s|sec|second|detik)?\b/i) || text.match(/(\d{1,3})\s*(?:s|sec|second|detik)\b/i);
  if (m) {
    const value = Number.parseInt(m[1], 10);
    if (value > 0 && value <= 600) return value;
  }
  return null;
}

/** Klasifikasi cadangan dari nilai BPM saja — selalu ditandai sebagai turunan. */
function classifyFromBpm(bpm) {
  if (bpm === null) return { label: 'Unclassified', abnormal: true };
  if (bpm < 60) return { label: 'Bradycardia', abnormal: true };
  if (bpm > 100) return { label: 'Tachycardia', abnormal: true };
  return { label: 'Normal Sinus Rhythm', abnormal: false };
}

/** Ambil deretan angka dari CSV/TXT. Mendukung "mV" per baris atau "waktu,mV". */
function parseSamples(buffer) {
  const lines = buffer.toString('utf8').split(/\r?\n/);
  const values = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /[a-df-zA-DF-Z]/.test(trimmed.replace(/e[+-]?\d+/gi, ''))) continue; // lewati header
    const cols = trimmed.split(/[,;\t]/).map((c) => Number.parseFloat(c.trim()));
    const numeric = cols.filter((c) => Number.isFinite(c));
    if (!numeric.length) continue;
    values.push(numeric.length > 1 ? numeric[numeric.length - 1] : numeric[0]);
  }
  return values;
}

/** Deteksi puncak R sederhana (ambang batas + jarak minimum) untuk estimasi BPM. */
function estimateBpmFromSamples(samples, sampleRate) {
  if (!samples.length || !sampleRate) return null;
  const max = Math.max(...samples);
  const min = Math.min(...samples);
  const threshold = min + (max - min) * 0.65;
  const minGap = Math.round(sampleRate * 0.3); // refractory 300 ms

  const peaks = [];
  let lastPeak = -Infinity;
  for (let i = 1; i < samples.length - 1; i += 1) {
    const isLocalMax = samples[i] >= samples[i - 1] && samples[i] > samples[i + 1];
    if (isLocalMax && samples[i] >= threshold && i - lastPeak >= minGap) {
      peaks.push(i);
      lastPeak = i;
    }
  }
  if (peaks.length < 2) return null;

  const intervals = peaks.slice(1).map((p, idx) => p - peaks[idx]);
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round((60 * sampleRate) / avgInterval);
  return bpm >= BPM_MIN && bpm <= BPM_MAX ? bpm : null;
}

/** Turunkan jumlah titik grafik supaya payload API tetap ringan. */
function downsample(samples, maxPoints = 2000) {
  if (samples.length <= maxPoints) return samples;
  const step = samples.length / maxPoints;
  const out = [];
  for (let i = 0; i < maxPoints; i += 1) out.push(samples[Math.floor(i * step)]);
  return out;
}

/** Ambil nilai dari teks laporan alat. Dipisah supaya mudah diuji tanpa berkas PDF. */
function parseReportText(text, warnings = []) {
  if (text.trim().length < 20) {
    warnings.push('PDF sepertinya berisi gambar hasil pindai, bukan teks. Nilai perlu dicek manual.');
  }

  const patientName = detectPatientName(text);
  const bpm = detectBpm(text);
  const instantAnalysis = detectInstantAnalysis(text);
  const deviceClass = detectClassification(text);
  const classification = deviceClass || classifyFromBpm(bpm);
  const scaleInfo = detectScale(text);
  const leadInfo = detectLeadInfo(text);
  const tags = detectTags(text);
  const notes = detectNotes(text);
  const recordedAt = detectRecordedAt(text);
  const durationSec = detectDuration(text);
  const sourceDevice = detectDevice(text);

  if (bpm === null) warnings.push('Nilai BPM tidak ditemukan di dalam PDF.');
  if (!deviceClass && bpm !== null) {
    warnings.push('Klasifikasi tidak tertulis di berkas; nilai diturunkan dari BPM dan perlu dikonfirmasi.');
  }

  return {
    patientName,
    bpm,
    classification: classification.label,
    instantAnalysis: instantAnalysis || classification.label,
    isAbnormal: classification.abnormal,
    recordedAt,
    durationSec,
    scaleInfo,
    leadInfo,
    tags,
    notes,
    sourceDevice,
    confidence: deviceClass && bpm !== null ? 'device' : bpm !== null ? 'derived' : 'unknown',
    samples: null,
    sampleRate: null,
    warnings,
  };

}

async function parsePdf(buffer) {
  const warnings = [];
  let text = '';
  try {
    // require di dalam fungsi: kalau pdf-parse bermasalah, unggahan tetap jalan.
    const pdfParse = require('pdf-parse');
    const parsed = await pdfParse(buffer);
    text = parsed.text || '';
  } catch (err) {
    warnings.push(`Teks PDF tidak bisa dibaca (${err.message}). Isi nilai secara manual.`);
  }
  return parseReportText(text, warnings);
}

function parseSignalFile(buffer, sampleRate = 250) {
  const warnings = [];
  const samples = parseSamples(buffer);

  if (samples.length < sampleRate) {
    warnings.push('Jumlah sampel terlalu sedikit untuk dianalisis.');
    return {
      bpm: null,
      classification: 'Unclassified',
      isAbnormal: true,
      recordedAt: null,
      durationSec: null,
      sourceDevice: null,
      confidence: 'unknown',
      samples: null,
      sampleRate: null,
      warnings,
    };
  }

  const bpm = estimateBpmFromSamples(samples, sampleRate);
  const classification = classifyFromBpm(bpm);
  if (bpm === null) warnings.push('Puncak R tidak terdeteksi jelas; BPM perlu diisi manual.');
  warnings.push(`BPM dihitung dari sinyal dengan asumsi laju cuplik ${sampleRate} Hz.`);

  return {
    bpm,
    classification: classification.label,
    isAbnormal: classification.abnormal,
    recordedAt: null,
    durationSec: Math.round(samples.length / sampleRate),
    sourceDevice: null,
    confidence: 'derived',
    samples: downsample(samples),
    sampleRate,
    warnings,
  };
}

/**
 * Pintu masuk utama. Mengembalikan objek hasil baca yang sudah dinormalisasi.
 */
async function parseEcgFile({ buffer, mimetype, originalName, sampleRate }) {
  const isPdf = mimetype === 'application/pdf' || /\.pdf$/i.test(originalName || '');
  if (isPdf) return parsePdf(buffer);
  return parseSignalFile(buffer, Number(sampleRate) || 250);
}

module.exports = { parseEcgFile, parseReportText, classifyFromBpm, estimateBpmFromSamples, downsample };
