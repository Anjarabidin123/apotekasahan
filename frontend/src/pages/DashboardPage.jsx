import React, { useEffect, useState, useMemo } from 'react';
import { api, hitungSelisihHari, isBatchActive } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusReturBadge } from '../components/common/StatusBadge';
import { DashboardHeroIllustration, DashboardMobileAccent } from '../components/dashboard/DashboardHeroArtwork';
import { BatchActionModal } from '../components/retur/BatchActionModal';
import { exportToExcelCsv } from '../utils/fileTools';
import { formatRupiah } from '../utils/formatters';
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
  onDataChanged,
  tanggalAcuan
}) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [batches, setBatches] = useState([]);
  const [pengingat, setPengingat] = useState({
    bisaDiretur: [],
    mendesakRetur: [],
    lewatBatasRetur: [],
    mendekatiKedaluwarsa: [],
    stokMenipis: []
  });
  const [ringkasan, setRingkasan] = useState({
    total_bisa_diretur: 0,
    total_mendesak_retur: 0,
    total_lewat_batas: 0,
    total_mendekati_kedaluwarsa: 0,
    total_stok_menipis: 0
  });
  const [actionModal, setActionModal] = useState({ isOpen: false, mode: 'retur', batch: null });
  const [actionFeedback, setActionFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hideValue, setHideValue] = useState(
    () => localStorage.getItem('simaaf_privacy_mode') === 'true'
  );
  const [mobileQueueFirst] = useState(
    () => localStorage.getItem('simaaf_mobile_queue_first') !== 'false'
  );
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

  const refDate = summary?.tanggal_acuan || tanggalAcuan || '2026-10-31';

  const activeBatches = useMemo(() => batches.filter(isBatchActive), [batches]);
  const bisaDireturList = Array.isArray(pengingat?.bisaDiretur) ? pengingat.bisaDiretur : [];
  const mendesakList = Array.isArray(pengingat?.mendesakRetur) ? pengingat.mendesakRetur : [];
  const lewatBatasList = Array.isArray(pengingat?.lewatBatasRetur) ? pengingat.lewatBatasRetur : [];
  const kedaluwarsaList = Array.isArray(pengingat?.mendekatiKedaluwarsa) ? pengingat.mendekatiKedaluwarsa : [];
  const stokTipisList = Array.isArray(pengingat?.stokMenipis) ? pengingat.stokMenipis : [];

  const handleActionSuccess = async (msg) => {
    setActionFeedback(msg);
    await loadDashboard(true);
    if (onDataChanged) onDataChanged();
    setTimeout(() => setActionFeedback(''), 4500);
  };

  const handleToggleHideValue = () => {
    const next = !hideValue;
    setHideValue(next);
    try {
      localStorage.setItem('simaaf_privacy_mode', String(next));
    } catch {
      // abaikan jika storage dibatasi
    }
  };

  /**
   * Menyusun antrean tindakan segera dari batch lewat batas retur, wajib retur, dan stok tipis.
   */
  const actionQueue = useMemo(() => {
    const queue = [];
    const seenIds = new Set();

    lewatBatasList.forEach((b) => {
      if (seenIds.has(b.id)) return;
      seenIds.add(b.id);
      queue.push({
        ...b,
        urgencyTitle: b.sudah_kedaluwarsa ? 'Kedaluwarsa • Catat Dibuang' : 'Batas Retur Terlewat',
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
  }, [lewatBatasList, mendesakList, stokTipisList]);

  /**
   * Menentukan daftar batch yang ditampilkan pada tabel utama sesuai tab dan pencarian.
   */
  const filteredTableItems = useMemo(() => {
    let source = activeBatches.map((b) => ({
      ...b,
      sisa_hari_retur: b.batas_retur ? hitungSelisihHari(b.batas_retur, refDate) : null
    }));
    if (activeTab === 'bisa_diretur') source = bisaDireturList;
    else if (activeTab === 'lewat_batas') source = lewatBatasList;
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
  }, [activeBatches, bisaDireturList, lewatBatasList, kedaluwarsaList, stokTipisList, activeTab, searchQuery, refDate]);

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
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang</span>
        </button>
      </div>
    );
  }

  const distributorList = Array.isArray(summary?.distributor_terancam) ? summary.distributor_terancam : [];
  const totalBatch = Math.max(summary?.total_batch_aktif || activeBatches.length || 0, 1);
  const countRisikoRetur = summary?.jumlah_batch_berisiko ?? mendesakList.length;
  const countAman = Math.max(0, totalBatch - countRisikoRetur);
  const pctAman = Math.round((countAman / totalBatch) * 100);
  const countLewatBatas = lewatBatasList.length;
  const countSegeraRetur = mendesakList.length;
  const countTerkendali = Math.max(0, activeBatches.length - countLewatBatas - countSegeraRetur);
  const totalDistCount = Math.max(activeBatches.length, 1);

  const handleExportTableCsv = () => {
    const source =
      activeTab === 'semua'
        ? activeBatches
        : activeTab === 'bisa_diretur'
        ? bisaDireturList
        : activeTab === 'lewat_batas'
        ? lewatBatasList
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
      id: 'faktur',
      label: 'Faktur Baru',
      icon: Plus,
      action: onNavigateToFaktur,
      iconStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
    },
    {
      id: 'ekspor',
      label: 'Ekspor CSV',
      icon: Download,
      action: () => handleExportTableCsv(),
      iconStyle: 'bg-teal-50 text-teal-600 border-teal-200/80'
    },
    {
      id: 'kalender',
      label: 'Kalender ED',
      icon: Calendar,
      action: onNavigateToKalender,
      iconStyle: 'bg-amber-50 text-amber-600 border-amber-200/80'
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan',
      icon: Settings,
      action: onNavigateToPengaturan,
      iconStyle: 'bg-slate-100 text-slate-700 border-slate-200/80'
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
      {actionFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{actionFeedback}</span>
        </div>
      )}

      {/* Kartu Ringkasan Mobile */}
      <section className="md:hidden relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F3FBF7] via-[#E5F6EE] to-[#D4EFE2] border border-[#BDE4D1] p-3 shadow-[0_4px_14px_rgba(5,150,105,0.08)] space-y-2">
        <DashboardMobileAccent />
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <button
              type="button"
              onClick={onNavigateToPengaturan}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/90 border border-emerald-200/80 text-[10.5px] font-bold text-emerald-700 shadow-2xs active:scale-95 transition"
              title="Ubah tanggal acuan di Pengaturan"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Acuan {refDate}</span>
            </button>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800">
              Data Simulasi
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleHideValue}
              className="w-7 h-7 rounded-lg bg-white/90 border border-white text-slate-600 flex items-center justify-center shadow-2xs active:scale-95 transition"
              aria-label={hideValue ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
            >
              {hideValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="w-7 h-7 rounded-lg bg-white/90 border border-white text-slate-600 flex items-center justify-center shadow-2xs active:scale-95 transition"
              aria-label="Segarkan Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10.5px] font-bold text-slate-500">Total Nilai Persediaan</p>
          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <p className="text-[21px] font-black text-slate-950 tracking-tight tabular-nums leading-none">
              {hideValue ? 'Rp ••••••••' : formatRupiah(summary?.total_nilai_persediaan)}
            </p>
            <span className="text-[10.5px] font-semibold text-slate-500 shrink-0">
              {summary?.total_batch_aktif || activeBatches.length} batch
            </span>
          </div>
        </div>

        {/* Bilah Segmen Sebaran Kondisi Batch */}
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-white/85 overflow-hidden flex gap-0.5 p-0.5">
            {countLewatBatas > 0 && (
              <div
                className="h-full rounded-full bg-rose-500"
                style={{ width: `${(countLewatBatas / totalDistCount) * 100}%` }}
              />
            )}
            {countSegeraRetur > 0 && (
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${(countSegeraRetur / totalDistCount) * 100}%` }}
              />
            )}
            <div
              className="h-full rounded-full bg-teal-500 flex-1"
              style={{ width: `${(countTerkendali / totalDistCount) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9.5px] font-semibold text-slate-600">
            <span>{countLewatBatas} lewat batas</span>
            <span>{countSegeraRetur} wajib retur</span>
            <span>{countTerkendali} aman</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-emerald-200/60">
          <button
            type="button"
            onClick={() => onNavigateToPengingat()}
            className="text-left rounded-xl bg-white/85 border border-white px-2 py-1.5 shadow-2xs active:scale-[0.98] transition"
          >
            <span className="flex items-center gap-1 text-[9.5px] font-bold text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              Risiko
            </span>
            <p className="text-[11px] font-black text-rose-600 tabular-nums mt-0.5">
              {summary?.persentase_berisiko || 0}% Aset
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToPengingat()}
            className="text-left rounded-xl bg-white/85 border border-white px-2 py-1.5 shadow-2xs active:scale-[0.98] transition"
          >
            <span className="flex items-center gap-1 text-[9.5px] font-bold text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              Wajib Retur
            </span>
            <p className="text-[11px] font-black text-slate-950 tabular-nums mt-0.5">
              {ringkasan?.total_mendesak_retur ?? mendesakList.length} Batch
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToInventori()}
            className="text-left rounded-xl bg-white/85 border border-white px-2 py-1.5 shadow-2xs active:scale-[0.98] transition"
          >
            <span className="flex items-center gap-1 text-[9.5px] font-bold text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              Stok Aman
            </span>
            <p className="text-[11px] font-black text-teal-700 tabular-nums mt-0.5">
              {pctAman}% ({countAman})
            </p>
          </button>
        </div>
      </section>

      {/* Banner Ringkasan Desktop */}
      <div className="hidden md:block relative overflow-hidden rounded-2xl border border-[#BEE5D2] bg-gradient-to-br from-[#F3FBF7] via-[#E5F6EE] to-[#D2EFE1] px-4 sm:px-5 py-3.5 sm:py-4 shadow-[0_4px_18px_rgba(5,150,105,0.07)]">
        <DashboardHeroIllustration />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/95 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Terpantau • Acuan {refDate}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                Data Simulasi
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
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs shadow-emerald-600/25 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Faktur Baru</span>
              </button>

              <button
                type="button"
                onClick={handleExportTableCsv}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white bg-white/90 hover:bg-white text-slate-700 text-xs font-bold transition shadow-2xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
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

          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onNavigateToPengingat}
              className="text-left bg-white/95 backdrop-blur-xs rounded-2xl p-3 w-48 border border-white shadow-[0_10px_28px_rgba(6,78,59,0.08)] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Pantau Retur
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
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
              className="w-[74px] h-[74px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_10px_24px_rgba(5,150,105,0.28)] border-[3px] border-white flex flex-col items-center justify-center hover:scale-105 transition-all duration-200 shrink-0"
              title="Lihat detail stok aman"
            >
              <span className="text-base font-black leading-none tabular-nums">{pctAman}%</span>
              <span className="text-[10px] font-bold text-emerald-50 mt-0.5">Stok Aman</span>
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
              onClick={handleToggleHideValue}
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
            {summary?.total_batch_aktif || activeBatches.length} batch tercatat di rak
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
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              Aman
            </span>
          </div>
          <p className="text-base sm:text-2xl font-extrabold text-emerald-600 tracking-tight tabular-nums">
            {pctAman}%
          </p>
          <p className="text-[11px] text-slate-500 font-medium flex items-center justify-between w-full">
            <span>{countAman} batch aman • {stokTipisList.length} tipis</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>
      </section>

      {/* Peluncur Cepat 4 Tombol Berwarna Ringkas untuk Mobile */}
      <div className="grid grid-cols-4 gap-1.5 md:hidden">
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`quick-action-${item.id}`}
              onClick={item.action}
              className="relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-white border border-slate-200/85 shadow-[0_1px_4px_rgba(15,23,42,0.03)] active:scale-[0.97] transition"
            >
              {item.badge && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-white text-[9.5px] font-extrabold flex items-center justify-center border-2 border-[#edf5f0] tabular-nums shadow-2xs">
                  {item.badge}
                </span>
              )}
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${item.iconStyle}`}>
                <Icon className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <span className="text-[10.5px] font-bold text-slate-800 leading-tight text-center truncate w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Workspace Utama: Tabel Kerja Inventori (8 Kolom) + Antrean Tindakan Cepat (4 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        <div className={`contents lg:block lg:col-span-8 lg:order-1 ${mobileQueueFirst ? 'order-2' : 'order-1'}`}>
          <section className={`${mobileQueueFirst ? 'order-2' : 'order-1'} surface-elevated overflow-hidden`}>
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
                className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          <div className="px-3.5 sm:px-4 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/80">
            <div className="flex items-center gap-3.5 sm:gap-5 text-[11px] sm:text-xs overflow-x-auto no-scrollbar">
              {[
                { id: 'semua', label: `Semua (${activeBatches.length})` },
                { id: 'bisa_diretur', label: `Bisa Diretur (${bisaDireturList.length})` },
                { id: 'lewat_batas', label: `Lewat Batas Retur (${lewatBatasList.length})` },
                { id: 'kedaluwarsa', label: `Dekat ED (${kedaluwarsaList.length})` },
                { id: 'stok', label: `Stok Tipis (${stokTipisList.length})` }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`py-2.5 border-b-2 transition whitespace-nowrap ${
                    activeTab === t.id
                      ? 'border-emerald-600 text-slate-950 font-bold'
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
              <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
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
                          {item.status_retur === 'lewat_batas' ? (
                            <button
                              type="button"
                              onClick={() => {
                                const isExpiredEd = hitungSelisihHari(item.tanggal_kedaluwarsa, refDate) <= 0;
                                setActionModal({
                                  isOpen: true,
                                  mode: isExpiredEd ? 'dibuang' : 'prioritas_jual',
                                  batch: item
                                });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                hitungSelisihHari(item.tanggal_kedaluwarsa, refDate) <= 0
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white'
                              }`}
                            >
                              {hitungSelisihHari(item.tanggal_kedaluwarsa, refDate) <= 0
                                ? 'Catat Dibuang'
                                : 'Prioritas Jual'}
                            </button>
                          ) : item.status_retur === 'bisa_diretur' && activeTab !== 'stok' ? (
                            <button
                              type="button"
                              onClick={() =>
                                setActionModal({
                                  isOpen: true,
                                  mode: 'retur',
                                  batch: item
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition"
                            >
                              Proses Retur
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                onNavigateToPenyesuaian
                                  ? onNavigateToPenyesuaian(item)
                                  : onNavigateToInventori(item.nomor_batch)
                              }
                              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-slate-700 text-[11px] font-bold transition"
                            >
                              Opname
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden divide-y divide-slate-100">
                {filteredTableItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      activeTab === 'stok' || item.status_retur === 'lewat_batas'
                        ? onNavigateToInventori(item.nomor_batch)
                        : onNavigateToPengingat(item.nomor_batch)
                    }
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
              Menampilkan{' '}
              <strong className="text-slate-900 sm:hidden">
                {Math.min(5, filteredTableItems.length)}
              </strong>
              <strong className="text-slate-900 hidden sm:inline">
                {filteredTableItems.length}
              </strong>{' '}
              dari {activeBatches.length} batch
            </span>
            <button
              type="button"
              onClick={() => onNavigateToInventori()}
              className="font-bold text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1 transition"
            >
              <span>Kelola Semua Batch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          </section>
        </div>

        {/* Kolom Kanan: Antrean Tindakan Cepat + Eksposur PBF + Halaman Awal */}
        <div className="contents lg:block lg:col-span-4 lg:order-2 lg:space-y-3">
          <section className={`${mobileQueueFirst ? 'order-1' : 'order-2'} surface-elevated p-4 space-y-3`}>
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
                      {q.status_retur === 'lewat_batas' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const isExpiredEd = hitungSelisihHari(q.tanggal_kedaluwarsa, refDate) <= 0;
                            setActionModal({
                              isOpen: true,
                              mode: isExpiredEd ? 'dibuang' : 'prioritas_jual',
                              batch: q
                            });
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-white text-[11px] font-bold transition shadow-xs ${
                            hitungSelisihHari(q.tanggal_kedaluwarsa, refDate) <= 0
                              ? 'bg-rose-600 hover:bg-rose-700'
                              : 'bg-amber-600 hover:bg-amber-700'
                          }`}
                        >
                          {hitungSelisihHari(q.tanggal_kedaluwarsa, refDate) <= 0
                            ? 'Catat Dibuang'
                            : 'Prioritas Jual'}
                        </button>
                      ) : q.status_retur === 'bisa_diretur' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setActionModal({
                              isOpen: true,
                              mode: 'retur',
                              batch: q
                            })
                          }
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs"
                        >
                          Proses Retur
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigateToInventori(q.nomor_batch)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs"
                        >
                          Lihat Batch
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onNavigateToPenyesuaian(q)}
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

          <section className="order-3 surface-elevated p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Eksposur Risiko PBF
              </h3>
              <button
                type="button"
                onClick={onNavigateToInventori}
                className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-600 hover:text-emerald-700"
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
                  const barColors = ['bg-rose-500', 'bg-emerald-600', 'bg-amber-500', 'bg-teal-600'];
                  const barColor = barColors[idx] || 'bg-emerald-600';
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

          <section className="hidden md:block lg:order-4 surface-elevated p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Halaman Awal Aplikasi
              </h3>
              {savedDefaultToast && (
                <span className="text-[11px] font-bold text-emerald-700">
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
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <BatchActionModal
        isOpen={actionModal.isOpen}
        mode={actionModal.mode}
        batch={actionModal.batch}
        petugasNama={user?.nama || 'Petugas Apotek'}
        onClose={() => setActionModal({ isOpen: false, mode: 'retur', batch: null })}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
