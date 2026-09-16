import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import { api } from '../api/client.js';

const STEPS = ['Pilih Pasien', 'Unggah Berkas PDF', 'Input Manual & Simpan'];
const MAX_MB = 50;

function StepIndicator({ current }) {
  return (
    <ol className="flex items-center gap-2 mb-6">
      {STEPS.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'active' : 'todo';
        return (
          <li key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                state === 'done'
                  ? 'bg-[#0057B8] text-white'
                  : state === 'active'
                  ? 'bg-blue-100 text-[#0057B8] ring-2 ring-[#0057B8]'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {state === 'done' ? <Icon name="check" size={16} /> : index + 1}
            </span>
            <span
              className={`text-xs whitespace-nowrap ${
                state === 'todo' ? 'text-slate-400 font-medium' : 'text-slate-900 font-semibold'
              }`}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && <span className="h-px bg-slate-200 flex-1 hidden sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function UploadEcg() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState(null);

  // File state
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  // Manual Blood Pressure & Notes fields
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Preset patient if loaded with ?patientId=...
  useEffect(() => {
    const preset = params.get('patientId');
    if (!preset) return;
    api
      .patient(preset)
      .then((res) => {
        setPatient(res.data);
        setStep(1);
      })
      .catch(() => setError('Pasien dari tautan tidak ditemukan. Pilih manual di bawah.'));
  }, [params]);

  // Search patients
  useEffect(() => {
    if (step !== 0) return undefined;
    setSearching(true);
    const timer = setTimeout(() => {
      api
        .patients(query, 8)
        .then((res) => setResults(res.data || []))
        .catch((err) => setError(err.message))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, step]);

  const pickFile = (selected) => {
    setError('');
    if (!selected) return;
    if (selected.size > MAX_MB * 1024 * 1024) {
      setError(`Ukuran berkas melebihi batas ${MAX_MB}MB.`);
      return;
    }
    if (!/\.pdf$/i.test(selected.name)) {
      setError('Format berkas tidak valid. Harap unggah berkas laporan ECG asli berformat PDF (.pdf).');
      return;
    }
    setFile(selected);
    setStep(2);
  };

  const handleUpload = async () => {
    if (!patient || !file) {
      setError('Harap lengkapi pemilihan pasien dan berkas PDF.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patient.id);
      if (systolicBp.trim()) formData.append('systolicBp', systolicBp.trim());
      if (diastolicBp.trim()) formData.append('diastolicBp', diastolicBp.trim());
      if (tags.trim()) formData.append('tags', tags.trim());
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await api.uploadEcg(formData);
      navigate(`/ecg/${res.data.id}`);
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <AppLayout breadcrumb={['Rekam ECG', STEPS[step]]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Unggah Hasil ECG OMRON
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simpan dokumen asli ECG PDF dari OMRON Complete HEM-7530T ke dalam sistem arsip klinis.
          </p>
        </div>

        <StepIndicator current={step} />
        <ErrorNotice message={error} />

        {/* STEP 0: Pilih Pasien */}
        {step === 0 && (
          <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2" htmlFor="patient-search">
              1. Pilih Pasien Rekam Medis
            </label>
            <div className="relative mb-4">
              <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="patient-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari berdasarkan nama atau NIK 16 digit..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              />
            </div>

            {searching ? (
              <div className="py-8">
                <Spinner label="Mencari pasien..." />
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {query ? 'Pasien tidak ditemukan. Periksa kembali nama atau NIK.' : 'Ketik nama atau NIK untuk mencari.'}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPatient(p);
                        setStep(1);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50/50 flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-[#0057B8]">{p.name}</p>
                        <p className="text-xs font-mono text-slate-400">NIK: {p.nik} · {p.sex === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#0057B8] flex items-center gap-1">
                        <span>Pilih</span>
                        <Icon name="chevron_right" size={16} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* STEP 1: Unggah Berkas PDF */}
        {step === 1 && (
          <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0057B8] flex items-center justify-center font-bold text-xs">
                  {patient?.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{patient?.name}</p>
                  <p className="text-[11px] font-mono text-slate-400">NIK: {patient?.nik}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-xs text-[#0057B8] hover:underline font-semibold"
              >
                Ganti Pasien
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragging
                  ? 'border-[#0057B8] bg-blue-50/50'
                  : 'border-slate-300 hover:border-[#0057B8] bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) pickFile(e.target.files[0]);
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-100/60 text-[#0057B8] flex items-center justify-center mx-auto mb-3">
                <Icon name="upload_file" size={28} />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Pilih atau seret berkas PDF ECG di sini
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Mendukung dokumen PDF asli dari OMRON Complete HEM-7530T. Maksimal {MAX_MB}MB.
              </p>
            </div>
          </section>
        )}

        {/* STEP 2: Konfirmasi Berkas & Input Manual Tekanan Darah */}
        {step === 2 && (
          <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            {/* Selected Info Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pasien Terpilih</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{patient?.name}</p>
                <p className="text-xs font-mono text-slate-400">NIK: {patient?.nik}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Berkas PDF</span>
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[180px] mt-0.5">{file?.name}</p>
                  <p className="text-[11px] font-mono text-slate-400">{((file?.size || 0) / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#0057B8] hover:underline font-semibold"
                >
                  Ganti
                </button>
              </div>
            </div>

            {/* Manual Blood Pressure Inputs */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Icon name="favorite" size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Tekanan Darah (Manual Entry - Opsional)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                PDF ECG OMRON tidak memuat nilai tekanan darah pada hasil ECG. Masukkan nilai Sistolik & Diastolik manual jika tersedia:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="input-systolic">
                    Sistolik (mmHg)
                  </label>
                  <input
                    id="input-systolic"
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 120"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="input-diastolic">
                    Diastolik (mmHg)
                  </label>
                  <input
                    id="input-diastolic"
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={diastolicBp}
                    onChange={(e) => setDiastolicBp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 80"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>
              </div>
            </div>

            {/* Tags & Notes */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="input-tags">
                  Tags (Opsional)
                </label>
                <input
                  id="input-tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Contoh: Pemeriksaan Rutin, Posyandu Lansia"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="input-notes">
                  Catatan Petugas (Opsional)
                </label>
                <textarea
                  id="input-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Kondisi pasien saat pengukuran, keluhan yang dirasakan, dll..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={uploading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Kembali
              </button>

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2.5 bg-[#0057B8] hover:bg-[#00479E] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2 transition-all hover:shadow"
              >
                {uploading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Menyimpan & Membaca PDF...</span>
                  </>
                ) : (
                  <>
                    <Icon name="cloud_upload" size={18} />
                    <span>Upload & Arsipkan ECG</span>
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
