import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { Calendar, LogOut, Menu, ArrowRightLeft } from 'lucide-react';

export function Header({
  onToggleSidebar,
  onOpenMobile,
  activePageTitle,
  tanggalAcuan,
  logoUrl,
}) {
  const { user, login, logout, isAdmin } = useAuth();

  const handleQuickSwitchRole = () => {
    if (isAdmin) {
      login('karyawan@apotek.local', 'karyawan123');
    } else {
      login('admin@apotek.local', 'admin123');
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 w-full max-w-full">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button (>= 44x44px touch target) */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-700 active:scale-95 transition md:hidden shrink-0"
          aria-label="Buka menu navigasi"
          title="Buka menu navigasi"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>

        {/* Desktop Toggle Sidebar Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition md:inline-flex hidden shrink-0"
          title="Buka / Tutup Sidebar"
          aria-label="Buka / Tutup Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo visible on mobile */}
        <div className="md:hidden shrink-0">
          <BrandLogo logoUrl={logoUrl} className="w-8 h-8 rounded-xl shadow-xs" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block leading-tight truncate">
              Apotek Asahan Farma
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          </div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[130px] sm:max-w-xs md:max-w-md">
            {activePageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Acuan: <strong className="text-slate-900">{tanggalAcuan || '2026-10-31'}</strong></span>
        </div>

        {/* Quick Switch Role button (>= 44px touch target) */}
        <button
          type="button"
          onClick={handleQuickSwitchRole}
          className="flex items-center gap-1.5 text-xs px-2.5 sm:px-3 h-11 min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95 shadow-2xs"
          title="Beralih cepat antara Admin (Bu Anni) dan Karyawan"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="hidden md:inline text-slate-500 font-medium">Mode:</span>
          <span className={isAdmin ? 'text-blue-700 font-bold' : 'text-slate-800 font-bold'}>
            <span className="hidden sm:inline">{isAdmin ? 'Pemilik (Bu Anni)' : 'Karyawan'}</span>
            <span className="sm:hidden">{isAdmin ? 'Bu Anni' : 'Karyawan'}</span>
          </span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200">
          <div
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0"
            title={user?.nama || 'Pengguna'}
          >
            {user?.nama?.[0] || 'A'}
          </div>
          {/* Logout button (>= 44x44px touch target) */}
          <button
            type="button"
            onClick={logout}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 active:scale-95 transition shrink-0"
            title="Keluar"
            aria-label="Keluar dari sistem"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
