import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Boxes,
  BellRing,
  ClipboardCheck,
  CalendarDays,
  Settings,
  Pill,
  Lock,
  Sparkles,
  Terminal,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export function Sidebar({ activePage, setActivePage, isCollapsed, urgentCount = 0 }) {
  const { isAdmin } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Eksekutif',
      icon: LayoutDashboard,
      adminOnly: true,
    },
    {
      id: 'faktur',
      label: 'Input Faktur (AI)',
      icon: FileSpreadsheet,
    },
    {
      id: 'inventori',
      label: 'Tabel Inventori Stok',
      icon: Boxes,
    },
    {
      id: 'pengingat',
      label: 'Pengingat & Retur',
      icon: BellRing,
      badge: urgentCount > 0 ? `${urgentCount} Urgent` : null,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      id: 'penyesuaian',
      label: 'Penyesuaian Stok (Opname)',
      icon: ClipboardCheck,
    },
    {
      id: 'kalender',
      label: 'Kalender Tenggat PBF',
      icon: CalendarDays,
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan CMS & Aturan',
      icon: Settings,
      adminOnly: true,
    },
  ];

  return (
    <aside
      className={`hidden md:flex bg-slate-100/80 border-r border-slate-200/90 flex-col transition-all duration-300 z-40 select-none shadow-[1px_0_12px_rgba(0,0,0,0.03)] backdrop-blur-md shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header (Style DesktopSidebar catatbirowisata) */}
      <div
        onClick={() => setActivePage('dashboard')}
        className="p-4 border-b border-slate-200/80 bg-white/70 flex items-center gap-3 hover:bg-white transition-colors group cursor-pointer"
        title="Apotek Asahan Farma - SIMAAF"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30 p-1 group-hover:scale-105 transition-transform border border-blue-400/20">
          <Pill className="w-5 h-5 text-white" strokeWidth={2.4} />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-slate-950 tracking-tight truncate group-hover:text-blue-600 transition-colors">
              SIMAAF
            </h2>
            <p className="text-[11px] font-extrabold text-slate-600 truncate">
              Apotek Asahan Farma
            </p>
          </div>
        )}
      </div>

      {/* AI Copilot Badge Button (Khas catatbirowisata) */}
      {!isCollapsed && (
        <div className="px-3 pt-3">
          <div
            onClick={() => setActivePage('faktur')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-sm shadow-blue-500/20 hover:opacity-95 transition-all cursor-pointer group"
            title="Model AI Random Forest & Ekstraksi Faktur"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
              <span>AI Opt-Stok & Vision</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/20 font-mono font-bold">
              v1.0
            </span>
          </div>
        </div>
      )}

      {/* Nav List: Tegas, Menggunakan Kartu Putih Berkontras Tinggi */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {!isCollapsed && (
          <p className="px-2 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
            {isAdmin ? 'Menu Eksekutif & Operasional' : 'Menu Operasional Lapangan'}
          </p>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const isRestricted = item.adminOnly && !isAdmin;

          if (isRestricted) {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] tracking-tight text-slate-400 bg-slate-50/50 border border-slate-200/50 select-none cursor-not-allowed opacity-60 font-bold"
                title="Khusus Akun Admin (Bu Anni)"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" strokeWidth={2} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] tracking-tight transition-all group cursor-pointer text-left ${
                isActive
                  ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 ring-1 ring-blue-500 border border-blue-600'
                  : 'bg-white/80 border border-slate-200/80 hover:bg-white hover:border-blue-400 hover:text-blue-600 text-slate-900 font-extrabold shadow-2xs'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-700 group-hover:text-blue-600'
                  }`}
                  strokeWidth={isActive ? 2.6 : 2.2}
                />
                {!isCollapsed && (
                  <span className="truncate tracking-tight">{item.label}</span>
                )}
              </div>

              {!isCollapsed && item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-black shrink-0 ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : item.badgeColor
                      ? `${item.badgeColor} border`
                      : 'bg-slate-200 text-slate-800 border border-slate-300/80'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Profil Singkat Apotek (Kartu Bersih Khas catatbirowisata) */}
      {!isCollapsed && (
        <div className="p-3 m-3 rounded-2xl bg-white border border-slate-200 text-xs space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Kisaran Timur
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
          </div>
          <p className="font-black text-slate-900 text-[11px] truncate">Jl. Imam Bonjol No.331</p>
          <p className="text-[10px] text-slate-500 font-mono font-semibold">NIB: 1210210063257</p>
        </div>
      )}
    </aside>
  );
}
