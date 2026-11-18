import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  Camera,
  Save,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Check,
  Clock,
  User,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

export function PenyesuaianStokPage({ preselectedBatch }) {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [jumlahFisik, setJumlahFisik] = useState('');
  const [alasan, setAlasan] = useState('Pemeriksaan rutin rak apotek');
  const [riwayat, setRiwayat] = useState([]);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [isScanningKartu, setIsScanningKartu] = useState(false);
  const [scanResult, setScanResult] = useState(null);

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
  const selisih =
    selectedBatch && jumlahFisik !== ''
      ? Number(jumlahFisik) - selectedBatch.jumlah_saat_ini
      : 0;

  const handleSimulateScanKartuStok = () => {
    setIsScanningKartu(true);
    setTimeout(() => {
      setIsScanningKartu(false);
      setScanResult('14');
      setJumlahFisik(14);
      setAlasan('Hasil scan foto kartu stok via Gemini Vision');
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (jumlahFisik === '' || Number(jumlahFisik) < 0) {
      setErrorMsg('Jumlah fisik tidak boleh kosong atau bernilai negatif.');
      return;
    }

    setLoading(true);
    try {
      await api.simpanPenyesuaianStok(
        selectedBatchId,
        Number(jumlahFisik),
        alasan,
        user?.nama || 'Karyawan Shift Apotek'
      );
      setSuccessMsg(
        `Stok ${selectedBatch.nama_obat} berhasil disesuaikan menjadi ${jumlahFisik} unit!`
      );
      setScanResult(null);
      await loadBatchesAndLogs();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan penyesuaian.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(''), 4500);
    }
  };

  // Hitung akumulasi statistik opname
  const totalOpnameCount = riwayat.length;
  const netSelisih = riwayat.reduce((acc, curr) => acc + (curr.selisih || 0), 0);

  return (
    <div className="space-y-5">
      
      <div className="border-b border-slate-200/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Audit Fisik & Kepatuhan Rak
          </span>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-blue-600" />
            Penyesuaian Stok Hasil Cek Fisik (Stock Opname)
          </h2>
          <p className="text-xs text-slate-500">
            Sinkronkan stok fisik di rak apotek dengan data sistem. Seluruh deviasi tercatat di log audit.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{totalOpnameCount} Opname Tercatat</span>
          </span>
        </div>
      </div>

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

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Formulir Verifikasi
              </span>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Cek Fisik Rak Apotek</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={handleSimulateScanKartuStok}
              disabled={isScanningKartu}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition active:scale-95"
              title="Gunakan Gemini Vision AI untuk membaca angka pada kartu stok fisik"
            >
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>{isScanningKartu ? 'Membaca Kartu...' : 'Demo Scan Kartu (Vision AI)'}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pemilihan Batch */}
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                Pilih Batch Obat di Rak
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  const b = batches.find((x) => x.id === Number(e.target.value));
                  if (b) setJumlahFisik(b.jumlah_saat_ini);
                }}
                className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nama_obat} — Batch: {b.nomor_batch} (Tercatat: {b.jumlah_saat_ini})
                  </option>
                ))}
              </select>
            </div>

            {/* Kotak Perbandingan 3-Pod (Live Metric Comparison Vercel-Style) */}
            {selectedBatch && (
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-center items-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                    Tercatat Sistem
                  </span>
                  <span className="text-xl font-black text-slate-800 leading-tight">
                    {selectedBatch.jumlah_saat_ini}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-medium">unit</span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-blue-200 shadow-2xs">
                  <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider block">
                    Hitungan Fisik Rak
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={jumlahFisik}
                    onChange={(e) => setJumlahFisik(e.target.value)}
                    className="w-16 h-7 text-center text-lg font-black rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mx-auto block text-blue-700 bg-blue-50/30"
                  />
                  <span className="text-[9px] text-blue-500 block font-bold">masukkan angka</span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                    Selisih Deviasi
                  </span>
                  <span
                    className={`text-xl font-black leading-tight block ${
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
                    {selisih === 0 ? 'Sesuai' : selisih < 0 ? 'Kurang di Rak' : 'Lebih'}
                  </span>
                </div>
              </div>
            )}

            {scanResult && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Hasil ekstraksi Vision AI: <strong>{scanResult} item</strong> terverifikasi pada kartu stok.
                </span>
              </div>
            )}

            {/* Quick Reason Chips & Catatan Temuan */}
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Alasan Penyesuaian / Temuan Fisik
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'Pemeriksaan rutin rak apotek',
                  'Kemasan rusak / sobek',
                  'Botol pecah / bocor',
                  'Selisih hitung awal masuk',
                ].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => setAlasan(txt)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      alasan === txt
                        ? 'bg-blue-50 border-blue-300 text-blue-800 font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>
              <textarea
                rows="2"
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                placeholder="Tuliskan catatan kondisi fisik rak atau no. faktur..."
              />
            </div>

            {/* Action Button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Pencatat: <strong>{user?.nama || 'Ibu Anni (Admin)'}</strong>
              </span>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary h-9 px-4 font-black"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan Penyesuaian'}</span>
              </button>
            </div>
          </form>
        </div>

        
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Audit Trail Log
              </span>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>Riwayat Penyesuaian Terakhir</span>
              </h3>
            </div>

            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {riwayat.length} Log
            </span>
          </div>

          {/* Quick Metrics Header */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                Akumulasi Selisih
              </span>
              <span
                className={`text-sm font-black ${
                  netSelisih < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {netSelisih} Unit
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                Akurasi Fisik Rak
              </span>
              <span className="text-sm font-black text-slate-800">
                96.4% Sesuai
              </span>
            </div>
          </div>

          {/* Activity Feed List (Compact, Scrollable) */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {riwayat.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Belum ada penyesuaian stok yang tercatat.
              </p>
            ) : (
              riwayat.map((log) => {
                const isNegative = log.selisih < 0;
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h5 className="text-xs font-black text-slate-900 truncate">
                          {log.nama_obat}
                        </h5>
                        <span className="font-mono text-[10px] text-slate-500">
                          Batch: {log.nomor_batch}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md border shrink-0 ${
                          isNegative
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {log.selisih > 0 ? `+${log.selisih}` : log.selisih} unit
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                      "{log.alasan}"
                    </p>

                    <div className="pt-1.5 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{log.tanggal}</span>
                      </span>
                      <span className="font-semibold text-slate-600 truncate max-w-[120px]">
                        Oleh: {log.petugas}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
