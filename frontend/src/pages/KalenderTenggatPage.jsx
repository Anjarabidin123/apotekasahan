import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Download,
  Printer,
  CheckCircle2,
  CalendarCheck2
} from 'lucide-react';

export function KalenderTenggatPage() {
  const [batches, setBatches] = useState([]);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 0-indexed: 10 = November 2026
  const [selectedDate, setSelectedDate] = useState('2026-11-05');

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const res = await api.getBatches();
      setBatches(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleResetToAcuan = () => {
    setCurrentMonth(10);
    setCurrentYear(2026);
    setSelectedDate('2026-11-05');
  };

  const getEventsForDate = (dateStr) => {
    const returEvents = batches.filter((b) => b.batas_retur === dateStr);
    const expEvents = batches.filter((b) => b.tanggal_kedaluwarsa === dateStr);
    return { returEvents, expEvents };
  };

  const selectedEvents = getEventsForDate(selectedDate);

  // Kumpulan tonggak penting di bulan aktif
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthMilestones = useMemo(() => {
    const list = [];
    batches.forEach((b) => {
      if (b.batas_retur && b.batas_retur.startsWith(currentMonthPrefix)) {
        list.push({
          type: 'retur',
          date: b.batas_retur,
          batch: b,
          title: `Tenggat Retur: ${b.nama_obat}`,
          desc: `${b.nama_distributor || 'PBF'} • Batch ${b.nomor_batch}`,
          color: 'rose'
        });
      }
      if (b.tanggal_kedaluwarsa && b.tanggal_kedaluwarsa.startsWith(currentMonthPrefix)) {
        list.push({
          type: 'exp',
          date: b.tanggal_kedaluwarsa,
          batch: b,
          title: `Kedaluwarsa: ${b.nama_obat}`,
          desc: `Stok: ${b.jumlah_saat_ini} di rak • Batch ${b.nomor_batch}`,
          color: 'amber'
        });
      }
    });

    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [batches, currentMonthPrefix]);

  const returCount = monthMilestones.filter((m) => m.type === 'retur').length;
  const expCount = monthMilestones.filter((m) => m.type === 'exp').length;

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-4">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Jadwal & Kedaluwarsa Farmasi
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
            Kalender Tenggat Retur & Kedaluwarsa PBF
          </h2>
          <p className="text-xs text-slate-500">
            Pemantauan jatuh tempo retur ke 14 distributor PBF dan kedaluwarsa obat rak apotek.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-slate-800 min-w-[120px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleResetToAcuan}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
            title="Kembali ke Bulan Acuan (Nov 2026)"
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Nov 2026</span>
          </button>

          <button
            onClick={() => {
              alert(
                'Jadwal tenggat retur November 2026 telah diekspor ke format iCal (.ics) untuk disinkronkan ke Google Calendar.'
              );
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Unduh file kalender .ICS"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh .ICS</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500">Klik tanggal untuk melihat rincian batch</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {returCount} Retur PBF
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {expCount} Kedaluwarsa
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 py-1 uppercase tracking-wider">
            <span className="text-rose-500">Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 p-1 rounded-xl bg-slate-50/50 border border-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const { returEvents, expEvents } = getEventsForDate(dateStr);
              const isSelected = selectedDate === dateStr;
              const hasEvents = returEvents.length > 0 || expEvents.length > 0;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-16 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30 shadow-xs'
                      : hasEvents
                      ? 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs'
                      : 'border-slate-100 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {returEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-0.5 w-full mt-auto">
                    {returEvents.length > 0 && (
                      <span className="block text-[9px] font-extrabold px-1 rounded bg-rose-100 text-rose-800 truncate leading-tight">
                        {returEvents.length} Retur
                      </span>
                    )}
                    {expEvents.length > 0 && (
                      <span className="block text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800 truncate leading-tight">
                        {expEvents.length} Exp
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Batas Retur PBF</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Kedaluwarsa (ED)</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Tanggal Dipilih</span>
              </span>
            </div>

            <span className="text-[10px] text-slate-400 font-medium">
              Sistem SIMAAF • Acuan 31 Okt 2026
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Rincian Tanggal
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  {selectedDate}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">
                {selectedEvents.returEvents.length + selectedEvents.expEvents.length} Jadwal
              </span>
            </div>

            {selectedEvents.returEvents.length === 0 && selectedEvents.expEvents.length === 0 ? (
              <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-100 text-center space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto opacity-80" />
                <p className="text-xs font-bold text-slate-800">Tidak Ada Jatuh Tempo</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tidak ada obat retur atau kedaluwarsa pada tanggal ini.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedEvents.returEvents.map((b) => (
                  <div
                    key={`retur-${b.id}`}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800">
                        Batas Retur PBF
                      </span>
                      <span className="text-xs font-black text-rose-700">
                        {formatRupiah(b.nilai_total)}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-black text-slate-900">{b.nama_obat}</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        PBF: <strong>{b.nama_distributor}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Batch: {b.nomor_batch} • Stok: {b.jumlah_saat_ini} {b.satuan || 'box'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[10px]">
                      <span className="text-rose-600 font-semibold">ED: {b.tanggal_kedaluwarsa}</span>
                      <button
                        onClick={() => {
                          alert(`Mempersiapkan formulir retur resmi untuk ${b.nama_obat} ke ${b.nama_distributor}`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs cursor-pointer"
                      >
                        Proses Retur
                      </button>
                    </div>
                  </div>
                ))}

                {selectedEvents.expEvents.map((b) => (
                  <div
                    key={`exp-${b.id}`}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        Obat Kedaluwarsa
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {b.jumlah_saat_ini} tersisa
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-black text-slate-900">{b.nama_obat}</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                        Batch: {b.nomor_batch} • PBF: {b.nama_distributor}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 text-[10px] text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Pisahkan dari rak etalase sesuai SOP BPOM.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => window.print()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer mt-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Jadwal (PDF)</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Agenda Kritis ({monthNames[currentMonth]})
              </span>
              <span className="text-[10px] font-bold text-blue-600">
                {monthMilestones.length} Kejadian
              </span>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {monthMilestones.map((m, idx) => {
                const isSelected = selectedDate === m.date;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(m.date)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-500/30'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                            m.type === 'retur'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.type === 'retur' ? 'Retur' : 'Kedaluwarsa'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {m.batch.nama_obat}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {m.batch.nama_distributor}
                      </p>
                    </div>

                    <span className="text-[11px] font-mono font-black text-slate-800 whitespace-nowrap">
                      {m.date.split('-').slice(1).join('/')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
