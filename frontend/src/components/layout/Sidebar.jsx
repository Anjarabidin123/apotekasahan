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
   * Merender item navigasi dengan font tegas (bold) di atas latar gelap kontras tinggi.
   */
  const renderNavItem = (item, { isMobileDrawer = false, compactDesktop = false }) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;
    const isRestricted = item.adminOnly && !isAdmin;

    if (isRestricted) {
      return (
        <div
          key={item.id}
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[14px] text-slate-500 select-none cursor-not-allowed opacity-60 font-semibold ${
            compactDesktop ? 'justify-center px-2' : ''
          }`}
          title="Khusus Akun Pemilik (Ibu Anni)"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Icon className="w-[18px] h-[18px] shrink-0 text-slate-500" strokeWidth={2} />
            {!compactDesktop && <span className="truncate">{item.label}</span>}
          </div>
          {!compactDesktop && <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
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
          compactDesktop ? 'justify-center px-2' : 'justify-between px-3'
        } py-2.5 rounded-lg text-[14px] tracking-tight transition-colors cursor-pointer text-left min-h-[42px] ${
          isActive
            ? 'bg-emerald-600 text-white font-bold shadow-xs'
            : 'text-slate-200 hover:bg-slate-800 hover:text-white font-bold'
        }`}
        title={compactDesktop ? item.label : undefined}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className={`w-[18px] h-[18px] shrink-0 transition-colors ${
              isActive
                ? 'text-white'
                : 'text-slate-400 group-hover:text-emerald-400'
            }`}
            strokeWidth={isActive ? 2.4 : 2.1}
          />
          {!compactDesktop && <span className="truncate">{item.label}</span>}
        </div>

        {!compactDesktop && item.badge && (
          <span
            className={`text-[11px] min-w-[20px] h-5 px-1.5 rounded-md font-bold flex items-center justify-center tabular-nums shrink-0 ${
              isActive
                ? 'bg-white text-emerald-700'
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
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Drawer Navigasi Mobile */}
      <aside
        data-testid="mobile-drawer"
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[82vw] bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi SIMAAF"
      >
        <div className="px-4 h-14 border-b border-slate-800 flex items-center justify-between">
          <div
            onClick={() => handleNavClick(isAdmin ? 'dashboard' : 'inventori')}
            className="flex items-center gap-2.5 cursor-pointer min-w-0"
          >
            <BrandLogo logoUrl={logoUrl} className="w-8 h-8 rounded-lg shrink-0 bg-white/10 p-0.5" />
            <div className="min-w-0">
              <h2 className="text-[15px] font-extrabold text-white tracking-tight truncate">
                SIMAAF
              </h2>
              <p className="text-[11px] font-semibold text-slate-400 truncate">
                Apotek Asahan Farma
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="mobile-drawer-close"
            onClick={onCloseMobile}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition shrink-0"
            aria-label="Tutup menu navigasi"
            title="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[11px] font-bold text-slate-500">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) =>
                  renderNavItem(item, { isMobileDrawer: true, compactDesktop: false })
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3.5 border-t border-slate-800 bg-slate-950/50 text-xs space-y-0.5 shrink-0">
          <p className="font-bold text-white text-[11px] truncate">Apotek Asahan Farma</p>
          <p className="text-[11px] text-slate-400 truncate">Jl. Imam Bonjol No. 331 • Kisaran</p>
        </div>
      </aside>

      {/* Sidebar Desktop Kontras Gelap */}
      <aside
        data-testid="desktop-sidebar"
        className={`hidden md:flex bg-gradient-to-b from-slate-900 via-slate-900 to-[#0a131f] border-r border-slate-800/90 text-slate-100 flex-col transition-all duration-300 z-40 select-none shrink-0 ${
          isCollapsed ? 'w-20' : 'w-60'
        }`}
      >
        <div
          onClick={() => setActivePage(isAdmin ? 'dashboard' : 'inventori')}
          className={`h-14 px-4 border-b border-slate-800 flex items-center ${
            isCollapsed ? 'justify-center' : 'gap-2.5'
          } hover:bg-slate-800/50 transition-colors cursor-pointer`}
          title="Apotek Asahan Farma - SIMAAF"
        >
          <BrandLogo logoUrl={logoUrl} className="w-8 h-8 rounded-lg shrink-0 bg-white p-0.5" />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-extrabold text-white tracking-tight truncate leading-none">
                SIMAAF
              </h2>
              <p className="text-[11px] font-semibold text-slate-400 truncate mt-1 leading-none">
                Apotek Asahan Farma
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-bold text-slate-500">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) =>
                  renderNavItem(item, { isMobileDrawer: false, compactDesktop: isCollapsed })
                )}
              </div>
            </div>
          ))}
        </div>

        {!isCollapsed && (
          <div className="p-3.5 border-t border-slate-800 bg-slate-950/50 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white">Kisaran Timur</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Jl. Imam Bonjol No. 331</p>
            <p className="text-[10px] text-slate-500 font-mono">NIB 1210210063257</p>
          </div>
        )}
      </aside>
    </>
  );
}
