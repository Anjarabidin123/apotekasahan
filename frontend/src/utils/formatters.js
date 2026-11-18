export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const NAMA_HARI_PENDEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const NAMA_HARI_PANJANG = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
];

export function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function pad2(num) {
  return String(num).padStart(2, '0');
}

export function toIsoDate(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

export function getLocalTodayIso() {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseIsoDateLocal(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return null;
  const parts = isoStr.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function formatFullDateId(isoStr) {
  const dt = parseIsoDateLocal(isoStr);
  if (!dt) return isoStr || '-';
  return `${NAMA_HARI_PANJANG[dt.getDay()]}, ${dt.getDate()} ${NAMA_BULAN[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function formatShortDateId(isoStr) {
  const dt = parseIsoDateLocal(isoStr);
  if (!dt) return isoStr || '-';
  return `${dt.getDate()} ${NAMA_BULAN[dt.getMonth()].slice(0, 3)} ${dt.getFullYear()}`;
}

export function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage browser dapat penuh atau dibatasi pada mode privat
  }
}
