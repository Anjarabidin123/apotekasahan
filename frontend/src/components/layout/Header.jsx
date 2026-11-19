import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { api } from '../../services/api';
import {
  Calendar,
  LogOut,
  PanelLeft,
  ArrowRightLeft,
  Bell,
  ArrowLeft,
  ArrowRight,
  CheckCheck,
} from 'lucide-react';

export function Header({
  onToggleSidebar,
  onSelectPage,
  activePageTitle,
  showBackButton = false,
  onBack,
  tanggalAcuan,
  urgentCount = 0,
  dataVersion = 0,
  logoUrl,
}) {
  const { login, logout, isAdmin } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readDismissed, setReadDismissed] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    let active = true;
    api
      .getHeaderNotifications()
      .then((list) => {
        if (active) setNotifications(list || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activePageTitle, tanggalAcuan, urgentCount, dataVersion]);

  useEffect(() => {
    if (!showNotif) return;
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotif]);

  const handleQuickSwitchRole = () => {
    if (isAdmin) {
      login('karyawan@apotek.local', 'karyawan123');
    } else {
      login('admin@apotek.local', 'admin123');
    }
  };

  const badgeCount = readDismissed ? 0 : notifications.length || urgentCount;

  const handleAlertClick = (item) => {
    setShowNotif(false);
    if (onSelectPage) {
      onSelectPage(item.targetPage || 'pengingat', item.nomor_batch);
    }
  };

  return (
    <header className="bg-[#f7fbf9]/95 backdrop-blur-md sticky top-0 z-30 w-full max-w-full border-b border-emerald-950/10 shadow-[0_4px_14px_-4px_rgba(6,78,59,0.06)]">
      <div className="h-14 flex items-center justify-between px-2.5 sm:px-4 lg:px-5 w-full max-w-full">
      <div className="flex items-center gap-2 min-w-0">
        {/* Identitas Ringkas Mobile */}
        <button
          type="button"
          onClick={() => onSelectPage && onSelectPage(isAdmin ? 'dashboard' : 'inventori')}
          className="md:hidden flex items-center justify-center rounded-xl active:scale-95 transition shrink-0 cursor-pointer"
          aria-label="Kembali ke halaman utama"
          title="Apotek Asahan Farma - SIMAAF"
        >
          <BrandLogo logoUrl={logoUrl} className="w-7 h-7" />
        </button>

        {/* Tombol Lipat Sidebar Desktop */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200/80 hover:border-emerald-300 text-slate-500 hover:text-emerald-800 transition shadow-2xs md:inline-flex hidden shrink-0 cursor-pointer"
          title="Buka / Tutup Sidebar"
          aria-label="Buka / Tutup Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {showBackButton && (
          <button
            type="button"
            data-testid="header-back-btn"
            onClick={onBack}
            className="h-9 sm:h-8 px-2 sm:px-2.5 flex items-center justify-center gap-1 rounded-lg bg-white border border-slate-200/85 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-bold transition shadow-2xs active:scale-95 shrink-0 cursor-pointer"
            title="Kembali ke halaman sebelumnya"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
        )}

        <div className="min-w-0 flex flex-col md:flex-row md:items-center md:gap-2">
          <span className="md:hidden text-[9.5px] font-bold text-emerald-700 leading-none tracking-tight">
            SIMAAF
          </span>
          <span className="hidden md:inline text-xs font-semibold text-slate-400">
            SIMAAF /
          </span>
          <h1
            data-testid="page-title"
            className="text-[13.5px] sm:text-[15px] font-extrabold text-slate-950 tracking-tight leading-tight truncate"
          >
            {activePageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-bold">
          Data Simulasi
        </span>

        <div className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/90 border border-emerald-950/10 text-slate-600 text-xs font-semibold shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            Acuan{' '}
            <strong className="text-slate-950 tabular-nums ml-0.5">
              {tanggalAcuan || '2026-10-31'}
            </strong>
          </span>
        </div>

        {/* Lonceng Notifikasi Pengingat & Retur di Header */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            data-testid="header-notif-btn"
            onClick={() => setShowNotif(!showNotif)}
            className={`relative w-10 h-11 sm:w-9 sm:h-9 min-h-[44px] sm:min-h-0 flex items-center justify-center rounded-full border transition active:scale-95 shrink-0 cursor-pointer ${
              showNotif
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-white/90 hover:bg-emerald-50 border-slate-200/85 text-slate-600 hover:text-emerald-700'
            }`}
            title="Notifikasi Retur & Stok"
            aria-label="Buka notifikasi retur dan stok"
          >
            <Bell className="w-4 h-4" />
            {badgeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-white text-[9.5px] font-black flex items-center justify-center border-2 border-[#f7fbf9] tabular-nums shadow-2xs">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div
              data-testid="header-notifications-popover"
              className="fixed sm:absolute right-3 sm:right-0 top-20 sm:top-11 w-[calc(100vw-24px)] max-w-[335px] sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-slate-950">Notifikasi Apotek</p>
                  <p className="text-[10.5px] text-slate-500">
                    {notifications.length} pengingat aktif per {tanggalAcuan || '2026-10-31'}
                  </p>
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setReadDismissed(true)}
                    className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded-lg hover:bg-emerald-50 transition"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Tandai dibaca</span>
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Semua retur dan stok obat terkendali aman.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAlertClick(item)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100 transition flex items-start gap-2.5 cursor-pointer"
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          item.tone === 'rose'
                            ? 'bg-rose-500'
                            : item.tone === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold ${
                              item.tone === 'rose'
                                ? 'text-rose-700'
                                : item.tone === 'amber'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {item.title}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {item.nomor_batch}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                          {item.nama_obat}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{item.detail}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotif(false);
                    if (onSelectPage) onSelectPage('pengingat', '');
                  }}
                  className="w-full py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center justify-center gap-1"
                >
                  <span>Kelola Semua di Pengingat Retur</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pengalih peran cepat Admin / Karyawan */}
        <button
          type="button"
          onClick={handleQuickSwitchRole}
          className="flex items-center gap-1.5 text-[11px] sm:text-xs pl-1 pr-2.5 sm:pl-1.5 sm:pr-3 h-11 sm:h-9 min-h-[44px] sm:min-h-0 rounded-full border border-slate-200/85 bg-white hover:bg-slate-50 text-slate-800 font-bold transition shadow-2xs active:scale-95 cursor-pointer"
          title="Beralih antara Pemilik (Ibu Anni) dan Karyawan"
        >
          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
            {isAdmin ? 'IA' : 'ST'}
          </span>
          <span className="truncate max-w-[66px] sm:max-w-none">
            {isAdmin ? 'Ibu Anni' : 'Karyawan'}
          </span>
          <ArrowRightLeft className="w-3 h-3 text-slate-400 shrink-0" />
        </button>

        {/* Tombol Keluar */}
        <button
          type="button"
          onClick={logout}
          className="w-10 h-11 sm:w-9 sm:h-9 min-h-[44px] sm:min-h-0 flex items-center justify-center rounded-full bg-white/85 hover:bg-rose-50 border border-slate-200/80 text-slate-500 hover:text-rose-600 hover:border-rose-200 active:scale-95 transition shrink-0 cursor-pointer"
          title="Keluar"
          aria-label="Keluar dari sistem"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      </div>

      <div className="sm:hidden flex items-center justify-between gap-2 px-3 py-1 border-t border-emerald-950/10 bg-amber-50/75 text-[10px]">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100/90 border border-amber-200 text-amber-900 font-bold">
          Data Simulasi
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-slate-600 tabular-nums">
          <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Acuan {tanggalAcuan || '2026-10-31'}</span>
        </span>
      </div>
    </header>
  );
}
