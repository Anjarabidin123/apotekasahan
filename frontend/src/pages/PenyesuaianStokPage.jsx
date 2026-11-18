import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  Save,
  RotateCcw,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  User,
  ShieldCheck,
  PackageCheck,
  Building2,
  Calendar,
  Layers,
  Plus,
  Minus
} from 'lucide-react';

export function PenyesuaianStokPage({ preselectedBatch }) {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [jumlahFisik, setJumlahFisik] = useState('');
  const [alasan, setAlasan] = useState('Pemeriksaan rutin rak apotek');
  const [catatanKhusus, setCatatanKhusus] = useState('');
  const [riwayat, setRiwayat] = useState([]);

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
    }
  }, [preselectedBatch, batches]);

  const loadBatchesAndLogs = async () => {
    try {
      const [bRes, logs] = await Promise.all([
        api.getBatches(),
        api.getRiwayatPenyesuaian(),
      ]);
      setBatches(bRes.data);
      setRiwayat(logs);
      if (bRes.data.length > 0 && !selectedBatchId) {
        setSelectedBatchId(bRes.data[0].id);
        setJumlahFisik(bRes.data[0].jumlah_saat_ini);
      }
    } catch (e) {
      console.error(e);
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

    const alasanLengkap = catatanKhusus.trim()
      ? `${alasan}: ${catatanKhusus.trim()}`
      : alasan;

    setLoading(true);
    try {
      await api.simpanPenyesuaianStok(
        selectedBatchId,
        Number(jumlahFisik),
        alasanLengkap,
        user?.nama || 'Petugas Apotek'
      );
      setSuccessMsg(
        `Stok ${selectedBatch.nama_obat} (Batch: ${selectedBatch.nomor_batch}) berhasil diperbarui menjadi ${jumlahFisik} unit!`
      );
      setCatatanKhusus('');
      await loadBatchesAndLogs();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan penyesuaian.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(''), 4500);
    }
  };

  const totalOpnameCount = riwayat.length;
  const netSelisih = riwayat.reduce((acc, curr) => acc + (curr.selisih || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header Halaman */}
      <div className="border-b border-slate-200/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Pemeriksaan Fisik Rak (Stock Opname)
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            Penyesuaian Stok Hasil Hitung Rak
          </h2>
          <p className="text-xs text-slate-500">
            Cocokkan jumlah fisik obat di rak dengan data sistem. Seluruh perubahan tercatat otomatis di buku audit.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-xs">
            <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{totalOpnameCount} Pemeriksaan Tercatat</span>
          </span>
        </div>
      </div>

      {/* Banner Jika Obat Terpilih Otomatis dari Pengingat Retur */}
      {preselectedBatch && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Obat <strong>{preselectedBatch.nama_obat}</strong> (Batch: {preselectedBatch.nomor_batch}) otomatis terpilih dari halaman Pengingat Retur.
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-200/60 font-bold text-blue-900">
            Terpilih Otomatis
          </span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Layout 2 Kolom Vercel-Style: Formulir Alur & Panel Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Kolom Kiri: Formulir 3 Langkah Alur Cek Fisik (7 Kolom) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* LANGKAH 1: PILIH OBAT DI RAK */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                    1
                  </span>
                  <span>Pilih Obat & Batch di Rak Apotek</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {batches.length} batch terdaftar
                </span>
              </div>

              {/* Input Pencarian Cepat */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama obat atau no. batch di rak..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs h-9 pl-8 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Dropdown Pemilihan Batch */}
              <select
                value={selectedBatchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900"
              >
                {filteredBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nama_obat} • Batch: {b.nomor_batch} (Stok Sistem: {b.jumlah_saat_ini} {b.satuan || 'box'})
                  </option>
                ))}
              </select>

              {/* Rincian Identitas Batch yang Sedang Dipilih */}
              {selectedBatch && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-xs">
                      {selectedBatch.nama_obat}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                      Batch: {selectedBatch.nomor_batch}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{selectedBatch.nama_distributor || 'PBF Rekanan'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>ED: <strong>{selectedBatch.tanggal_kedaluwarsa}</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LANGKAH 2: HITUNG FISIK DI RAK & LIHAT SELISIH */}
            {selectedBatch && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                    2
                  </span>
                  <span>Hitung Jumlah Fisik di Rak & Lihat Selisih</span>
                </label>

                {/* Kotak Perbandingan 3-Pod */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 text-center items-center">
                  {/* Pod 1: Tercatat di Komputer */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                      Tercatat Sistem
                    </span>
                    <span className="text-xl font-black text-slate-800 leading-tight block mt-0.5">
                      {selectedBatch.jumlah_saat_ini}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block">
                      {selectedBatch.satuan || 'unit'}
                    </span>
                  </div>

                  {/* Pod 2: Input Hitung Fisik Rak */}
                  <div className="p-2.5 rounded-lg bg-white border-2 border-blue-500 shadow-2xs">
                    <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider block">
                      Hitungan Fisik Rak
                    </span>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() => adjustJumlahFisik(-1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                        title="Kurang 1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={jumlahFisik}
                        onChange={(e) => setJumlahFisik(e.target.value)}
                        className="w-12 h-7 text-center text-lg font-black rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-700 bg-blue-50/30"
                      />
                      <button
                        type="button"
                        onClick={() => adjustJumlahFisik(1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                        title="Tambah 1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[9px] text-blue-600 font-bold block mt-0.5">
                      di rak saat ini
                    </span>
                  </div>

                  {/* Pod 3: Selisih Otomatis */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                      Selisih Deviasi
                    </span>
                    <span
                      className={`text-xl font-black leading-tight block mt-0.5 ${
                        selisih < 0
                          ? 'text-rose-600'
                          : selisih > 0
                          ? 'text-blue-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {selisih > 0 ? `+${selisih}` : selisih}
                    </span>
                    <span
                      className={`text-[9px] font-bold block ${
                        selisih < 0
                          ? 'text-rose-500'
                          : selisih > 0
                          ? 'text-blue-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {selisih === 0
                        ? 'Sesuai'
                        : selisih < 0
                        ? 'Kurang di Rak'
                        : 'Lebih di Rak'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* LANGKAH 3: PILIH ALASAN PENYESUAIAN */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                  3
                </span>
                <span>Pilih Alasan / Penyebab Selisih</span>
              </label>

              {/* 4 Tombol Cepat Alasan yang Masuk Akal */}
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  'Pemeriksaan rutin rak (stok cocok)',
                  'Obat terjual ke pasien',
                  'Kemasan rusak / botol pecah di rak',
                  'Salah hitung saat penerimaan faktur',
                ].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => setAlasan(txt)}
                    className={`text-[11px] p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      alasan === txt
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-black ring-1 ring-blue-500/20'
                        : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 font-semibold'
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>

              {/* Catatan Tambahan Opsional */}
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Catatan tambahan (contoh: 2 botol sirup retak terbentur saat susun rak)..."
                  value={catatanKhusus}
                  onChange={(e) => setCatatanKhusus(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Tombol Simpan & Submit */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Pencatat: <strong>{user?.nama || 'Petugas Apotek'}</strong>
              </span>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan & Perbarui Stok Rak'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Panel Riwayat & Audit Trail Log (5 Kolom) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Buku Catatan Audit
              </span>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>Riwayat Penyesuaian Terakhir</span>
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
              {riwayat.length} Log
            </span>
          </div>

          {/* Quick Metrics Audit */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Total Selisih
              </span>
              <span
                className={`text-sm font-black ${
                  netSelisih < 0
                    ? 'text-rose-600'
                    : netSelisih > 0
                    ? 'text-blue-600'
                    : 'text-emerald-600'
                }`}
              >
                {netSelisih > 0 ? `+${netSelisih}` : netSelisih} Unit
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Tingkat Akurasi Rak
              </span>
              <span className="text-sm font-black text-slate-800">
                96.4% Sesuai
              </span>
            </div>
          </div>

          {/* Daftar Riwayat Penyesuaian */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {riwayat.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-black text-slate-900 truncate">
                    {log.nama_obat}
                  </h5>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      log.selisih < 0
                        ? 'bg-rose-100 text-rose-800'
                        : log.selisih > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {log.selisih > 0 ? `+${log.selisih}` : log.selisih} unit
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>Batch: {log.nomor_batch}</span>
                  <span>•</span>
                  <span>{log.jumlah_sebelum} $\rightarrow$ {log.jumlah_sesudah}</span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed italic bg-white/80 p-1.5 rounded-lg border border-slate-100">
                  "{log.alasan}"
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{log.waktu}</span>
                  </span>
                  <span className="font-semibold text-slate-600">
                    Oleh: {log.petugas}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
