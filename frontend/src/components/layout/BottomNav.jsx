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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4 pb-3 pt-1 pointer-events-none md:hidden">
      <div className="flex items-center justify-around rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.12)] px-2 py-2 pointer-events-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all relative ${
                isActive ? '-translate-y-0.5' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-105'
                    : 'text-slate-500 bg-slate-50'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10px] font-bold tracking-tight ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>

              {item.badge > 0 && (
                <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
