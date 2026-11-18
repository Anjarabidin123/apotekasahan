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
      label: 'Beranda',
      icon: LayoutDashboard,
      iconColor: 'text-blue-600',
      adminOnly: true,
    },
    {
      id: 'faktur',
      label: 'Input Faktur',
      icon: FileSpreadsheet,
      iconColor: 'text-indigo-600',
    },
    {
      id: 'inventori',
      label: 'Stok & Batch',
      icon: Boxes,
      iconColor: 'text-emerald-600',
    },
    {
      id: 'pengingat',
      label: 'Retur & ED',
      icon: BellRing,
      iconColor: 'text-rose-600',
      badge: urgentCount > 0 ? `${urgentCount}` : null,
    },
    {
      id: 'penyesuaian',
      label: 'Stok Opname',
      icon: ClipboardCheck,
      iconColor: 'text-amber-600',
    },
    {
      id: 'kalender',
      label: 'Kalender PBF',
      icon: CalendarDays,
      iconColor: 'text-cyan-600',
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan',
      icon: Settings,
      iconColor: 'text-purple-600',
      adminOnly: true,
    },
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  /**
   * Merender item navigasi baik untuk drawer mobile maupun sidebar desktop.
   */
  const renderNavItem = (item, { isMobileDrawer = false, compactDesktop = false }) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;
    const isRestricted = item.adminOnly && !isAdmin;

    if (isRestricted) {
      return (
        <div
          key={item.id}
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] text-slate-400 select-none cursor-not-allowed opacity-60 font-medium ${
            compactDesktop ? 'justify-center px-2' : ''
          }`}
          title="Khusus Akun Pemilik (Ibu Anni)"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Icon className="w-4 h-4 shrink-0 text-slate-400" strokeWidth={2} />
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
        className={`w-full flex items-center ${
          compactDesktop ? 'justify-center px-2' : 'justify-between px-3'
        } py-2.5 rounded-xl text-[13px] transition-all cursor-pointer text-left min-h-[42px] ${
          isActive
            ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/25'
            : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
        }`}
        title={compactDesktop ? item.label : undefined}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? 'text-white' : item.iconColor
            }`}
            strokeWidth={isActive ? 2.3 : 2.1}
          />
          {!compactDesktop && <span className="truncate">{item.label}</span>}
        </div>

        {!compactDesktop && item.badge && (
          <span
            className={`text-[10px] min-w-[20px] h-5 px-1.5 rounded-full font-bold flex items-center justify-center tabular-nums shrink-0 ${
              isActive
                ? 'bg-white/25 text-white'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Drawer Navigasi Mobile */}
      <aside
        data-testid="mobile-drawer"
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[82vw] bg-white border-r border-slate-200/80 flex flex-col md:hidden transform transition-transform duration-300 ease-in-out shadow-xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi SIMAAF"
      >
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div
            onClick={() => handleNavClick(isAdmin ? 'dashboard' : 'inventori')}
            className="flex items-center gap-2.5 cursor-pointer min-w-0"
          >
            <BrandLogo logoUrl={logoUrl} className="w-8 h-8 rounded-xl shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
                SIMAAF
              </h2>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                Apotek Asahan Farma
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="mobile-drawer-close"
            onClick={onCloseMobile}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition shrink-0"
            aria-label="Tutup menu navigasi"
            title="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) =>
            renderNavItem(item, { isMobileDrawer: true, compactDesktop: false })
          )}
        </div>

        <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-0.5 shrink-0">
          <p className="font-bold text-slate-800 text-[11px] truncate">Jl. Imam Bonjol No.331</p>
          <p className="text-[10px] text-slate-500 font-mono">Kisaran Timur • NIB 1210210063257</p>
        </div>
      </aside>

      {/* Sidebar Desktop */}
      <aside
        data-testid="desktop-sidebar"
        className={`hidden md:flex bg-white border-r border-slate-200/80 flex-col transition-all duration-300 z-40 select-none shrink-0 ${
          isCollapsed ? 'w-20' : 'w-60'
        }`}
      >
        <div
          onClick={() => setActivePage(isAdmin ? 'dashboard' : 'inventori')}
          className={`h-14 px-4 border-b border-slate-200/80 flex items-center ${
            isCollapsed ? 'justify-center' : 'gap-2.5'
          } hover:bg-slate-50/60 transition-colors cursor-pointer`}
          title="Apotek Asahan Farma - SIMAAF"
        >
          <BrandLogo logoUrl={logoUrl} className="w-8 h-8 rounded-xl shrink-0" />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
                SIMAAF
              </h2>
              <p className="text-[10px] font-medium text-slate-500 truncate">
                Apotek Asahan Farma
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) =>
            renderNavItem(item, { isMobileDrawer: false, compactDesktop: isCollapsed })
          )}
        </div>

        {!isCollapsed && (
          <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500">Kisaran Timur</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aktif
              </span>
            </div>
            <p className="font-bold text-slate-800 text-[11px] truncate">Jl. Imam Bonjol No.331</p>
            <p className="text-[10px] text-slate-500 font-mono">NIB: 1210210063257</p>
          </div>
        )}
      </aside>
    </>
  );
}
