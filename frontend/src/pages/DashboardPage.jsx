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
  Calendar,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export function DashboardPage({
  onNavigateToPengingat,
  onNavigateToInventori,
  onNavigateToFaktur,
  onNavigateToKalender
}) {
  const [summary, setSummary] = useState(null);
  const [pengingat, setPengingat] = useState({ mendesakRetur: [], mendekatiKedaluwarsa: [], stokMenipis: [] });
  const [ringkasan, setRingkasan] = useState({ total_mendesak_retur: 0, total_mendekati_kedaluwarsa: 0, total_stok_menipis: 0 });
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
      if (summaryRes?.data) setSummary(summaryRes.data);
      if (pengingatRes?.data) setPengingat(pengingatRes.data);
      if (pengingatRes?.ringkasan) setRingkasan(pengingatRes.ringkasan);
    } catch (e) {
      console.error('Error memuat data dashboard:', e);
      setError('Gagal memuat data dashboard.');
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

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-semibold animate-pulse space-y-2">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p>Memuat ringkasan eksekutif Apotek Asahan Farma...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center text-rose-500 text-xs font-semibold space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <p>{error}</p>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-md border border-rose-200 hover:bg-rose-100 transition text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // Siapkan data batch mendesak retur dengan fallback aman
  const rawMendesak = Array.isArray(pengingat?.mendesakRetur) && pengingat.mendesakRetur.length > 0
    ? pengingat.mendesakRetur.map((item, idx) => ({
        id: item.id || idx,
        nama_obat: item.nama_obat || 'Obat',
        no_batch: item.nomor_batch || item.no_batch || '-',
        pbf: item.nama_distributor || item.pbf || 'PBF',
        ed: item.tanggal_kedaluwarsa || item.ed || '-',
        batas_retur: item.batas_retur || '-',
        sisa_hari: item.sisa_hari_retur !== undefined ? item.sisa_hari_retur : (item.sisa_hari ?? 0),
        nilai: item.nilai_total || item.nilai || 0,
        stok: `${item.jumlah_saat_ini || item.stok || 0} ${item.satuan || 'Pcs'}`,
        status: item.status_retur || item.status || 'bisa_diretur',
        skor_risiko: item.skor_risiko || 0.8,
        rekomendasi: item.urgensi === 'kritis'
          ? 'Batas retur sangat dekat. Segera ajukan formulir retur ke distributor.'
          : 'Pantau sisa waktu retur dan prioritaskan pengeluaran rak obat.'
      }))
    : [
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

  const filteredUrgent = rawMendesak.filter((b) => {
    if (filterRisk === 'mendesak') return b.sisa_hari >= 0 && b.sisa_hari <= 30;
    if (filterRisk === 'lewat') return b.sisa_hari < 0;
    return true;
  });

  const quickActions = [
    {
      label: 'Input Faktur',
      desc: 'Scan foto / ketik faktur',
      icon: Plus,
      action: onNavigateToFaktur,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'hover:border-blue-300'
    },
    {
      label: 'Stok Obat',
      desc: 'Daftar & rak obat',
      icon: Boxes,
      action: onNavigateToInventori,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'hover:border-emerald-300'
    },
    {
      label: 'Retur Mendesak',
      desc: `${ringkasan?.total_mendesak_retur || summary?.jumlah_batch_berisiko || 3} batch perlu retur`,
      icon: AlertTriangle,
      action: onNavigateToPengingat,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'hover:border-rose-300'
    },
    {
      label: 'Kalender Tenggat',
      desc: 'Jadwal jatuh tempo',
      icon: Calendar,
      action: onNavigateToKalender,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'hover:border-amber-300'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm">
            AF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Apotek Asahan Farma
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operasional Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>Kisaran Timur, Asahan</span>
              <span>•</span>
              <span className="text-slate-700 font-medium">Akses Pemilik (Ibu Anni)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition shadow-sm"
            title="Segarkan data terbaru"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Quick Action Grid (App-like 4-item launcher for mobile & desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {quickActions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={item.action}
            className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg text-left transition-all shadow-sm ${item.borderColor} active:scale-[0.98] group`}
          >
            <div className={`w-9 h-9 rounded-md ${item.bgColor} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-blue-600 transition-colors">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {item.desc}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* KPI Balance Header / Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Nilai Persediaan */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Nilai Persediaan
              </span>
              <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {hideValue ? 'Rp ••••••••' : formatRupiah(summary?.total_nilai_persediaan)}
              </h3>
              <button
                type="button"
                onClick={() => setHideValue(!hideValue)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition"
                title={hideValue ? 'Tampilkan Nominal' : 'Sembunyikan'}
              >
                {hideValue ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2 truncate">
            {summary?.total_batch_aktif || 0} batch aktif tercatat di rak
          </p>
        </div>

        {/* Card 2: Potensi Risiko Retur */}
        <div
          onClick={onNavigateToPengingat}
          className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Potensi Risiko Retur
              </span>
              <div className="w-7 h-7 rounded bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-rose-600 tracking-tight">
                {hideValue ? '••••••••' : formatRupiah(summary?.total_nilai_berisiko)}
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                {summary?.persentase_berisiko || 0}% Aset
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
            <span className="truncate">Rugi jika retur terlambat</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-rose-600 transition" />
          </p>
        </div>

        {/* Card 3: Mendesak Diretur */}
        <div
          onClick={onNavigateToPengingat}
          className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mendesak Diretur
              </span>
              <div className="w-7 h-7 rounded bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {summary?.jumlah_batch_berisiko || ringkasan?.total_mendesak_retur || 0} Batch
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Tenggat Dekat
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
            <span className="truncate">Prioritas minggu ini</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition" />
          </p>
        </div>

        {/* Card 4: Kepatuhan Rak FEFO */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Kepatuhan Rak FEFO
              </span>
              <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                94.2%
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Standar BPOM
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2 truncate">
            Batch terdekat ED di baris depan
          </p>
        </div>
      </div>

      {/* Main Content Layout: 2 Kolom Kiri + 1 Kolom Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kolom Kiri (2 Kolom): Prioritas Batch Berisiko & Rekomendasi */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card: Batch Obat Berisiko Tinggi */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Prioritas Tindakan Cepat
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Batch Obat Berisiko Tinggi & Tenggat Retur</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                    {rawMendesak.length} Temuan
                  </span>
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs font-medium self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilterRisk('semua')}
                  className={`px-2.5 py-1 rounded transition text-xs ${
                    filterRisk === 'semua'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semua ({rawMendesak.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('mendesak')}
                  className={`px-2.5 py-1 rounded transition text-xs ${
                    filterRisk === 'mendesak'
                      ? 'bg-white text-amber-700 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mendesak
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('lewat')}
                  className={`px-2.5 py-1 rounded transition text-xs ${
                    filterRisk === 'lewat'
                      ? 'bg-white text-rose-700 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Lewat Batas
                </button>
              </div>
            </div>

            {/* List Batch Items */}
            <div className="space-y-2">
              {filteredUrgent.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Tidak ada batch obat pada filter ini.
                </div>
              ) : (
                filteredUrgent.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.nama_obat}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-1 py-0 rounded">
                            {item.no_batch}
                          </span>
                          <StatusReturBadge status={item.status} sisaHari={item.sisa_hari} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Distributor: <strong className="text-slate-700">{item.pbf}</strong> • Stok: {item.stok}
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0 flex sm:block justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-900 block">
                          {formatRupiah(item.nilai)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ED: {item.ed}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-[10px] text-slate-600 flex items-center gap-1.5 line-clamp-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{item.rekomendasi}</span>
                      </p>

                      <button
                        type="button"
                        onClick={onNavigateToPengingat}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 text-blue-600 rounded text-[10px] font-bold transition shrink-0"
                      >
                        <span>Proses Retur</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card: Rekomendasi Operasional & Kepatuhan Rak */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Rekomendasi Operasional
                </span>
                <h3 className="text-xs font-bold text-slate-900">
                  Evaluasi Kepatuhan & Efisiensi Stok Rak
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-blue-100 text-blue-800 font-bold text-[9px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h4 className="text-[10px] font-bold text-slate-900">
                    Perbedaan Tenggat Retur PBF
                  </h4>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  PBF Merapi Utama Pharma memberi batas aman 45 hari sebelum ED, sementara PBF Kimia Farma TD hanya 15 hari.
                </p>
                <p className="text-[9px] font-semibold text-blue-600 pt-0.5">
                  Tindakan: Verifikasi faktur maksimal 24 jam setelah obat diterima.
                </p>
              </div>

              <div className="p-2.5 rounded border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-indigo-100 text-indigo-800 font-bold text-[9px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h4 className="text-[10px] font-bold text-slate-900">
                    Monitoring Obat Slow-Moving
                  </h4>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Ibuprofen 400mg memiliki tren perputaran lambat (12 strip/bulan vs 80 strip stok di rak).
                </p>
                <p className="text-[9px] font-semibold text-indigo-600 pt-0.5">
                  Tindakan: Utamakan pengeluaran batch terdekat atau ajukan retur dini.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan (1 Kolom): Evaluasi PBF & Quick Links */}
        <div className="space-y-4">
          {/* Card: Evaluasi Risiko PBF */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Evaluasi Risiko PBF
                </span>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Distributor Berisiko Retur</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={onNavigateToInventori}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
              >
                <span>Semua</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {Array.isArray(summary?.distributor_terancam) && summary.distributor_terancam.length > 0 ? (
                summary.distributor_terancam.map((d, idx) => {
                  const maxVal = summary.distributor_terancam[0]?.nilai || 1;
                  const percent = Math.min(100, Math.round((d.nilai / maxVal) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                          {d.nama}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400">
                            {d.batch_count} batch
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatRupiah(d.nilai)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-[10px] text-slate-400 italic py-2">
                  Data distributor tidak tersedia.
                </div>
              )}
            </div>
          </div>

          {/* Card: Kepatuhan Pengeluaran Obat FEFO */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Kepatuhan Pengeluaran Obat
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                87.5% FEFO
              </span>
            </div>

            <h3 className="text-xs font-bold text-slate-900">
              Prinsip First Expired First Out
            </h3>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              Sebanyak 7 dari 8 batch obat keluar dari rak sesuai tanggal kedaluwarsa terdekat.
            </p>

            <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
              <div className="bg-emerald-500 h-full rounded" style={{ width: '87.5%' }} />
            </div>
          </div>

          {/* Card: Aksi Cepat & Ekspor Dokumen */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 shadow-sm space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Aksi Cepat & Laporan
            </span>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={onNavigateToPengingat}
                className="w-full flex items-center justify-between p-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] text-slate-700 transition"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-medium">Buat Surat Pengajuan Retur</span>
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onNavigateToInventori}
                className="w-full flex items-center justify-between p-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] text-slate-700 transition"
              >
                <span className="flex items-center gap-2">
                  <Boxes className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium">Lihat Agregasi Persediaan Rak</span>
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
