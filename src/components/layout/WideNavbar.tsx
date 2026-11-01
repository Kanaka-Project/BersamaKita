import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Heart,
  LayoutGrid,
  Radio,
  Package,
  Activity,
  LogOut,
  LogIn,
  Receipt,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

export const WideNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard Bencana', icon: LayoutGrid },
    { path: '/dashboard/analysis', label: 'Analisis Situasi', icon: Activity },
    { path: '/dashboard/reports', label: 'Transparansi Penyaluran', icon: Package },
    { path: '/dashboard/katalog', label: 'Katalog BMKG', icon: Radio },
    { path: '/my-donation', label: 'Donasi Saya', icon: Heart },
    { path: '/cek-transaksi', label: 'Cek Transaksi', icon: Receipt },
  ];

  const displayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Donatur';

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
    navigate('/');
  };

  const openMobileMenu = () => {
    setMobileMenuOpen(true);
    requestAnimationFrame(() => setDrawerVisible(true));
  };

  const closeMobileMenu = () => {
    setDrawerVisible(false);
    setTimeout(() => setMobileMenuOpen(false), 300);
  };

  const go = (path: string) => {
    navigate(path);
    closeMobileMenu();
  };

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-8 py-3 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand "Bersama Kita" */}
        <div
          onClick={() => navigate(user ? '/dashboard' : '/')}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
        >
          <div className="w-8 h-8 flex items-center justify-center shadow-sm">
            <img src="/assets/images/logo.svg" alt="Logo" className="w-8 h-8" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-[#1B3322] block leading-none">
              Bersama Kita
            </span>
            <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase block mt-0.5">
              Tanggap Bencana
            </span>
          </div>
        </div>

        {/* Center: Main Path-Based Navigation Tabs (desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-100 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    active ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile or Login CTA */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName[0].toUpperCase()
                )}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 max-w-30 truncate">
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors ml-0.5"
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth/login')}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-[#1B3322] hover:bg-[#243E2C] text-[#0C8F63] text-xs font-bold transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Masuk Donatur</span>
            </button>
          )}

          {/* Hamburger (mobile only) */}
          <button
            onClick={openMobileMenu}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-slate-900/60 transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div
            className={`relative z-10 w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
              drawerVisible ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <img src="/assets/images/logo.svg" alt="Logo" className="w-7 h-7" />
                <span className="font-extrabold text-sm tracking-tight text-[#1B3322]">
                  Bersama Kita
                </span>
              </div>
              <button
                onClick={closeMobileMenu}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Tutup menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    displayName[0].toUpperCase()
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-800 truncate">{displayName}</span>
              </div>
            )}

            {/* Drawer Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Menu navigasi">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 h-11 px-3 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
                      active
                        ? 'bg-slate-100 text-emerald-800 font-bold'
                        : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="shrink-0 border-t border-slate-200/80 px-4 py-3">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              ) : (
                <button
                  onClick={() => go('/auth/login')}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold bg-[#1B3322] text-[#0C8F63] hover:bg-[#243E2C] transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Donatur</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
