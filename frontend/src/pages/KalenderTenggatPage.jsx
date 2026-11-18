import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  RotateCcw,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  CalendarCheck,
  Flag,
  Building2,
} from 'lucide-react';
import { api } from '../services/api';
import { exportCalendarIcs, exportToExcelCsv } from '../utils/fileTools';
import {
  NAMA_BULAN,
  NAMA_HARI_PENDEK,
  pad2,
  toIsoDate,
  getLocalTodayIso,
  parseIsoDateLocal,
  formatFullDateId,
  formatShortDateId,
  readJsonStorage,
  writeJsonStorage,
} from '../utils/formatters';
import { getHolidayInfo } from '../utils/holidaysId';

const STORAGE_NOTES_KEY = 'simaaf_calendar_notes';

const KATEGORI_CATATAN = [
  { id: 'merah', label: 'Tandai Merah / Penting', chipClass: 'bg-rose-600 text-white' },
  { id: 'pbf', label: 'Jadwal Sales PBF', chipClass: 'bg-blue-600 text-white' },
  { id: 'opname', label: 'Cek Rak / Opname', chipClass: 'bg-emerald-600 text-white' },
];

function buildCalendarGrid(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const mondayFirstOffset = (firstDay.getDay() + 6) % 7;

  const prevMonthDate = new Date(year, monthIndex, 0);
  const prevMonthDays = prevMonthDate.getDate();
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthIdx = prevMonthDate.getMonth();

  const nextMonthDate = new Date(year, monthIndex + 1, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonthIdx = nextMonthDate.getMonth();

  const cells = [];

  for (let i = mondayFirstOffset - 1; i >= 0; i -= 1) {
    const day = prevMonthDays - i;
    cells.push({
      day,
      iso: toIsoDate(prevYear, prevMonthIdx, day),
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      iso: toIsoDate(year, monthIndex, day),
      inCurrentMonth: true,
    });
  }

  const remainder = cells.length % 7;
  const trailingCount = remainder === 0 ? 0 : 7 - remainder;
  for (let day = 1; day <= trailingCount; day += 1) {
    cells.push({
      day,
      iso: toIsoDate(nextYear, nextMonthIdx, day),
      inCurrentMonth: false,
    });
  }

  return cells;
}

export function KalenderTenggatPage() {
  const realTodayIso = getLocalTodayIso();
  const realNow = parseIsoDateLocal(realTodayIso) || new Date();

  const [batches, setBatches] = useState([]);
  const [tanggalAcuan, setTanggalAcuan] = useState(realTodayIso);
  const [loading, setLoading] = useState(true);

  const [currentYear, setCurrentYear] = useState(realNow.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(realNow.getMonth());
  const [selectedDate, setSelectedDate] = useState(realTodayIso);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'retur' | 'ed' | 'libur' | 'catatan'

  const [customNotes, setCustomNotes] = useState(() => {
    const saved = readJsonStorage(STORAGE_NOTES_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState('merah');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        const [resBatches, resSettings] = await Promise.all([
          api.getBatches(),
          api.getSettings().catch(() => null),
        ]);
        if (!active) return;

        if (resBatches?.sukses) {
          setBatches(resBatches.data || []);
        }
        const acuan = resSettings?.tanggal_acuan || resBatches?.tanggal_acuan || realTodayIso;
        setTanggalAcuan(acuan);
      } catch (err) {
        console.error('Gagal memuat data kalender:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCalendarData();
    return () => {
      active = false;
    };
  }, [realTodayIso]);

  useEffect(() => {
    writeJsonStorage(STORAGE_NOTES_KEY, customNotes);
  }, [customNotes]);

  const showNotice = (text) => {
    setFeedbackMsg(text);
    setTimeout(() => setFeedbackMsg(null), 2600);
  };

  // Kumpulkan semua tenggat retur, kedaluwarsa, dan catatan kustom per tanggal
  const eventsByDate = useMemo(() => {
    const map = {};
    const ensureBucket = (iso) => {
      if (!map[iso]) {
        map[iso] = { returs: [], eds: [], notes: [] };
      }
      return map[iso];
    };

    batches.forEach((b) => {
      if (b.batas_retur) {
        ensureBucket(b.batas_retur).returs.push({
          id: `retur-${b.id}`,
          type: 'retur',
          date: b.batas_retur,
          title: `Retur: ${b.nama_obat}`,
          desc: `${b.nomor_batch} • ${b.nama_distributor}`,
          batch: b,
        });
      }
      if (b.tanggal_kedaluwarsa) {
        ensureBucket(b.tanggal_kedaluwarsa).eds.push({
          id: `ed-${b.id}`,
          type: 'ed',
          date: b.tanggal_kedaluwarsa,
          title: `ED: ${b.nama_obat}`,
          desc: `${b.nomor_batch} • Sisa ${b.jumlah_saat_ini} unit`,
          batch: b,
        });
      }
    });

    customNotes.forEach((note) => {
      if (note?.date) {
        ensureBucket(note.date).notes.push(note);
      }
    });

    return map;
  }, [batches, customNotes]);

  // Daftar tanggal penting terdekat untuk loncat cepat
  const nearestReturDate = useMemo(() => {
    const allReturDates = batches
      .map((b) => b.batas_retur)
      .filter(Boolean)
      .sort();
    return (
      allReturDates.find((d) => d >= tanggalAcuan) ||
      allReturDates[allReturDates.length - 1] ||
      null
    );
  }, [batches, tanggalAcuan]);

  const yearOptions = useMemo(() => {
    const years = new Set([2024, 2025, 2026, 2027, 2028, 2029, 2030]);
    years.add(realNow.getFullYear());
    years.add(currentYear);
    batches.forEach((b) => {
      if (b.batas_retur) years.add(Number(b.batas_retur.slice(0, 4)));
      if (b.tanggal_kedaluwarsa) years.add(Number(b.tanggal_kedaluwarsa.slice(0, 4)));
    });
    return Array.from(years)
      .filter((y) => !Number.isNaN(y))
      .sort((a, b) => a - b);
  }, [batches, currentYear, realNow]);

  const calendarCells = useMemo(
    () => buildCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const monthPrefix = `${currentYear}-${pad2(currentMonth + 1)}`;

  // Statistik dan agenda khusus bulan yang sedang dibuka
  const monthlyStats = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let returCount = 0;
    let edCount = 0;
    let redDateCount = 0;
    let noteCount = 0;
    const holidaysInMonth = [];
    const deadlinesInMonth = [];
    const notesInMonth = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = toIsoDate(currentYear, currentMonth, day);
      const holiday = getHolidayInfo(iso);
      const bucket = eventsByDate[iso];

      if (holiday.isRedDate) {
        redDateCount += 1;
        if (holiday.isHoliday) {
          holidaysInMonth.push({ date: iso, day, ...holiday });
        }
      }

      if (bucket) {
        returCount += bucket.returs.length;
        edCount += bucket.eds.length;
        noteCount += bucket.notes.length;
        bucket.returs.forEach((ev) => deadlinesInMonth.push(ev));
        bucket.eds.forEach((ev) => deadlinesInMonth.push(ev));
        bucket.notes.forEach((n) => notesInMonth.push(n));
      }
    }

    deadlinesInMonth.sort((a, b) => a.date.localeCompare(b.date));
    notesInMonth.sort((a, b) => a.date.localeCompare(b.date));

    return {
      returCount,
      edCount,
      redDateCount,
      noteCount,
      holidaysInMonth,
      deadlinesInMonth,
      notesInMonth,
    };
  }, [currentYear, currentMonth, eventsByDate]);

  // Bulan-bulan yang memiliki jadwal retur atau kedaluwarsa agar mudah dijelajahi
  const activeBatchMonths = useMemo(() => {
    const monthCounts = {};
    batches.forEach((b) => {
      if (b.batas_retur) {
        const key = b.batas_retur.slice(0, 7);
        if (!monthCounts[key]) monthCounts[key] = { key, retur: 0, ed: 0 };
        monthCounts[key].retur += 1;
      }
      if (b.tanggal_kedaluwarsa) {
        const key = b.tanggal_kedaluwarsa.slice(0, 7);
        if (!monthCounts[key]) monthCounts[key] = { key, retur: 0, ed: 0 };
        monthCounts[key].ed += 1;
      }
    });
    return Object.values(monthCounts).sort((a, b) => a.key.localeCompare(b.key));
  }, [batches]);

  const jumpToIsoDate = (isoStr) => {
    const dt = parseIsoDateLocal(isoStr);
    if (!dt) return;
    setCurrentYear(dt.getFullYear());
    setCurrentMonth(dt.getMonth());
    setSelectedDate(isoStr);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    jumpToIsoDate(realTodayIso);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    const cleaned = noteText.trim();
    if (!cleaned || !selectedDate) return;

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: selectedDate,
      text: cleaned,
      category: noteCategory,
      done: false,
      createdAt: new Date().toISOString(),
    };
    setCustomNotes((prev) => [newNote, ...prev]);
    setNoteText('');
    showNotice(`Pengingat disimpan untuk ${formatShortDateId(selectedDate)}.`);
  };

  const handleToggleNote = (noteId) => {
    setCustomNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, done: !n.done } : n))
    );
  };

  const handleDeleteNote = (noteId) => {
    setCustomNotes((prev) => prev.filter((n) => n.id !== noteId));
    showNotice('Catatan dihapus dari kalender.');
  };

  const handleExportIcs = () => {
    const batchMilestones = Object.values(eventsByDate).flatMap((bucket) => [
      ...bucket.returs,
      ...bucket.eds,
      ...bucket.notes.map((n) => ({
        date: n.date,
        title: `Catatan Apotek: ${n.text}`,
        desc: `Kategori: ${n.category.toUpperCase()}`,
      })),
    ]);
    if (batchMilestones.length === 0) {
      showNotice('Belum ada jadwal atau tenggat untuk diekspor.');
      return;
    }
    exportCalendarIcs(`kalender-simaaf-${monthPrefix}.ics`, batchMilestones);
    showNotice('File .ICS siap dibuka di Google Calendar / Kalender HP.');
  };

  const handleExportCsv = () => {
    const rows = [
      ...monthlyStats.holidaysInMonth.map((h) => [
        h.date,
        'TANGGAL MERAH',
        h.label,
        '-',
        '-',
        0,
        'Libur Nasional',
      ]),
      ...monthlyStats.deadlinesInMonth.map((ev) => [
        ev.date,
        ev.type === 'retur' ? 'BATAS RETUR PBF' : 'KEDALUWARSA (ED)',
        ev.batch?.nama_obat || ev.title,
        ev.batch?.nomor_batch || '-',
        ev.batch?.nama_distributor || '-',
        ev.batch?.nilai_total || 0,
        ev.batch?.status_retur || '-',
      ]),
      ...monthlyStats.notesInMonth.map((n) => [
        n.date,
        `CATATAN (${n.category.toUpperCase()})`,
        n.text,
        '-',
        'Apotek Asahan Farma',
        0,
        n.done ? 'Selesai' : 'Aktif',
      ]),
    ];

    if (rows.length === 0) {
      showNotice('Belum ada agenda atau libur nasional pada bulan ini.');
      return;
    }

    exportToExcelCsv(
      `agenda-kalender-${monthPrefix}.csv`,
      ['Tanggal', 'Jenis', 'Judul / Nama Obat', 'Batch', 'Pihak / PBF', 'Nilai (Rp)', 'Status'],
      rows
    );
    showNotice(`Agenda ${NAMA_BULAN[currentMonth]} ${currentYear} diekspor ke CSV.`);
  };

  const selectedBucket = eventsByDate[selectedDate] || { returs: [], eds: [], notes: [] };
  const selectedHoliday = getHolidayInfo(selectedDate);
  const isViewingTodayMonth =
    currentYear === realNow.getFullYear() && currentMonth === realNow.getMonth();
  const gridRowCount = Math.ceil(calendarCells.length / 7);

  return (
    <div className="space-y-4 sm:space-y-5">
      {feedbackMsg && (
        <div className="fixed bottom-24 sm:bottom-6 right-4 z-50 bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header Kalender Aktif & Aksi Ekspor */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <span>Kalender Operasional &amp; Tenggat PBF</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Hari Ini: {formatShortDateId(realTodayIso)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kalender aktif dengan tanggal merah Indonesia, penanda merah batas retur PBF, dan pengingat jadwal apotek.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[42px] px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV Bulan Ini</span>
          </button>
          <button
            type="button"
            onClick={handleExportIcs}
            className="min-h-[42px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Ekspor .ICS</span>
          </button>
        </div>
      </div>

      {/* Bilah Kontrol Bulan, Tahun, Loncat Cepat, dan Filter */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Pemilih Bulan & Tahun Langsung */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              className="w-11 h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <select
              aria-label="Pilih bulan"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="min-h-[44px] px-2.5 sm:px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {NAMA_BULAN.map((nama, idx) => (
                <option key={nama} value={idx}>
                  {nama}
                </option>
              ))}
            </select>

            <select
              aria-label="Pilih tahun"
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="min-h-[44px] px-2.5 sm:px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Bulan berikutnya"
              className="w-11 h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Tombol Loncat Aktif: Hari Ini, Tenggat PBF, Acuan */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleJumpToday}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isViewingTodayMonth && selectedDate === realTodayIso
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
            >
              Hari Ini ({realNow.getDate()} {NAMA_BULAN[realNow.getMonth()].slice(0, 3)})
            </button>

            {nearestReturDate && (
              <button
                type="button"
                onClick={() => jumpToIsoDate(nearestReturDate)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                <span>Tenggat PBF ({formatShortDateId(nearestReturDate)})</span>
              </button>
            )}

            {tanggalAcuan && tanggalAcuan !== realTodayIso && (
              <button
                type="button"
                onClick={() => jumpToIsoDate(tanggalAcuan)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Acuan Data
              </button>
            )}
          </div>
        </div>

        {/* Filter Penanda & Ringkasan Angka Bulan Ini */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200">
          {[
            { id: 'all', label: 'Semua', count: null, active: 'bg-slate-900 text-white border-slate-900' },
            { id: 'retur', label: 'Retur PBF', count: monthlyStats.returCount, active: 'bg-rose-600 text-white border-rose-600', dot: 'bg-rose-600' },
            { id: 'ed', label: 'Kedaluwarsa', count: monthlyStats.edCount, active: 'bg-amber-600 text-white border-amber-600', dot: 'bg-amber-500' },
            { id: 'libur', label: 'Tgl Merah', count: monthlyStats.redDateCount, active: 'bg-red-700 text-white border-red-700', dot: 'bg-red-600' },
            { id: 'catatan', label: 'Catatan', count: monthlyStats.noteCount, active: 'bg-blue-600 text-white border-blue-600', dot: 'bg-blue-600' },
          ].map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`min-h-[36px] px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? tab.active
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {tab.dot && !isActive && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${tab.dot}`} />
                )}
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold leading-none ${
                      isActive ? 'bg-white/25 text-white' : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Konten Utama: Grid Kalender Bergaris Tegas + Panel Detail Tanggal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* Kisi Kalender Utama */}
        <div className="lg:col-span-8 bg-white rounded-2xl border-2 border-slate-400 shadow-sm overflow-hidden">
          {/* Header Nama Hari (Sen - Min) */}
          <div className="grid grid-cols-7 border-b-2 border-slate-400 bg-slate-100">
            {NAMA_HARI_PENDEK.map((hari, idx) => {
              const isMinggu = idx === 6;
              return (
                <div
                  key={hari}
                  className={`py-2.5 text-center text-[11px] sm:text-xs font-extrabold uppercase tracking-wider ${
                    idx < 6 ? 'border-r border-slate-300' : ''
                  } ${isMinggu ? 'bg-rose-100 text-rose-700' : 'text-slate-700'}`}
                >
                  {hari}
                </div>
              );
            })}
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-medium text-slate-500">
              Memuat jadwal tenggat batch dan kalender nasional...
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarCells.map((cell, index) => {
                const colIndex = index % 7;
                const rowIndex = Math.floor(index / 7);
                const isLastCol = colIndex === 6;
                const isLastRow = rowIndex === gridRowCount - 1;

                const holiday = getHolidayInfo(cell.iso);
                const bucket = eventsByDate[cell.iso] || { returs: [], eds: [], notes: [] };

                const visibleReturs =
                  filterType === 'all' || filterType === 'retur' ? bucket.returs : [];
                const visibleEds =
                  filterType === 'all' || filterType === 'ed' ? bucket.eds : [];
                const visibleNotes =
                  filterType === 'all' || filterType === 'catatan' ? bucket.notes : [];
                const showHolidayMark =
                  filterType === 'all' || filterType === 'libur';

                const hasRetur = visibleReturs.length > 0;
                const hasEd = visibleEds.length > 0;
                const hasRedNote = visibleNotes.some((n) => n.category === 'merah' && !n.done);
                const hasRegularNote = visibleNotes.length > 0;
                const hasUrgentRedMark = hasRetur || hasRedNote;

                const isToday = cell.iso === realTodayIso;
                const isSelected = cell.iso === selectedDate;
                const isAcuan = cell.iso === tanggalAcuan;

                const borderClasses = `${!isLastCol ? 'border-r border-slate-300' : ''} ${
                  !isLastRow ? 'border-b border-slate-300' : ''
                }`;

                // Latar belakang sel jelas membedakan tanggal merah, bulan luar, dan hari aktif
                let bgClass = 'bg-white hover:bg-slate-50';
                if (!cell.inCurrentMonth) {
                  bgClass = holiday.isRedDate
                    ? 'bg-rose-50/35 text-slate-400 hover:bg-rose-50/60'
                    : 'bg-slate-100/70 text-slate-400 hover:bg-slate-100';
                } else if (isSelected) {
                  bgClass = 'bg-blue-50/85 ring-2 ring-inset ring-blue-600 z-10';
                } else if (hasUrgentRedMark || (showHolidayMark && holiday.isHoliday)) {
                  bgClass = 'bg-rose-50/80 hover:bg-rose-100/80';
                } else if (showHolidayMark && holiday.isSunday) {
                  bgClass = 'bg-rose-50/45 hover:bg-rose-50/80';
                } else if (hasEd) {
                  bgClass = 'bg-amber-50/45 hover:bg-amber-50/80';
                } else if (isToday) {
                  bgClass = 'bg-blue-50/45 hover:bg-blue-50/80';
                }

                // Warna angka tanggal
                let dayNumberClass = 'text-slate-800 font-bold';
                if (!cell.inCurrentMonth) {
                  dayNumberClass =
                    showHolidayMark && holiday.isRedDate
                      ? 'text-rose-400 font-semibold'
                      : 'text-slate-400 font-medium';
                } else if (isToday) {
                  dayNumberClass =
                    holiday.isRedDate || hasUrgentRedMark
                      ? 'bg-rose-600 text-white font-extrabold ring-2 ring-blue-600 ring-offset-1 shadow-xs'
                      : 'bg-blue-600 text-white font-extrabold shadow-xs';
                } else if (hasUrgentRedMark) {
                  dayNumberClass =
                    'bg-rose-600 text-white font-extrabold shadow-xs';
                } else if (showHolidayMark && holiday.isRedDate) {
                  dayNumberClass = 'text-rose-600 font-extrabold';
                }

                // Ringkasan pill untuk desktop
                const desktopItems = [
                  ...(showHolidayMark && holiday.isHoliday
                    ? [{ key: 'libur', kind: 'libur', text: holiday.label }]
                    : []),
                  ...visibleReturs.map((r) => ({
                    key: r.id,
                    kind: 'retur',
                    text: `Retur: ${r.batch?.nama_obat || r.title}`,
                  })),
                  ...visibleEds.map((e) => ({
                    key: e.id,
                    kind: 'ed',
                    text: `ED: ${e.batch?.nama_obat || e.title}`,
                  })),
                  ...visibleNotes.map((n) => ({
                    key: n.id,
                    kind: n.category === 'merah' ? 'note-merah' : 'note',
                    text: n.text,
                    done: n.done,
                  })),
                ];

                const totalMarkCount =
                  visibleReturs.length + visibleEds.length + visibleNotes.length;

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => jumpToIsoDate(cell.iso)}
                    title={`${formatFullDateId(cell.iso)}${holiday.label ? ` • ${holiday.label}` : ''}`}
                    className={`min-w-0 min-h-[58px] sm:min-h-[86px] lg:min-h-[96px] p-1 sm:p-1.5 flex flex-col justify-between text-left transition-colors relative cursor-pointer overflow-hidden ${borderClasses} ${bgClass}`}
                  >
                    {/* Baris atas sel: Angka Tanggal + Tanda Merah / Hari Ini */}
                    <div className="flex items-start justify-between gap-0.5 w-full">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm leading-none shrink-0 ${dayNumberClass}`}
                      >
                        {cell.day}
                      </span>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {isToday && cell.inCurrentMonth && (
                          <span className="hidden sm:inline-block px-1 py-0.5 rounded bg-blue-100 border border-blue-300 text-blue-800 text-[9px] font-extrabold leading-none">
                            Hari Ini
                          </span>
                        )}
                        {!isToday && isAcuan && cell.inCurrentMonth && (
                          <span className="hidden lg:inline-block px-1 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-bold leading-none">
                            Acuan
                          </span>
                        )}
                        {/* Titik merah menyala di sudut kanan atas untuk tanggal merah/retur */}
                        {(hasUrgentRedMark || (showHolidayMark && holiday.isHoliday)) && (
                          <span
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-600 ring-2 ring-white shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </div>

                    {/* Indikator Mobile (dots + garis warna tegas agar muat di 375px) */}
                    <div className="flex sm:hidden flex-col gap-0.5 w-full mt-auto pt-1">
                      <div className="flex items-center flex-wrap gap-0.5">
                        {showHolidayMark && holiday.isHoliday && (
                          <span className="px-1 py-[1px] rounded bg-rose-600 text-white text-[8px] font-extrabold leading-none">
                            LIBUR
                          </span>
                        )}
                        {hasUrgentRedMark && (
                          <span className="px-1 py-[1px] rounded bg-rose-600 text-white text-[8px] font-extrabold leading-none">
                            {hasRetur ? `R:${visibleReturs.length}` : '!'}
                          </span>
                        )}
                        {hasEd && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        )}
                        {hasRegularNote && !hasRedNote && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      {(hasUrgentRedMark || (showHolidayMark && holiday.isHoliday)) && (
                        <span className="block w-full h-1 rounded-full bg-rose-600" />
                      )}
                    </div>

                    {/* Daftar Label Ringkas Desktop (tablet & PC) */}
                    <div className="hidden sm:flex flex-col gap-0.5 w-full mt-1">
                      {desktopItems.slice(0, 2).map((item) => {
                        if (item.kind === 'libur') {
                          return (
                            <span
                              key={item.key}
                              className="block truncate px-1 py-0.5 rounded-r bg-rose-600 text-white text-[9px] font-extrabold leading-tight border-l-2 border-rose-900"
                            >
                              {item.text}
                            </span>
                          );
                        }
                        if (item.kind === 'retur') {
                          return (
                            <span
                              key={item.key}
                              className="block truncate px-1 py-0.5 rounded-r bg-rose-100 text-rose-900 text-[10px] font-bold leading-tight border-l-[3px] border-rose-600"
                            >
                              {item.text}
                            </span>
                          );
                        }
                        if (item.kind === 'ed') {
                          return (
                            <span
                              key={item.key}
                              className="block truncate px-1 py-0.5 rounded-r bg-amber-100 text-amber-900 text-[10px] font-bold leading-tight border-l-[3px] border-amber-500"
                            >
                              {item.text}
                            </span>
                          );
                        }
                        if (item.kind === 'note-merah') {
                          return (
                            <span
                              key={item.key}
                              className={`block truncate px-1 py-0.5 rounded-r bg-rose-50 text-rose-800 text-[10px] font-bold leading-tight border-l-[3px] border-rose-500 ${
                                item.done ? 'line-through opacity-60' : ''
                              }`}
                            >
                              {item.text}
                            </span>
                          );
                        }
                        return (
                          <span
                            key={item.key}
                            className={`block truncate px-1 py-0.5 rounded-r bg-blue-50 text-blue-800 text-[10px] font-semibold leading-tight border-l-[3px] border-blue-500 ${
                              item.done ? 'line-through opacity-60' : ''
                            }`}
                          >
                            {item.text}
                          </span>
                        );
                      })}

                      {desktopItems.length > 2 && (
                        <span className="text-[9px] font-extrabold text-slate-600 pl-1">
                          +{desktopItems.length - 2} lagi
                        </span>
                      )}

                      {desktopItems.length === 0 && totalMarkCount > 0 && (
                        <span className="text-[9px] font-bold text-slate-500">
                          {totalMarkCount} agenda
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Legenda Warna & Tanda Kalender */}
          <div className="bg-slate-50 border-t-2 border-slate-300 px-3.5 sm:px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-700 font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
              <span>Tanda Merah: Batas Retur PBF / Libur Nasional / Penting</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-rose-600 font-extrabold">Min</span>
              <span>Tanggal Merah Akhir Pekan</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span>Batas Kedaluwarsa (ED)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
              <span>Hari Ini / Catatan Jadwal</span>
            </span>
          </div>
        </div>

        {/* Panel Detail Tanggal Terpilih & Pengingat Aktif */}
        <div className="lg:col-span-4 bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Detail Tanggal Terpilih
              </p>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug mt-0.5">
                {formatFullDateId(selectedDate)}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {selectedDate === realTodayIso && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">
                    Hari Ini
                  </span>
                )}
                {selectedHoliday.isRedDate && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">
                    Tanggal Merah
                  </span>
                )}
                {selectedDate === tanggalAcuan && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-bold">
                    Acuan Data
                  </span>
                )}
              </div>
            </div>

            <div
              className={`w-12 h-12 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${
                selectedHoliday.isRedDate || selectedBucket.returs.length > 0
                  ? 'bg-rose-600 border-rose-700 text-white'
                  : selectedDate === realTodayIso
                  ? 'bg-blue-600 border-blue-700 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <span className="text-lg font-extrabold leading-none">
                {selectedDate ? Number(selectedDate.slice(8, 10)) : '-'}
              </span>
              <span className="text-[9px] font-bold uppercase mt-0.5 opacity-90">
                {selectedDate
                  ? NAMA_BULAN[Number(selectedDate.slice(5, 7)) - 1]?.slice(0, 3)
                  : ''}
              </span>
            </div>
          </div>

          {/* Info Hari Libur Nasional / Akhir Pekan */}
          {selectedHoliday.isRedDate && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 space-y-1">
              <p className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{selectedHoliday.label}</span>
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Layanan pengantaran dan penjemputan retur distributor (PBF) umumnya tutup pada tanggal merah. Jadwalkan serah terima retur di hari kerja sebelumnya.
              </p>
            </div>
          )}

          {/* Daftar Tenggat Retur PBF & ED Obat */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Tenggat Batch PBF
              </h4>
              <span className="text-[11px] font-bold text-slate-500">
                {selectedBucket.returs.length + selectedBucket.eds.length} batch
              </span>
            </div>

            {selectedBucket.returs.length === 0 && selectedBucket.eds.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-500 text-center">
                Tidak ada tenggat retur atau ED obat pada tanggal ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                {selectedBucket.returs.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-rose-50/75 border-l-4 border-l-rose-600 border border-rose-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-white bg-rose-600 px-2 py-0.5 rounded-full">
                        <RotateCcw className="w-3 h-3" />
                        Batas Retur PBF
                      </span>
                      <span className="text-[11px] font-bold text-rose-700 tabular-nums">
                        Rp {Number(ev.batch?.nilai_total || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900">
                      {ev.batch?.nama_obat}
                    </p>
                    <p className="text-[11px] text-slate-600 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {ev.batch?.nomor_batch} • {ev.batch?.nama_distributor}
                      </span>
                    </p>
                  </div>
                ))}

                {selectedBucket.eds.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-amber-50/75 border-l-4 border-l-amber-500 border border-amber-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-950 bg-amber-300/80 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Kedaluwarsa (ED)
                      </span>
                      <span className="text-[11px] font-bold text-amber-800 tabular-nums">
                        {ev.batch?.jumlah_saat_ini || 0} unit
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900">
                      {ev.batch?.nama_obat}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate">
                      {ev.batch?.nomor_batch} • {ev.batch?.nama_distributor}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pengingat & Tandai Tanggal Apotek (Aktif Tersimpan Lokal) */}
          <div className="pt-3 border-t border-slate-200 space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Pengingat &amp; Tandai Tanggal</span>
              <span className="text-[10px] font-bold text-slate-400">
                {selectedBucket.notes.length} catatan
              </span>
            </h4>

            <form onSubmit={handleAddNote} className="space-y-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Mis. Sales PBF ambil retur / Cek rak..."
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap gap-1.5">
                {KATEGORI_CATATAN.map((kat) => {
                  const selected = noteCategory === kat.id;
                  return (
                    <button
                      key={kat.id}
                      type="button"
                      onClick={() => setNoteCategory(kat.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        selected
                          ? `${kat.chipClass} border-transparent`
                          : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {kat.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="submit"
                disabled={!noteText.trim()}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-45 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Pengingat di Tanggal Ini</span>
              </button>
            </form>

            {selectedBucket.notes.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {selectedBucket.notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 ${
                      note.category === 'merah'
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-blue-50/60 border-blue-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleNote(note.id)}
                      className="flex items-start gap-2 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          note.done
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : note.category === 'merah'
                            ? 'border-rose-500 bg-white'
                            : 'border-blue-500 bg-white'
                        }`}
                      >
                        {note.done && <CheckCircle2 className="w-3 h-3" />}
                      </span>
                      <span
                        className={`text-xs font-semibold leading-snug break-words ${
                          note.done
                            ? 'line-through text-slate-400'
                            : note.category === 'merah'
                            ? 'text-rose-900'
                            : 'text-slate-800'
                        }`}
                      >
                        {note.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      aria-label="Hapus catatan"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ringkasan Bulanan: Tanggal Merah Nasional + Jadwal Tenggat PBF + Bulan Aktif */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Daftar Hari Libur Nasional & Catatan Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Flag className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Tanggal Merah &amp; Pengingat ({NAMA_BULAN[currentMonth]} {currentYear})
              </span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
              {monthlyStats.redDateCount} Tgl Merah
            </span>
          </div>

          {monthlyStats.holidaysInMonth.length === 0 && monthlyStats.notesInMonth.length === 0 ? (
            <p className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3">
              Bulan ini memiliki <strong>{monthlyStats.redDateCount} hari Minggu</strong> sebagai tanggal merah (tidak ada hari libur nasional tengah pekan). Klik tanggal mana saja untuk menambah pengingat merah.
            </p>
          ) : (
            <div className="space-y-2">
              {monthlyStats.holidaysInMonth.map((h) => (
                <button
                  key={h.date}
                  type="button"
                  onClick={() => jumpToIsoDate(h.date)}
                  className="w-full text-left p-2.5 rounded-xl bg-rose-50/75 border border-rose-200 hover:bg-rose-100/70 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-rose-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      {h.day}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-rose-900 truncate">
                        {h.label}
                      </p>
                      <p className="text-[10px] font-medium text-rose-700">
                        Hari Libur Nasional Indonesia
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 shrink-0">
                    Lihat →
                  </span>
                </button>
              ))}

              {monthlyStats.notesInMonth.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => jumpToIsoDate(n.date)}
                  className="w-full text-left p-2.5 rounded-xl bg-blue-50/60 border border-blue-200 hover:bg-blue-50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-lg text-white text-xs font-extrabold flex items-center justify-center shrink-0 ${
                        n.category === 'merah' ? 'bg-rose-600' : 'bg-blue-600'
                      }`}
                    >
                      {Number(n.date.slice(8, 10))}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {n.text}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500">
                        Catatan Apotek {n.done ? '• Selesai' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 shrink-0">
                    Buka →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Daftar Agenda Tenggat Retur & ED Bulan Ini + Lompatan Bulan Aktif */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Agenda Tenggat Batch ({NAMA_BULAN[currentMonth]} {currentYear})
              </span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {monthlyStats.deadlinesInMonth.length} agenda
            </span>
          </div>

          {monthlyStats.deadlinesInMonth.length === 0 ? (
            <div className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 space-y-2">
              <p>
                Tidak ada tenggat retur atau kedaluwarsa obat pada bulan{' '}
                <strong>
                  {NAMA_BULAN[currentMonth]} {currentYear}
                </strong>
                .
              </p>
              {activeBatchMonths.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-600 mr-1">
                    Bulan dengan tenggat:
                  </span>
                  {activeBatchMonths.map((bm) => {
                    const [yy, mm] = bm.key.split('-').map(Number);
                    return (
                      <button
                        key={bm.key}
                        type="button"
                        onClick={() => {
                          setCurrentYear(yy);
                          setCurrentMonth(mm - 1);
                          setSelectedDate(`${bm.key}-01`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold cursor-pointer"
                      >
                        {NAMA_BULAN[mm - 1]?.slice(0, 3)} {yy} ({bm.retur + bm.ed})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
              {monthlyStats.deadlinesInMonth.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => jumpToIsoDate(ev.date)}
                  className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    ev.type === 'retur'
                      ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                      : 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                        ev.type === 'retur'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {Number(ev.date.slice(8, 10))}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">
                        {ev.batch?.nama_obat}
                      </p>
                      <p className="text-[11px] text-slate-600 truncate">
                        {ev.type === 'retur' ? 'Batas Retur' : 'Kedaluwarsa'} •{' '}
                        {ev.batch?.nama_distributor}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-800 shrink-0 tabular-nums">
                    Rp {Number(ev.batch?.nilai_total || 0).toLocaleString('id-ID')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
