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

  const navGroups = [
    {
      title: 'Ringkasan',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          adminOnly: true,
        },
        {
          id: 'pengingat',
          label: 'Retur & Kedaluwarsa',
          icon: BellRing,
          badge: urgentCount > 0 ? urgentCount : null,
        },
      ],
    },
    {
      title: 'Operasional',
      items: [
        {
          id: 'faktur',
          label: 'Input Faktur',
          icon: FileSpreadsheet,
        },
        {
          id: 'inventori',
          label: 'Stok & Batch',
          icon: Boxes,
        },
        {
          id: 'penyesuaian',
          label: 'Stok Opname',
          icon: ClipboardCheck,
        },
        {
          id: 'kalender',
          label: 'Kalender PBF',
          icon: CalendarDays,
        },
      ],
    },
    {
      title: 'Sistem',
      items: [
        {
          id: 'pengaturan',
          label: 'Pengaturan',
          icon: Settings,
          adminOnly: true,
        },
      ],
    },
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  /**
   * Merender tiap menu dalam gelembung tombol tipis agar terasa responsif dan dapat ditekan.
   */
  const renderNavItem = (item, { isMobileDrawer = false, compactDesktop = false }) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;
    const isRestricted = item.adminOnly && !isAdmin;

    if (isRestricted) {
      return (
        <div
          key={item.id}
          className={`flex items-center justify-between px-2.5 py-2 rounded-xl border border-slate-200/60 bg-slate-100/60 text-[13px] text-slate-400 select-none cursor-not-allowed opacity-70 font-semibold ${
            compactDesktop ? 'justify-center px-2' : ''
          }`}
          title="Khusus Akun Pemilik (Ibu Anni)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-slate-200/60 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-slate-400" strokeWidth={2} />
            </span>
            {!compactDesktop && <span className="truncate">{item.label}</span>}
          </div>
          {!compactDesktop && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </div>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        data-testid={isMobileDrawer ? `mobile-nav-${item.id}` : undefined}
        onClick={() => (isMobileDrawer ? handleNavClick(item.id) : setActivePage(item.id))}
        className={`group w-full flex items-center ${
          compactDesktop ? 'justify-center px-1.5' : 'justify-between px-2.5'
        } py-1.5 rounded-xl text-[13px] tracking-tight transition-all duration-150 cursor-pointer text-left min-h-[42px] border active:scale-[0.98] ${
          isActive
            ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.24)]'
            : 'bg-white/85 hover:bg-white text-slate-700 hover:text-slate-950 font-semibold border-slate-200/90 hover:border-blue-300/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-xs'
        }`}
        title={compactDesktop ? item.label : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-slate-100/90 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={isActive ? 2.4 : 2.1} />
          </span>
          {!compactDesktop && <span className="truncate">{item.label}</span>}
        </div>

        {!compactDesktop && item.badge && (
          <span
            className={`text-[11px] min-w-[20px] h-5 px-1.5 rounded-full font-bold flex items-center justify-center tabular-nums shrink-0 ${
              isActive
                ? 'bg-white text-blue-700'
                : 'bg-rose-600 text-white'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div
          data-testid="mobile-drawer-backdrop"
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Drawer Navigasi Mobile */}
      <aside
        data-testid="mobile-drawer"
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[82vw] bg-[#f8faff] border-r border-slate-200 text-slate-900 flex flex-col md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi SIMAAF"
      >
        <div className="px-4 h-14 border-b border-slate-200/80 flex items-center justify-between bg-white/80">
          <div
            onClick={() => handleNavClick(isAdmin ? 'dashboard' : 'inventori')}
            className="flex items-center gap-2.5 cursor-pointer min-w-0"
          >
            <BrandLogo logoUrl={logoUrl} className="w-8 h-8" />
            <div className="min-w-0">
              <h2 className="text-[15px] font-black text-slate-950 tracking-tight truncate leading-none">
                SIMAAF
              </h2>
              <p className="text-[11px] font-semibold text-blue-600 truncate mt-0.5 leading-none">
                Apotek Asahan Farma
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="mobile-drawer-close"
            onClick={onCloseMobile}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition shrink-0"
            aria-label="Tutup menu navigasi"
            title="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <p className="px-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
              <div className="space-y-1.5">
                {group.items.map((item) =>
                  renderNavItem(item, { isMobileDrawer: true, compactDesktop: false })
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-slate-200/80 bg-white/70 text-[11px] text-slate-500 space-y-0.5 shrink-0">
          <p className="font-bold text-slate-800 truncate">Kisaran Timur</p>
          <p className="truncate">Jl. Imam Bonjol No. 331 • NIB 1210210063257</p>
        </div>
      </aside>

      {/* Sidebar Desktop dengan Garis Batas & Bayangan Pemisah ke Konten */}
      <aside
        data-testid="desktop-sidebar"
        className={`hidden md:flex bg-[#f8faff] border-r border-slate-200/90 shadow-[4px_0_18px_-4px_rgba(15,23,42,0.07)] text-slate-900 flex-col transition-all duration-300 z-40 select-none shrink-0 relative ${
          isCollapsed ? 'w-[76px]' : 'w-[228px]'
        }`}
      >
        <div
          onClick={() => setActivePage(isAdmin ? 'dashboard' : 'inventori')}
          className={`h-14 px-3.5 border-b border-slate-200/80 bg-white/75 flex items-center ${
            isCollapsed ? 'justify-center' : 'gap-2.5'
          } cursor-pointer group`}
          title="Apotek Asahan Farma - SIMAAF"
        >
          <BrandLogo logoUrl={logoUrl} className="w-8 h-8 transition-transform group-hover:scale-105" />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-black text-slate-950 tracking-tight truncate leading-none">
                SIMAAF
              </h2>
              <p className="text-[11px] font-semibold text-blue-600 truncate mt-0.5 leading-none">
                Apotek Asahan Farma
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              {!isCollapsed && (
                <p className="px-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
              )}
              <div className="space-y-1.5">
                {group.items.map((item) =>
                  renderNavItem(item, { isMobileDrawer: false, compactDesktop: isCollapsed })
                )}
              </div>
            </div>
          ))}
        </div>

        {!isCollapsed && (
          <div className="mx-3 mb-3 pt-2.5 border-t border-slate-200/80 text-[11px] space-y-0.5 px-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800 truncate">Kisaran Timur</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                Aktif
              </span>
            </div>
            <p className="text-slate-500 truncate">Jl. Imam Bonjol No. 331</p>
            <p className="text-[10px] text-slate-400 font-mono">NIB 1210210063257</p>
          </div>
        )}
      </aside>
    </>
  );
}
