import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { StatusReturBadge, StatusRisikoBadge } from '../components/common/StatusBadge';
import {
  Wallet,
  AlertTriangle,
  Boxes,
  TrendingDown,
  Building2,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  SendHorizontal
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
      {/* ========================================================
          Top Header Bar Eksekutif (Style Modern catatbirowisata)
          ======================================================== */}
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
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Kisaran Timur, Asahan</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                Mode Pemilik: Ibu Anni (Akses Penuh)
              </span>
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadDashboard}
            className="btn-outline h-9"
            title="Segarkan Data Terkini"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Segarkan</span>
          </button>

          <button
            onClick={onNavigateToKalender}
            className="btn-outline h-9"
            title="Lihat Kalender Tenggat"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Kalender</span>
          </button>

          {onNavigateToFaktur && (
            <button
              onClick={onNavigateToFaktur}
              className="btn-primary h-9 px-4"
              title="Input Faktur Pembelian Baru"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Faktur</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          4 Bento Metric Cards Desktop (Clean High-Contrast)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Nilai Persediaan */}
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
                title={hideValue ? 'Tampilkan Nominal' : 'Sembunyikan'}
              >
                {hideValue ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500 pt-2.5 border-t border-slate-100 line-clamp-1">
            {data.total_batch_aktif} batch obat aktif tercatat di rak
          </p>
        </div>

        {/* Metric 2: Stok Berisiko Hangus */}
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

        {/* Metric 3: Batch Mendesak Diretur */}
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

        {/* Metric 4: Model Prediksi AI */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Model Analitik AI
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                AUC 0.91
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Random Forest
              </span>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500 pt-2.5 border-t border-slate-100 line-clamp-1">
            2 temuan optimasi stok terdeteksi
          </p>
        </div>
      </div>

      {/* ========================================================
          Main Content Grid: 2 Kolom Kiri + 1 Kolom Kanan
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (2 Kolom): Daftar Batch Berisiko & Rekomendasi Tindakan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Daftar Batch Berisiko */}
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
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                <button
                  onClick={() => setFilterRisk('semua')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterRisk === 'semua'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semua ({urgentBatches.length})
                </button>
                <button
                  onClick={() => setFilterRisk('mendesak')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterRisk === 'mendesak'
                      ? 'bg-white text-amber-700 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mendesak (2)
                </button>
                <button
                  onClick={() => setFilterRisk('lewat')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterRisk === 'lewat'
                      ? 'bg-white text-rose-700 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Lewat Batas (1)
                </button>
              </div>
            </div>

            {/* List of Urgent Batches */}
            <div className="space-y-3">
              {filteredUrgent.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
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

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900 block">
                        {formatRupiah(item.nilai)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ED: {item.ed}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation pill */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3 text-xs">
                    <p className="text-[11px] text-slate-600 flex items-center gap-1.5 line-clamp-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{item.rekomendasi}</span>
                    </p>

                    <button
                      onClick={onNavigateToPengingat}
                      className="btn-outline h-7 px-2.5 text-[11px] font-bold shrink-0 text-blue-600 hover:text-blue-700"
                    >
                      Proses Retur
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Wawasan Data Science & Temuan Analitik */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Wawasan Capstone AI
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Temuan Analitis Data Science untuk Efisiensi Stok
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
                    Asimetri Kebijakan Retur PBF
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  PT Merapi Utama Pharma memberi batas aman 45 hari sebelum ED, sementara PT Kimia Farma TD hanya 15 hari. Keterlambatan input faktur 1 minggu berisiko fatal hangus.
                </p>
                <div className="pt-2 text-[10px] font-semibold text-blue-600 flex items-center gap-1">
                  <span>Rekomendasi: Input faktur otomatis via OCR dalam 24 jam.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[10px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    Pola Stok Slow-Moving
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Ibuprofen 400mg memiliki rasio perputaran lambat (12 strip/bulan vs 80 strip stok) dengan skor risiko model AI 0.88. Berisiko tidak habis sebelum masa kedaluwarsa.
                </p>
                <div className="pt-2 text-[10px] font-semibold text-indigo-600 flex items-center gap-1">
                  <span>Rekomendasi: Terapkan bundling resep atau program diskon.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan (1 Kolom): Evaluasi Distributor, Kepatuhan FEFO & Aksi Cepat */}
        <div className="space-y-6">
          {/* Card: Evaluasi Distributor */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Evaluasi Risiko PBF
                </span>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Distributor Terancam
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
                    {/* Visual Progress Bar */}
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

          {/* Card: Kepatuhan FEFO (First Expired First Out) */}
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

          {/* Card: Aksi Cepat & Ekspor Dokumen */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Aksi Cepat & Ekspor
            </span>

            <div className="space-y-2">
              <button
                onClick={onNavigateToPengingat}
                className="w-full btn-outline justify-between py-2.5 text-xs text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Buat Surat Pengajuan Retur</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={onNavigateToInventori}
                className="w-full btn-outline justify-between py-2.5 text-xs text-slate-700"
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
