import React, { useEffect, useState } from 'react';
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
  Building2,
  SlidersHorizontal,
  Download,
  ShieldCheck,
  Clock,
  Activity
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
  const [activeTab, setActiveTab] = useState('retur');
  const [defaultPage, setDefaultPage] = useState(
    () => localStorage.getItem('simaaf_default_page') || 'dashboard'
  );
  const [savedDefaultToast, setSavedDefaultToast] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  /**
   * Memuat data ringkasan stok dan daftar pengingat secara paralel.
   */
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 h-52 rounded-2xl bg-slate-200" />
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="h-52 rounded-2xl bg-slate-200" />
            <div className="h-52 rounded-2xl bg-slate-200" />
            <div className="h-52 rounded-2xl bg-slate-200" />
          </div>
        </div>
        <div className="h-72 rounded-2xl bg-slate-200" />
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
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
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

  // Kalkulasi proporsi kesehatan stok untuk bar visual 3 warna
  const totalBatch = Math.max(summary?.total_batch_aktif || 0, 1);
  const countRisikoRetur = summary?.jumlah_batch_berisiko ?? mendesakList.length;
  const countDekatEd = Math.min(kedaluwarsaList.length, Math.max(0, totalBatch - countRisikoRetur));
  const countAman = Math.max(0, totalBatch - countRisikoRetur - countDekatEd);

  const pctRisiko = Math.round((countRisikoRetur / totalBatch) * 100);
  const pctEd = Math.round((countDekatEd / totalBatch) * 100);
  const pctAman = Math.max(0, 100 - pctRisiko - pctEd);
  const riskAssetPct = Math.min(100, Number(summary?.persentase_berisiko || 0));

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
    exportToExcelCsv(
      `simaaf_${labelMap[activeTab]}_${summary?.tanggal_acuan || '2026-10-31'}.csv`,
      headers,
      rows
    );
  };

  const handleExportAllDashboardExcel = async () => {
    try {
      const res = await api.getBatches();
      const all = Array.isArray(res?.data) ? res.data : activeItems;
      const headers = ['Nama Obat', 'Nomor Batch', 'Distributor PBF', 'Tgl Kedaluwarsa', 'Batas Retur', 'Stok Saat Ini', 'Nilai Stok (Rp)', 'Status Retur', 'Status Risiko'];
      const rows = all.map((b) => [
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
      exportToExcelCsv(
        `ringkasan_inventori_apotek_asahan_${summary?.tanggal_acuan || '2026-10-31'}.csv`,
        headers,
        rows
      );
    } catch {
      handleExportActiveCsv();
    }
  };

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

  const pbfBarGradients = [
    'from-rose-500 to-orange-500',
    'from-amber-500 to-yellow-500',
    'from-blue-500 to-indigo-500',
    'from-emerald-500 to-teal-500'
  ];

  return (
    <div className="space-y-4">
      {/* Baris Bento Atas: Hero Card Biru-Indigo + 3 Kartu KPI Semantik */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Hero Card Nilai Persediaan */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 text-white p-5 shadow-md shadow-blue-900/15 flex flex-col justify-between">
          <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-indigo-400/20 blur-2xl" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-blue-100">
                  Total Nilai Persediaan
                </span>
                <button
                  type="button"
                  onClick={() => setHideValue(!hideValue)}
                  className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white text-[11px] font-medium transition disabled:opacity-60"
                title="Segarkan Data"
              >
                <span>{summary?.tanggal_acuan || tanggalAcuan || '2026-10-31'}</span>
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-white">
                {hideValue ? 'Rp ••••••••' : formatRupiah(summary?.total_nilai_persediaan)}
              </h2>
              <p className="text-[11px] text-blue-100/90 mt-1">
                {summary?.total_batch_aktif || 0} batch aktif terpantau di Apotek Asahan Farma
              </p>
            </div>

            {/* Bilah Kesehatan Stok 3 Warna */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-semibold text-blue-100">
                <span>Kesehatan Batch Rak</span>
                <span className="tabular-nums">{pctAman}% Aman • {pctRisiko}% Berisiko</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden flex gap-0.5">
                {pctAman > 0 && (
                  <div className="bg-emerald-400 h-full transition-all" style={{ width: `${pctAman}%` }} />
                )}
                {pctEd > 0 && (
                  <div className="bg-amber-400 h-full transition-all" style={{ width: `${pctEd}%` }} />
                )}
                {pctRisiko > 0 && (
                  <div className="bg-rose-400 h-full transition-all" style={{ width: `${pctRisiko}%` }} />
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 hidden md:flex items-center gap-2 mt-4 pt-3.5 border-t border-white/15">
            <button
              type="button"
              onClick={onNavigateToFaktur}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Faktur</span>
            </button>
            <button
              type="button"
              onClick={handleExportAllDashboardExcel}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition border border-white/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* Peluncur Cepat 4 Menu Khusus Mobile (< md) */}
        <div className="grid grid-cols-4 gap-2 md:hidden">
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
        </div>

        {/* 3 Kartu KPI Berwarna Semantik */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* KPI 1: Eksposur Risiko Retur (Rose) */}
          <button
            type="button"
            onClick={onNavigateToPengingat}
            className="text-left bg-gradient-to-br from-rose-50/90 via-white to-white rounded-2xl border border-rose-200/80 hover:border-rose-300 p-4 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100/80 text-rose-700 tabular-nums">
                  {riskAssetPct}% aset
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600">Eksposur Risiko Retur</p>
                <p className="text-xl font-extrabold text-rose-600 tabular-nums mt-1">
                  {hideValue ? '••••••' : formatRupiah(summary?.total_nilai_berisiko)}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-rose-100 space-y-2">
              <div className="w-full h-1.5 rounded-full bg-rose-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500"
                  style={{ width: `${Math.max(8, riskAssetPct)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-rose-700">
                <span>Tinjau batch berisiko</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* KPI 2: Tenggat Retur & ED (Amber) */}
          <button
            type="button"
            onClick={onNavigateToKalender}
            className="text-left bg-gradient-to-br from-amber-50/90 via-white to-white rounded-2xl border border-amber-200/80 hover:border-amber-300 p-4 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 tabular-nums">
                  {kedaluwarsaList.length} dekat ED
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600">Tenggat Retur PBF</p>
                <p className="text-xl font-extrabold text-slate-900 tabular-nums mt-1">
                  {ringkasan?.total_mendesak_retur ?? mendesakList.length} Batch
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-amber-100 space-y-2">
              <p className="text-[11px] text-slate-500">
                Perlu diajukan sebelum tenggat PBF habis
              </p>
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-700">
                <span>Buka kalender jatuh tempo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* KPI 3: Kesehatan Stok Rak (Emerald) */}
          <button
            type="button"
            onClick={onNavigateToInventori}
            className="text-left bg-gradient-to-br from-emerald-50/90 via-white to-white rounded-2xl border border-emerald-200/80 hover:border-emerald-300 p-4 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 tabular-nums">
                  {stokTipisList.length} menipis
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600">Kesehatan Stok Rak</p>
                <p className="text-xl font-extrabold text-emerald-700 tabular-nums mt-1">
                  {pctAman}% Aman
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-emerald-100 space-y-2">
              <p className="text-[11px] text-slate-500">
                {countAman} dari {totalBatch} batch aktif dalam kondisi aman
              </p>
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                <span>Kelola seluruh stok</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Grid Konten Utama: Pantauan Stok + Analitik Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Kolom Kiri: Daftar Pantauan Stok Interaktif */}
        <section className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Pantauan Stok Prioritas
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportActiveCsv}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                title="Unduh tab aktif sebagai CSV Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ekspor CSV</span>
              </button>
              <button
                type="button"
                onClick={activeTab === 'stok' ? onNavigateToInventori : onNavigateToPengingat}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1.5 rounded-xl hover:bg-blue-50 transition"
              >
                <span>Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tab Filter Semantik Berwarna */}
          <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('retur')}
              className={`py-2 px-2 rounded-lg transition truncate ${
                activeTab === 'retur'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Wajib Retur ({mendesakList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kedaluwarsa')}
              className={`py-2 px-2 rounded-lg transition truncate ${
                activeTab === 'kedaluwarsa'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dekat ED ({kedaluwarsaList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stok')}
              className={`py-2 px-2 rounded-lg transition truncate ${
                activeTab === 'stok'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stok Tipis ({stokTipisList.length})
            </button>
          </div>

          {/* Daftar Baris Ringkas */}
          {displayedItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
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
                  ? 'bg-rose-100 text-rose-700 border-rose-200'
                  : activeTab === 'stok'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200';

                const badgeLabel =
                  activeTab === 'stok'
                    ? `${item.jumlah_saat_ini ?? 0}`
                    : `${daysLeft ?? 0}h`;

                const rightSubtext =
                  activeTab === 'retur'
                    ? `Batas: ${item.batas_retur || '-'}`
                    : activeTab === 'kedaluwarsa'
                    ? `ED: ${item.tanggal_kedaluwarsa || '-'}`
                    : `Sisa: ${item.jumlah_saat_ini ?? 0} ${item.satuan || 'unit'}`;

                return (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-slate-50/90 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center shrink-0 text-xs font-extrabold tabular-nums ${badgeClass}`}
                      >
                        <span>{badgeLabel}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.nama_obat}
                          </p>
                          <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 shrink-0">
                            {item.nomor_batch}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.nama_distributor}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 tabular-nums">
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
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-semibold transition"
                      >
                        <span>{activeTab === 'stok' ? 'Opname' : 'Proses'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Kolom Kanan: Komposisi Kesehatan, Eksposur PBF, & Preferensi Awal */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Komposisi Kesehatan Batch */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Komposisi Kesehatan Batch
            </h3>

            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
              {pctAman > 0 && (
                <div className="bg-emerald-500 h-full" style={{ width: `${pctAman}%` }} />
              )}
              {pctEd > 0 && (
                <div className="bg-amber-400 h-full" style={{ width: `${pctEd}%` }} />
              )}
              {pctRisiko > 0 && (
                <div className="bg-rose-500 h-full" style={{ width: `${pctRisiko}%` }} />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                <span className="text-[10px] font-semibold text-emerald-700 block">Stok Aman</span>
                <span className="text-sm font-extrabold text-emerald-800 tabular-nums">{countAman}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
                <span className="text-[10px] font-semibold text-amber-700 block">Dekat ED</span>
                <span className="text-sm font-extrabold text-amber-800 tabular-nums">{countDekatEd}</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100 text-center">
                <span className="text-[10px] font-semibold text-rose-700 block">Risiko Retur</span>
                <span className="text-sm font-extrabold text-rose-700 tabular-nums">{countRisikoRetur}</span>
              </div>
            </div>
          </section>

          {/* Eksposur Risiko per Distributor PBF */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
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
                  const barGradient = pbfBarGradients[idx % pbfBarGradients.length];
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
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${barGradient} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Preferensi Tampilan Awal */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
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
              Pilih menu pertama yang terbuka saat login di perangkat ini.
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
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
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
