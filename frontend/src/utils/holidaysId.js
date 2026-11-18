import { parseIsoDateLocal } from './formatters';

const LIBUR_NASIONAL_TETAP = {
  '01-01': 'Tahun Baru Masehi',
  '05-01': 'Hari Buruh Internasional',
  '06-01': 'Hari Lahir Pancasila',
  '08-17': 'Hari Kemerdekaan RI',
  '12-25': 'Hari Raya Natal',
};

const LIBUR_NASIONAL_KHUSUS = {
  // 2025
  '2025-01-27': 'Isra Mikraj Nabi Muhammad SAW',
  '2025-01-29': 'Tahun Baru Imlek 2576 Kongzili',
  '2025-03-29': 'Hari Suci Nyepi 1947 Saka',
  '2025-03-31': 'Hari Raya Idulfitri 1446 H',
  '2025-04-01': 'Hari Raya Idulfitri 1446 H (Hari 2)',
  '2025-04-18': 'Wafat Yesus Kristus',
  '2025-04-20': 'Kebangkitan Yesus Kristus (Paskah)',
  '2025-05-12': 'Hari Raya Waisak 2569 BE',
  '2025-05-29': 'Kenaikan Yesus Kristus',
  '2025-06-06': 'Hari Raya Iduladha 1446 H',
  '2025-06-27': 'Tahun Baru Islam 1447 H',
  '2025-09-05': 'Maulid Nabi Muhammad SAW',
  // 2026
  '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-19': 'Hari Suci Nyepi 1948 Saka',
  '2026-03-21': 'Hari Raya Idulfitri 1447 H',
  '2026-03-22': 'Hari Raya Idulfitri 1447 H (Hari 2)',
  '2026-04-03': 'Wafat Yesus Kristus',
  '2026-04-05': 'Kebangkitan Yesus Kristus (Paskah)',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-27': 'Hari Raya Iduladha 1447 H',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-16': 'Tahun Baru Islam 1448 H',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  // 2027
  '2027-01-05': 'Isra Mikraj Nabi Muhammad SAW',
  '2027-02-06': 'Tahun Baru Imlek 2578 Kongzili',
  '2027-03-10': 'Hari Raya Idulfitri 1448 H',
  '2027-03-11': 'Hari Raya Idulfitri 1448 H (Hari 2)',
  '2027-03-26': 'Wafat Yesus Kristus',
  '2027-03-28': 'Kebangkitan Yesus Kristus (Paskah)',
  '2027-04-08': 'Hari Suci Nyepi 1949 Saka',
  '2027-05-06': 'Kenaikan Yesus Kristus',
  '2027-05-17': 'Hari Raya Iduladha 1448 H',
  '2027-05-20': 'Hari Raya Waisak 2571 BE',
  '2027-06-06': 'Tahun Baru Islam 1449 H',
  '2027-08-14': 'Maulid Nabi Muhammad SAW',
  '2027-12-26': 'Isra Mikraj Nabi Muhammad SAW',
};

export function getHolidayInfo(isoStr) {
  const dt = parseIsoDateLocal(isoStr);
  if (!dt) {
    return { isRedDate: false, isHoliday: false, isSunday: false, label: null };
  }

  const mmdd = isoStr.slice(5, 10);
  const holidayName = LIBUR_NASIONAL_KHUSUS[isoStr] || LIBUR_NASIONAL_TETAP[mmdd] || null;
  const isSunday = dt.getDay() === 0;
  const isHoliday = Boolean(holidayName);
  const isRedDate = isSunday || isHoliday;

  let label = holidayName;
  if (isHoliday && isSunday) {
    label = `${holidayName} (Minggu)`;
  } else if (!isHoliday && isSunday) {
    label = 'Hari Minggu (Akhir Pekan)';
  }

  return { isRedDate, isHoliday, isSunday, label };
}
