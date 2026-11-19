import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  exportToExcelCsv,
  parseUploadedDocument,
  downloadTemplateOpnameCsv,
} from '../utils/fileTools';
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  Save,
  Clock,
  PackageCheck,
  Building2,
  Calendar,
  Plus,
  Minus,
  Download,
  UploadCloud,
  Camera,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';

export function PenyesuaianStokPage({ preselectedBatch, onDataChanged }) {
  const { user } = useAuth();
  const [opnameMode, setOpnameMode] = useState('satuan'); // 'satuan' | 'impor'
  const [batches, setBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [obatList, setObatList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [jumlahFisik, setJumlahFisik] = useState('');
  const [alasan, setAlasan] = useState('Pemeriksaan rutin rak (stok cocok)');
  const [catatanKhusus, setCatatanKhusus] = useState('');
  const [riwayat, setRiwayat] = useState([]);

  // State mode Impor Dokumen / Migrasi Stok Awal Apotek Lama
  const [importedItems, setImportedItems] = useState([]);
  const [importInfo, setImportInfo] = useState(null);
  const [importAlasan, setImportAlasan] = useState('Migrasi stok awal & opname massal');
  const [isParsingDoc, setIsParsingDoc] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadBatchesAndLogs();
  }, []);

  useEffect(() => {
    if (preselectedBatch && batches.length > 0) {
      setSelectedBatchId(preselectedBatch.id);
      setJumlahFisik(preselectedBatch.jumlah_saat_ini);
      setOpnameMode('satuan');
    }
  }, [preselectedBatch, batches]);

  /**
   * Memuat daftar batch persediaan, master obat/PBF, dan riwayat log opname rak.
   */
  const loadBatchesAndLogs = async () => {
    try {
      const [bRes, logs, distRes, oList] = await Promise.all([
        api.getBatches(),
        api.getRiwayatPenyesuaian(),
        api.getDistributors(),
        api.getObatList(),
      ]);
      setBatches(bRes.data || []);
      setRiwayat(logs || []);
      setDistributors(distRes || []);
      setObatList(oList || []);
      if (bRes.data?.length > 0 && !selectedBatchId) {
        setSelectedBatchId(bRes.data[0].id);
        setJumlahFisik(bRes.data[0].jumlah_saat_ini);
      }
    } catch (e) {
      console.error('Gagal memuat data opname:', e);
    }
  };

  const selectedBatch = batches.find((b) => b.id === Number(selectedBatchId));

  const filteredBatches = batches.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.nama_obat.toLowerCase().includes(q) ||
      b.nomor_batch.toLowerCase().includes(q) ||
      (b.nama_distributor && b.nama_distributor.toLowerCase().includes(q))
    );
  });

  const selisih =
    selectedBatch && jumlahFisik !== ''
      ? Number(jumlahFisik) - selectedBatch.jumlah_saat_ini
      : 0;

  const handleBatchChange = (batchId) => {
    setSelectedBatchId(batchId);
    const b = batches.find((x) => x.id === Number(batchId));
    if (b) {
      setJumlahFisik(b.jumlah_saat_ini);
    }
  };

  const adjustJumlahFisik = (delta) => {
    const current = Number(jumlahFisik) || 0;
    const updated = Math.max(0, current + delta);
    setJumlahFisik(updated);
  };

  const handleExportLogsCsv = () => {
    if (riwayat.length === 0) return;
    const headers = [
      'Waktu',
      'Nama Obat',
      'Nomor Batch',
      'Stok Sebelum',
      'Stok Sesudah',
      'Selisih',
      'Alasan',
      'Petugas',
    ];
    const rows = riwayat.map((l) => [
      l.waktu || l.tanggal || '-',
      l.nama_obat,
      l.nomor_batch,
      l.jumlah_sebelum,
      l.jumlah_sesudah,
      l.selisih,
      l.alasan,
      l.petugas,
    ]);
    exportToExcelCsv(
      `log_opname_simaaf_${new Date().toISOString().split('T')[0]}.csv`,
      headers,
      rows
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (jumlahFisik === '' || Number(jumlahFisik) < 0) {
      setErrorMsg('Jumlah fisik tidak boleh kosong atau bernilai negatif.');
      return;
    }

    if (!selectedBatch) {
      setErrorMsg('Silakan pilih batch obat di rak terlebih dahulu.');
      return;
    }

    const alasanLengkap = catatanKhusus.trim() ? `${alasan}: ${catatanKhusus.trim()}` : alasan;

    setLoading(true);
    try {
      await api.simpanPenyesuaianStok(
        selectedBatchId,
        Number(jumlahFisik),
        alasanLengkap,
        user?.nama || 'Petugas Apotek'
      );
      setSuccessMsg(
        `Stok ${selectedBatch.nama_obat} (${selectedBatch.nomor_batch}) diperbarui menjadi ${jumlahFisik} unit.`
      );
      setCatatanKhusus('');
      await loadBatchesAndLogs();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan penyesuaian.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(''), 4500);
    }
  };

  // Mengunggah dokumen apa saja (Excel, CSV, Word, PDF, Foto, JSON, TXT) ke mode Impor Massal
  const handleOpnameDocUpload = async (file) => {
    if (!file) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsParsingDoc(true);
    try {
      const res = await parseUploadedDocument(file, obatList, distributors);
      const list = Array.isArray(res.data?.items) ? res.data.items : [];
      setImportedItems(
        list.map((it) => ({
          ...it,
          distributor_id: res.data?.distributor_id || distributors[0]?.id || 1,
        }))
      );
      setImportInfo({
        fileName: file.name,
        metode: res.metode,
        pesan: res.pesan,
      });
    } catch (err) {
      setErrorMsg(
        err.message || 'Gagal mengekstrak dokumen. Gunakan Templat Opname CSV untuk impor pasti.'
      );
    } finally {
      setIsParsingDoc(false);
    }
  };

  const handleLoadMigrationSample = () => {
    setErrorMsg('');
    setImportedItems([
      {
        obat_id: 3,
        nama_obat: 'Cefixime 100mg Kapsul',
        nomor_batch: 'CFX-2601-A',
        tanggal_kedaluwarsa: '2027-02-15',
        jumlah: 12,
        harga_beli_satuan: 78000,
        satuan: 'box',
        distributor_id: 4,
      },
      {
        obat_id: 901,
        nama_obat: 'Paracetamol 500mg Tablet (Stok Rak Lama)',
        nomor_batch: 'PCT-OLD-26A',
        tanggal_kedaluwarsa: '2027-11-30',
        jumlah: 65,
        harga_beli_satuan: 4500,
        satuan: 'strip',
        distributor_id: 2,
      },
      {
        obat_id: 902,
        nama_obat: 'Metronidazole 500mg Tablet',
        nomor_batch: 'MTZ-2609-L2',
        tanggal_kedaluwarsa: '2028-01-20',
        jumlah: 30,
        harga_beli_satuan: 19000,
        satuan: 'box',
        distributor_id: 1,
      },
    ]);
    setImportInfo({
      fileName: 'Contoh_Stok_Awal_Apotek_Lama.csv',
      metode: 'Data Simulasi',
      pesan: 'Menampilkan contoh kombinasi pembaruan batch lama dan migrasi obat baru.',
    });
  };

  // Menganalisis tiap baris impor apakah memperbarui batch existing atau menambah batch baru
  const previewWithMatch = useMemo(() => {
    return importedItems.map((it) => {
      const noLower = String(it.nomor_batch || '').trim().toLowerCase();
      const matched = batches.find(
        (b) =>
          (noLower && String(b.nomor_batch || '').trim().toLowerCase() === noLower) ||
          (Number(b.obat_id) === Number(it.obat_id) &&
            String(b.nama_obat || '').toLowerCase() === String(it.nama_obat || '').toLowerCase() &&
            String(b.tanggal_kedaluwarsa || '') === String(it.tanggal_kedaluwarsa || ''))
      );
      return {
        ...it,
        isUpdate: Boolean(matched),
        stokLama: matched ? matched.jumlah_saat_ini : 0,
        selisihPreview: matched ? (Number(it.jumlah) || 0) - matched.jumlah_saat_ini : Number(it.jumlah) || 0,
      };
    });
  }, [importedItems, batches]);

  const updateCount = previewWithMatch.filter((i) => i.isUpdate).length;
  const createCount = previewWithMatch.length - updateCount;

  const handleApplyBulkOpname = async () => {
    if (importedItems.length === 0) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.terapkanOpnameMassal(
        importedItems,
        importAlasan,
        user?.nama || 'Petugas Apotek'
      );
      setSuccessMsg(
        `Berhasil menerapkan ${res.total} item (${res.updatedCount} update stok lama, ${res.createdCount} batch baru dimigrasi)!`
      );
      setImportedItems([]);
      setImportInfo(null);
      await loadBatchesAndLogs();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menerapkan opname massal.');
    } finally {
      setLoading(false);
    }
  };

  const totalOpnameCount = riwayat.length;
  const netSelisih = riwayat.reduce((acc, curr) => acc + (curr.selisih || 0), 0);
  const totalUnitSistem = batches.reduce((acc, b) => acc + (b.jumlah_saat_ini || 0), 0);
  const totalAbsSelisih = riwayat.reduce((acc, curr) => acc + Math.abs(Number(curr.selisih) || 0), 0);
  const akurasiRakPct =
    totalUnitSistem + totalAbsSelisih > 0
      ? ((totalUnitSistem / (totalUnitSistem + totalAbsSelisih)) * 100).toFixed(1)
      : '100.0';

  return (
    <div className="space-y-3">
      {/* Header Halaman Opname + Mode Switcher (Satuan vs Impor Dokumen / Migrasi Cepat) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Stok Opname &amp; Migrasi Cepat
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  Data Simulasi
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Cek fisik rak satuan atau impor massal stok awal apotek lama.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 tabular-nums">
            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{totalOpnameCount} Log</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/70">
          <button
            type="button"
            data-testid="opname-mode-satuan"
            onClick={() => setOpnameMode('satuan')}
            className={`h-9 rounded-lg text-xs font-bold transition cursor-pointer ${
              opnameMode === 'satuan'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cek Rak Satuan
          </button>
          <button
            type="button"
            data-testid="opname-mode-impor"
            onClick={() => setOpnameMode('impor')}
            className={`h-9 rounded-lg text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              opnameMode === 'impor'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden truncate">Impor / Migrasi</span>
            <span className="hidden sm:inline truncate">Impor Dokumen / Migrasi</span>
          </button>
        </div>
      </div>

      {preselectedBatch && opnameMode === 'satuan' && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">
              Batch terpilih: <strong>{preselectedBatch.nama_obat}</strong> ({preselectedBatch.nomor_batch})
            </span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Kolom Kiri: Form Satuan ATAU Impor Dokumen & Migrasi Stok Awal */}
        <div className="lg:col-span-7 space-y-3">
          {opnameMode === 'satuan' ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Pilih Obat &amp; Batch di Rak
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {batches.length} batch terdaftar
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama obat atau nomor batch..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs h-11 sm:h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <select
                    value={selectedBatchId}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="w-full text-xs h-11 sm:h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-900"
                  >
                    {filteredBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nama_obat} • {b.nomor_batch} (Stok: {b.jumlah_saat_ini})
                      </option>
                    ))}
                  </select>

                  {selectedBatch && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-medium truncate max-w-[200px]">
                          {selectedBatch.nama_distributor || 'PBF Rekanan'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          ED: <strong className="text-slate-900">{selectedBatch.tanggal_kedaluwarsa}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedBatch && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-3.5 grid grid-cols-3 gap-2 text-center shadow-2xs">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">Stok Sistem</span>
                        <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                          {selectedBatch.jumlah_saat_ini}
                        </span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[11px] font-semibold text-emerald-700 block">Fisik Rak</span>
                        <span className="text-lg font-extrabold text-emerald-600 tabular-nums">
                          {jumlahFisik === '' ? 0 : jumlahFisik}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">Selisih</span>
                        <span
                          className={`text-lg font-extrabold tabular-nums ${
                            selisih < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {selisih > 0 ? `+${selisih}` : selisih}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => adjustJumlahFisik(-5)}
                        className="h-11 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold active:scale-95 transition"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustJumlahFisik(-1)}
                        className="w-11 h-11 min-w-[44px] rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center active:scale-95 transition"
                        aria-label="Kurangi 1 unit"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={jumlahFisik}
                        onChange={(e) => setJumlahFisik(e.target.value)}
                        className="w-20 h-11 text-center text-lg font-extrabold rounded-xl border-2 border-emerald-500 text-emerald-700 bg-white focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => adjustJumlahFisik(1)}
                        className="w-11 h-11 min-w-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center active:scale-95 transition"
                        aria-label="Tambah 1 unit"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustJumlahFisik(5)}
                        className="h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold active:scale-95 transition"
                      >
                        +5
                      </button>
                    </div>

                    {selisih !== 0 && (
                      <div
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between ${
                          selisih < 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}
                      >
                        <span>Estimasi Nilai Selisih:</span>
                        <span className="tabular-nums">
                          {selisih > 0 ? '+' : ''}
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            maximumFractionDigits: 0,
                          }).format(selisih * (selectedBatch.harga_beli_satuan || 0))}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800 block">Alasan Penyesuaian</label>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Pemeriksaan rutin rak (stok cocok)', short: 'Stok Cocok' },
                      { id: 'Obat terjual ke pasien', short: 'Terjual Pasien' },
                      { id: 'Kemasan rusak / pecah di rak', short: 'Rusak / Pecah' },
                      { id: 'Koreksi selisih hitung faktur', short: 'Koreksi Faktur' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAlasan(opt.id)}
                        className={`text-xs px-3 py-2 min-h-[42px] rounded-xl border text-left transition flex items-center ${
                          alasan === opt.id
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-white font-semibold'
                        }`}
                      >
                        <span className="truncate">{opt.short}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Catatan tambahan opsional..."
                    value={catatanKhusus}
                    onChange={(e) => setCatatanKhusus(e.target.value)}
                    className="w-full text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    Petugas: <strong>{user?.nama || 'Petugas Apotek'}</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/20 active:scale-95 disabled:opacity-50 w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Menyimpan...' : 'Simpan Hasil Opname'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Mode Impor Massal & Migrasi Stok Awal Apotek Lama */
            <div className="space-y-3">

              {/* Kotak Unggah Multi-Format */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Unggah Dokumen Opname / Stok Awal
                  </h3>
                  <span className="text-[10.5px] text-slate-400">
                    Excel, CSV, Word, PDF, Foto, TXT, JSON
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="btn-primary h-11 min-h-[44px] px-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-[11px] font-bold text-white">
                    <UploadCloud className="w-4 h-4 shrink-0" />
                    <span className="truncate">Pilih Dokumen</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.csv,.tsv,.xlsx,.xls,.docx,.doc,.txt,.json"
                      className="hidden"
                      onChange={(e) => handleOpnameDocUpload(e.target.files?.[0])}
                    />
                  </label>

                  <label className="btn-outline h-11 min-h-[44px] px-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white">
                    <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Foto Catatan</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleOpnameDocUpload(e.target.files?.[0])}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={downloadTemplateOpnameCsv}
                    className="btn-outline h-11 min-h-[44px] px-2.5 text-[11px] font-bold text-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Templat CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadMigrationSample}
                    className="h-11 min-h-[44px] px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold inline-flex items-center justify-center gap-1 transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Contoh</span>
                  </button>
                </div>

                {isParsingDoc && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Membaca isi dokumen &amp; mencocokkan dengan batch apotek...</span>
                  </div>
                )}

                {importInfo && !isParsingDoc && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">
                      {importInfo.fileName} • <strong>{importInfo.metode}</strong>
                    </span>
                    <span className="shrink-0 font-bold text-emerald-700">
                      {previewWithMatch.length} baris
                    </span>
                  </div>
                )}
              </div>

              {/* Pratinjau Daftar Hasil Impor Sebelum Disimpan */}
              {previewWithMatch.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        Pratinjau Opname &amp; Migrasi ({previewWithMatch.length} Item)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {updateCount} update batch lama • {createCount} batch baru didaftarkan
                      </p>
                    </div>
                    <input
                      type="text"
                      value={importAlasan}
                      onChange={(e) => setImportAlasan(e.target.value)}
                      placeholder="Keterangan log opname..."
                      className="text-xs h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium sm:w-56"
                    />
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                    {previewWithMatch.map((it, idx) => (
                      <div key={idx} className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span
                              className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1 ${
                                it.isUpdate
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {it.isUpdate
                                ? `Update Opname (${it.stokLama} → ${it.jumlah})`
                                : '+ Migrasi Batch Baru'}
                            </span>
                            <p className="text-xs font-bold text-slate-900 truncate">{it.nama_obat}</p>
                            <p className="text-[11px] font-mono text-slate-500">
                              {it.nomor_batch} • ED {it.tanggal_kedaluwarsa}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min="0"
                              value={it.jumlah}
                              onChange={(e) => {
                                const next = [...importedItems];
                                next[idx] = { ...next[idx], jumlah: Number(e.target.value) };
                                setImportedItems(next);
                              }}
                              aria-label={`Jumlah fisik ${it.nama_obat}`}
                              className="w-16 h-9 text-center text-xs font-extrabold rounded-xl border border-emerald-300 bg-emerald-50/40 text-emerald-800"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setImportedItems(importedItems.filter((_, i) => i !== idx))
                              }
                              className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                              aria-label="Hapus baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Siap memproses <strong>{previewWithMatch.length}</strong> item sekaligus
                    </span>
                    <button
                      type="button"
                      data-testid="apply-bulk-opname-btn"
                      onClick={handleApplyBulkOpname}
                      disabled={loading}
                      className="btn-primary h-11 px-4 text-xs font-bold w-full sm:w-auto justify-center"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loading ? 'Menerapkan...' : 'Terapkan Semua ke Inventori'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Buku Catatan Audit */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Audit ({riwayat.length})</span>
            </h3>

            <button
              type="button"
              onClick={handleExportLogsCsv}
              disabled={riwayat.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div>
              <span className="text-[11px] text-slate-500 block">Akumulasi Selisih</span>
              <span
                className={`text-sm font-extrabold tabular-nums ${
                  netSelisih < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {netSelisih > 0 ? `+${netSelisih}` : netSelisih} Unit
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Akurasi Rak</span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                {akurasiRakPct}% Sesuai
              </span>
            </div>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {riwayat.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-bold text-slate-900 truncate">{log.nama_obat}</h5>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                      log.selisih < 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {log.selisih > 0 ? `+${log.selisih}` : log.selisih} unit
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>{log.nomor_batch}</span>
                  <span>•</span>
                  <span>
                    {log.jumlah_sebelum} → {log.jumlah_sesudah}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                  {log.alasan}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{log.waktu || log.tanggal || '-'}</span>
                  </span>
                  <span className="font-semibold text-slate-700">{log.petugas}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
