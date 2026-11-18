import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, LogOut, Menu, PanelLeft, ArrowRightLeft } from 'lucide-react';

export function Header({
  onToggleSidebar,
  onOpenMobile,
  activePageTitle,
  tanggalAcuan,
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
    <header className="h-14 bg-[#f8faff]/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 lg:px-5 w-full max-w-full border-b border-slate-200/90 shadow-[0_4px_14px_-4px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-2 min-w-0">
        {/* Tombol Hamburger Mobile */}
        <button
          type="button"
          data-testid="mobile-hamburger"
          onClick={onOpenMobile}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white text-slate-700 active:scale-95 transition md:hidden shrink-0"
          aria-label="Buka menu navigasi"
          title="Buka menu navigasi"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>

        {/* Tombol Lipat Sidebar Desktop */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200/80 hover:border-blue-300 text-slate-500 hover:text-slate-900 transition shadow-2xs md:inline-flex hidden shrink-0 cursor-pointer"
          title="Buka / Tutup Sidebar"
          aria-label="Buka / Tutup Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="min-w-0 flex items-center gap-2 pl-0.5">
          <span className="hidden md:inline text-xs font-semibold text-slate-400">
            SIMAAF /
          </span>
          <h1
            data-testid="page-title"
            className="text-sm sm:text-[15px] font-extrabold text-slate-950 tracking-tight leading-tight truncate"
          >
            {activePageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/90 border border-slate-200/80 text-slate-600 text-xs font-semibold shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            Acuan <strong className="text-slate-950 tabular-nums ml-0.5">{tanggalAcuan || '2026-10-31'}</strong>
          </span>
        </div>

        {/* Pengalih Peran Cepat Bergaya Kapsul Profil */}
        <button
          type="button"
          onClick={handleQuickSwitchRole}
          className="flex items-center gap-2 text-xs pl-1.5 pr-3 h-11 sm:h-9 min-h-[44px] sm:min-h-0 rounded-full border border-slate-200/85 bg-white hover:bg-slate-50 text-slate-800 font-bold transition shadow-2xs active:scale-95 cursor-pointer"
          title="Beralih antara Pemilik (Ibu Anni) dan Karyawan"
        >
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
            {isAdmin ? 'IA' : 'ST'}
          </span>
          <span>{isAdmin ? 'Ibu Anni' : 'Karyawan'}</span>
          <ArrowRightLeft className="w-3 h-3 text-slate-400 shrink-0" />
        </button>

        {/* Tombol Keluar */}
        <button
          type="button"
          onClick={logout}
          className="w-11 h-11 sm:w-9 sm:h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-full bg-white/85 hover:bg-rose-50 border border-slate-200/80 text-slate-500 hover:text-rose-600 hover:border-rose-200 active:scale-95 transition shrink-0 cursor-pointer"
          title="Keluar"
          aria-label="Keluar dari sistem"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
