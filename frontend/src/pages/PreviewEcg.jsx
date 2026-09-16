import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EcgPdfViewer from '../components/EcgPdfViewer.jsx';
import DoctorSignaturePad from '../components/DoctorSignaturePad.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime, maskNik } from '../utils/format.js';

export default function PreviewEcg() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState(null);

  // Edit Blood Pressure & Notes Modal
  const [editOpen, setEditOpen] = useState(false);
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Doctor Signature Modal
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  // Delete State
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .record(id)
      .then((res) => {
        setRecord(res.data);
        setSystolicBp(res.data.systolic_bp != null ? String(res.data.systolic_bp) : '');
        setDiastolicBp(res.data.diastolic_bp != null ? String(res.data.diastolic_bp) : '');
        setNotes(res.data.notes || '');
        setTags(res.data.tags || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  // Load PDF Blob URL for secure viewer display
  useEffect(() => {
    if (!record) return undefined;
    let url;
    api
      .fileBlobUrl(record.id)
      .then((blobUrl) => {
        url = blobUrl;
        setFileUrl(blobUrl);
      })
      .catch(() => setFileUrl(null));

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [record]);

  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');

    try {
      const res = await api.updateRecord(id, {
        systolicBp: systolicBp.trim() === '' ? null : Number(systolicBp),
        diastolicBp: diastolicBp.trim() === '' ? null : Number(diastolicBp),
        notes: notes.trim() || null,
        tags: tags.trim() || null,
      });
      setRecord(res.data);
      setEditOpen(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDoctorVerification = async (data) => {
    setSavingSignature(true);
    try {
      const res = await api.verifyDoctor(id, data);
      setRecord(res.data);
      setSignatureModalOpen(false);
    } catch (err) {
      alert('Gagal menyimpan verifikasi dokter: ' + err.message);
    } finally {
      setSavingSignature(false);
    }
  };

  const handlePrintReport = async () => {
    try {
      await api.markPrinted(id).catch(() => {});
      window.print();
    } catch (e) {
      window.print();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await api.deleteRecord(id);
      navigate('/archive');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <AppLayout breadcrumb={['Arsip ECG', 'Memuat...']}>
        <div className="py-20 text-center">
          <Spinner label="Memuat dokumen pemeriksaan klinis..." />
        </div>
      </AppLayout>
    );
  }

  if (!record) {
    return (
      <AppLayout breadcrumb={['Arsip ECG', 'Hasil Tidak Ditemukan']}>
        <div className="max-w-xl mx-auto py-12">
          <ErrorNotice message={error || 'Dokumen pemeriksaan ECG tidak ditemukan.'} onRetry={load} />
          <div className="mt-4 text-center">
            <Link to="/archive" className="text-sm font-semibold text-[#0057B8] hover:underline">
              ← Kembali ke Arsip ECG
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const hasBp = record.systolic_bp != null && record.diastolic_bp != null;
  const isVerified = Boolean(record.verified_at || record.doctor_signature);
  const isDoctorOrAdmin = ['doctor', 'admin'].includes(user?.role);

  return (
    <AppLayout breadcrumb={['Arsip ECG', `Pemeriksaan #${record.id}`]}>
      {/* Container - Screen & Print Friendly */}
      <div className="max-w-5xl mx-auto space-y-6 print:space-y-4 print:max-w-full print:p-0">
        {/* Screen Header Bar (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              to="/archive"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Kembali ke Arsip"
            >
              <Icon name="arrow_back" size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Lembar Hasil Pemeriksaan ECG
                </h1>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  REF: #{record.id}
                </span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Icon name="verified" size={13} /> Terverifikasi Dokter
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Draft (Menunggu Verifikasi)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Alat Perekam: <span className="font-semibold text-slate-700">{record.source_device || 'OMRON Complete HEM-7530T'}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrintReport}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Cetak Format Lembar Medis Pasien A4"
            >
              <Icon name="print" size={16} className="text-[#0057B8]" />
              <span>Cetak Laporan Pasien</span>
            </button>

            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Icon name="edit" size={15} />
              <span>Edit Data Manual</span>
            </button>

            {fileUrl && (
              <a
                href={fileUrl}
                download={record.file_name || `ECG-${record.patient_name}-${record.id}.pdf`}
                className="px-3 py-2 rounded-xl bg-[#0057B8] hover:bg-[#00479E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Icon name="download" size={15} />
                <span>Unduh PDF Asli</span>
              </a>
            )}

            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                title="Hapus Rekaman"
              >
                <Icon name="delete" size={16} />
              </button>
            )}
          </div>
        </div>

        <ErrorNotice message={error} />

        {/* PRINTABLE OFFICIAL MEDICAL DOCUMENT WRAPPER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">
          {/* Official Clinic / Hospital Header (Always visible & crisp on Print) */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 print:bg-white print:p-0 print:pb-4 print:border-b-2 print:border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight print:text-xl">
                  LEMBAR HASIL PEMERIKSAAN ELEKTROKARDIOGRAFI (ECG)
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5 print:text-slate-700">
                  Fasilitas Pelayanan Kesehatan / Klinik Pratama & Posyandu
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-500">
                <p className="font-bold text-slate-800">NO. REKAM: ECG-{String(record.id).padStart(6, '0')}</p>
                <p className="text-[11px]">Tgl Cetak: {formatDateTime(new Date().toISOString())}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6 print:p-0 print:space-y-4">
            {/* SECTION A: INFORMASI PASIEN */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                <span className="w-1.5 h-4 bg-[#0057B8] rounded-full print:hidden" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  INFORMASI PASIEN
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Nama Pasien</span>
                  <span className="font-bold text-slate-900 text-sm">{record.patient_name || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">NIK</span>
                  <span className="font-mono font-bold text-slate-800">{record.patient_nik || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Nomor Telepon</span>
                  <span className="font-mono text-slate-800">{record.patient_phone || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Tanggal Lahir</span>
                  <span className="text-slate-800 font-medium">
                    {record.patient_birth_date ? formatDateTime(record.patient_birth_date).split(',')[0] : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Jenis Kelamin</span>
                  <span className="text-slate-800 font-medium">
                    {record.patient_sex === 'L' ? 'Laki-laki (L)' : record.patient_sex === 'P' ? 'Perempuan (P)' : '-'}
                  </span>
                </div>
              </div>
            </section>

            {/* SECTION B: HASIL PEMERIKSAAN ECG */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                <span className="w-1.5 h-4 bg-[#0057B8] rounded-full print:hidden" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  HASIL PEMERIKSAAN ECG
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {/* Heart Rate / BPM */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 print:bg-white print:p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium block">Heart Rate</span>
                    <span className="text-[10px] text-blue-600 font-semibold print:hidden">From ECG PDF</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 text-base">{record.bpm || '-'}</span>
                    <span className="text-[11px] text-slate-500">bpm</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 print:bg-white print:p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium block">Duration</span>
                    <span className="text-[10px] text-blue-600 font-semibold print:hidden">From ECG PDF</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 text-base">
                      {record.duration_sec ? `${record.duration_sec}` : '30'}
                    </span>
                    <span className="text-[11px] text-slate-500">s</span>
                  </div>
                </div>

                {/* Instant Analysis */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 print:bg-white print:p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium block">Instant Analysis</span>
                    <span className="text-[10px] text-blue-600 font-semibold print:hidden">From ECG PDF</span>
                  </div>
                  <div className="mt-1">
                    <StatusBadge tone={record.is_abnormal ? 'abnormal' : 'normal'}>
                      {record.instant_analysis || record.classification || 'Normal'}
                    </StatusBadge>
                  </div>
                </div>

                {/* Recorded Time */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 print:bg-white print:p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium block">Recorded</span>
                    <span className="text-[10px] text-blue-600 font-semibold print:hidden">From ECG PDF</span>
                  </div>
                  <span className="font-bold text-slate-900 block mt-0.5">{formatDateTime(record.recorded_at)}</span>
                  {record.tags && (
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">Tags: {record.tags}</span>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION C: TEKANAN DARAH (BLOOD PRESSURE) */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                <span className="w-1.5 h-4 bg-[#0057B8] rounded-full print:hidden" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  TEKANAN DARAH (BLOOD PRESSURE)
                </h3>
              </div>

              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/70 print:bg-white print:border-slate-200 print:p-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <span className="text-xs text-slate-600 font-medium">
                    Data Tekanan Darah (Input Manual):
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded self-start print:hidden">
                    Source: Manual Entry
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Sistolik</span>
                    <span className="font-mono font-bold text-slate-900 text-base">
                      {record.systolic_bp != null ? `${record.systolic_bp} mmHg` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Diastolik</span>
                    <span className="font-mono font-bold text-slate-900 text-base">
                      {record.diastolic_bp != null ? `${record.diastolic_bp} mmHg` : '-'}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-medium block">Sumber Data</span>
                    <span className="font-semibold text-slate-700 text-xs">
                      {hasBp ? 'Manual Entry' : 'Belum diisi'}
                    </span>
                    {!hasBp && (
                      <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="text-[11px] text-[#0057B8] font-semibold hover:underline block mt-0.5 print:hidden"
                      >
                        + Input Nilai BP
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION D: HASIL ECG / LEAD / ECG WAVEFORM */}
            <section className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#0057B8] rounded-full print:hidden" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    HASIL ECG / LEAD / ECG WAVEFORM
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                  <span>Lead/Channel: <strong className="text-slate-800">{record.lead_info || '-'}</strong></span>
                  <span>Skala: <strong className="text-slate-800">{record.scale_info || '25 mm/s, 10 mm/mV'}</strong></span>
                </div>
              </div>

              {/* PDF.js Viewer (On Screen and On Print) */}
              <div className="w-full">
                {fileUrl ? (
                  <EcgPdfViewer
                    pdfUrl={fileUrl}
                    fileName={record.file_name}
                    durationSec={record.duration_sec || 30}
                    scaleInfo={record.scale_info || '25 mm/s, 10 mm/mV'}
                    leadInfo={record.lead_info}
                  />
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200">
                    <Spinner label="Menghubungkan ke berkas ECG PDF..." />
                  </div>
                )}
              </div>
            </section>


            {/* SECTION E: CATATAN PETUGAS */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                <span className="w-1.5 h-4 bg-[#0057B8] rounded-full print:hidden" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  CATATAN PETUGAS
                </h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 min-h-[48px] print:bg-white">
                {record.notes || <span className="text-slate-400 italic">Tidak ada catatan klinis khusus.</span>}
              </div>
            </section>

            {/* SECTION F: VERIFIKASI DOKTER */}
            <section className="pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 pb-2 mb-2">
                <span className="w-1.5 h-4 bg-[#0057B8] rounded-full print:hidden" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  VERIFIKASI DOKTER
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                {/* Disclaimer Klinis */}
                <div className="max-w-md text-[11px] text-slate-400 leading-relaxed">
                  <p className="font-semibold text-slate-600 mb-0.5">Catatan Medis Penting:</p>
                  Hasil Instant Analysis merupakan pembacaan otomatis dari perangkat ECG dan bukan diagnosis tunggal.
                  Diagnosis pasti ditegakkan berdasarkan telaah klinis komprehensif oleh dokter pemeriksa.
                </div>

                {/* Doctor Signature Block */}
                <div className="w-64 text-center">
                  <p className="text-xs text-slate-500 mb-1">
                    {record.verified_at ? formatDateTime(record.verified_at).split(',')[0] : 'Dokter Pemeriksa / Verifikator'},
                  </p>

                  {/* Doctor Signature Image / Pad Trigger */}
                  <div className="h-28 flex items-center justify-center border-b border-slate-800 pb-1 relative">
                    {record.doctor_signature ? (
                      <img
                        src={record.doctor_signature}
                        alt="Tanda Tangan Dokter"
                        className="max-h-24 max-w-full object-contain mx-auto"
                      />
                    ) : (
                      <div className="print:hidden">
                        {isDoctorOrAdmin ? (
                          <button
                            type="button"
                            onClick={() => setSignatureModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0057B8] text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1.5 mx-auto"
                          >
                            <Icon name="draw" size={16} />
                            <span>Tanda Tangani Laporan</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Menunggu Tanda Tangan Dokter</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Doctor Name & License */}
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    ( {record.doctor_name || '...................................................'} )
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {record.doctor_license ? `SIP: ${record.doctor_license}` : 'SIP / NIP Dokter'}
                  </p>
                  {record.verified_at && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Tgl Verifikasi: {formatDateTime(record.verified_at)}
                    </p>
                  )}
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Doctor Signature Modal Component */}
        {signatureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <DoctorSignaturePad
              defaultDoctorName={record.doctor_name || user?.name}
              defaultDoctorLicense={record.doctor_license || ''}
              onSave={handleSaveDoctorVerification}
              onCancel={() => setSignatureModalOpen(false)}
            />
          </div>
        )}

        {/* Edit Manual Blood Pressure & Notes Modal */}
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center">
                    <Icon name="edit_note" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Sunting Data Manual</h3>
                    <p className="text-xs text-slate-500">Pasien: {record.patient_name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveMetadata} className="mt-4 space-y-4">
                <ErrorNotice message={saveError} />

                {/* Blood Pressure Input */}
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs text-slate-700">
                  <p className="font-semibold text-amber-900 mb-0.5">Pengukuran Tekanan Darah (Manual Entry):</p>
                  Masukkan nilai numerik Sistolik & Diastolik (mmHg):
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="modal-systolic">
                      Sistolik (mmHg)
                    </label>
                    <input
                      id="modal-systolic"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="modal-diastolic">
                      Diastolik (mmHg)
                    </label>
                    <input
                      id="modal-diastolic"
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

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="modal-tags">
                    Tags (Opsional)
                  </label>
                  <input
                    id="modal-tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Contoh: Rutin, Pasca Istirahat"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="modal-notes">
                    Catatan Klinis Petugas
                  </label>
                  <textarea
                    id="modal-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Keluhan pasien, kondisi saat pemeriksaan, atau rekomendasi..."
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-semibold bg-[#0057B8] hover:bg-[#00479E] text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Icon name="save" size={16} />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Alert */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <Icon name="warning" size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Hapus Dokumen ECG?</h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Berkas PDF asli dan data pemeriksaan pasien <strong>{record.patient_name}</strong> akan dihapus permanen.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
