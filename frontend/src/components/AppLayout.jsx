import { useState } from 'react';
import Topbar from './Topbar.jsx';
import Sidebar from './Sidebar.jsx';

/**
 * Layout modern Bisfit:
 * - Topbar horizontal sticky di atas
 * - Mobile slide-over drawer ketika menu hamburguer ditekan
 * - Area konten responsif dengan padding lega dan background halus
 */
export default function AppLayout({ breadcrumb, actions, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      {/* Mobile Drawer Navigation */}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Main Topbar */}
      <Topbar onMenuClick={() => setMenuOpen(true)} breadcrumb={breadcrumb} actions={actions} />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
