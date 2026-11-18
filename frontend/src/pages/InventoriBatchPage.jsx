import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusReturBadge, StatusRisikoBadge } from '../components/common/StatusBadge';
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  Edit3
} from 'lucide-react';

export function InventoriBatchPage({ onSelectBatchForAdjustment }) {
  const [batches, setBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tanggalAcuan, setTanggalAcuan] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [distributorFilter, setDistributorFilter] = useState('');
  const [risikoFilter, setRisikoFilter] = useState('semua');
  const [returFilter, setReturFilter] = useState('semua');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, dList] = await Promise.all([
        api.getBatches({
          search,
          distributor_id: distributorFilter,
          status_risiko: risikoFilter,
          status_retur: returFilter
        }),
        api.getDistributors()
      ]);
      setBatches(bRes.data);
      setTanggalAcuan(bRes.tanggal_acuan);
      setDistributors(dList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    loadData();
  };

  const handleResetFilter = () => {
    setSearch('');
    setDistributorFilter('');
    setRisikoFilter('semua');
    setReturFilter('semua');
    setTimeout(() => {
      loadData();
    }, 50);
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Bar Terpadu (Ga Boros Spasi) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-brand-600" />
              Tabel Persediaan & Agregasi Batch Obat
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan seluruh batch obat aktif dengan pemantauan batas retur dan prioritas kedaluwarsa (FEFO).
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
            Total Tercatat: <strong className="text-slate-800">{batches.length} Batch</strong>
          </div>
        </div>

        {/* Baris Filter Kompak */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-100">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              placeholder="Cari obat / nomor batch..."
              className="w-full text-xs h-8 pl-8 pr-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Distributor Filter */}
          <select
            value={distributorFilter}
            onChange={(e) => setDistributorFilter(e.target.value)}
            className="text-xs h-8 px-2 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Semua Distributor (14 PBF)</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>

          {/* Status Risiko AI Filter */}
          <select
            value={risikoFilter}
            onChange={(e) => setRisikoFilter(e.target.value)}
            className="text-xs h-8 px-2 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="semua">Semua Tingkat Risiko</option>
            <option value="tinggi">Risiko Tinggi (Tenggat Dekat)</option>
            <option value="sedang">Risiko Sedang</option>
            <option value="rendah">Risiko Rendah / Aman</option>
          </select>

          {/* Status Retur Filter */}
          <select
            value={returFilter}
            onChange={(e) => setReturFilter(e.target.value)}
            className="text-xs h-8 px-2 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="semua">Semua Status Retur</option>
            <option value="bisa_diretur">Bisa Diretur</option>
            <option value="lewat_batas">Lewat Batas Retur</option>
            <option value="tidak_bisa_diretur">Tanpa Retur</option>
          </select>

          {/* Action Buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={handleApplyFilter}
              className="flex-1 h-8 px-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-md transition"
            >
              Terapkan
            </button>
            <button
              onClick={handleResetFilter}
              className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-md transition"
              title="Reset Filter"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Data Batch Kompak */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Memuat daftar batch persediaan...
          </div>
        ) : batches.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Tidak ada batch yang cocok dengan kriteria filter Anda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Nama Obat & Batch</th>
                  <th className="py-2.5 px-3">Distributor (PBF)</th>
                  <th className="py-2.5 px-3">Tgl Kedaluwarsa</th>
                  <th className="py-2.5 px-3">Batas Retur</th>
                  <th className="py-2.5 px-3 text-center">Stok</th>
                  <th className="py-2.5 px-3 text-right">Nilai Stok</th>
                  <th className="py-2.5 px-3">Status Retur</th>
                  <th className="py-2.5 px-3">Status Risiko</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900 leading-tight">{b.nama_obat}</p>
                      <span className="font-mono text-[11px] text-slate-500">
                        {b.nomor_batch}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate" title={b.nama_distributor}>
                      {b.nama_distributor}
                    </td>

                    <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                      {b.tanggal_kedaluwarsa}
                    </td>

                    <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                      {b.batas_retur || <span className="text-slate-400 italic">Tidak ada</span>}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-slate-900 text-xs">
                        {b.jumlah_saat_ini}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        awal: {b.jumlah_awal}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {formatRupiah(b.nilai_total)}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusReturBadge status={b.status_retur} batasRetur={b.batas_retur} />
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusRisikoBadge status={b.status_risiko} skor={b.skor_risiko} />
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectBatchForAdjustment && onSelectBatchForAdjustment(b)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-semibold transition"
                        title="Sesuaikan stok dari hasil cek fisik rak"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Cek Fisik</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
