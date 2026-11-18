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
  const { login, logout, isAdmin } = useAuth();

  const handleQuickSwitchRole = () => {
    if (isAdmin) {
      login('karyawan@apotek.local', 'karyawan123');
    } else {
      login('admin@apotek.local', 'admin123');
    }
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900 text-white sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 w-full max-w-full">
      <div className="flex items-center gap-2 min-w-0">
        {/* Tombol Hamburger Mobile */}
        <button
          type="button"
          data-testid="mobile-hamburger"
          onClick={onOpenMobile}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-200 active:scale-95 transition md:hidden shrink-0"
          aria-label="Buka menu navigasi"
          title="Buka menu navigasi"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        {/* Tombol Lipat Sidebar Desktop */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition md:inline-flex hidden shrink-0"
          title="Buka / Tutup Sidebar"
          aria-label="Buka / Tutup Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo Ringkas di Mobile */}
        <div className="md:hidden shrink-0">
          <BrandLogo logoUrl={logoUrl} className="w-7 h-7 rounded-lg bg-white p-0.5" />
        </div>

        <div className="min-w-0">
          <h1
            data-testid="page-title"
            className="text-sm sm:text-[15px] font-bold text-white tracking-tight leading-tight truncate"
          >
            {activePageTitle}
          </h1>
          <p className="text-[11px] font-medium text-slate-400 leading-tight truncate">
            Apotek Asahan Farma
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            Acuan: <strong className="text-white tabular-nums">{tanggalAcuan || '2026-10-31'}</strong>
          </span>
        </div>

        {/* Pengalih Peran Cepat */}
        <button
          type="button"
          onClick={handleQuickSwitchRole}
          className="flex items-center gap-1.5 text-xs px-3 h-11 min-h-[44px] rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold transition active:scale-95"
          title="Beralih antara Pemilik (Ibu Anni) dan Karyawan"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{isAdmin ? 'Ibu Anni' : 'Karyawan'}</span>
        </button>

        {/* Tombol Keluar */}
        <button
          type="button"
          onClick={logout}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 hover:text-rose-400 active:scale-95 transition shrink-0"
          title="Keluar"
          aria-label="Keluar dari sistem"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
