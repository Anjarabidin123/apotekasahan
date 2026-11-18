import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { exportToExcelCsv } from '../utils/fileTools';
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
  Download
} from 'lucide-react';

export function DashboardPage({
  onNavigateToPengingat,
  onNavigateToInventori,
  onNavigateToFaktur,
  onNavigateToKalender,
  onNavigateToPenyesuaian,
  tanggalAcuan
}) {
  const [summary, setSummary] = useState(null);
  const [batches, setBatches] = useState([]);
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
  const [chartMode, setChartMode] = useState('retur');
  const [selectedBucketKey, setSelectedBucketKey] = useState(null);
  const [activeTab, setActiveTab] = useState('retur');
  const [defaultPage, setDefaultPage] = useState(
    () => localStorage.getItem('simaaf_default_page') || 'dashboard'
  );
  const [savedDefaultToast, setSavedDefaultToast] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  /**
   * Memuat ringkasan aset, daftar batch aktif, dan daftar pengingat secara paralel.
   */
  const loadDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [summaryRes, pengingatRes, batchesRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getPengingat(),
        api.getBatches()
      ]);
      if (summaryRes?.data) setSummary(summaryRes.data);
      if (pengingatRes?.data) setPengingat(pengingatRes.data);
      if (pengingatRes?.ringkasan) setRingkasan(pengingatRes.ringkasan);
      if (Array.isArray(batchesRes?.data)) setBatches(batchesRes.data);
    } catch (e) {
      console.error('Gagal memuat dashboard:', e);
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

  const formatSingkatRp = (val) => {
    const n = Number(val || 0);
    if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1).replace('.0', '')} Jt`;
    if (n >= 1000) return `Rp ${Math.round(n / 1000)} Rb`;
    return `Rp ${n}`;
  };

  const refDate = summary?.tanggal_acuan || tanggalAcuan || '2026-10-31';

  /**
   * Menghitung proyeksi nilai aset jatuh tempo per periode langsung dari daftar batch nyata.
   */
  const chartBuckets = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const refObj = new Date(refDate);

    // Bangun 5 bulan ke depan relatif terhadap tanggal acuan sistem
    const futureMonths = [];
    for (let i = 1; i <= 5; i++) {
      const d = new Date(refObj.getFullYear(), refObj.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      futureMonths.push({ key, label, items: [], total: 0, tone: i === 1 ? 'warning' : 'normal' });
    }

    const overdueBucket = { key: 'lewat', label: 'Lewat', items: [], total: 0, tone: 'danger' };
    const laterBucket = { key: 'aman', label: 'Jauh / Lainnya', items: [], total: 0, tone: 'safe' };

    batches.forEach((b) => {
      const targetDate = chartMode === 'retur' ? b.batas_retur : b.tanggal_kedaluwarsa;
      const val = Number(b.nilai_total || 0);

      if (!targetDate) {
        if (chartMode === 'retur') {
          laterBucket.items.push(b);
          laterBucket.total += val;
        }
        return;
      }

      if (targetDate < refDate) {
        overdueBucket.items.push(b);
        overdueBucket.total += val;
        return;
      }

      const monthKey = targetDate.slice(0, 7);
      const found = futureMonths.find((m) => m.key === monthKey);
      if (found) {
        found.items.push(b);
        found.total += val;
      } else {
        laterBucket.items.push(b);
        laterBucket.total += val;
      }
    });

    return [overdueBucket, ...futureMonths, laterBucket];
  }, [batches, chartMode, refDate]);

  const activeBucket = useMemo(() => {
    if (selectedBucketKey) {
      const match = chartBuckets.find((b) => b.key === selectedBucketKey);
      if (match) return match;
    }
    return chartBuckets.find((b) => b.total > 0) || chartBuckets[0];
  }, [chartBuckets, selectedBucketKey]);

  const upcomingDeadlines = useMemo(() => {
    return [...batches]
      .filter((b) => b.batas_retur || b.tanggal_kedaluwarsa)
      .map((b) => {
        const target = b.batas_retur || b.tanggal_kedaluwarsa;
        const isRetur = Boolean(b.batas_retur);
        const diffDays = Math.ceil((new Date(target) - new Date(refDate)) / (1000 * 60 * 60 * 24));
        return { ...b, targetDate: target, isRetur, diffDays };
      })
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 4);
  }, [batches, refDate]);

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-700">{error}</p>
        <button
          type="button"
          onClick={() => loadDashboard(false)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
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

  const totalBatch = Math.max(summary?.total_batch_aktif || batches.length || 0, 1);
  const countRisikoRetur = summary?.jumlah_batch_berisiko ?? mendesakList.length;
  const countAman = Math.max(0, totalBatch - countRisikoRetur);
  const pctAman = Math.round((countAman / totalBatch) * 100);
  const maxChartTotal = Math.max(...chartBuckets.map((b) => b.total), 1);

  const handleExportActiveCsv = () => {
    const labelMap = {
      retur: 'wajib_retur',
      kedaluwarsa: 'mendekati_ed',
      stok: 'stok_menipis'
    };
    const headers = ['Nama Obat', 'Nomor Batch', 'Distributor', 'Batas Retur', 'Tanggal ED', 'Sisa Stok', 'Nilai Total (Rp)'];
    const rows = activeItems.map((b) => [
      b.nama_obat,
      b.nomor_batch,
      b.nama_distributor || '-',
      b.batas_retur || '-',
      b.tanggal_kedaluwarsa || '-',
      b.jumlah_saat_ini ?? 0,
      b.nilai_total || 0
    ]);
    exportToExcelCsv(`simaaf_${labelMap[activeTab]}_${refDate}.csv`, headers, rows);
  };

  const handleExportAllExcel = () => {
    const source = batches.length > 0 ? batches : activeItems;
    const headers = ['Nama Obat', 'Nomor Batch', 'Distributor PBF', 'Tgl Kedaluwarsa', 'Batas Retur', 'Stok Saat Ini', 'Nilai Stok (Rp)', 'Status Retur', 'Status Risiko'];
    const rows = source.map((b) => [
      b.nama_obat,
      b.nomor_batch,
      b.nama_distributor || '-',
      b.tanggal_kedaluwarsa || '-',
      b.batas_retur || '-',
      b.jumlah_saat_ini ?? 0,
      b.nilai_total || 0,
      b.status_retur || '-',
      b.status_risiko || '-'
    ]);
    exportToExcelCsv(`ringkasan_inventori_apotek_asahan_${refDate}.csv`, headers, rows);
  };

  const quickActions = [
    { label: 'Faktur Baru', icon: Plus, action: onNavigateToFaktur },
    { label: 'Stok Obat', icon: Boxes, action: onNavigateToInventori },
    {
      label: 'Retur & ED',
      icon: AlertTriangle,
      action: onNavigateToPengingat,
      badge: mendesakList.length > 0 ? mendesakList.length : null
    },
    { label: 'Kalender', icon: Calendar, action: onNavigateToKalender }
  ];

  const startPageOptions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'faktur', label: 'Input Faktur' },
    { id: 'inventori', label: 'Stok & Batch' },
    { id: 'pengingat', label: 'Retur & ED' }
  ];

  return (
    <div className="space-y-4">
      {/* Bilah Aksi Desktop */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-950 tracking-tight">
            Ringkasan Inventori & Retur PBF
          </h2>
          <p className="text-xs text-slate-500">
            Pemantauan nilai aset apotek per tanggal acuan {refDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleExportAllExcel}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToFaktur}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Input Faktur</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Mobile + Peluncur Cepat (< md) */}
      <div className="md:hidden space-y-3">
        <div className="bg-slate-950 text-white rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Nilai Persediaan</span>
            <button
              type="button"
              onClick={() => setHideValue(!hideValue)}
              className="text-slate-400 hover:text-white p-1"
              aria-label={hideValue ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
            >
              {hideValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {hideValue ? 'Rp ••••••••' : formatRupiah(summary?.total_nilai_persediaan)}
          </p>
          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Risiko Retur:{' '}
              <strong className="text-rose-400 tabular-nums">
                {hideValue ? '••••••' : formatRupiah(summary?.total_nilai_berisiko)}
              </strong>
            </span>
            <span className="text-emerald-400 font-semibold tabular-nums">
              {pctAman}% Aman
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="relative flex flex-col items-center justify-center gap-1.5 py-3 px-1.5 bg-white rounded-xl border border-slate-200 active:scale-[0.97] transition"
              >
                {item.badge && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {item.badge}
                  </span>
                )}
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                  <Icon className="w-4 h-4" strokeWidth={2.1} />
                </div>
                <span className="text-[11px] font-semibold text-slate-800 leading-tight text-center truncate w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Kartu Metrik Seragam Tanpa Gradasi Warna-Warni */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">Total Nilai Aset</span>
            <button
              type="button"
              onClick={() => setHideValue(!hideValue)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition hidden md:block"
              title={hideValue ? 'Tampilkan' : 'Sembunyikan'}
            >
              {hideValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-950 tracking-tight tabular-nums">
            {hideValue ? 'Rp ••••••••' : formatRupiah(summary?.total_nilai_persediaan)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            {summary?.total_batch_aktif || batches.length} batch aktif di rak
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToPengingat}
          className="text-left bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 flex flex-col justify-between space-y-2 transition group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">Aset Risiko Retur</span>
            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-950 tracking-tight tabular-nums">
            {hideValue ? '••••••' : formatRupiah(summary?.total_nilai_berisiko)}
          </p>
          <p className="text-[11px] font-semibold text-rose-600 flex items-center justify-between w-full">
            <span>{summary?.persentase_berisiko || 0}% dari nilai aset</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>

        <button
          type="button"
          onClick={onNavigateToPengingat}
          className="text-left bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 flex flex-col justify-between space-y-2 transition group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">Wajib Retur</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-950 tracking-tight tabular-nums">
            {ringkasan?.total_mendesak_retur ?? mendesakList.length} Batch
          </p>
          <p className="text-[11px] text-slate-500 font-medium flex items-center justify-between w-full">
            <span>{kedaluwarsaList.length} batch mendekati ED</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>

        <button
          type="button"
          onClick={onNavigateToInventori}
          className="text-left bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 flex flex-col justify-between space-y-2 transition group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">Stok Kondisi Aman</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-emerald-700 tracking-tight tabular-nums">
            {pctAman}%
          </p>
          <p className="text-[11px] text-slate-500 font-medium flex items-center justify-between w-full">
            <span>{countAman} batch aman • {stokTipisList.length} tipis</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>
      </section>

      {/* Grid Utama 12 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Kolom Kiri (8 Kolom): Grafik Proyeksi Jatuh Tempo Nyata + Daftar Pantauan */}
        <div className="lg:col-span-8 space-y-4">
          {/* Grafik Operasional: Proyeksi Nilai Jatuh Tempo Retur & ED */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-950">
                  Jadwal Nilai Aset Jatuh Tempo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik batang periode untuk melihat batch obat yang jatuh tempo pada bulan tersebut.
                </p>
              </div>

              <div className="inline-flex bg-slate-100 p-1 rounded-lg text-xs font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setChartMode('retur');
                    setSelectedBucketKey(null);
                  }}
                  className={`px-3 py-1.5 rounded-md transition ${
                    chartMode === 'retur'
                      ? 'bg-white text-slate-950 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Batas Retur PBF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChartMode('ed');
                    setSelectedBucketKey(null);
                  }}
                  className={`px-3 py-1.5 rounded-md transition ${
                    chartMode === 'ed'
                      ? 'bg-white text-slate-950 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kedaluwarsa (ED)
                </button>
              </div>
            </div>

            {/* Batang Grafik Interaktif */}
            <div className="pt-2">
              <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-40 pb-2 border-b border-slate-200">
                {chartBuckets.map((bucket) => {
                  const pctHeight =
                    bucket.total > 0
                      ? Math.max(12, Math.round((bucket.total / maxChartTotal) * 100))
                      : 4;
                  const isSelected = activeBucket?.key === bucket.key;

                  const barColorClass =
                    bucket.total === 0
                      ? 'bg-slate-100'
                      : bucket.tone === 'danger'
                      ? 'bg-rose-600'
                      : bucket.tone === 'warning'
                      ? 'bg-emerald-600'
                      : isSelected
                      ? 'bg-slate-950'
                      : 'bg-slate-700 hover:bg-slate-900';

                  return (
                    <button
                      key={bucket.key}
                      type="button"
                      onClick={() => setSelectedBucketKey(bucket.key)}
                      className={`group flex flex-col items-center justify-end h-full rounded-lg p-1 transition ${
                        isSelected ? 'bg-slate-50 ring-1 ring-slate-200' : ''
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-600 tabular-nums mb-1.5 truncate max-w-full">
                        {bucket.total > 0 ? (hideValue ? '••' : formatSingkatRp(bucket.total)) : '-'}
                      </span>
                      <div className="w-full max-w-[36px] flex-1 flex items-end justify-center">
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${barColorClass}`}
                          style={{ height: `${pctHeight}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center pt-2">
                {chartBuckets.map((bucket) => {
                  const isSelected = activeBucket?.key === bucket.key;
                  return (
                    <button
                      key={bucket.key}
                      type="button"
                      onClick={() => setSelectedBucketKey(bucket.key)}
                      className={`text-[11px] truncate transition ${
                        isSelected
                          ? 'font-bold text-slate-950'
                          : 'font-medium text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {bucket.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail Periode Terpilih */}
            {activeBucket && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="font-bold text-slate-900">
                    Periode {activeBucket.label}:
                  </span>{' '}
                  <span className="text-slate-600 tabular-nums">
                    {activeBucket.items.length} batch (
                    <strong className="text-slate-950">
                      {hideValue ? '••••••' : formatRupiah(activeBucket.total)}
                    </strong>
                    )
                  </span>
                  {activeBucket.items.length > 0 && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {activeBucket.items.map((x) => x.nama_obat).join(', ')}
                    </p>
                  )}
                </div>

                {activeBucket.items.length > 0 && (
                  <button
                    type="button"
                    onClick={onNavigateToPengingat}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0"
                  >
                    <span>Tindak Lanjut</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Daftar Pantauan Prioritas */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-950">
                Daftar Pantauan Stok Prioritas
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportActiveCsv}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ekspor CSV</span>
                </button>
                <button
                  type="button"
                  onClick={activeTab === 'stok' ? onNavigateToInventori : onNavigateToPengingat}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tab Garis Bawah Bersih */}
            <div className="flex items-center gap-5 border-b border-slate-200 text-xs overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('retur')}
                className={`pb-2.5 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'retur'
                    ? 'border-slate-950 text-slate-950 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                Wajib Retur ({mendesakList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('kedaluwarsa')}
                className={`pb-2.5 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'kedaluwarsa'
                    ? 'border-slate-950 text-slate-950 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                Dekat ED ({kedaluwarsaList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stok')}
                className={`pb-2.5 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'stok'
                    ? 'border-slate-950 text-slate-950 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                Stok Tipis ({stokTipisList.length})
              </button>
            </div>

            {displayedItems.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
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

                  const badgeClass = isCritical
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                  const badgeLabel =
                    activeTab === 'stok'
                      ? `${item.jumlah_saat_ini ?? 0} unit`
                      : `${daysLeft ?? 0} hari`;

                  const rightSubtext =
                    activeTab === 'retur'
                      ? `Batas: ${item.batas_retur || '-'}`
                      : activeTab === 'kedaluwarsa'
                      ? `ED: ${item.tanggal_kedaluwarsa || '-'}`
                      : `Sisa: ${item.jumlah_saat_ini ?? 0} ${item.satuan || 'unit'}`;

                  return (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50/80 px-2 -mx-2 rounded-lg transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.nama_obat}
                          </p>
                          <span className="font-mono text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            {item.nomor_batch}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border tabular-nums shrink-0 ${badgeClass}`}
                          >
                            {badgeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {item.nama_distributor}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-bold text-slate-950 tabular-nums">
                            {hideValue ? '••••••' : formatRupiah(item.nilai_total)}
                          </p>
                          <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                            {rightSubtext}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            activeTab === 'stok' && onNavigateToPenyesuaian
                              ? onNavigateToPenyesuaian()
                              : onNavigateToPengingat()
                          }
                          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-900 hover:bg-slate-950 hover:text-white text-slate-700 text-xs font-semibold transition"
                        >
                          <span>{activeTab === 'stok' ? 'Opname' : 'Proses'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Kolom Kanan (4 Kolom): Eksposur PBF, Tenggat Terdekat, Tampilan Awal */}
        <div className="lg:col-span-4 space-y-4">
          {/* Eksposur Risiko per PBF dengan Palet Disiplin */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-950">
                Eksposur Risiko PBF
              </h3>
              <button
                type="button"
                onClick={onNavigateToInventori}
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-600 hover:text-slate-950"
              >
                <span>Semua</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {distributorList.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                Belum ada eksposur risiko retur PBF.
              </p>
            ) : (
              <div className="space-y-3">
                {distributorList.map((d, idx) => {
                  const maxVal = distributorList[0]?.nilai || 1;
                  const percent = Math.min(100, Math.round(((d.nilai || 0) / maxVal) * 100));
                  const barColor = idx === 0 ? 'bg-rose-600' : 'bg-slate-800';
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-800 truncate">
                          {d.nama}
                        </span>
                        <span className="font-bold text-slate-950 tabular-nums shrink-0">
                          {hideValue ? '••••••' : formatRupiah(d.nilai)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`${barColor} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                          {d.batch_count} batch
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Agenda Jatuh Tempo Terdekat */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-950">
                Jadwal Tenggat Terdekat
              </h3>
              <button
                type="button"
                onClick={onNavigateToKalender}
                className="text-xs font-semibold text-slate-600 hover:text-slate-950 inline-flex items-center gap-0.5"
              >
                <span>Kalender</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {upcomingDeadlines.map((b) => {
                const isOverdue = b.diffDays < 0;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={onNavigateToKalender}
                    className="w-full py-2.5 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50 px-1.5 -mx-1.5 rounded-lg transition"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {b.nama_obat}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {b.isRetur ? 'Batas retur' : 'Kedaluwarsa'} • {b.nama_distributor}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums shrink-0 ${
                        isOverdue
                          ? 'bg-rose-50 text-rose-700'
                          : b.diffDays <= 15
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.targetDate.slice(5)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Preferensi Halaman Awal */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-950">
                Tampilan Awal Aplikasi
              </h3>
              {savedDefaultToast && (
                <span className="text-[11px] font-semibold text-emerald-700">
                  Tersimpan
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Menu yang terbuka pertama kali di perangkat ini.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {startPageOptions.map((opt) => {
                const isSelected = defaultPage === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDefaultPage(opt.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
