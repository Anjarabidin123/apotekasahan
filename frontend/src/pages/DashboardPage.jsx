import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { StatusReturBadge } from '../components/common/StatusBadge';
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
  Download,
  Search,
  Settings
} from 'lucide-react';

export function DashboardPage({
  onNavigateToPengingat,
  onNavigateToInventori,
  onNavigateToFaktur,
  onNavigateToKalender,
  onNavigateToPenyesuaian,
  onNavigateToPengaturan,
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
  const [activeTab, setActiveTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
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

  const refDate = summary?.tanggal_acuan || tanggalAcuan || '2026-10-31';

  const mendesakList = Array.isArray(pengingat?.mendesakRetur) ? pengingat.mendesakRetur : [];
  const kedaluwarsaList = Array.isArray(pengingat?.mendekatiKedaluwarsa) ? pengingat.mendekatiKedaluwarsa : [];
  const stokTipisList = Array.isArray(pengingat?.stokMenipis) ? pengingat.stokMenipis : [];

  /**
   * Menyusun antrean tindakan segera dari batch lewat batas retur, wajib retur, dan stok tipis.
   */
  const actionQueue = useMemo(() => {
    const queue = [];
    const seenIds = new Set();

    batches
      .filter((b) => b.status_retur === 'lewat_batas')
      .forEach((b) => {
        if (seenIds.has(b.id)) return;
        seenIds.add(b.id);
        queue.push({
          ...b,
          urgencyTitle: 'Batas Retur Terlewat',
          tone: 'rose'
        });
      });

    mendesakList.forEach((b) => {
      if (seenIds.has(b.id)) return;
      seenIds.add(b.id);
      queue.push({
        ...b,
        urgencyTitle: `Tenggat Retur ${b.sisa_hari_retur ?? 0} Hari`,
        tone: 'amber'
      });
    });

    stokTipisList.forEach((b) => {
      if (seenIds.has(b.id)) return;
      seenIds.add(b.id);
      queue.push({
        ...b,
        urgencyTitle: `Stok Tipis (${b.jumlah_saat_ini ?? 0} sisa)`,
        tone: 'slate'
      });
    });

    return queue.slice(0, 3);
  }, [batches, mendesakList, stokTipisList]);

  /**
   * Menentukan daftar batch yang ditampilkan pada tabel utama sesuai tab dan pencarian.
   */
  const filteredTableItems = useMemo(() => {
    let source = batches;
    if (activeTab === 'retur') source = mendesakList;
    else if (activeTab === 'kedaluwarsa') source = kedaluwarsaList;
    else if (activeTab === 'stok') source = stokTipisList;

    if (!searchQuery.trim()) return source.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return source
      .filter(
        (b) =>
          (b.nama_obat || '').toLowerCase().includes(q) ||
          (b.nomor_batch || '').toLowerCase().includes(q) ||
          (b.nama_distributor || '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [batches, mendesakList, kedaluwarsaList, stokTipisList, activeTab, searchQuery]);

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
        <div className="h-32 rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 -mt-10 px-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-white border border-slate-200" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-elevated p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-700">{error}</p>
        <button
          type="button"
          onClick={() => loadDashboard(false)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang</span>
        </button>
      </div>
    );
  }

  const distributorList = Array.isArray(summary?.distributor_terancam) ? summary.distributor_terancam : [];
  const totalBatch = Math.max(summary?.total_batch_aktif || batches.length || 0, 1);
  const countRisikoRetur = summary?.jumlah_batch_berisiko ?? mendesakList.length;
  const countAman = Math.max(0, totalBatch - countRisikoRetur);
  const pctAman = Math.round((countAman / totalBatch) * 100);

  const handleExportTableCsv = () => {
    const source =
      activeTab === 'semua'
        ? batches
        : activeTab === 'retur'
        ? mendesakList
        : activeTab === 'kedaluwarsa'
        ? kedaluwarsaList
        : stokTipisList;

    const headers = ['Nama Obat', 'Nomor Batch', 'Distributor PBF', 'Batas Retur', 'Tanggal ED', 'Sisa Stok', 'Nilai Total (Rp)', 'Status Retur'];
    const rows = source.map((b) => [
      b.nama_obat,
      b.nomor_batch,
      b.nama_distributor || '-',
      b.batas_retur || '-',
      b.tanggal_kedaluwarsa || '-',
      b.jumlah_saat_ini ?? 0,
      b.nilai_total || 0,
      b.status_retur || '-'
    ]);
    exportToExcelCsv(`simaaf_inventori_${activeTab}_${refDate}.csv`, headers, rows);
  };

  const quickActions = [
    {
      label: 'Faktur Baru',
      icon: Plus,
      action: onNavigateToFaktur,
      iconStyle: 'bg-blue-50 text-blue-600 border-blue-200/80'
    },
    {
      label: 'Ekspor CSV',
      icon: Download,
      action: () => handleExportTableCsv(),
      iconStyle: 'bg-teal-50 text-teal-600 border-teal-200/80'
    },
    {
      label: 'Kalender ED',
      icon: Calendar,
      action: onNavigateToKalender,
      iconStyle: 'bg-amber-50 text-amber-600 border-amber-200/80'
    },
    {
      label: 'Pengaturan',
      icon: Settings,
      action: onNavigateToPengaturan,
      iconStyle: 'bg-violet-50 text-violet-600 border-violet-200/80'
    }
  ];

  const startPageOptions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'faktur', label: 'Input Faktur' },
    { id: 'inventori', label: 'Stok & Batch' },
    { id: 'pengingat', label: 'Retur & ED' }
  ];

  return (
    <div className="space-y-3">
      {/* Kartu Ringkasan Khusus Mobile Bergaya Native FinTech-Health */}
      <section className="md:hidden rounded-2xl bg-gradient-to-br from-[#F4F6FF] via-[#EAEFFD] to-[#DDE6FE] border border-[#D4DFFB] p-4 shadow-[0_6px_20px_rgba(37,99,235,0.07)] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-blue-200/80 text-[11px] font-bold text-blue-700 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Acuan {refDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHideValue(!hideValue)}
              className="w-8 h-8 rounded-lg bg-white/90 border border-white text-slate-600 flex items-center justify-center shadow-2xs active:scale-95 transition"
              aria-label={hideValue ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
            >
              {hideValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="w-8 h-8 rounded-lg bg-white/90 border border-white text-slate-600 flex items-center justify-center shadow-2xs active:scale-95 transition"
              aria-label="Segarkan Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-500">Total Nilai Persediaan</p>
          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <p className="text-2xl font-black text-slate-950 tracking-tight tabular-nums leading-none">
              {hideValue ? 'Rp ••••••••' : formatRupiah(summary?.total_nilai_persediaan)}
            </p>
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">
              {summary?.total_batch_aktif || batches.length} batch
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-blue-200/60">
          <button
            type="button"
            onClick={onNavigateToPengingat}
            className="text-left rounded-xl bg-white/85 border border-white px-2.5 py-2 shadow-2xs active:scale-[0.98] transition"
          >
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              Risiko
            </span>
            <p className="text-xs font-black text-rose-600 tabular-nums mt-0.5">
              {summary?.persentase_berisiko || 0}% Aset
            </p>
          </button>

          <button
            type="button"
            onClick={onNavigateToPengingat}
            className="text-left rounded-xl bg-white/85 border border-white px-2.5 py-2 shadow-2xs active:scale-[0.98] transition"
          >
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              Wajib Retur
            </span>
            <p className="text-xs font-black text-slate-950 tabular-nums mt-0.5">
              {ringkasan?.total_mendesak_retur ?? mendesakList.length} Batch
            </p>
          </button>

          <button
            type="button"
            onClick={onNavigateToInventori}
            className="text-left rounded-xl bg-white/85 border border-white px-2.5 py-2 shadow-2xs active:scale-[0.98] transition"
          >
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              Stok Aman
            </span>
            <p className="text-xs font-black text-teal-700 tabular-nums mt-0.5">
              {pctAman}% ({countAman})
            </p>
          </button>
        </div>
      </section>

      {/* Showcase Ringkasan Berilustrasi Ringkas ala Orely Studio (Desktop) */}
      <div className="hidden md:block relative overflow-hidden rounded-2xl border border-[#DCE3FB] bg-gradient-to-br from-[#F4F6FF] via-[#ECEFFD] to-[#E2E9FC] px-4 sm:px-5 py-3.5 sm:py-4 shadow-[0_4px_18px_rgba(37,99,235,0.06)]">
        {/* Elemen vektor pemandangan apotek & daun botani di latar kanan/bawah */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 180"
          preserveAspectRatio="xMidYMax slice"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-55 sm:opacity-90"
        >
          {/* Awan halus atmosfer */}
          <ellipse cx="470" cy="36" rx="85" ry="15" fill="#FFFFFF" fillOpacity="0.6" />
          <ellipse cx="300" cy="28" rx="52" ry="11" fill="#FFFFFF" fillOpacity="0.45" />
          {/* Perbukitan berlapis */}
          <path d="M0 155 Q160 128 320 148 T600 138 L600 180 L0 180 Z" fill="#D5DDFB" fillOpacity="0.7" />
          <path d="M220 180 Q390 132 600 150 L600 180 Z" fill="#C4D0FA" fillOpacity="0.75" />
          {/* Daun botani herbal sudut kanan */}
          <g transform="translate(510, 100)" opacity="0.9">
            <path d="M22 80 C20 48 24 22 38 6" stroke="#0D9488" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M23 58 C4 52 -2 38 10 32 C20 27 25 43 23 58 Z" fill="#14B8A6" />
            <path d="M25 40 C44 36 52 22 40 16 C29 11 24 28 25 40 Z" fill="#2DD4BF" />
          </g>
          {/* Ikon apotek/gudang minimalis */}
          <g transform="translate(415, 118)">
            <rect x="4" y="20" width="52" height="34" rx="4" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="1.5" />
            <path d="M0 22 L30 4 L60 22 Z" fill="#3B82F6" />
            <rect x="24" y="34" width="12" height="20" rx="2" fill="#E0E7FF" />
            <rect x="11" y="28" width="8" height="8" rx="1.5" fill="#93C5FD" />
            <rect x="41" y="28" width="8" height="8" rx="1.5" fill="#93C5FD" />
          </g>
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/95 text-blue-700 border border-blue-200/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Terpantau • Acuan {refDate}
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 leading-snug">
                Ringkasan Inventori & Retur PBF
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
                Pantau batas retur distributor rekanan, urutan FEFO, dan nilai persediaan apotek.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onNavigateToFaktur}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs shadow-blue-600/25 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Faktur Baru</span>
              </button>

              <button
                type="button"
                onClick={handleExportTableCsv}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white bg-white/90 hover:bg-white text-slate-700 text-xs font-bold transition shadow-2xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Ekspor Excel</span>
              </button>

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white bg-white/85 hover:bg-white text-slate-700 text-xs font-bold transition shadow-2xs active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>
          </div>

          {/* Kartu Mengambang Interaktif Bergaya Cropconex di Sisi Kanan Desktop */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onNavigateToPengingat}
              className="text-left bg-white/95 backdrop-blur-xs rounded-2xl p-3 w-48 border border-white shadow-[0_10px_28px_rgba(30,41,59,0.08)] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Pantau Retur
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[13px] font-extrabold text-slate-900 tabular-nums">
                {ringkasan?.total_mendesak_retur ?? mendesakList.length} Batch Prioritas
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {kedaluwarsaList.length} mendekati ED • Klik tinjau
              </p>
            </button>

            <button
              type="button"
              onClick={onNavigateToInventori}
              className="w-[74px] h-[74px] rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-[0_10px_24px_rgba(20,184,166,0.28)] border-[3px] border-white flex flex-col items-center justify-center hover:scale-105 transition-all duration-200 shrink-0"
              title="Lihat detail stok aman"
            >
              <span className="text-base font-black leading-none tabular-nums">{pctAman}%</span>
              <span className="text-[10px] font-bold text-teal-50 mt-0.5">Stok Aman</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Kartu Metrik Modular Bersih (Desktop) */}
      <section className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 flex flex-col justify-between space-y-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500">Total Nilai Aset</span>
            <button
              type="button"
              onClick={() => setHideValue(!hideValue)}
              className="text-slate-500 hover:text-slate-900 bg-slate-100 p-1 rounded-lg transition"
              title={hideValue ? 'Tampilkan' : 'Sembunyikan'}
              aria-label={hideValue ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
            >
              {hideValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-base sm:text-2xl font-extrabold text-slate-950 tracking-tight tabular-nums">
            {hideValue ? 'Rp ••••••••' : formatRupiah(summary?.total_nilai_persediaan)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            {summary?.total_batch_aktif || batches.length} batch tercatat di rak
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToPengingat}
          className="text-left bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 flex flex-col justify-between space-y-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-bold text-slate-500 truncate">Aset Risiko Retur</span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
              Risiko
            </span>
          </div>
          <p className="text-base sm:text-2xl font-extrabold text-slate-950 tracking-tight tabular-nums">
            {hideValue ? '••••••' : formatRupiah(summary?.total_nilai_berisiko)}
          </p>
          <p className="text-[11px] font-bold text-rose-600 flex items-center justify-between w-full">
            <span>{summary?.persentase_berisiko || 0}% nilai persediaan</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>

        <button
          type="button"
          onClick={onNavigateToPengingat}
          className="text-left bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 flex flex-col justify-between space-y-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-bold text-slate-500 truncate">Wajib Retur</span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
              Prioritas
            </span>
          </div>
          <p className="text-base sm:text-2xl font-extrabold text-slate-950 tracking-tight tabular-nums">
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
          className="text-left bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 flex flex-col justify-between space-y-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-bold text-slate-500 truncate">Kondisi Stok Aman</span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              Aman
            </span>
          </div>
          <p className="text-base sm:text-2xl font-extrabold text-blue-600 tracking-tight tabular-nums">
            {pctAman}%
          </p>
          <p className="text-[11px] text-slate-500 font-medium flex items-center justify-between w-full">
            <span>{countAman} batch aman • {stokTipisList.length} tipis</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>
      </section>

      {/* Peluncur Cepat 4 Tombol Berwarna Kontras Halus untuk Mobile */}
      <div className="grid grid-cols-4 gap-2 md:hidden">
        {quickActions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={item.action}
              className="relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-2xl bg-white border border-slate-200/85 shadow-[0_2px_8px_rgba(15,23,42,0.04)] active:scale-[0.97] transition"
            >
              {item.badge && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#ebf0fa] tabular-nums shadow-2xs">
                  {item.badge}
                </span>
              )}
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${item.iconStyle}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight text-center truncate w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Workspace Utama: Tabel Kerja Inventori (8 Kolom) + Antrean Tindakan Cepat (4 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        <section className="lg:col-span-8 surface-elevated overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Pengawasan Batch Obat
              </h3>
              <p className="text-xs text-slate-500">
                Daftar stok aktif berdasarkan batas pengembalian PBF dan tanggal kedaluwarsa.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari obat, batch, atau PBF..."
                className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
              />
            </div>
          </div>

          <div className="px-3.5 sm:px-4 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/80">
            <div className="flex items-center gap-3.5 sm:gap-5 text-[11px] sm:text-xs overflow-x-auto no-scrollbar">
              {[
                { id: 'semua', label: `Semua (${batches.length})` },
                { id: 'retur', label: `Retur (${mendesakList.length})` },
                { id: 'kedaluwarsa', label: `Dekat ED (${kedaluwarsaList.length})` },
                { id: 'stok', label: `Tipis (${stokTipisList.length})` }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`py-2.5 border-b-2 transition whitespace-nowrap ${
                    activeTab === t.id
                      ? 'border-blue-600 text-slate-950 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 font-semibold'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTableItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 text-blue-600 mx-auto" />
              <p className="text-xs font-medium text-slate-500">
                Tidak ada batch obat yang cocok dengan filter saat ini.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto hidden sm:block">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <th className="py-2.5 pl-4 pr-2">Obat & Batch</th>
                      <th className="py-2.5 px-2">Distributor</th>
                      <th className="py-2.5 px-2">Tenggat</th>
                      <th className="py-2.5 px-2 text-right">Stok & Nilai</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 pl-2 pr-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTableItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/90 transition-colors">
                        <td className="py-3 pl-4 pr-2 min-w-[145px] max-w-[180px]">
                          <p className="font-bold text-slate-900 leading-snug line-clamp-2">
                            {item.nama_obat}
                          </p>
                          <span className="font-mono text-[11px] font-medium text-slate-500">
                            {item.nomor_batch}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-600 max-w-[105px] truncate" title={item.nama_distributor}>
                          {item.nama_distributor}
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap tabular-nums">
                          <span className="font-semibold text-slate-800 block text-[11px]">
                            {item.batas_retur ? `Retur: ${item.batas_retur}` : 'Tanpa Retur'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ED: {item.tanggal_kedaluwarsa}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap tabular-nums">
                          <span className="font-bold text-slate-950 block">
                            {hideValue ? '••••••' : formatRupiah(item.nilai_total)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {item.jumlah_saat_ini ?? 0} unit
                          </span>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <StatusReturBadge
                            status={item.status_retur}
                            sisaHari={item.sisa_hari_retur}
                            batasRetur={item.batas_retur}
                          />
                        </td>
                        <td className="py-3 pl-2 pr-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              activeTab === 'stok' && onNavigateToPenyesuaian
                                ? onNavigateToPenyesuaian()
                                : onNavigateToPengingat()
                            }
                            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-700 text-[11px] font-bold transition"
                          >
                            {activeTab === 'stok' ? 'Opname' : 'Tinjau'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden divide-y divide-slate-100">
                {filteredTableItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={activeTab === 'stok' ? onNavigateToInventori : onNavigateToPengingat}
                    className="w-full px-3.5 py-3 text-left hover:bg-slate-50 active:bg-slate-100/70 flex items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-[13px] font-bold text-slate-900 truncate">
                        {item.nama_obat}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="font-mono font-semibold text-slate-600">{item.nomor_batch}</span> • {item.nama_distributor}
                      </p>
                      <div className="pt-0.5">
                        <StatusReturBadge
                          status={item.status_retur}
                          sisaHari={item.sisa_hari_retur}
                          batasRetur={item.batas_retur}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end">
                      <p className="text-xs font-extrabold text-slate-950 tabular-nums">
                        {hideValue ? '••••••' : formatRupiah(item.nilai_total)}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 tabular-nums mt-0.5">
                        {item.jumlah_saat_ini ?? 0} unit
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-900">{filteredTableItems.length}</strong> batch
            </span>
            <button
              type="button"
              onClick={onNavigateToInventori}
              className="font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition"
            >
              <span>Kelola Semua Batch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Kolom Kanan: Antrean Tindakan Cepat + Eksposur PBF + Halaman Awal */}
        <div className="lg:col-span-4 space-y-3">
          <section className="surface-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                Antrean Tindakan
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                {actionQueue.length} Prioritas
              </span>
            </div>

            {actionQueue.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Semua antrean retur dan stok terkendali.
              </p>
            ) : (
              <div className="space-y-2.5">
                {actionQueue.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          q.tone === 'rose'
                            ? 'bg-rose-100 text-rose-800'
                            : q.tone === 'amber'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {q.urgencyTitle}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                        {hideValue ? '••••••' : formatRupiah(q.nilai_total)}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate">{q.nama_obat}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="font-mono">{q.nomor_batch}</span> • {q.nama_distributor}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={onNavigateToPengingat}
                        className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition shadow-xs"
                      >
                        Proses Retur
                      </button>
                      <button
                        type="button"
                        onClick={onNavigateToPenyesuaian}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition"
                      >
                        Cek Rak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="surface-elevated p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Eksposur Risiko PBF
              </h3>
              <button
                type="button"
                onClick={onNavigateToInventori}
                className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-600 hover:text-blue-700"
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
                  const barColor = idx === 0 ? 'bg-rose-500' : 'bg-blue-600';
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

          <section className="hidden md:block surface-elevated p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Halaman Awal Aplikasi
              </h3>
              {savedDefaultToast && (
                <span className="text-[11px] font-bold text-blue-700">
                  Tersimpan
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Menu yang otomatis dibuka saat masuk ke aplikasi.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {startPageOptions.map((opt) => {
                const isSelected = defaultPage === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDefaultPage(opt.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
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
