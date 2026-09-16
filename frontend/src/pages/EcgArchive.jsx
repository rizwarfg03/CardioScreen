import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime, maskNik } from '../utils/format.js';

export default function EcgArchive() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRhythm, setFilterRhythm] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all | verified | draft

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .records(searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '')
      .then((res) => setRecords(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const handleDownloadFile = async (rec) => {
    try {
      const blobUrl = await api.fileBlobUrl(rec.id);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = rec.file_name || `ECG-${rec.patient_name}-${rec.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      alert('Gagal mengunduh berkas: ' + err.message);
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteRecord(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      alert('Gagal menghapus rekaman: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filter client-side
  const filteredRecords = records.filter((r) => {
    if (filterRhythm === 'normal' && r.is_abnormal) return false;
    if (filterRhythm === 'abnormal' && !r.is_abnormal) return false;
    if (filterStatus === 'verified' && !r.verified_at && !r.doctor_signature) return false;
    if (filterStatus === 'draft' && (r.verified_at || r.doctor_signature)) return false;
    return true;
  });

  const totalCount = records.length;
  const verifiedCount = records.filter((r) => r.verified_at || r.doctor_signature).length;
  const pendingCount = totalCount - verifiedCount;

  return (
    <AppLayout breadcrumb={['Arsip ECG']}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-[#0057B8]/10 flex items-center justify-center text-[#0057B8]">
                <Icon name="archive" size={18} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Arsip Rekam Medis ECG
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Dokumen pemeriksaan elektrokardiografi resmi dari perangkat OMRON Complete HEM-7530T.
            </p>
          </div>

          {['nurse', 'admin'].includes(user?.role) && (
            <Link
              to="/upload"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0057B8] hover:bg-[#00479E] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Icon name="upload_file" size={16} />
              <span>Unggah Berkas PDF ECG</span>
            </Link>
          )}
        </div>

        {/* Clinical Summary Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Arsip</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{totalCount}</span>
            <span className="text-[10px] text-slate-400">Pemeriksaan tersimpan</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Terverifikasi Dokter</span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">{verifiedCount}</span>
            <span className="text-[10px] text-slate-400">Laporan bertanda tangan</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Menunggu Verifikasi</span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">{pendingCount}</span>
            <span className="text-[10px] text-slate-400">Status draft pemeriksaan</span>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pasien, NIK, atau ritme..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterRhythm}
              onChange={(e) => setFilterRhythm(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Semua Ritme</option>
              <option value="normal">Normal Sinus Rhythm</option>
              <option value="abnormal">Perlu Perhatian (Abnormal)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Semua Status Laporan</option>
              <option value="verified">Terverifikasi Dokter</option>
              <option value="draft">Draft (Belum Verifikasi)</option>
            </select>
          </div>
        </div>

        <ErrorNotice message={error} />

        {/* Clinical Archive Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <Spinner label="Memuat arsip rekam medis ECG..." />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                <Icon name="folder_off" size={24} />
              </div>
              <h3 className="text-xs font-bold text-slate-700">Tidak Ditemukan Rekam Pemeriksaan</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {searchQuery ? 'Coba sesuaikan kata kunci pencarian pasien.' : 'Belum ada data rekaman ECG di dalam arsip.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Identitas Pasien</th>
                    <th className="px-4 py-3">Waktu Rekam</th>
                    <th className="px-3 py-3 text-center">Detak Jantung</th>
                    <th className="px-4 py-3">Hasil Analisis</th>
                    <th className="px-4 py-3">Tekanan Darah</th>
                    <th className="px-4 py-3 text-center">Status Verifikasi</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r) => {
                    const hasBp = r.systolic_bp != null && r.diastolic_bp != null;
                    const isRecVerified = Boolean(r.verified_at || r.doctor_signature);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Pasien */}
                        <td className="px-4 py-3.5">
                          <div>
                            <Link
                              to={`/ecg/${r.id}`}
                              className="font-bold text-slate-900 hover:text-[#0057B8] transition-colors"
                            >
                              {r.patient_name}
                            </Link>
                            <p className="text-[11px] text-slate-400 font-mono">
                              NIK: {maskNik(r.patient_nik)}
                            </p>
                          </div>
                        </td>

                        {/* Waktu Rekam */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-medium text-slate-800">{formatDateTime(r.recorded_at)}</p>
                          <span className="text-[10px] text-blue-600 font-medium font-mono">Durasi: {r.duration_sec ? `${r.duration_sec}s` : '30s'}</span>
                        </td>

                        {/* Detak Jantung */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          {r.bpm ? (
                            <div>
                              <span className="font-mono font-bold text-slate-900 text-sm">{r.bpm}</span>{' '}
                              <span className="text-[10px] text-slate-500">bpm</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        {/* Hasil Analisis */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge tone={r.is_abnormal ? 'abnormal' : 'normal'}>
                            {r.instant_analysis || r.classification || 'Normal'}
                          </StatusBadge>
                        </td>

                        {/* Tekanan Darah (Manual Entry) */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {hasBp ? (
                            <div>
                              <span className="font-mono font-bold text-slate-800">
                                {r.systolic_bp}/{r.diastolic_bp}
                              </span>{' '}
                              <span className="text-[10px] text-slate-500">mmHg</span>
                              <span className="block text-[9px] text-slate-400">Manual Entry</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        {/* Status Verifikasi */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {isRecVerified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Icon name="check_circle" size={12} />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              Draft
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <Link
                              to={`/ecg/${r.id}`}
                              className="px-2.5 py-1 rounded bg-[#0057B8] hover:bg-[#00479E] text-white text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Buka Dokumen Pemeriksaan"
                            >
                              <Icon name="visibility" size={14} />
                              <span>Lihat</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDownloadFile(r)}
                              className="p-1 rounded text-slate-500 hover:text-[#0057B8] hover:bg-blue-50 transition-colors"
                              title="Unduh Berkas PDF Asli OMRON"
                            >
                              <Icon name="download" size={15} />
                            </button>

                            {user?.role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(r)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Hapus Dokumen"
                              >
                                <Icon name="delete" size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <Icon name="warning" size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Hapus Dokumen ECG?</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Dokumen hasil pemeriksaan pasien <strong>{deleteTarget.patient_name}</strong> akan dihapus permanen dari server.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRecord}
                  disabled={deleting}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
