import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatusReturBadge } from '../components/common/StatusBadge';
import {
  Wallet,
  AlertTriangle,
  Boxes,
  Building2,
  Lightbulb,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
  ShieldCheck,
  RefreshCw,
  Plus,
  CheckCircle2,
  FileText,
  Calendar
} from 'lucide-react';

export function DashboardPage({ onNavigateToPengingat, onNavigateToInventori, onNavigateToFaktur, onNavigateToKalender }) {
  const [data, setData] = useState({ summary: null, pengingat: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hideValue, setHideValue] = useState(false);
  const [filterRisk, setFilterRisk] = useState('semua'); // 'semua' | 'mendesak' | 'lewat'

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, pengingatRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getPengingat()
      ]);
      setData({ summary: summaryRes.data, pengingat: pengingatRes.data });
    } catch (e) {
      console.error(e);
      setError('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-semibold animate-pulse">
        Memuat ringkasan eksekutif apotek...
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-20 text-center text-rose-500 text-xs font-semibold">
        {error}
        <button onClick={loadDashboard} className="block mt-2 underline text-rose-700">Coba Lagi</button>
      </div>
    );
  }
  if (!data.summary || !data.pengingat) return null;

  const mendesakRetur = data.pengingat.mendesakRetur || [];

  const filteredUrgent = mendesakRetur.filter((b) => {
    if (filterRisk === 'mendesak') return b.sisa_hari_retur >= 0 && b.sisa_hari_retur <= 30;
    if (filterRisk === 'lewat') return b.sisa_hari_retur < 0;
    return true;
  });

  return (
    <div className="space-y-4">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0">
            AF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-900">
                Apotek Asahan Farma
              </h1>
              <span className="w-4 h-4 rounded-sm bg-blue-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                ✓
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500 animate-pulse" />
                Sistem Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Kisaran Timur, Asahan</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                Mode Pemilik: Ibu Anni (Akses Penuh)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={loadDashboard}
            className="btn-outline !rounded min-h-[44px] sm:min-h-0 h-11 sm:h-9 px-3.5"
            title="Segarkan Data Terkini"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Segarkan</span>
          </button>

          <button
            onClick={onNavigateToKalender}
            className="btn-outline !rounded min-h-[44px] sm:min-h-0 h-11 sm:h-9 px-3.5"
            title="Lihat Kalender Tenggat"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Kalender</span>
          </button>

          {onNavigateToFaktur && (
            <button
              onClick={onNavigateToFaktur}
              className="btn-primary min-h-[44px] sm:min-h-0 h-11 sm:h-9 px-4"
              title="Input Faktur Pembelian Baru"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Faktur</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 border border-slate-200 rounded p-1 bg-transparent">
        <div className="flex flex-col p-2 border-r border-slate-200">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Nilai Stok</span>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              {hideValue ? 'Rp •••' : formatRupiah(data.summary.total_nilai_persediaan)}
            </h3>
        </div>

        <div
          onClick={onNavigateToPengingat}
          className="flex flex-col p-2 border-r border-slate-200 cursor-pointer hover:bg-slate-100"
        >
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Risiko Retur</span>
            <h3 className="text-sm font-black text-rose-600 tracking-tight">
              {hideValue ? 'Rp •••' : formatRupiah(data.summary.total_nilai_berisiko)}
            </h3>
        </div>

        <div
          onClick={onNavigateToPengingat}
          className="flex flex-col p-2 border-r border-slate-200 cursor-pointer hover:bg-slate-100"
        >
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Mendesak</span>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              {data.summary.jumlah_batch_berisiko} Batch
            </h3>
        </div>

        <div className="flex flex-col p-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Kepatuhan</span>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              94.2%
            </h3>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-transparent rounded border border-slate-200 p-3 space-y-3">
            <div className="min-h-[44px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Prioritas Tindakan Cepat
                </span>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Batch Obat Berisiko Tinggi & Rekomendasi Retur</span>
                  <span className="px-2 py-0.5 rounded-sm bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                    {mendesakRetur.length} Temuan
                  </span>
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="min-h-[44px] w-full sm:w-auto overflow-x-auto no-scrollbar flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilterRisk('semua')}
                  className={`px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-sm transition shrink-0 ${
                    filterRisk === 'semua'
                      ? 'bg-transparent text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semua ({mendesakRetur.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('mendesak')}
                  className={`px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-sm transition shrink-0 ${
                    filterRisk === 'mendesak'
                      ? 'bg-transparent text-amber-700 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mendesak ({mendesakRetur.filter(b => b.sisa_hari_retur >= 0 && b.sisa_hari_retur <= 30).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('lewat')}
                  className={`px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-sm transition shrink-0 ${
                    filterRisk === 'lewat'
                      ? 'bg-transparent text-rose-700 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Lewat Batas ({mendesakRetur.filter(b => b.sisa_hari_retur < 0).length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-2 font-bold text-slate-600">Obat</th>
                    <th className="p-2 font-bold text-slate-600">Batch</th>
                    <th className="p-2 font-bold text-slate-600">Status</th>
                    <th className="p-2 font-bold text-slate-600">Nilai</th>
                    <th className="p-2 font-bold text-slate-600 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUrgent.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2 font-medium text-slate-900">{item.nama_obat}</td>
                      <td className="p-2 text-slate-500 font-mono">{item.nomor_batch}</td>
                      <td className="p-2"><StatusReturBadge status={item.status_retur} sisaHari={item.sisa_hari_retur} /></td>
                      <td className="p-2">{formatRupiah(item.nilai_total)}</td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={onNavigateToPengingat}
                          className="text-blue-600 hover:text-blue-800 font-bold"
                        >
                          Proses
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-transparent rounded border border-slate-200 p-3 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Rekomendasi Operasional
                </span>
                <h3 className="text-xs font-bold text-slate-900">
                  Evaluasi Kepatuhan & Efisiensi Stok Rak
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded border border-slate-200/80 bg-slate-50/60 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-sm bg-blue-100 text-blue-800 font-black text-[9px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h4 className="text-[10px] font-bold text-slate-900">
                    Perbedaan Tenggat Retur Distributor
                  </h4>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  PBF Merapi Utama Pharma memberi batas aman 45 hari sebelum ED, sementara PBF Kimia Farma TD hanya 15 hari.
                </p>
                <div className="pt-1 text-[9px] font-semibold text-blue-600 flex items-center gap-1">
                  <span>Tindakan: Verifikasi faktur maksimal 24 jam.</span>
                </div>
              </div>

              <div className="p-3 rounded border border-slate-200/80 bg-slate-50/60 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-sm bg-indigo-100 text-indigo-800 font-black text-[9px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h4 className="text-[10px] font-bold text-slate-900">
                    Pemantauan Obat Perputaran Lambat
                  </h4>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Ibuprofen 400mg memiliki tren perputaran lambat (12 strip/bulan vs 80 strip stok).
                </p>
                <div className="pt-1 text-[9px] font-semibold text-indigo-600 flex items-center gap-1">
                  <span>Tindakan: Utamakan pengeluaran batch terdekat.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-transparent rounded border border-slate-200 p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Evaluasi Risiko PBF
                </span>
                <h3 className="text-[10px] font-bold text-slate-900 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  Distributor Berisiko Retur
                </h3>
              </div>
              <button
                onClick={onNavigateToInventori}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5 min-h-[44px]"
              >
                Lihat Semua
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {data?.summary?.distributor_terancam?.length > 0 ? (
                data.summary.distributor_terancam.map((d, idx) => {
                  const maxVal = data.summary.distributor_terancam[0]?.nilai || 1;
                  const percent = Math.min(100, Math.round((d.nilai / maxVal) * 100));
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-800 truncate max-w-[120px]">
                          {d.nama}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-400">
                            {d.batch_count} batch
                          </span>
                          <span className="font-bold text-slate-900 text-[10px]">
                            {formatRupiah(d.nilai)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-sm overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-sm transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-[10px] text-slate-500 italic">Data distributor tidak tersedia</div>
              )}
            </div>
          </div>

          <div className="bg-transparent rounded border border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Kepatuhan Pengeluaran Obat
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                87.5% FEFO
              </span>
            </div>

            <h3 className="text-[10px] font-bold text-slate-900">
              Prinsip First Expired First Out
            </h3>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              Sebanyak 7 dari 8 batch obat keluar dari rak sesuai tanggal kedaluwarsa terdekat.
            </p>

            <div className="w-full bg-slate-100 h-1.5 rounded-sm overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-sm" style={{ width: '87.5%' }} />
            </div>
          </div>

          <div className="bg-transparent rounded border border-slate-200 p-3 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Aksi Cepat & Ekspor
            </span>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={onNavigateToPengingat}
                className="w-full btn-outline justify-between py-2 min-h-[44px] text-[10px] text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Buat Surat Pengajuan Retur</span>
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onNavigateToInventori}
                className="w-full btn-outline justify-between py-2 min-h-[44px] text-[10px] text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ekspor Laporan Stok (Excel)</span>
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}