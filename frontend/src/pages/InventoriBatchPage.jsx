import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { StatusReturBadge, StatusRisikoBadge } from '../components/common/StatusBadge';
import { exportToExcelCsv, parseUploadedDocument } from '../utils/fileTools';
import {
  Boxes,
  Search,
  Edit3,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export function InventoriBatchPage({ onSelectBatchForAdjustment }) {
  const [batches, setBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [obatList, setObatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState(null);
  const fileImportRef = useRef(null);

  const [search, setSearch] = useState('');
  const [distributorFilter, setDistributorFilter] = useState('');
  const [risikoFilter, setRisikoFilter] = useState('semua');
  const [returFilter, setReturFilter] = useState('semua');

  /**
   * Mengambil data batch beserta master distributor dan obat.
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [batchRes, distRes, oList] = await Promise.all([
        api.getBatches({
          search: search || undefined,
          distributor_id: distributorFilter || undefined,
          status_risiko: risikoFilter !== 'semua' ? risikoFilter : undefined,
          status_retur: returFilter !== 'semua' ? returFilter : undefined,
        }),
        api.getDistributors(),
        api.getObatList(),
      ]);
      setBatches(batchRes.data || []);
      setDistributors(distRes || []);
      setObatList(oList || []);
    } catch (err) {
      console.error('Gagal mengambil data inventori:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [distributorFilter, risikoFilter, returFilter]);

  const handleResetFilter = () => {
    setSearch('');
    setDistributorFilter('');
    setRisikoFilter('semua');
    setReturFilter('semua');
    setTimeout(() => loadData(), 0);
  };

  /**
   * Mengekspor seluruh daftar batch yang sedang tampil ke berkas CSV siap buka di Excel.
   */
  const handleExportExcel = () => {
    if (batches.length === 0) return;
    const headers = [
      'Nama Obat',
      'Nomor Batch',
      'Distributor PBF',
      'Tgl Masuk',
      'Tgl Kedaluwarsa',
      'Batas Retur',
      'Stok Awal',
      'Stok Saat Ini',
      'Harga Beli Satuan',
      'Nilai Total (Rp)',
      'Status Retur',
      'Status Risiko',
    ];
    const rows = batches.map((b) => [
      b.nama_obat,
      b.nomor_batch,
      b.nama_distributor || '-',
      b.tanggal_masuk || '-',
      b.tanggal_kedaluwarsa || '-',
      b.batas_retur || '-',
      b.jumlah_awal ?? 0,
      b.jumlah_saat_ini ?? 0,
      b.harga_beli_satuan ?? 0,
      b.nilai_total ?? 0,
      b.status_retur || '-',
      b.status_risiko || '-',
    ]);
    exportToExcelCsv(
      `persediaan_batch_simaaf_${new Date().toISOString().split('T')[0]}.csv`,
      headers,
      rows
    );
  };

  /**
   * Mengimpor banyak batch sekaligus dari berkas Excel/CSV/Word secara instan.
   */
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportNotice(null);
    try {
      const parsed = await parseUploadedDocument(file, obatList, distributors);
      const parsedItems = parsed.data?.items || [];
      if (parsedItems.length === 0) {
        setImportNotice({
          type: 'error',
          text: 'Tidak ada baris batch yang berhasil dibaca dari berkas.',
        });
        return;
      }

      const payload = parsedItems.map((it) => ({
        ...it,
        distributor_id: parsed.data?.distributor_id || distributors[0]?.id || 1,
        tanggal_masuk: new Date().toISOString().split('T')[0],
        keterangan: `Impor massal (${file.name})`,
      }));

      await api.simpanBatchList(payload);
      setImportNotice({
        type: 'success',
        text: `Berhasil mengimpor ${payload.length} batch baru dari "${file.name}" (${parsed.metode}).`,
      });
      await loadData();
    } catch (err) {
      setImportNotice({
        type: 'error',
        text: err.message || 'Gagal mengimpor data berkas.',
      });
    } finally {
      setImporting(false);
      if (fileImportRef.current) fileImportRef.current.value = '';
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const riskOptions = [
    { id: 'semua', label: 'Semua' },
    { id: 'tinggi', label: 'Tinggi' },
    { id: 'sedang', label: 'Sedang' },
    { id: 'rendah', label: 'Rendah' },
  ];

  const returOptions = [
    { id: 'semua', label: 'Semua Retur' },
    { id: 'bisa_diretur', label: 'Bisa Diretur' },
    { id: 'lewat_batas', label: 'Lewat Batas' },
    { id: 'tidak_bisa_diretur', label: 'Tanpa Retur' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Aksi & Bilah Filter Ringkas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Persediaan & Batch Obat ({batches.length})
              </h2>
              <p className="text-xs text-slate-500">
                Pantau stok aktif, tenggat retur PBF, dan prioritas FEFO.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileImportRef}
              type="file"
              accept=".csv,.tsv,.xlsx,.xls,.docx,.doc,.txt,.json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileImportRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-3 min-h-[44px] sm:min-h-0 h-11 sm:h-9 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition disabled:opacity-60"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{importing ? 'Mengimpor...' : 'Impor Excel/CSV'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={batches.length === 0}
              className="inline-flex items-center gap-1.5 px-3 min-h-[44px] sm:min-h-0 h-11 sm:h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Ekspor Excel (.CSV)</span>
            </button>
          </div>
        </div>

        {importNotice && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              importNotice.type === 'success'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {importNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{importNotice.text}</span>
          </div>
        )}

        {/* Pencarian & Pilih PBF */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1 border-t border-slate-100">
          <div className="relative sm:col-span-6">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              placeholder="Cari nama obat atau nomor batch..."
              className="w-full text-xs h-11 sm:h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={distributorFilter}
            onChange={(e) => setDistributorFilter(e.target.value)}
            className="sm:col-span-4 text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
          >
            <option value="">Semua Distributor ({distributors.length} PBF)</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>

          <div className="sm:col-span-2 flex gap-2">
            <button
              type="button"
              onClick={loadData}
              className="flex-1 h-11 sm:h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              Cari
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="w-11 sm:w-9 h-11 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition shrink-0"
              title="Reset Filter"
              aria-label="Reset Filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pil Filter Ringkas (Risiko & Status Retur) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Risiko:</span>
            {riskOptions.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setRisikoFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  risikoFilter === pill.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Retur:</span>
            {returOptions.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setReturFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  returFilter === pill.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Daftar Hasil Inventori: Kartu Mobile + Tabel Desktop */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Memuat daftar batch persediaan...
          </div>
        ) : batches.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Tidak ada batch yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <>
            {/* Kartu Mobile Ringkas */}
            <div className="block md:hidden divide-y divide-slate-100">
              {batches.map((b) => (
                <div key={b.id} className="p-3.5 space-y-2.5 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug truncate">
                        {b.nama_obat}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mr-1.5">
                          {b.nomor_batch}
                        </span>
                        {b.nama_distributor}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-slate-900 tabular-nums block">
                        {formatRupiah(b.nilai_total)}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-700 tabular-nums">
                        Stok: {b.jumlah_saat_ini}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusReturBadge status={b.status_retur} batasRetur={b.batas_retur} />
                    <StatusRisikoBadge status={b.status_risiko} skor={b.skor_risiko} />
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <span>
                      ED: <strong className="text-slate-800">{b.tanggal_kedaluwarsa}</strong>
                    </span>
                    <span>
                      Retur: <strong className="text-rose-700">{b.batas_retur || 'Tanpa retur'}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectBatchForAdjustment && onSelectBatchForAdjustment(b)}
                    className="w-full flex items-center justify-center gap-2 h-11 min-h-[44px] rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs transition"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>Cek Fisik Rak & Opname</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Tabel Desktop */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <th className="py-3 px-3.5">Nama Obat & Batch</th>
                    <th className="py-3 px-3.5">Distributor (PBF)</th>
                    <th className="py-3 px-3.5">Tgl ED</th>
                    <th className="py-3 px-3.5">Batas Retur</th>
                    <th className="py-3 px-3.5 text-center">Stok</th>
                    <th className="py-3 px-3.5 text-right">Nilai Stok</th>
                    <th className="py-3 px-3.5">Status Retur</th>
                    <th className="py-3 px-3.5">Risiko</th>
                    <th className="py-3 px-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3.5">
                        <p className="font-bold text-slate-900 leading-tight">{b.nama_obat}</p>
                        <span className="font-mono text-[11px] text-blue-700">
                          {b.nomor_batch}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 max-w-[180px] truncate" title={b.nama_distributor}>
                        {b.nama_distributor}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-700 whitespace-nowrap tabular-nums">
                        {b.tanggal_kedaluwarsa}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-700 whitespace-nowrap tabular-nums">
                        {b.batas_retur || <span className="text-slate-400 italic">Tidak ada</span>}
                      </td>
                      <td className="py-2.5 px-3.5 text-center tabular-nums">
                        <span className="font-bold text-slate-900">{b.jumlah_saat_ini}</span>
                        <span className="text-[10px] text-slate-400 block">awal: {b.jumlah_awal}</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 whitespace-nowrap tabular-nums">
                        {formatRupiah(b.nilai_total)}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <StatusReturBadge status={b.status_retur} batasRetur={b.batas_retur} />
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <StatusRisikoBadge status={b.status_risiko} skor={b.skor_risiko} />
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectBatchForAdjustment && onSelectBatchForAdjustment(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-semibold transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Opname</span>
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
