import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { StatusReturBadge, StatusRisikoBadge } from '../components/common/StatusBadge';
import { exportToExcelCsv } from '../utils/fileTools';
import {
  BellRing,
  Clock,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Printer,
  LayoutList,
  LayoutGrid,
  CheckSquare,
  Square,
  Download
} from 'lucide-react';

export function PengingatReturPage({ onNavigateToPenyesuaian }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('retur');
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPbf, setFilterPbf] = useState('semua');
  const [sortBy, setSortBy] = useState('urgensi');
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [bapModalData, setBapModalData] = useState({ isOpen: false, batches: [] });

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
    const selectedBatches = filteredAndSortedList.filter((b) => selectedBatchIds.includes(b.id));
    setBapModalData({
      isOpen: true,
      batches: selectedBatches.length > 0 ? selectedBatches : filteredAndSortedList,
    });
  };

  const handleOpenSingleBap = (item) => {
    setBapModalData({
      isOpen: true,
      batches: [item],
    });
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
    <div className="space-y-3">
      {/* Header Pengingat & Ekspor Excel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Pengingat Retur & Kedaluwarsa
            </h2>
            <p className="text-xs text-slate-500">
              Dihitung per acuan <strong className="text-slate-700">{data.tanggal_acuan}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const headers = ['Nama Obat', 'Nomor Batch', 'Distributor PBF', 'Sisa Hari Retur', 'Batas Retur', 'Tanggal ED', 'Sisa Stok', 'Nilai Total (Rp)'];
              const rows = filteredAndSortedList.map((b) => [
                b.nama_obat,
                b.nomor_batch,
                b.nama_distributor || '-',
                b.sisa_hari_retur ?? b.sisa_hari_exp ?? '-',
                b.batas_retur || '-',
                b.tanggal_kedaluwarsa || '-',
                b.jumlah_saat_ini || 0,
                b.nilai_total || 0,
              ]);
              exportToExcelCsv(`pengingat_retur_${data.tanggal_acuan}.csv`, headers, rows);
            }}
            className="btn-outline h-10 sm:h-9 px-3 text-xs"
            title="Ekspor daftar ini ke format Excel CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Ekspor Excel (.CSV)</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{mendesakRetur.length} Mendesak</span>
          </div>
        </div>
      </div>

      {/* Kartu Kategori 3 Kolom Ringkas */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('retur');
            setSelectedBatchIds([]);
          }}
          className={`p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'retur'
              ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-rose-300 text-slate-900'
          }`}
        >
          <div className="min-w-0">
            <span className={`text-[10px] sm:text-xs font-semibold block truncate ${activeTab === 'retur' ? 'text-rose-100' : 'text-slate-500'}`}>
              Mendesak Retur
            </span>
            <p className="text-base sm:text-xl font-extrabold tabular-nums mt-0.5">
              {mendesakRetur.length} <span className="text-[11px] font-medium hidden sm:inline">Batch</span>
            </p>
          </div>
          <div className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center shrink-0 ${activeTab === 'retur' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'}`}>
            <Clock className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('kedaluwarsa');
            setSelectedBatchIds([]);
          }}
          className={`p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'kedaluwarsa'
              ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-amber-300 text-slate-900'
          }`}
        >
          <div className="min-w-0">
            <span className={`text-[10px] sm:text-xs font-semibold block truncate ${activeTab === 'kedaluwarsa' ? 'text-amber-50' : 'text-slate-500'}`}>
              Dekat ED
            </span>
            <p className="text-base sm:text-xl font-extrabold tabular-nums mt-0.5">
              {mendekatiKedaluwarsa.length} <span className="text-[11px] font-medium hidden sm:inline">Batch</span>
            </p>
          </div>
          <div className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center shrink-0 ${activeTab === 'kedaluwarsa' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('menipis');
            setSelectedBatchIds([]);
          }}
          className={`p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'menipis'
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-blue-300 text-slate-900'
          }`}
        >
          <div className="min-w-0">
            <span className={`text-[10px] sm:text-xs font-semibold block truncate ${activeTab === 'menipis' ? 'text-blue-100' : 'text-slate-500'}`}>
              Stok Tipis
            </span>
            <p className="text-base sm:text-xl font-extrabold tabular-nums mt-0.5">
              {stokMenipis.length} <span className="text-[11px] font-medium hidden sm:inline">Batch</span>
            </p>
          </div>
          <div className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center shrink-0 ${activeTab === 'menipis' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
            <Boxes className="w-4 h-4" />
          </div>
        </button>
      </div>

      
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Kiri: Search Input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama obat, nomor batch, atau distributor..."
            className="w-full text-xs h-11 sm:h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Kanan: Filter PBF, Sorting, & Toggle Table/Cards */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Dropdown Filter PBF */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-1 sm:flex-initial">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterPbf}
              onChange={(e) => setFilterPbf(e.target.value)}
              className="text-xs h-11 sm:h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium w-full sm:w-auto"
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
          <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-1 sm:flex-initial">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs h-11 sm:h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium w-full sm:w-auto"
            >
              <option value="urgensi">Tenggat Terdekat</option>
              <option value="nilai_desc">Nilai Terbesar (Rp)</option>
              <option value="nama_asc">Nama Obat (A-Z)</option>
              <option value="stok_asc">Sisa Stok Sedikit</option>
            </select>
          </div>

          {/* View Mode Switcher (with >= 44x44px touch targets on mobile) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg text-xs transition ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Ringkas"
              aria-label="Tampilan Tabel Ringkas"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg text-xs transition ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu"
              aria-label="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      
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
                  <th className="py-2.5 px-3 font-extrabold text-center">Tingkat Risiko</th>
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

                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-[180px]">
                          <span className="font-semibold text-slate-800 block truncate">
                            {item.nama_distributor || '-'}
                          </span>
                        </td>

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

                        <td className="py-2.5 px-3 text-right">
                          <span className="font-black text-slate-900 block text-xs">
                            {item.jumlah_saat_ini}
                          </span>
                          <span className="text-[10px] text-slate-400">unit di rak</span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`font-black text-xs block ${
                              isOverdue ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {formatRupiah(item.nilai_total)}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <StatusRisikoBadge
                            status={item.status_risiko}
                            skor={item.skor_risiko}
                          />
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                onNavigateToPenyesuaian && onNavigateToPenyesuaian(item)
                              }
                              className="btn-outline h-7 px-2.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Lakukan Cek Fisik Rak & Stock Opname"
                            >
                              Cek Rak
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenSingleBap(item)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                              title="Buat Berita Acara Retur"
                              aria-label={`Buat Berita Acara Retur untuk ${item.nama_obat}`}
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

          <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong>{filteredAndSortedList.length}</strong> batch obat
            </span>
            <span>SIMAAF Apotek Asahan Farma • Kepatuhan Standar CDOB BPOM</span>
          </div>
        </div>
      ) : (
        /* Mobile / Cards View with Full Feature Parity */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAndSortedList.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition-all space-y-3 ${
                selectedBatchIds.includes(item.id)
                  ? 'border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleSelectOne(item.id)}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-blue-600 transition -ml-2 -mt-2 shrink-0"
                    title={selectedBatchIds.includes(item.id) ? 'Batalkan pilihan' : 'Pilih batch'}
                    aria-label={`Pilih batch ${item.nomor_batch}`}
                  >
                    {selectedBatchIds.includes(item.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {item.nama_obat}
                    </h4>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-semibold mt-0.5 inline-block">
                      {item.nomor_batch}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-900 block">
                    {formatRupiah(item.nilai_total)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.jumlah_saat_ini} tersisa
                  </span>
                </div>
              </div>

              {/* Status Badges Parity */}
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusReturBadge status={item.status_retur} batasRetur={item.batas_retur} />
                <StatusRisikoBadge status={item.status_risiko} skor={item.skor_risiko} />
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

              {/* Action Buttons with >=44px touch targets on mobile */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenSingleBap(item)}
                  className="btn-outline h-11 min-h-[44px] px-3 text-xs font-bold text-slate-700 flex-1 flex items-center justify-center gap-1.5"
                  title="Buat Berita Acara Retur"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dokumen BAP</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onNavigateToPenyesuaian && onNavigateToPenyesuaian(item)
                  }
                  className="btn-primary h-11 min-h-[44px] px-3 text-xs font-bold flex-1 flex items-center justify-center gap-1.5"
                  title="Cek Fisik Rak & Penyesuaian Stok"
                >
                  <span>Cek Rak</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dokumen Berita Acara Retur (BAP) */}
      {bapModalData.isOpen && (
        <div
          data-testid="bap-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={() => setBapModalData({ isOpen: false, batches: [] })}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal BAP */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Berita Acara Pengembalian (BAP) Obat
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Dokumen resmi pengajuan retur PBF</p>
              </div>
              <button
                type="button"
                data-testid="bap-modal-close"
                onClick={() => setBapModalData({ isOpen: false, batches: [] })}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition"
                aria-label="Tutup dialog BAP"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-3 text-xs flex-1">
              {/* Pharmacy Letterhead */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-base font-black text-slate-950 tracking-tight">
                  APOTEK ASAHAN FARMA
                </h2>
                <p className="text-slate-600 text-[11px] font-medium">
                  Jl. Imam Bonjol No.331, Kisaran Timur, Kab. Asahan, Sumatera Utara
                </p>
                <p className="text-slate-400 text-[10px] font-mono">
                  NIB: 1210210063257 • SIA: 442/012/SIA/DPMPTSP/2022 • APJ: Ibu Anni, S.Farm., Apt.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">
                  BERITA ACARA PENGEMBALIAN BATCH OBAT (BAP)
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Diterbitkan pada tanggal <strong>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> untuk pengembalian produk obat mendekati kedaluwarsa sesuai klausul retur PBF distributor rekanan.
                </p>
              </div>

              {/* Daftar Item BAP untuk Layar Mobile (Tanpa Geser Horizontal) */}
              <div className="sm:hidden print:hidden border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {bapModalData.batches.map((b, idx) => (
                  <div key={b.id || idx} className="p-3 bg-white space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 leading-snug">
                          {idx + 1}. {b.nama_obat}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          <span className="font-mono">{b.nomor_batch || b.no_batch}</span> • {b.nama_distributor || b.pbf}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900 tabular-nums shrink-0">
                        {formatRupiah(b.nilai_total || b.nilai)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-rose-600 font-semibold whitespace-nowrap">
                        ED: {b.tanggal_kedaluwarsa || b.ed}
                      </span>
                      <span className="font-bold text-slate-700">
                        {b.jumlah_saat_ini || b.stok} unit
                      </span>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between font-extrabold">
                  <span className="text-slate-700">Total Pengajuan Retur</span>
                  <span className="text-blue-700 tabular-nums">
                    {formatRupiah(
                      bapModalData.batches.reduce((acc, curr) => acc + (curr.nilai_total || curr.nilai || 0), 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Tabel Resmi BAP untuk Desktop & Cetak */}
              <div className="hidden sm:block print:block border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">Nama Obat</th>
                      <th className="py-2 px-3">No. Batch</th>
                      <th className="py-2 px-3">Distributor</th>
                      <th className="py-2 px-3">ED</th>
                      <th className="py-2 px-3 text-center">Unit</th>
                      <th className="py-2 px-3 text-right">Nilai Estimasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bapModalData.batches.map((b, idx) => (
                      <tr key={b.id || idx}>
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{b.nama_obat}</td>
                        <td className="py-2 px-3 font-mono">{b.nomor_batch || b.no_batch}</td>
                        <td className="py-2 px-3 text-slate-600">{b.nama_distributor || b.pbf}</td>
                        <td className="py-2 px-3 text-rose-600 font-medium whitespace-nowrap">{b.tanggal_kedaluwarsa || b.ed}</td>
                        <td className="py-2 px-3 text-center font-bold">{b.jumlah_saat_ini || b.stok}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatRupiah(b.nilai_total || b.nilai)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-extrabold">
                    <tr>
                      <td colSpan={6} className="py-2 px-3 text-right">Total Nilai Pengajuan Retur:</td>
                      <td className="py-2 px-3 text-right text-blue-700 whitespace-nowrap">
                        {formatRupiah(
                          bapModalData.batches.reduce((acc, curr) => acc + (curr.nilai_total || curr.nilai || 0), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Area Tanda Tangan */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 text-center text-[11px] sm:text-xs">
                <div className="space-y-10 sm:space-y-12">
                  <p className="text-slate-500 font-medium">Apoteker Penanggung Jawab,</p>
                  <div>
                    <p className="font-bold text-slate-900 underline">Ibu Anni, S.Farm., Apt.</p>
                    <p className="text-[10px] text-slate-400">SIP: 19850412/SIPA-012/2022</p>
                  </div>
                </div>
                <div className="space-y-10 sm:space-y-12">
                  <p className="text-slate-500 font-medium">Petugas Ekspedisi / PBF,</p>
                  <div>
                    <p className="font-bold text-slate-900 underline whitespace-nowrap">( .................... )</p>
                    <p className="text-[10px] text-slate-400">Nama Terang & Cap Distributor</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                Kepatuhan Standar CDOB BPOM • SIMAAF
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary min-h-[44px] flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen BAP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBapModalData({ isOpen: false, batches: [] })}
                  className="btn-outline min-h-[44px] px-4"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
