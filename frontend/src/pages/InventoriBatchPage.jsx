import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusReturBadge, StatusRisikoBadge } from '../components/common/StatusBadge';
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Edit3,
  Calendar,
  AlertTriangle,
  Building2,
  Package
} from 'lucide-react';

export function InventoriBatchPage({ onSelectBatchForAdjustment }) {
  const [batches, setBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parameter Filter
  const [search, setSearch] = useState('');
  const [distributorFilter, setDistributorFilter] = useState('');
  const [risikoFilter, setRisikoFilter] = useState('semua');
  const [returFilter, setReturFilter] = useState('semua');

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchRes, distRes] = await Promise.all([
        api.getBatches({
          search: search || undefined,
          distributor: distributorFilter || undefined,
          risiko: risikoFilter !== 'semua' ? risikoFilter : undefined,
          retur: returFilter !== 'semua' ? returFilter : undefined,
        }),
        api.getDistributors(),
      ]);
      setBatches(batchRes.data || []);
      setDistributors(distRes.data || []);
    } catch (err) {
      console.error('Gagal mengambil data inventori:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [risikoFilter, returFilter]);

  const handleApplyFilter = () => {
    loadData();
  };

  const handleResetFilter = () => {
    setSearch('');
    setDistributorFilter('');
    setRisikoFilter('semua');
    setReturFilter('semua');
    // Refresh otomatis melalui useEffect
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-4">
      {/* Header dan bilah filter */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-card space-y-3.5">
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

          <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            Total Tercatat: <strong className="text-slate-800">{batches.length} Batch</strong>
          </div>
        </div>

        {/* Interactive Filter Pills */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1">
              Filter Risiko:
            </span>
            {[
              { id: 'semua', label: 'Semua Risiko' },
              { id: 'tinggi', label: 'Risiko Tinggi' },
              { id: 'sedang', label: 'Risiko Sedang' },
              { id: 'rendah', label: 'Risiko Rendah' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setRisikoFilter(pill.id)}
                className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold transition shrink-0 ${
                  risikoFilter === pill.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1">
              Filter Retur:
            </span>
            {[
              { id: 'semua', label: 'Semua Status' },
              { id: 'bisa_diretur', label: 'Bisa Diretur' },
              { id: 'lewat_batas', label: 'Lewat Batas' },
              { id: 'tidak_bisa_diretur', label: 'Tanpa Retur' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setReturFilter(pill.id)}
                className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold transition shrink-0 ${
                  returFilter === pill.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search, Dropdowns, and Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              placeholder="Cari obat / nomor batch..."
              className="w-full text-xs h-11 sm:h-9 pl-9 pr-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={distributorFilter}
            onChange={(e) => setDistributorFilter(e.target.value)}
            className="text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">Semua Distributor (14 PBF)</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>

          <select
            value={risikoFilter}
            onChange={(e) => setRisikoFilter(e.target.value)}
            className="text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="semua">Semua Tingkat Risiko</option>
            <option value="tinggi">Risiko Tinggi (Tenggat Dekat)</option>
            <option value="sedang">Risiko Sedang</option>
            <option value="rendah">Risiko Rendah / Aman</option>
          </select>

          <select
            value={returFilter}
            onChange={(e) => setReturFilter(e.target.value)}
            className="text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="semua">Semua Status Retur</option>
            <option value="bisa_diretur">Bisa Diretur</option>
            <option value="lewat_batas">Lewat Batas Retur</option>
            <option value="tidak_bisa_diretur">Tanpa Retur</option>
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApplyFilter}
              className="flex-1 h-11 sm:h-9 min-h-[44px] sm:min-h-0 px-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-xs active:scale-95"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition active:scale-95"
              title="Reset Filter"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Kontainer Hasil (Dual View: Cards on mobile, Table on desktop) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Memuat daftar batch persediaan...
          </div>
        ) : batches.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Tidak ada batch yang cocok dengan kriteria filter Anda.
          </div>
        ) : (
          <>
            {/* Mobile / Tablet Responsive Batch Cards (block md:hidden) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {batches.map((b) => (
                <div key={b.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                        {b.nama_obat}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          Batch: {b.nomor_batch}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium truncate">
                          • {b.nama_distributor}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-900 shrink-0">
                      {formatRupiah(b.nilai_total)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusReturBadge status={b.status_retur} batasRetur={b.batas_retur} />
                    <StatusRisikoBadge status={b.status_risiko} skor={b.skor_risiko} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                        Kedaluwarsa (ED)
                      </span>
                      <span className="font-semibold text-slate-700">
                        {b.tanggal_kedaluwarsa}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                        Batas Retur PBF
                      </span>
                      <span className="font-semibold text-slate-700">
                        {b.batas_retur || <span className="text-slate-400 italic">Tidak ada</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                        Stok Fisik Saat Ini
                      </span>
                      <span className="font-black text-slate-900 text-sm">
                        {b.jumlah_saat_ini}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                        Jumlah Penerimaan Awal
                      </span>
                      <span className="font-medium text-slate-600">
                        {b.jumlah_awal}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectBatchForAdjustment && onSelectBatchForAdjustment(b)}
                    className="w-full flex items-center justify-center gap-2 h-11 min-h-[44px] rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-xs transition active:scale-95"
                    title="Sesuaikan stok dari hasil cek fisik rak"
                  >
                    <Edit3 className="w-4 h-4 text-emerald-600" />
                    <span>Cek Fisik Rak & Sesuaikan Stok</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="overflow-x-auto hidden md:block">
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
                          type="button"
                          onClick={() => onSelectBatchForAdjustment && onSelectBatchForAdjustment(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-semibold transition"
                          title="Sesuaikan stok dari hasil cek fisik rak"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Cek Fisik</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
