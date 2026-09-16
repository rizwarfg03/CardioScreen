import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function PublicLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src="/images/logo.png" alt="CardioScreen Health Monitoring" className="h-10 lg:h-14 object-contain" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-700">
              <Link to="/" className="hover:text-[#0057B8] transition-colors">Home</Link>
              <a href="/#about" className="hover:text-[#0057B8] transition-colors">About</a>
              <a href="/#why-choose" className="hover:text-[#0057B8] transition-colors">Technology</a>
              <Link to="/team" className="hover:text-[#0057B8] transition-colors">Team</Link>
              <Link to="/biomedical-engineering" className="hover:text-[#0057B8] transition-colors">Research</Link>
              <a href="/#contact" className="hover:text-[#0057B8] transition-colors">Contact</a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4 text-sm font-semibold">
              {user ? (
                <Link to="/dashboard" className="flex items-center gap-1 hover:text-[#0057B8] transition-colors">
                  <Icon name="dashboard" size={20} />
                  User Dashboard
                </Link>
              ) : (
                <Link to="/login" className="flex items-center gap-1 hover:text-[#0057B8] transition-colors">
                  <Icon name="person" size={20} />
                  Register/Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        {children}
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-[#001f3f] text-slate-300 py-16 border-t-4 border-[#0057B8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <div className="mb-6 bg-white inline-block p-2 rounded-xl">
                <Link to="/">
                  <img src="/images/logo.png" alt="CardioScreen Health Monitoring" className="h-10 lg:h-12 object-contain" />
                </Link>
              </div>
              <h4 className="text-lg text-white font-serif mb-2">Digital Cardiovascular Health Platform</h4>
              <p className="text-sm text-slate-400 max-w-md">
                Developed through biomedical innovation and digital healthcare transformation.
              </p>
            </div>
            
            <div className="flex gap-16 md:justify-end">
              <div className="flex flex-col gap-3">
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <a href="/#about" className="hover:text-white transition-colors">About</a>
                <a href="/#why-choose" className="hover:text-white transition-colors">Technology</a>
              </div>
              <div className="flex flex-col gap-3">
                <Link to="/team" className="hover:text-white transition-colors">Team</Link>
                <Link to="/biomedical-engineering" className="hover:text-white transition-colors">Research</Link>
                <a href="/#contact" className="hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-700 text-center text-xs text-slate-500">
            <p>© 2026 CardioScreen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
