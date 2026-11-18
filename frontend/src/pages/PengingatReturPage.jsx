import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { StatusReturBadge, StatusRisikoBadge } from '../components/common/StatusBadge';
import {
  BellRing,
  Clock,
  Calendar,
  Building2,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Phone,
  LayoutList,
  LayoutGrid,
  CheckSquare,
  Square,
  AlertCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export function PengingatReturPage({ onNavigateToPenyesuaian }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('retur'); // 'retur', 'kedaluwarsa', 'menipis'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPbf, setFilterPbf] = useState('semua');
  const [sortBy, setSortBy] = useState('urgensi'); // 'urgensi', 'nilai_desc', 'nama_asc', 'stok_asc'
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  useEffect(() => {
    loadPengingat();
  }, []);

  const loadPengingat = async () => {
    setLoading(true);
    try {
      const res = await api.getPengingat();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Kumpulan data berdasarkan tab aktif
  const currentList = useMemo(() => {
    if (!data?.data) return [];
    if (activeTab === 'retur') return data.data.mendesakRetur;
    if (activeTab === 'kedaluwarsa') return data.data.mendekatiKedaluwarsa;
    return data.data.stokMenipis;
  }, [data, activeTab]);

  // Daftar unik PBF untuk filter dropdown
  const uniquePbfs = useMemo(() => {
    if (!currentList) return [];
    const set = new Set();
    currentList.forEach((item) => {
      if (item.nama_distributor) set.add(item.nama_distributor);
    });
    return Array.from(set);
  }, [currentList]);

  // Filter & Sorting data
  const filteredAndSortedList = useMemo(() => {
    let list = [...currentList];

    // Filter pencarian
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.nama_obat.toLowerCase().includes(q) ||
          b.nomor_batch.toLowerCase().includes(q) ||
          (b.nama_distributor || '').toLowerCase().includes(q)
      );
    }

    // Filter PBF
    if (filterPbf !== 'semua') {
      list = list.filter((b) => b.nama_distributor === filterPbf);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'urgensi') {
        const daysA = a.sisa_hari_retur !== undefined ? a.sisa_hari_retur : a.sisa_hari_exp || 0;
        const daysB = b.sisa_hari_retur !== undefined ? b.sisa_hari_retur : b.sisa_hari_exp || 0;
        return daysA - daysB;
      }
      if (sortBy === 'nilai_desc') {
        return (b.nilai_total || 0) - (a.nilai_total || 0);
      }
      if (sortBy === 'nama_asc') {
        return a.nama_obat.localeCompare(b.nama_obat);
      }
      if (sortBy === 'stok_asc') {
        return (a.jumlah_saat_ini || 0) - (b.jumlah_saat_ini || 0);
      }
      return 0;
    });

    return list;
  }, [currentList, searchQuery, filterPbf, sortBy]);

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedBatchIds.length === filteredAndSortedList.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(filteredAndSortedList.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkPrintReturn = () => {
    setBulkSuccessMsg(
      `Berita Acara Retur Fisik untuk ${selectedBatchIds.length} batch telah disiapkan untuk dicetak!`
    );
    setTimeout(() => setBulkSuccessMsg(''), 4500);
  };

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-slate-400 font-semibold animate-pulse">
        Menghitung pengingat tenggat retur dan kedaluwarsa apotek...
      </div>
    );
  }

  const { mendesakRetur, mendekatiKedaluwarsa, stokMenipis } = data.data;

  // Total nilai batch terpilih
  const totalNilaiSelected = filteredAndSortedList
    .filter((b) => selectedBatchIds.includes(b.id))
    .reduce((acc, curr) => acc + (curr.nilai_total || 0), 0);

  return (
    <div className="space-y-5">
      {/* ========================================================
          Top Header Bar
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Pusat Pengawasan Logistik
          </span>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BellRing className="w-4 h-4 text-rose-600" />
            Pengingat Tenggat Retur & Kedaluwarsa
          </h2>
          <p className="text-xs text-slate-500">
            Dihitung otomatis per tanggal acuan sistem: <strong className="text-slate-800">{data.tanggal_acuan}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,Nama Obat,No Batch,PBF,Sisa Hari,Batas Retur,Stok,Nilai Total\n' +
                filteredAndSortedList
                  .map(
                    (b) =>
                      `"${b.nama_obat}","${b.nomor_batch}","${b.nama_distributor || ''}",${b.sisa_hari_retur || ''},${b.batas_retur || ''},${b.jumlah_saat_ini || 0},${b.nilai_total || 0}`
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `pengingat_retur_${data.tanggal_acuan}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="btn-outline h-8 px-3 text-xs"
            title="Ekspor daftar ini ke format CSV/Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{mendesakRetur.length} Batch Perlu Tindakan Segera</span>
          </div>
        </div>
      </div>

      {bulkSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{bulkSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================
          3 Kartu Metrik Tab Ringkas (Horizontal, Padat & Rapi)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => {
            setActiveTab('retur');
            setSelectedBatchIds([]);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer ${
            activeTab === 'retur'
              ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block truncate">
                Mendesak Retur (&lt; 30 Hari)
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {mendesakRetur.length} Batch
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Batas klaim PBF hampir habis</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" strokeWidth={2.4} />
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('kedaluwarsa');
            setSelectedBatchIds([]);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer ${
            activeTab === 'kedaluwarsa'
              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block truncate">
                Mendekati Kedaluwarsa (&lt; 90 Hari)
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {mendekatiKedaluwarsa.length} Batch
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Prioritaskan pengeluaran FEFO</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" strokeWidth={2.4} />
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('menipis');
            setSelectedBatchIds([]);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer ${
            activeTab === 'menipis'
              ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block truncate">
                Stok Menipis
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {stokMenipis.length} Batch
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Di bawah stok pengaman</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4" strokeWidth={2.4} />
          </div>
        </button>
      </div>

      {/* ========================================================
          Toolbar Kontrol: Pencarian, Filter PBF, Sort, & Mode Tampilan
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Kiri: Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama obat, nomor batch, atau distributor..."
            className="w-full text-xs h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Kanan: Filter PBF, Sorting, & Toggle Table/Cards */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dropdown Filter PBF */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterPbf}
              onChange={(e) => setFilterPbf(e.target.value)}
              className="text-xs h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="semua">Semua PBF ({uniquePbfs.length})</option>
              {uniquePbfs.map((pbf, idx) => (
                <option key={idx} value={pbf}>
                  {pbf}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="urgensi">Tenggat Terdekat</option>
              <option value="nilai_desc">Nilai Terbesar (Rp)</option>
              <option value="nama_asc">Nama Obat (A-Z)</option>
              <option value="stok_asc">Sisa Stok Sedikit</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Berdensitas Tinggi (Compact Table)"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu Ringkas (Compact Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          Floating / Sticky Bulk Action Bar jika ada batch terpilih
          ======================================================== */}
      {selectedBatchIds.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">
              <strong className="text-blue-700">{selectedBatchIds.length} batch</strong> terpilih
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-extrabold text-slate-900">
              Total Nilai: {formatRupiah(totalNilaiSelected)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkPrintReturn}
              className="btn-primary h-8 px-3 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Berita Acara Retur ({selectedBatchIds.length})</span>
            </button>
            <button
              onClick={() => setSelectedBatchIds([])}
              className="btn-outline h-8 px-2.5 text-xs text-slate-500"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TAMPILAN 1: COMPACT DATA TABLE (Berdensitas Tinggi, Bebas Boros)
          ======================================================== */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-blue-600 transition"
                      title="Pilih Semua Batch"
                    >
                      {selectedBatchIds.length === filteredAndSortedList.length &&
                      filteredAndSortedList.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3 font-extrabold">Nama Obat & No. Batch</th>
                  <th className="py-2.5 px-3 font-extrabold">Distributor (PBF)</th>
                  <th className="py-2.5 px-3 font-extrabold">Tenggat Retur & ED</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Sisa Stok</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Nilai Total</th>
                  <th className="py-2.5 px-3 font-extrabold text-center">Risiko AI</th>
                  <th className="py-2.5 px-3 font-extrabold text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada data batch yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedList.map((item) => {
                    const isSelected = selectedBatchIds.includes(item.id);
                    const isOverdue =
                      item.sisa_hari_retur !== undefined && item.sisa_hari_retur < 0;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(item.id)}
                            className="text-slate-400 hover:text-blue-600 transition"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Nama Obat & Batch */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 truncate max-w-[200px] block">
                              {item.nama_obat}
                            </span>
                            <span className="font-mono text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-semibold shrink-0">
                              {item.nomor_batch}
                            </span>
                          </div>
                        </td>

                        {/* Distributor PBF */}
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-[180px]">
                          <span className="font-semibold text-slate-800 block truncate">
                            {item.nama_distributor || '-'}
                          </span>
                        </td>

                        {/* Tenggat Retur & ED */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {item.sisa_hari_retur !== undefined ? (
                              <StatusReturBadge
                                status={item.status_retur}
                                sisaHari={item.sisa_hari_retur}
                              />
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-500" />
                                {item.sisa_hari_exp} Hari Lagi
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              (ED: {item.tanggal_kedaluwarsa})
                            </span>
                          </div>
                        </td>

                        {/* Sisa Stok */}
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-black text-slate-900 block text-xs">
                            {item.jumlah_saat_ini}
                          </span>
                          <span className="text-[10px] text-slate-400">unit di rak</span>
                        </td>

                        {/* Nilai Total */}
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`font-black text-xs block ${
                              isOverdue ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {formatRupiah(item.nilai_total)}
                          </span>
                        </td>

                        {/* Status Risiko AI */}
                        <td className="py-2.5 px-3 text-center">
                          <StatusRisikoBadge
                            status={item.status_risiko}
                            skor={item.skor_risiko}
                          />
                        </td>

                        {/* Aksi Cepat */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() =>
                                onNavigateToPenyesuaian && onNavigateToPenyesuaian(item)
                              }
                              className="btn-outline h-7 px-2.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Lakukan Cek Fisik Rak & Stock Opname"
                            >
                              Cek Rak
                            </button>

                            <button
                              onClick={() => {
                                alert(
                                  `Surat Pengajuan Retur untuk ${item.nama_obat} (Batch ${item.nomor_batch}) kepada ${item.nama_distributor} telah digenerate sesuai klausul kebijakan retur.`
                                );
                              }}
                              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                              title="Buat Berita Acara Retur"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong>{filteredAndSortedList.length}</strong> batch obat
            </span>
            <span>SIMAAF Apotek Asahan Farma • Kepatuhan Standar CDOB BPOM</span>
          </div>
        </div>
      ) : (
        /* ========================================================
            TAMPILAN 2: COMPACT GRID CARDS (Lebih Rapi & Padat)
            ======================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAndSortedList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {item.nama_obat}
                  </h4>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1 rounded font-semibold mt-0.5 inline-block">
                    {item.nomor_batch}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-900 block">
                    {formatRupiah(item.nilai_total)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.jumlah_saat_ini} tersisa
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Distributor:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[150px]">
                    {item.nama_distributor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batas Retur:</span>
                  <span className="font-bold text-rose-600">{item.batas_retur || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tgl Kedaluwarsa:</span>
                  <span className="text-slate-700">{item.tanggal_kedaluwarsa}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <StatusRisikoBadge status={item.status_risiko} skor={item.skor_risiko} />
                <button
                  onClick={() =>
                    onNavigateToPenyesuaian && onNavigateToPenyesuaian(item)
                  }
                  className="btn-outline h-7 px-2.5 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                >
                  Cek Rak
                  <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
