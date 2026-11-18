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
      className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(15,23,42,0.05)] z-30 md:hidden"
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
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`relative flex items-center justify-center px-3.5 py-1 rounded-full transition-colors ${
                  isActive ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/25' : ''
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight leading-none ${
                  isActive ? 'font-bold text-blue-700' : 'font-semibold text-slate-500'
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
