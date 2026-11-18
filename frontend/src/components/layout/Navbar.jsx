import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, LogOut, Menu, ArrowRightLeft, Sparkles, Building2 } from 'lucide-react';

export function Navbar({ onToggleSidebar, activePageTitle, tanggalAcuan }) {
  const { user, login, logout, isAdmin } = useAuth();

  const handleQuickSwitchRole = () => {
    if (isAdmin) {
      login('karyawan@apotek.local', 'karyawan123');
    } else {
      login('admin@apotek.local', 'admin123');
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Kiri: Toggle & Judul Halaman */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition md:inline-flex hidden"
          title="Buka / Tutup Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block leading-tight">
              Apotek Asahan Farma
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight">
            {activePageTitle}
          </h1>
        </div>
      </div>

      {/* Kanan: Tanggal Acuan + Role Switcher + Profil */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Tanggal Acuan Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>Acuan: <strong className="text-slate-900">{tanggalAcuan || '2026-10-31'}</strong></span>
        </div>

        {/* Quick Switch Role Pill (Style catatbirowisata) */}
        <button
          onClick={handleQuickSwitchRole}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition active:scale-95 shadow-sm"
          title="Beralih cepat antara Admin (Bu Anni) dan Karyawan"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden md:inline text-slate-500 font-medium">Mode:</span>
          <span className={isAdmin ? 'text-blue-700 font-bold' : 'text-slate-800 font-bold'}>
            {isAdmin ? 'Pemilik (Bu Anni)' : 'Karyawan'}
          </span>
        </button>

        {/* Profil Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm"
            title={user?.nama || 'Pengguna'}
          >
            {user?.nama?.[0] || 'A'}
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
