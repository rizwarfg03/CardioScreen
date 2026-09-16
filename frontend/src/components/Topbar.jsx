import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABEL } from '../utils/format.js';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/patients', label: 'Pasien', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/archive', label: 'Arsip ECG', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/upload', label: 'Unggah PDF', roles: ['nurse', 'admin'] },
  { to: '/health-info', label: 'Informasi Kesehatan', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/team', label: 'Tim Pengembang', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/about-system', label: 'Tentang Sistem', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/admin', label: 'Sistem', roles: ['admin'] },
];

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patients?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <header className="bg-white sticky top-0 z-30 border-b border-[#D9E0E8] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
      {/* Kiri: Institutional Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="xl:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Buka menu navigasi"
        >
          <Icon name="menu" size={22} />
        </button>

        <NavLink to="/dashboard" className="flex items-center group">
          <img src="/images/logo.png" alt="CardioScreen Health Monitoring" className="h-8 sm:h-10 object-contain" />
        </NavLink>
      </div>

      {/* Tengah: Navigation Tabs (Desktop) */}
      <nav className="hidden xl:flex items-center gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-50 text-[#0057B8]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>


      {/* Kanan: Search Bar + Action Icons + Profile */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative hidden xl:flex items-center">
          <div className="absolute left-3.5 text-slate-400 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything in Bisfit"
            className="pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-56 transition-all placeholder:text-slate-400"
          />
        </form>

        {/* Action Icon: Document / Notification */}
        <button
          type="button"
          onClick={() => navigate('/patients')}
          title="Dokumen & Pasien"
          className="w-9 h-9 rounded-full border border-slate-200/90 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[19px]">assignment</span>
        </button>

        {/* Action Icon: User */}
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          title="Profil"
          className="w-9 h-9 rounded-full border border-slate-200/90 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[19px]">person</span>
        </button>

        {/* Dark Circle Profile Avatar & Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm hover:ring-2 hover:ring-slate-400 transition-all shadow-xs"
            aria-label="Menu akun"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Willian'}</p>
                <p className="text-xs text-slate-500">
                  {ROLE_LABEL[user?.role] || user?.role || 'Dokter'} ·{' '}
                  <span className="font-mono text-slate-700">{user?.staffCode || 'DOC-01'}</span>
                </p>
              </div>

              <div className="py-1">
                <NavLink
                  to="/change-password"
                  onClick={() => setProfileOpen(false)}
                  className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Icon name="lock_reset" size={18} />
                  <span>Ganti Password</span>
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <Icon name="logout" size={18} />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
