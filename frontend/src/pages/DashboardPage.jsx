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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hideValue, setHideValue] = useState(false);
  const [filterRisk, setFilterRisk] = useState('semua'); // 'semua' | 'mendesak' | 'lewat'

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardSummary();
      setData(res.data);
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
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-semibold animate-pulse">
        Memuat ringkasan eksekutif apotek...
      </div>
    );
  }

  // Sample urgent batches derived from data or mock
  const urgentBatches = [
    {
      id: 1,
      nama_obat: 'Amoxicillin 500mg',
      no_batch: 'AMX-2024-001',
      pbf: 'PT Kimia Farma TD',
      ed: '2026-11-15',
      batas_retur: '2026-10-16',
      sisa_hari: -15,
      nilai: 9200000,
      stok: '46 Box',
      status: 'lewat_batas',
      skor_risiko: 0.94,
      rekomendasi: 'Hubungi PIC PBF untuk izin dispensasi retur khusus atau konsinyasi diskon cepat.',
    },
    {
      id: 2,
      nama_obat: 'Ibuprofen 400mg',
      no_batch: 'IBP-2024-089',
      pbf: 'PT Enseval Putera Megatrading',
      ed: '2026-12-10',
      batas_retur: '2026-11-10',
      sisa_hari: 10,
      nilai: 6400000,
      stok: '80 Strip',
      status: 'bisa_diretur',
      skor_risiko: 0.88,
      rekomendasi: 'Cetak formulir retur hari ini; sisa waktu 10 hari sebelum hangus permanen.',
    },
    {
      id: 3,
      nama_obat: 'Paracetamol Sirup 120mg',
      no_batch: 'PCT-2024-012',
      pbf: 'PT Merapi Utama Pharma',
      ed: '2026-12-25',
      batas_retur: '2026-11-10',
      sisa_hari: 10,
      nilai: 15820000,
      stok: '140 Botol',
      status: 'bisa_diretur',
      skor_risiko: 0.76,
      rekomendasi: 'Verifikasi keutuhan segel botol dan siapkan faktur pembelian asli.',
    },
  ];

  const filteredUrgent = urgentBatches.filter((b) => {
    if (filterRisk === 'mendesak') return b.sisa_hari >= 0 && b.sisa_hari <= 30;
    if (filterRisk === 'lewat') return b.sisa_hari < 0;
    return true;
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
            AF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-900">
                Apotek Asahan Farma
              </h1>
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                ✓
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
            className="btn-outline min-h-[44px] sm:min-h-0 h-11 sm:h-9 px-3.5"
            title="Segarkan Data Terkini"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Segarkan</span>
          </button>

          <button
            onClick={onNavigateToKalender}
            className="btn-outline min-h-[44px] sm:min-h-0 h-11 sm:h-9 px-3.5"
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

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Total Nilai Persediaan
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" strokeWidth={2.2} />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {hideValue ? 'Rp ••••••••' : formatRupiah(data.total_nilai_persediaan)}
              </h3>
              <button
                type="button"
                onClick={() => setHideValue(!hideValue)}
                className="text-slate-400 hover:text-slate-600 p-2 sm:p-1 rounded-lg transition min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center shrink-0"
                title={hideValue ? 'Tampilkan Nominal' : 'Sembunyikan'}
                aria-label={hideValue ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
              >
                {hideValue ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500 pt-2.5 border-t border-slate-100 line-clamp-1">
            {data.total_batch_aktif} batch obat aktif tercatat di rak
          </p>
        </div>

        <div
          onClick={onNavigateToPengingat}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:border-rose-300 hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Potensi Risiko Retur
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" strokeWidth={2.2} />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-2xl font-black text-rose-600 tracking-tight leading-none">
                {hideValue ? '••••••••' : formatRupiah(data.total_nilai_berisiko)}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {data.persentase_berisiko}% Aset
              </span>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span>Rugi jika batas retur terlewat</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition" />
          </p>
        </div>

        <div
          onClick={onNavigateToPengingat}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Mendesak Diretur
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" strokeWidth={2.2} />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {data.jumlah_batch_berisiko} Batch
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Tenggat Dekat
              </span>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span>Termasuk 1 batch lewat batas</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition" />
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Kepatuhan Rak FEFO
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                94.2%
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Standar BPOM
              </span>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500 pt-2.5 border-t border-slate-100 line-clamp-1">
            Batch terdekat ED berada di baris depan rak
          </p>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Prioritas Tindakan Cepat
                </span>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Batch Obat Berisiko Tinggi & Rekomendasi Retur</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                    {urgentBatches.length} Temuan
                  </span>
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="w-full sm:w-auto overflow-x-auto no-scrollbar flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilterRisk('semua')}
                  className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-lg transition shrink-0 ${
                    filterRisk === 'semua'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semua ({urgentBatches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('mendesak')}
                  className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-lg transition shrink-0 ${
                    filterRisk === 'mendesak'
                      ? 'bg-white text-amber-700 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mendesak (2)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('lewat')}
                  className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-lg transition shrink-0 ${
                    filterRisk === 'lewat'
                      ? 'bg-white text-rose-700 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Lewat Batas (1)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredUrgent.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.nama_obat}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                          {item.no_batch}
                        </span>
                        <StatusReturBadge status={item.status} sisaHari={item.sisa_hari} />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Distributor: <strong className="text-slate-700">{item.pbf}</strong> • Stok: {item.stok}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0 flex sm:block justify-between items-baseline">
                      <span className="text-xs font-black text-slate-900 block">
                        {formatRupiah(item.nilai)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ED: {item.ed}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <p className="text-[11px] text-slate-600 flex items-center gap-1.5 line-clamp-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{item.rekomendasi}</span>
                    </p>

                    <button
                      type="button"
                      onClick={onNavigateToPengingat}
                      className="btn-outline min-h-[44px] sm:min-h-[28px] h-11 sm:h-7 px-3 text-xs sm:text-[11px] font-bold shrink-0 text-blue-600 hover:text-blue-700 w-full sm:w-auto justify-center"
                    >
                      Proses Retur
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Rekomendasi Operasional
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Evaluasi Kepatuhan & Efisiensi Stok Rak
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black text-[10px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    Perbedaan Tenggat Retur Distributor
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  PBF Merapi Utama Pharma memberi batas aman 45 hari sebelum ED, sementara PBF Kimia Farma TD hanya 15 hari. Pastikan faktur diverifikasi segera setelah barang tiba.
                </p>
                <div className="pt-2 text-[10px] font-semibold text-blue-600 flex items-center gap-1">
                  <span>Tindakan: Verifikasi faktur maksimal 24 jam setelah obat diterima.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[10px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    Pemantauan Obat Perputaran Lambat
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Ibuprofen 400mg memiliki tren perputaran lambat (12 strip/bulan vs 80 strip stok di rak). Berpotensi mendekati tanggal kedaluwarsa sebelum terjual habis.
                </p>
                <div className="pt-2 text-[10px] font-semibold text-indigo-600 flex items-center gap-1">
                  <span>Tindakan: Utamakan pengeluaran batch terdekat atau ajukan retur dini.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Evaluasi Risiko PBF
                </span>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Distributor Berisiko Retur
                </h3>
              </div>
              <button
                onClick={onNavigateToInventori}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
              >
                Lihat Semua
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {data.distributor_terancam.map((d, idx) => {
                const maxVal = data.distributor_terancam[0].nilai || 1;
                const percent = Math.min(100, Math.round((d.nilai / maxVal) * 100));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[150px]">
                        {d.nama}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {d.batch_count} batch
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {formatRupiah(d.nilai)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Kepatuhan Pengeluaran Obat
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                87.5% FEFO
              </span>
            </div>

            <h3 className="text-xs font-bold text-slate-900">
              Prinsip First Expired First Out
            </h3>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sebanyak 7 dari 8 batch obat keluar dari rak sesuai tanggal kedaluwarsa terdekat. Hanya 1 batch obat batuk yang berada di baris belakang rak depan.
            </p>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '87.5%' }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Aksi Cepat & Ekspor
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={onNavigateToPengingat}
                className="w-full btn-outline justify-between py-3 min-h-[44px] text-xs text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Buat Surat Pengajuan Retur</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onNavigateToInventori}
                className="w-full btn-outline justify-between py-3 min-h-[44px] text-xs text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-slate-500" />
                  <span>Ekspor Laporan Stok (Excel)</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
