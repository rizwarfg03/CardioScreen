import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime, maskNik, ROLE_LABEL } from '../utils/format.js';
import { HEALTH_ARTICLES } from '../data/healthArticles.js';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.records('?limit=10'),
      api.patients('', 1, 0).catch(() => ({ total: 0 })),
    ])
      .then(([recRes, patRes]) => {
        setRecords(recRes.data || []);
        setPatientsCount(patRes.total || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const totalExams = records.length;
  const verifiedCount = records.filter((r) => r.verified_at || r.doctor_signature).length;
  const pendingCount = totalExams - verifiedCount;

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const latestArticles = HEALTH_ARTICLES.slice(0, 3);

  return (
    <AppLayout breadcrumb={['Dashboard']}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Institutional & Clinical Greeting */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0057B8] border border-blue-200 uppercase tracking-wider">
                CARDIOSCREEN
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {ROLE_LABEL[user?.role] || user?.role}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
              Selamat datang, {user?.name || 'Petugas Medis'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Portal Pengarsipan ECG OMRON Complete & Informasi Kesehatan CardioScreen · {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Link
              to="/"
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Icon name="web" size={16} />
              <span>Kembali ke Dashboard Informasi</span>
            </Link>

            {['nurse', 'admin'].includes(user?.role) && (
              <Link
                to="/upload"
                className="px-3.5 py-2 bg-[#0057B8] hover:bg-[#00479E] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Icon name="upload_file" size={16} />
                <span>Unggah ECG OMRON</span>
              </Link>
            )}

            <Link
              to="/archive"
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Icon name="archive" size={16} />
              <span>Arsip ECG</span>
            </Link>
          </div>
        </div>

        <ErrorNotice message={error} />

        {/* 4 Clinical Primary Metric Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Pemeriksaan ECG
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
              {totalExams}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Dokumen PDF tersimpan</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Data Pasien
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
              {patientsCount}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Pasien terdaftar</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
              Menunggu Verifikasi
            </span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block font-mono">
              {pendingCount}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Status draft pemeriksaan</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
              Terverifikasi Dokter
            </span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block font-mono">
              {verifiedCount}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Laporan bertanda tangan</span>
          </div>
        </div>

        {/* AKSES CEPAT (Quick Actions) */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Akses Cepat Layanan & Informasi
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {['nurse', 'admin'].includes(user?.role) && (
              <Link
                to="/upload"
                className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-[#0057B8] hover:shadow-xs transition-all flex flex-col items-center text-center group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Icon name="upload_file" size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0057B8]">
                  Unggah ECG
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Input PDF OMRON</span>
              </Link>
            )}

            <Link
              to="/archive"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-[#0057B8] hover:shadow-xs transition-all flex flex-col items-center text-center group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Icon name="archive" size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0057B8]">
                Arsip Rekaman
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Daftar Hasil ECG</span>
            </Link>

            <Link
              to="/patients"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-[#0057B8] hover:shadow-xs transition-all flex flex-col items-center text-center group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Icon name="groups" size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0057B8]">
                Data Pasien
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Riwayat & Profil</span>
            </Link>

            <Link
              to="/health-info"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-[#0057B8] hover:shadow-xs transition-all flex flex-col items-center text-center group"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Icon name="menu_book" size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0057B8]">
                Edukasi Sehat
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Artikel Kardiovaskular</span>
            </Link>



            <Link
              to="/about-system"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-[#0057B8] hover:shadow-xs transition-all flex flex-col items-center text-center group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Icon name="info" size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0057B8]">
                Tentang Sistem
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Spesifikasi & Privasi</span>
            </Link>
          </div>
        </div>

        {/* INFORMASI KESEHATAN TERBARU (Latest Health Info Section) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Icon name="favorite" size={18} className="text-rose-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Informasi Kesehatan & Edukasi Medis
                </h2>
                <p className="text-[11px] text-slate-500">
                  Materi edukasi kardiovaskular dan pemahaman pemeriksaan klinis
                </p>
              </div>
            </div>
            <Link
              to="/health-info"
              className="text-xs font-semibold text-[#0057B8] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua Artikel</span>
              <Icon name="chevron_right" size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestArticles.map((article) => (
              <div
                key={article.id}
                className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 flex flex-col justify-between hover:bg-white hover:border-[#0057B8] transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0057B8] border border-blue-100">
                      {article.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Icon name="schedule" size={12} />
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#0057B8] transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {article.publishedDate}
                  </span>
                  <Link
                    to={`/health-info/${article.id}`}
                    className="text-xs font-semibold text-[#0057B8] hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Baca</span>
                    <Icon name="arrow_forward" size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Clinical Examinations Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="history" size={18} className="text-[#0057B8]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Pemeriksaan ECG Terakhir
              </h2>
            </div>
            <Link
              to="/archive"
              className="text-xs font-semibold text-[#0057B8] hover:underline flex items-center gap-1"
            >
              <span>Lihat Seluruh Arsip</span>
              <Icon name="chevron_right" size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="py-14 text-center">
              <Spinner label="Memuat riwayat pemeriksaan..." />
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada hasil pemeriksaan ECG yang diunggah.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Nama Pasien</th>
                    <th className="px-4 py-3">Waktu Rekam</th>
                    <th className="px-3 py-3 text-center">Detak Jantung</th>
                    <th className="px-4 py-3">Hasil Analisis</th>
                    <th className="px-4 py-3">Tekanan Darah</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.slice(0, 8).map((r) => {
                    const hasBp = r.systolic_bp != null && r.diastolic_bp != null;
                    const isRecVerified = Boolean(r.verified_at || r.doctor_signature);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Pasien */}
                        <td className="px-4 py-3.5">
                          <Link
                            to={`/ecg/${r.id}`}
                            className="font-bold text-slate-900 hover:text-[#0057B8] transition-colors"
                          >
                            {r.patient_name}
                          </Link>
                          <p className="text-[11px] text-slate-400 font-mono">
                            NIK: {maskNik(r.patient_nik)}
                          </p>
                        </td>

                        {/* Waktu Rekam */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-medium text-slate-800">{formatDateTime(r.recorded_at)}</p>
                          <span className="text-[10px] text-blue-600 font-mono">From ECG PDF</span>
                        </td>

                        {/* BPM */}
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

                        {/* Analysis */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge tone={r.is_abnormal ? 'abnormal' : 'normal'}>
                            {r.instant_analysis || r.classification || 'Normal'}
                          </StatusBadge>
                        </td>

                        {/* Blood Pressure */}
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

                        {/* Status */}
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
                          <Link
                            to={`/ecg/${r.id}`}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-[#0057B8] text-slate-700 hover:text-white text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <Icon name="visibility" size={14} />
                            <span>Buka</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

