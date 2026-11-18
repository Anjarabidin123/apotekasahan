import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Boxes,
  BellRing,
  ClipboardCheck,
  CalendarDays,
  Settings,
  Lock,
  X,
} from 'lucide-react';

export function Sidebar({
  activePage,
  setActivePage,
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  urgentCount = 0,
  logoUrl,
}) {
  const { isAdmin } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      adminOnly: true,
    },
    {
      id: 'faktur',
      label: 'Penerimaan Faktur',
      icon: FileSpreadsheet,
    },
    {
      id: 'inventori',
      label: 'Persediaan Obat',
      icon: Boxes,
    },
    {
      id: 'pengingat',
      label: 'Pengingat & Retur',
      icon: BellRing,
      badge: urgentCount > 0 ? `${urgentCount} Mendesak` : null,
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
      label: 'Pengaturan Apotek',
      icon: Settings,
      adminOnly: true,
    },
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {isMobileOpen && (
        <div
          data-testid="mobile-drawer-backdrop"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        data-testid="mobile-drawer"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi SIMAAF"
      >
        <div className="p-3 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
            title="Apotek Asahan Farma - SIMAAF"
          >
            <BrandLogo
              logoUrl={logoUrl}
              className="w-10 h-10 group-hover:scale-105 transition-transform border border-blue-400/20 shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-950 tracking-tight truncate group-hover:text-blue-600 transition-colors">
                SIMAAF
              </h2>
              <p className="text-[11px] font-extrabold text-slate-600 truncate">
                Apotek Asahan Farma
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="mobile-drawer-close"
            onClick={onCloseMobile}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition shrink-0 active:scale-95"
            aria-label="Tutup menu navigasi"
            title="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          <p className="px-2 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
            {isAdmin ? 'Menu Eksekutif & Operasional' : 'Menu Operasional Lapangan'}
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isRestricted = item.adminOnly && !isAdmin;

            if (isRestricted) {
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-xl text-[13px] tracking-tight text-slate-400 bg-slate-50/50 border border-slate-200/50 select-none cursor-not-allowed opacity-60 font-bold min-h-[40px]"
                  title="Khusus Akun Admin (Bu Anni)"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400" strokeWidth={2} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                data-testid={`mobile-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-[13px] tracking-tight transition-all text-left min-h-[40px] active:scale-[0.98] ${
                  isActive
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 ring-1 ring-blue-500 border border-blue-600'
                    : 'bg-white border border-slate-200/80 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 text-slate-900 font-extrabold shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-700'
                    }`}
                    strokeWidth={isActive ? 2.6 : 2.2}
                  />
                  <span className="truncate tracking-tight">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-md font-black shrink-0 ${
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

        <div className="p-3 m-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 shadow-2xs shrink-0">
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
      </aside>

      <aside
        data-testid="desktop-sidebar"
        className={`hidden md:flex bg-slate-100/80 border-r border-slate-200/90 flex-col transition-all duration-300 z-40 select-none shadow-[1px_0_12px_rgba(0,0,0,0.03)] backdrop-blur-md shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div
          onClick={() => setActivePage('dashboard')}
          className="p-4 border-b border-slate-200/80 bg-white/70 flex items-center gap-3 hover:bg-white transition-colors group cursor-pointer"
          title="Apotek Asahan Farma - SIMAAF"
        >
          <BrandLogo
            logoUrl={logoUrl}
            className="w-10 h-10 group-hover:scale-105 transition-transform border border-blue-400/20 shadow-sm shrink-0"
          />
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

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
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
                  className="flex items-center justify-between px-2 py-1.5 rounded-xl text-[13px] tracking-tight text-slate-400 bg-slate-50/50 border border-slate-200/50 select-none cursor-not-allowed opacity-60 font-bold min-h-[40px]"
                  title="Khusus Akun Admin (Bu Anni)"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400" strokeWidth={2} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-[13px] tracking-tight transition-all group cursor-pointer text-left min-h-[40px] ${
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
    </>
  );
}
