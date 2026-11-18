import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Boxes, BellRing, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function BottomNav({ activePage, setActivePage, urgentCount = 0 }) {
  const { isAdmin } = useAuth();

  const navItems = [
    ...(isAdmin ? [{ id: 'dashboard', label: 'Beranda', icon: LayoutDashboard }] : []),
    { id: 'faktur', label: 'Faktur', icon: FileSpreadsheet },
    { id: 'inventori', label: 'Stok', icon: Boxes },
    { id: 'pengingat', label: 'Retur', icon: BellRing, badge: urgentCount },
    { id: 'penyesuaian', label: 'Opname', icon: ClipboardCheck },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah"
      className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-30 md:hidden"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center border border-slate-900 tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight leading-none ${
                  isActive ? 'font-bold text-emerald-400' : 'font-semibold text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
