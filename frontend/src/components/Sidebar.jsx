import { NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABEL } from '../utils/format.js';

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/patients', icon: 'folder_shared', label: 'Data Pasien', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/archive', icon: 'archive', label: 'Arsip ECG', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/upload', icon: 'upload_file', label: 'Unggah PDF ECG', roles: ['nurse', 'admin'] },
  { to: '/health-info', icon: 'menu_book', label: 'Informasi Kesehatan', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/team', icon: 'groups', label: 'Tim Pengembang', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/about-system', icon: 'info', label: 'Tentang Sistem', roles: ['nurse', 'doctor', 'admin'] },
  { to: '/admin', icon: 'settings_applications', label: 'Sistem & Admin', roles: ['admin'] },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
    isActive
      ? 'bg-blue-50 text-[#0057B8] font-semibold'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
  }`;

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Tutup menu"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <nav className="fixed left-0 top-0 bottom-0 w-[300px] bg-white text-slate-900 flex flex-col p-6 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center">
            <img src="/images/logo.png" alt="CardioScreen Health Monitoring" className="h-8 object-contain" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <Icon name="close" size={20} />
          </button>
        </div>


        {['nurse', 'admin'].includes(user?.role) && (
          <div className="my-5">
            <NavLink
              to="/upload"
              onClick={onClose}
              className="w-full bg-primary text-white py-2.5 rounded-full text-sm font-semibold
                         flex items-center justify-center gap-2 shadow-sm hover:bg-primary-hover transition-colors"
            >
              <Icon name="add_circle" size={18} />
              Rekam ECG Baru
            </NavLink>
          </div>
        )}

        <ul className="flex-1 overflow-y-auto space-y-1.5 my-2">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClass} onClick={onClose}>
                <Icon name={item.icon} size={20} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="pt-5 border-t border-slate-100 space-y-2">
          <div className="px-3 py-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500">
              {ROLE_LABEL[user?.role] || user?.role} · <span className="font-mono">{user?.staffCode}</span>
            </p>
          </div>
          <NavLink
            to="/change-password"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium"
            onClick={onClose}
          >
            <Icon name="lock_reset" size={18} />
            <span>Ganti Password</span>
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
          >
            <Icon name="logout" size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
