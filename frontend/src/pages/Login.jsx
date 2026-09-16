import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { value: 'nurse', label: 'Perawat', icon: 'medical_services' },
  { value: 'doctor', label: 'Dokter', icon: 'stethoscope' },
  { value: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
];

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState('nurse');
  const [staffCode, setStaffCode] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    new URLSearchParams(location.search).get('expired') ? 'Sesi habis. Silakan login ulang.' : ''
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(staffCode.trim().toUpperCase(), password, role);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172033] flex flex-col justify-between">
      {/* Top Academic Header Bar */}
      <header className="bg-white border-b border-[#D9E0E8] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/images/logo.png" alt="CardioScreen Health Monitoring" className="h-8 sm:h-10 object-contain" />
        </Link>

        {/* Public Nav Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600">
          <Link to="/health-info" className="hover:text-[#0057B8] transition-colors">
            Informasi Kesehatan
          </Link>
          <Link to="/team" className="hover:text-[#0057B8] transition-colors">
            Tim Pengembang
          </Link>
          <Link to="/about-system" className="hover:text-[#0057B8] transition-colors">
            Tentang Sistem
          </Link>
        </nav>
      </header>

      {/* Main Two-Column Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* LEFT COLUMN: Academic & Clinical Platform Introduction */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0057B8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <Icon name="verified" size={14} />
              Portal Akademik & Pelayanan Medis
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Teknologi, kesehatan, dan inovasi untuk masa depan pelayanan kesehatan.
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
              Platform terintegrasi CardioScreen yang menggabungkan sistem pengarsipan elektrokardiogram (ECG) klinis, penelaahan medis, dan pusat edukasi kesehatan kardiovaskular.
            </p>
          </div>

          {/* Clinical Feature List (Non-AI, Grounded & Factual) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-xl bg-white border border-[#D9E0E8] shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center shrink-0">
                <Icon name="monitor_heart" size={18} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">Arsip Digital ECG</h2>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Pengarsipan dokumen PDF asli OMRON HEM-7530T resolusi tinggi dengan grid 25mm/s, 10mm/mV.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#D9E0E8] shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center shrink-0">
                <Icon name="assignment_turned_in" size={18} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">Verifikasi Dokter</h2>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Validasi telaah irama jantung oleh dokter pemeriksa dilengkapi tanda tangan digital resmi.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#D9E0E8] shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center shrink-0">
                <Icon name="menu_book" size={18} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">Informasi Kesehatan</h2>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Artikel edukasi kesehatan kardiovaskular terstandarisasi untuk masyarakat umum.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#D9E0E8] shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center shrink-0">
                <Icon name="biotech" size={18} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">Riset Biomedis UNAIR</h2>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Pengembangan teknologi instrumentasi dan pemrosesan sinyal hayati dalam konteks pengabdian masyarakat.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Public Links for Mobile / Direct Access */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-500 font-medium">Akses Publik:</span>
            <Link
              to="/health-info"
              className="text-[#0057B8] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Lihat Informasi Kesehatan</span>
              <Icon name="arrow_forward" size={14} />
            </Link>
            <span className="text-slate-300">·</span>
            <Link to="/team" className="text-slate-600 hover:text-[#0057B8] font-medium">
              Tim Pengembang
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Formal Medical Login Box */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#D9E0E8] space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Masuk ke Sistem</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih peran dan masukkan kredensial staf fasilitas kesehatan.
              </p>
            </div>

            {/* Role Tab Selector */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Peran Pengguna (Role)
              </label>
              <div
                className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80"
                role="tablist"
                aria-label="Pilih peran pengguna"
              >
                {ROLES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={role === item.value}
                    onClick={() => setRole(item.value)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      role === item.value
                        ? 'bg-white text-[#0057B8] shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1" htmlFor="staffCode">
                  Kode Staf / Username
                </label>
                <div className="relative">
                  <Icon name="badge" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="staffCode"
                    name="staffCode"
                    type="text"
                    autoComplete="username"
                    required
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    placeholder="Contoh: PRW-0001 / DOK-0001 / ADM-0001"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8] transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="password">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Icon name="lock" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    <Icon name={showPassword ? 'visibility' : 'visibility_off'} size={18} />
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0057B8] focus:ring-[#0057B8]/20 border-slate-300"
                  />
                  <span>Remember me</span>
                </label>
                <span className="text-slate-400 text-[11px]" title="Hubungi administrator sistem untuk reset kata sandi">
                  Lupa password? Hubungi Admin
                </span>
              </div>

              <ErrorNotice message={error} />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0057B8] hover:bg-[#00479E] text-white rounded-xl py-2.5 px-4 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                <span>{submitting ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
                <Icon name="arrow_forward" size={16} />
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Developed for biomedical engineering and healthcare education.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Academic Note */}
      <footer className="bg-white border-t border-[#D9E0E8] py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <p>
          © 2026 CardioScreen · Platform Informasi Kesehatan dan Teknologi Biomedis.
        </p>
      </footer>
    </div>
  );
}

