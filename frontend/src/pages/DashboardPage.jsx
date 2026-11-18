import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  AlertTriangle,
  Boxes,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Calendar,
  CheckCircle2,
  Building2,
  SlidersHorizontal
} from 'lucide-react';

export function DashboardPage({
  onNavigateToPengingat,
  onNavigateToInventori,
  onNavigateToFaktur,
  onNavigateToKalender,
  tanggalAcuan
}) {
  const [summary, setSummary] = useState(null);
  const [pengingat, setPengingat] = useState({
    mendesakRetur: [],
    mendekatiKedaluwarsa: [],
    stokMenipis: []
  });
  const [ringkasan, setRingkasan] = useState({
    total_mendesak_retur: 0,
    total_mendekati_kedaluwarsa: 0,
    total_stok_menipis: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hideValue, setHideValue] = useState(false);
  const [activeTab, setActiveTab] = useState('retur'); // 'retur' | 'kedaluwarsa' | 'stok'
  const [defaultPage, setDefaultPage] = useState(
    () => localStorage.getItem('simaaf_default_page') || 'dashboard'
  );
  const [savedDefaultToast, setSavedDefaultToast] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [summaryRes, pengingatRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getPengingat()
      ]);
      if (summaryRes?.data) setSummary(summaryRes.data);
      if (pengingatRes?.data) setPengingat(pengingatRes.data);
      if (pengingatRes?.ringkasan) setRingkasan(pengingatRes.ringkasan);
    } catch (e) {
      console.error('Error memuat data dashboard:', e);
      setError('Gagal memuat data ringkasan stok.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleSelectDefaultPage = (pageId) => {
    setDefaultPage(pageId);
    try {
      localStorage.setItem('simaaf_default_page', pageId);
      setSavedDefaultToast(true);
      setTimeout(() => setSavedDefaultToast(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-44 rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-xs font-semibold text-slate-700">{error}</p>
        <button
          type="button"
          onClick={() => loadDashboard(false)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang</span>
        </button>
      </div>
    );
  }

  const mendesakList = Array.isArray(pengingat?.mendesakRetur) ? pengingat.mendesakRetur : [];
  const kedaluwarsaList = Array.isArray(pengingat?.mendekatiKedaluwarsa) ? pengingat.mendekatiKedaluwarsa : [];
  const stokTipisList = Array.isArray(pengingat?.stokMenipis) ? pengingat.stokMenipis : [];

  const activeItems =
    activeTab === 'retur'
      ? mendesakList
      : activeTab === 'kedaluwarsa'
      ? kedaluwarsaList
      : stokTipisList;

  const displayedItems = activeItems.slice(0, 6);
  const distributorList = Array.isArray(summary?.distributor_terancam) ? summary.distributor_terancam : [];

  const quickActions = [
    {
      label: 'Faktur Baru',
      icon: Plus,
      action: onNavigateToFaktur,
      iconBg: 'bg-blue-50 text-blue-600'
    },
    {
      label: 'Stok Obat',
      icon: Boxes,
      action: onNavigateToInventori,
      iconBg: 'bg-emerald-50 text-emerald-600'
    },
    {
      label: 'Retur & ED',
      icon: AlertTriangle,
      action: onNavigateToPengingat,
      iconBg: 'bg-rose-50 text-rose-600',
      badge: mendesakList.length > 0 ? mendesakList.length : null
    },
    {
      label: 'Kalender',
      icon: Calendar,
      action: onNavigateToKalender,
      iconBg: 'bg-amber-50 text-amber-600'
    }
  ];

  const startPageOptions = [
    { id: 'dashboard', label: 'Beranda' },
    { id: 'faktur', label: 'Input Faktur' },
    { id: 'inventori', label: 'Stok & Batch' },
    { id: 'pengingat', label: 'Retur & ED' }
  ];

  return (
    <div className="space-y-4">
      {/* Dark Hero Balance & Inventory Card */}
      <section className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">
              Total Nilai Persediaan
            </span>
            <button
              type="button"
              onClick={() => setHideValue(!hideValue)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              title={hideValue ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
              aria-label={hideValue ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
            >
              {hideValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition disabled:opacity-60"
            title="Segarkan Data"
          >
            <span>Acuan: {summary?.tanggal_acuan || tanggalAcuan || '2026-10-31'}</span>
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mt-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-white">
            {hideValue ? 'Rp ••••••••' : formatRupiah(summary?.total_nilai_persediaan)}
          </h2>
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-800 grid grid-cols-3 gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onNavigateToPengingat}
            className="text-left group"
          >
            <span className="text-[11px] text-slate-400 block">Risiko Retur</span>
            <span className="text-xs sm:text-sm font-bold text-rose-400 tabular-nums block mt-0.5 group-hover:underline">
              {hideValue ? '••••••' : formatRupiah(summary?.total_nilai_berisiko)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {summary?.persentase_berisiko || 0}% dari aset
            </span>
          </button>

          <button
            type="button"
            onClick={onNavigateToInventori}
            className="text-left group border-l border-slate-800 pl-2.5 sm:pl-4"
          >
            <span className="text-[11px] text-slate-400 block">Batch Aktif</span>
            <span className="text-xs sm:text-sm font-bold text-white tabular-nums block mt-0.5 group-hover:underline">
              {summary?.total_batch_aktif || 0} Batch
            </span>
            <span className="text-[10px] text-slate-500 block">
              Tercatat di rak
            </span>
          </button>

          <button
            type="button"
            onClick={onNavigateToPengingat}
            className="text-left group border-l border-slate-800 pl-2.5 sm:pl-4"
          >
            <span className="text-[11px] text-slate-400 block">Wajib Retur</span>
            <span className="text-xs sm:text-sm font-bold text-amber-400 tabular-nums block mt-0.5 group-hover:underline">
              {ringkasan?.total_mendesak_retur ?? summary?.jumlah_batch_berisiko ?? 0} Batch
            </span>
            <span className="text-[10px] text-slate-500 block">
              Tenggat dekat
            </span>
          </button>
        </div>
      </section>

      {/* Single-Row 4-Column Quick Action Grid */}
      <section className="grid grid-cols-4 gap-2 sm:gap-3">
        {quickActions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={item.action}
              className="relative flex flex-col items-center justify-center gap-1.5 py-3 px-1.5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 active:scale-[0.97] transition-all shadow-2xs"
            >
              {item.badge && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {item.badge}
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 leading-tight text-center truncate w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Primary Column: Watchlist Card */}
        <section className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Pantauan Stok
            </h3>
            <button
              type="button"
              onClick={activeTab === 'stok' ? onNavigateToInventori : onNavigateToPengingat}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Segmented Pill Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('retur')}
              className={`py-1.5 px-2 rounded-lg transition truncate ${
                activeTab === 'retur'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Retur ({mendesakList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kedaluwarsa')}
              className={`py-1.5 px-2 rounded-lg transition truncate ${
                activeTab === 'kedaluwarsa'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Dekat ED ({kedaluwarsaList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stok')}
              className={`py-1.5 px-2 rounded-lg transition truncate ${
                activeTab === 'stok'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Stok Tipis ({stokTipisList.length})
            </button>
          </div>

          {/* Compact List Rows */}
          {displayedItems.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
              <p className="text-xs font-medium text-slate-500">
                Tidak ada batch obat pada kategori ini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedItems.map((item, idx) => {
                const daysLeft =
                  activeTab === 'retur'
                    ? item.sisa_hari_retur
                    : activeTab === 'kedaluwarsa'
                    ? item.sisa_hari_exp
                    : null;

                const isCritical =
                  activeTab === 'retur'
                    ? daysLeft !== null && daysLeft <= 15
                    : activeTab === 'kedaluwarsa'
                    ? daysLeft !== null && daysLeft <= 30
                    : (item.jumlah_saat_ini || 0) <= 5;

                const badgeBg = isCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                  : activeTab === 'stok'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200/80';

                const badgeLabel =
                  activeTab === 'stok'
                    ? `${item.jumlah_saat_ini ?? 0}`
                    : `${daysLeft ?? 0}h`;

                const rightSubtext =
                  activeTab === 'retur'
                    ? `Batas: ${item.batas_retur || '-'}`
                    : activeTab === 'kedaluwarsa'
                    ? `ED: ${item.tanggal_kedaluwarsa || '-'}`
                    : `Sisa: ${item.jumlah_saat_ini ?? 0} ${item.satuan || 'Unit'}`;

                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={activeTab === 'stok' ? onNavigateToInventori : onNavigateToPengingat}
                    className="w-full flex items-center justify-between gap-3 py-2.5 px-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center shrink-0 text-xs font-extrabold tabular-nums ${badgeBg}`}
                      >
                        <span>{badgeLabel}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.nama_obat}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.nomor_batch} • {item.nama_distributor}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900 tabular-nums">
                        {hideValue ? '••••••' : formatRupiah(item.nilai_total)}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                        {rightSubtext}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Secondary Column: PBF Exposure & Start Page Preference */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Card 1: Risiko Retur per PBF */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Eksposur Risiko PBF
                </h3>
              </div>
              <button
                type="button"
                onClick={onNavigateToInventori}
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>Stok</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {distributorList.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                Belum ada eksposur risiko retur PBF saat ini.
              </p>
            ) : (
              <div className="space-y-3">
                {distributorList.map((d, idx) => {
                  const maxVal = distributorList[0]?.nilai || 1;
                  const percent = Math.min(100, Math.round(((d.nilai || 0) / maxVal) * 100));
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-800 truncate">
                          {d.nama}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {d.batch_count} batch
                          </span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {hideValue ? '••••••' : formatRupiah(d.nilai)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-slate-900 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Card 2: Pintasan Tampilan Awal */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Tampilan Awal Aplikasi
                </h3>
              </div>
              {savedDefaultToast && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tersimpan
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Pilih halaman pertama saat aplikasi dibuka di perangkat ini.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {startPageOptions.map((opt) => {
                const isSelected = defaultPage === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDefaultPage(opt.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
