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
  Search
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
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
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
      {/* Banner Gelap Terhubung ke Header + Kartu KPI Tumpang-Tindih Berkedalaman */}
      <div>
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e2222] to-slate-900 text-white px-4 sm:px-6 pt-4 sm:pt-5 pb-14 sm:pb-16 border border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Ringkasan Inventori & Retur PBF
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Terpantau
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Acuan operasional {refDate} • Apotek Asahan Farma
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-bold transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>

              <button
                type="button"
                onClick={handleExportTableCsv}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ekspor Excel</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToFaktur}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Input Faktur</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Kartu Metrik Melayang dengan Garis Aksen Atas & Efek Hover */}
        <section className="-mt-10 sm:-mt-11 px-2 sm:px-3 grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          <div className="bg-white rounded-xl border border-slate-200/90 border-t-2 border-t-slate-900 p-3.5 sm:p-4 flex flex-col justify-between space-y-2 shadow-md shadow-slate-900/5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500">Total Nilai Aset</span>
              <button
                type="button"
                onClick={() => setHideValue(!hideValue)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded transition"
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
            className="text-left bg-white rounded-xl border border-slate-200/90 border-t-2 border-t-rose-500 p-3.5 sm:p-4 flex flex-col justify-between space-y-2 shadow-md shadow-slate-900/5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500">Aset Risiko Retur</span>
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
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
            className="text-left bg-white rounded-xl border border-slate-200/90 border-t-2 border-t-amber-500 p-3.5 sm:p-4 flex flex-col justify-between space-y-2 shadow-md shadow-slate-900/5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500">Wajib Retur</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
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
            className="text-left bg-white rounded-xl border border-slate-200/90 border-t-2 border-t-emerald-600 p-3.5 sm:p-4 flex flex-col justify-between space-y-2 shadow-md shadow-slate-900/5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500">Kondisi Stok Aman</span>
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            </div>
            <p className="text-base sm:text-2xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
              {pctAman}%
            </p>
            <p className="text-[11px] text-slate-500 font-medium flex items-center justify-between w-full">
              <span>{countAman} batch aman • {stokTipisList.length} tipis</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </button>
        </section>
      </div>

      {/* Peluncur Cepat 4 Tombol untuk Mobile */}
      <div className="grid grid-cols-4 gap-2 md:hidden">
        {quickActions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={item.action}
              className="relative flex flex-col items-center justify-center gap-1.5 py-3 px-1.5 surface-elevated active:scale-[0.97]"
            >
              {item.badge && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {item.badge}
                </span>
              )}
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
                <Icon className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight text-center truncate w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Workspace Utama: Tabel Kerja Inventori (8 Kolom) + Antrean Tindakan Cepat (4 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
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
                className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          <div className="px-4 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/70">
            <div className="flex items-center gap-5 text-xs overflow-x-auto no-scrollbar">
              {[
                { id: 'semua', label: `Semua (${batches.length})` },
                { id: 'retur', label: `Wajib Retur (${mendesakList.length})` },
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
                      <th className="py-2.5 px-4">Nama Obat & Batch</th>
                      <th className="py-2.5 px-3">Distributor (PBF)</th>
                      <th className="py-2.5 px-3">Tenggat / ED</th>
                      <th className="py-2.5 px-3 text-center">Stok</th>
                      <th className="py-2.5 px-3 text-right">Nilai Aset</th>
                      <th className="py-2.5 px-3">Status Retur</th>
                      <th className="py-2.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTableItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/90 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 leading-snug">
                            {item.nama_obat}
                          </p>
                          <span className="font-mono text-[11px] font-medium text-slate-500">
                            {item.nomor_batch}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[160px] truncate" title={item.nama_distributor}>
                          {item.nama_distributor}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap tabular-nums">
                          <span className="font-semibold text-slate-800 block">
                            {item.batas_retur ? `Retur: ${item.batas_retur}` : 'Tanpa Retur'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ED: {item.tanggal_kedaluwarsa}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 tabular-nums">
                          {item.jumlah_saat_ini ?? 0}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-950 whitespace-nowrap tabular-nums">
                          {hideValue ? '••••••' : formatRupiah(item.nilai_total)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <StatusReturBadge
                            status={item.status_retur}
                            sisaHari={item.sisa_hari_retur}
                            batasRetur={item.batas_retur}
                          />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              activeTab === 'stok' && onNavigateToPenyesuaian
                                ? onNavigateToPenyesuaian()
                                : onNavigateToPengingat()
                            }
                            className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-slate-700 text-[11px] font-bold transition"
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
                    className="w-full p-3.5 text-left hover:bg-slate-50 flex items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.nama_obat}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="font-mono">{item.nomor_batch}</span> • {item.nama_distributor}
                      </p>
                      <StatusReturBadge
                        status={item.status_retur}
                        sisaHari={item.sisa_hari_retur}
                        batasRetur={item.batas_retur}
                      />
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-extrabold text-slate-950 tabular-nums">
                        {hideValue ? '••••••' : formatRupiah(item.nilai_total)}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                        Stok: {item.jumlah_saat_ini ?? 0}
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
              className="font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 transition"
            >
              <span>Kelola Semua Batch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Kolom Kanan: Antrean Tindakan Cepat + Eksposur PBF + Halaman Awal */}
        <div className="lg:col-span-4 space-y-4">
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
                    className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/80 hover:bg-white hover:border-slate-300 transition space-y-2"
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
                        className="flex-1 py-1.5 rounded-md bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-bold transition"
                      >
                        Proses Retur
                      </button>
                      <button
                        type="button"
                        onClick={onNavigateToPenyesuaian}
                        className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition"
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

          <section className="surface-elevated p-4 space-y-2.5">
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
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
