import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { exportCalendarIcs, exportToExcelCsv } from '../utils/fileTools';
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
  const [noticeMsg, setNoticeMsg] = useState('');

  useEffect(() => {
    loadBatches();
  }, []);

  /**
   * Memuat seluruh data batch untuk dipetakan pada kalender jatuh tempo.
   */
  const loadBatches = async () => {
    try {
      const res = await api.getBatches();
      setBatches(res.data || []);
    } catch (e) {
      console.error('Gagal memuat jadwal kalender:', e);
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
        });
      }
      if (b.tanggal_kedaluwarsa && b.tanggal_kedaluwarsa.startsWith(currentMonthPrefix)) {
        list.push({
          type: 'exp',
          date: b.tanggal_kedaluwarsa,
          batch: b,
          title: `Kedaluwarsa: ${b.nama_obat}`,
          desc: `Stok: ${b.jumlah_saat_ini} • Batch ${b.nomor_batch}`,
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

  /**
   * Mengekspor seluruh jadwal jatuh tempo bulan aktif ke file .ICS atau CSV Excel.
   */
  const handleDownloadIcs = () => {
    if (monthMilestones.length === 0) {
      setNoticeMsg('Belum ada jadwal jatuh tempo pada bulan ini untuk diunduh.');
      setTimeout(() => setNoticeMsg(''), 3000);
      return;
    }
    exportCalendarIcs(`jadwal_pbf_${currentMonthPrefix}.ics`, monthMilestones);
    setNoticeMsg(`Berhasil mengunduh ${monthMilestones.length} jadwal ke file .ICS.`);
    setTimeout(() => setNoticeMsg(''), 3500);
  };

  const handleDownloadCsv = () => {
    if (monthMilestones.length === 0) return;
    const headers = ['Tanggal', 'Jenis Jadwal', 'Nama Obat', 'Nomor Batch', 'Distributor PBF', 'Stok', 'Nilai Total (Rp)'];
    const rows = monthMilestones.map((m) => [
      m.date,
      m.type === 'retur' ? 'Tenggat Retur PBF' : 'Tanggal Kedaluwarsa',
      m.batch.nama_obat,
      m.batch.nomor_batch,
      m.batch.nama_distributor || '-',
      m.batch.jumlah_saat_ini ?? 0,
      m.batch.nilai_total || 0,
    ]);
    exportToExcelCsv(`jadwal_tenggat_${currentMonthPrefix}.csv`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Header Kalender & Kontrol Bulan */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Kalender Tenggat PBF & Kedaluwarsa
            </h2>
            <p className="text-xs text-slate-500">
              Pantau jatuh tempo retur distributor dan tanggal kedaluwarsa per hari.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-white text-slate-600 transition"
              title="Bulan Sebelumnya"
              aria-label="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-900 min-w-[115px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-white text-slate-600 transition"
              title="Bulan Berikutnya"
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToAcuan}
            className="btn-outline h-11 sm:h-9 px-3 text-xs"
            title="Kembali ke Bulan Acuan (Nov 2026)"
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Nov 2026</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={monthMilestones.length === 0}
            className="btn-outline h-11 sm:h-9 px-3 text-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadIcs}
            className="btn-primary h-11 sm:h-9 px-3 text-xs"
            title="Unduh file kalender .ICS"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh .ICS</span>
          </button>
        </div>
      </div>

      {noticeMsg && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Kisi Kalender */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-800">
              {monthNames[currentMonth]} {currentYear}
            </span>

            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {returCount} Retur PBF
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {expCount} Kedaluwarsa
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 py-1">
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
              <div key={`empty-${i}`} className="h-14 sm:h-16 p-1 rounded-xl bg-slate-50/50" />
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
                  className={`min-h-[54px] sm:h-16 p-1 sm:p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                      : hasEvents
                      ? 'border-slate-200 bg-white hover:border-blue-400'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums ${
                        isSelected ? 'bg-blue-600 text-white' : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {returEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 hidden sm:block" />
                    )}
                  </div>

                  {/* Badge Desktop */}
                  <div className="hidden sm:block space-y-0.5 w-full mt-auto">
                    {returEvents.length > 0 && (
                      <span className="block text-[9px] font-bold px-1 rounded bg-rose-100 text-rose-800 truncate">
                        {returEvents.length} Retur
                      </span>
                    )}
                    {expEvents.length > 0 && (
                      <span className="block text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800 truncate">
                        {expEvents.length} Exp
                      </span>
                    )}
                  </div>

                  {/* Titik Indikator Mobile */}
                  <div className="flex sm:hidden items-center justify-center gap-1 w-full mt-auto pb-0.5">
                    {returEvents.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                    {expEvents.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Rincian Tanggal Dipilih & Agenda Bulan */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                Jadwal: {selectedDate}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold tabular-nums">
                {selectedEvents.returEvents.length + selectedEvents.expEvents.length} Item
              </span>
            </div>

            {selectedEvents.returEvents.length === 0 && selectedEvents.expEvents.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Tidak Ada Jatuh Tempo</p>
                <p className="text-[11px] text-slate-500">
                  Klik tanggal bertanda titik merah atau kuning untuk melihat detail.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedEvents.returEvents.map((b) => (
                  <div
                    key={`retur-${b.id}`}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Batas Retur PBF
                      </span>
                      <span className="text-xs font-bold text-rose-700 tabular-nums">
                        {formatRupiah(b.nilai_total)}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">{b.nama_obat}</h5>
                    <p className="text-[11px] text-slate-600">
                      {b.nama_distributor} • Batch <span className="font-mono">{b.nomor_batch}</span>
                    </p>
                  </div>
                ))}

                {selectedEvents.expEvents.map((b) => (
                  <div
                    key={`exp-${b.id}`}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Obat Kedaluwarsa
                      </span>
                      <span className="text-xs font-bold text-slate-800 tabular-nums">
                        {b.jumlah_saat_ini} unit
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">{b.nama_obat}</h5>
                    <p className="text-[11px] text-slate-600 font-mono">
                      Batch: {b.nomor_batch} • {b.nama_distributor}
                    </p>
                    <div className="pt-1 text-[10px] text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Pisahkan dari rak sesuai standar CDOB BPOM.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full btn-outline h-10 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Jadwal Bulan Ini</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">
                Agenda {monthNames[currentMonth]}
              </span>
              <span className="text-[11px] font-bold text-blue-600 tabular-nums">
                {monthMilestones.length} Agenda
              </span>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {monthMilestones.map((m, idx) => {
                const isSelected = selectedDate === m.date;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(m.date)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            m.type === 'retur'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.type === 'retur' ? 'Retur' : 'ED'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {m.batch.nama_obat}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {m.batch.nama_distributor}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-700 shrink-0">
                      {m.date.split('-').slice(1).join('/')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
