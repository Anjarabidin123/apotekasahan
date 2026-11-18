// Layer layanan API SIMAAF
// Mendukung mode mock lokal (default pengembangan) dan live backend Express.js

import {
  DISTRIBUTORS,
  INITIAL_OBAT,
  INITIAL_BATCHES,
  INITIAL_SETTINGS,
  INITIAL_STOCK_LOGS,
  SAMPLE_FAKTUR_EXTRACTION
} from './mockData';

// Helper storage lokal agar interaksi (tambah batch, ubah stok, ubah aturan) tetap tersimpan saat refresh
const STORAGE_KEYS = {
  BATCHES: 'simaaf_batches',
  SETTINGS: 'simaaf_settings',
  DISTRIBUTORS: 'simaaf_distributors',
  LOGS: 'simaaf_stock_logs',
  PROFILE: 'simaaf_profile',
  KATEGORI: 'simaaf_kategori',
};

export const DEFAULT_PROFILE = {
  nama_apotek: 'Apotek Asahan Farma',
  pimpinan: 'Ibu Anni (Komisaris)',
  apoteker_pj: 'apt. Nurul Hasanah, S.Farm',
  sipa: '19930412/SIPA_1208/2022/2041',
  sia: '503/SIA/042/DPMPTSP/2021',
  nib: '1210210063257',
  alamat: 'Jl. Imam Bonjol No. 331, Kel. Kisaran Timur, Kab. Asahan, Sumatera Utara 21214',
  telepon: '(0623) 41289',
  whatsapp: '0812-6543-9870',
  email: 'apotek.asahanfarma@gmail.com',
  jam_operasional: 'Senin - Minggu: 08.00 - 22.00 WIB',
  catatan_kaki_surat: 'Obat yang diretur wajib bersegel utuh dan diverifikasi nomor batch resminya.',
  format_no_retur: 'BAP-RETUR/{YYYY}/{MM}/{INDEX}',
  tanda_tangan_apj: true,
};

export const DEFAULT_KATEGORI = [
  { id: 1, nama: 'Antibiotik (Keras)', stok_minimum: 15, masa_pantau_hari: 30, jenis: 'Keras' },
  { id: 2, nama: 'Analgesik & Antipiretik', stok_minimum: 20, masa_pantau_hari: 30, jenis: 'Bebas' },
  { id: 3, nama: 'Antasida & Obat Lambung', stok_minimum: 15, masa_pantau_hari: 45, jenis: 'Bebas Terbatas' },
  { id: 4, nama: 'Antihipertensi & Jantung', stok_minimum: 20, masa_pantau_hari: 30, jenis: 'Keras' },
  { id: 5, nama: 'Antidiabetes Oral', stok_minimum: 30, masa_pantau_hari: 30, jenis: 'Keras' },
  { id: 6, nama: 'Sirup & Tetes Anak', stok_minimum: 15, masa_pantau_hari: 45, jenis: 'Bebas Terbatas' },
  { id: 7, nama: 'Salep & Krim Topikal', stok_minimum: 10, masa_pantau_hari: 60, jenis: 'Bebas Terbatas' },
  { id: 8, nama: 'Suplemen & Vitamin', stok_minimum: 20, masa_pantau_hari: 60, jenis: 'Bebas' },
];

function getStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Gagal menyimpan storage:', e);
  }
}

// Inisialisasi data awal jika storage kosong
if (!localStorage.getItem(STORAGE_KEYS.BATCHES)) {
  setStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
  setStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  setStorage(STORAGE_KEYS.DISTRIBUTORS, DISTRIBUTORS);
  setStorage(STORAGE_KEYS.LOGS, INITIAL_STOCK_LOGS);
}

// Helper kalkulasi batas retur berdasarkan aturan distributor
export function hitungBatasRetur(tanggalKedaluwarsa, bulanAturan) {
  if (!bulanAturan || bulanAturan <= 0) return null;
  const d = new Date(tanggalKedaluwarsa);
  d.setMonth(d.getMonth() - bulanAturan);
  return d.toISOString().split('T')[0];
}

// Helper selisih hari dari tanggal acuan
export function hitungSelisihHari(targetDateStr, refDateStr) {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr);
  const ref = new Date(refDateStr);
  const diffTime = target - ref;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const api = {
  // Autentikasi
  async login(email, password) {
    await new Promise((r) => setTimeout(r, 400)); // simulasi delay jaringan
    if (email === 'admin@apotek.local' && password === 'admin123') {
      const user = { id: 1, nama: 'Ibu Anni (Komisaris)', email, role: 'admin' };
      localStorage.setItem('simaaf_token', 'mock-jwt-admin-token');
      localStorage.setItem('simaaf_user', JSON.stringify(user));
      return { sukses: true, data: user };
    }
    if (email === 'karyawan@apotek.local' && password === 'karyawan123') {
      const user = { id: 2, nama: 'Karyawan Shift Apotek', email, role: 'karyawan' };
      localStorage.setItem('simaaf_token', 'mock-jwt-karyawan-token');
      localStorage.setItem('simaaf_user', JSON.stringify(user));
      return { sukses: true, data: user };
    }
    throw new Error('Email atau kata sandi tidak cocok. Gunakan admin123 atau karyawan123');
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem('simaaf_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('simaaf_token');
    localStorage.removeItem('simaaf_user');
  },

  // Master data obat dan distributor
  async getObatList() {
    return INITIAL_OBAT;
  },

  async getDistributors() {
    return getStorage(STORAGE_KEYS.DISTRIBUTORS, DISTRIBUTORS);
  },

  // Inventori batch obat
  async getBatches(filters = {}) {
    await new Promise((r) => setTimeout(r, 200));
    let list = getStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    const settings = getStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);

    // Filter search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (b) =>
          b.nama_obat.toLowerCase().includes(q) ||
          b.nomor_batch.toLowerCase().includes(q)
      );
    }

    // Filter distributor
    if (filters.distributor_id) {
      list = list.filter((b) => b.distributor_id === Number(filters.distributor_id));
    }

    // Filter status risiko
    if (filters.status_risiko && filters.status_risiko !== 'semua') {
      list = list.filter((b) => b.status_risiko === filters.status_risiko);
    }

    // Filter status retur
    if (filters.status_retur && filters.status_retur !== 'semua') {
      list = list.filter((b) => b.status_retur === filters.status_retur);
    }

    return {
      sukses: true,
      data: list,
      tanggal_acuan: settings.tanggal_acuan
    };
  },

  // Simpan batch baru (dari input faktur atau manual)
  async simpanBatchList(newItems) {
    await new Promise((r) => setTimeout(r, 500));
    const currentBatches = getStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    const distributors = getStorage(STORAGE_KEYS.DISTRIBUTORS, DISTRIBUTORS);
    const settings = getStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);

    const createdBatches = newItems.map((item, index) => {
      const dist = distributors.find((d) => d.id === Number(item.distributor_id)) || distributors[0];
      const batasRetur = hitungBatasRetur(item.tanggal_kedaluwarsa, dist.aturan_retur_bulan);
      
      // Tentukan status retur relatif terhadap tanggal acuan
      let statusRetur = 'bisa_diretur';
      if (!batasRetur) {
        statusRetur = 'tidak_bisa_diretur';
      } else if (new Date(batasRetur) < new Date(settings.tanggal_acuan)) {
        statusRetur = 'lewat_batas';
      }

      // Simulasi model risiko (berdasarkan sisa hari ke retur dan jumlah stok)
      const selisihHariRetur = hitungSelisihHari(batasRetur, settings.tanggal_acuan);
      let skorRisiko = 0.25;
      let statusRisiko = 'rendah';

      if (statusRetur === 'lewat_batas' || (selisihHariRetur !== null && selisihHariRetur <= 30)) {
        skorRisiko = Number((0.75 + Math.random() * 0.2).toFixed(2));
        statusRisiko = 'tinggi';
      } else if (selisihHariRetur !== null && selisihHariRetur <= 60) {
        skorRisiko = Number((0.50 + Math.random() * 0.2).toFixed(2));
        statusRisiko = 'sedang';
      }

      const jumlah = Number(item.jumlah);
      const hargaBeli = Number(item.harga_beli_satuan);

      return {
        id: Date.now() + index,
        obat_id: Number(item.obat_id),
        nama_obat: item.nama_obat,
        distributor_id: dist.id,
        nama_distributor: dist.nama,
        nomor_batch: item.nomor_batch,
        tanggal_masuk: item.tanggal_masuk || settings.tanggal_acuan,
        tanggal_kedaluwarsa: item.tanggal_kedaluwarsa,
        batas_retur: batasRetur,
        jumlah_awal: jumlah,
        jumlah_saat_ini: jumlah,
        harga_beli_satuan: hargaBeli,
        nilai_total: jumlah * hargaBeli,
        skor_risiko: skorRisiko,
        status_risiko: statusRisiko,
        status_retur: statusRetur,
        keterangan: item.keterangan || 'Input via formulir faktur'
      };
    });

    const updated = [...createdBatches, ...currentBatches];
    setStorage(STORAGE_KEYS.BATCHES, updated);
    return { sukses: true, data: createdBatches };
  },

  // Ekstraksi faktur penerimaan
  async ekstrakFakturFoto(file) {
    // Simulasi latensi pemrosesan dokumen (2.5 detik)
    await new Promise((r) => setTimeout(r, 2200));
    
    // Kembalikan data ekstraksi terstruktur
    return {
      sukses: true,
      data: SAMPLE_FAKTUR_EXTRACTION,
      pesan: 'Foto faktur berhasil dipindai dan diproses.'
    };
  },

  // Pemantauan tenggat dan peringatan
  async getPengingat() {
    await new Promise((r) => setTimeout(r, 200));
    const batches = getStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    const settings = getStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const refDate = settings.tanggal_acuan;

    const mendesakRetur = [];
    const mendekatiKedaluwarsa = [];
    const stokMenipis = [];

    batches.forEach((b) => {
      // 1. Cek retur
      if (b.batas_retur) {
        const sisaHariRetur = hitungSelisihHari(b.batas_retur, refDate);
        if (sisaHariRetur !== null && sisaHariRetur > 0 && sisaHariRetur <= settings.batas_retur_warning_hari) {
          mendesakRetur.push({
            ...b,
            sisa_hari_retur: sisaHariRetur,
            urgensi: sisaHariRetur <= 15 ? 'kritis' : 'waspada'
          });
        }
      }

      // 2. Cek kedaluwarsa
      const sisaHariExp = hitungSelisihHari(b.tanggal_kedaluwarsa, refDate);
      if (sisaHariExp !== null && sisaHariExp > 0 && sisaHariExp <= settings.batas_kedaluwarsa_warning_hari) {
        mendekatiKedaluwarsa.push({
          ...b,
          sisa_hari_exp: sisaHariExp,
          urgensi: sisaHariExp <= 30 ? 'kritis' : 'waspada'
        });
      }

      // 3. Cek stok menipis
      if (b.jumlah_saat_ini <= settings.stok_minimum_default) {
        stokMenipis.push(b);
      }
    });

    // Urutkan dari tenggat paling dekat
    mendesakRetur.sort((a, b) => a.sisa_hari_retur - b.sisa_hari_retur);
    mendekatiKedaluwarsa.sort((a, b) => a.sisa_hari_exp - b.sisa_hari_exp);

    return {
      sukses: true,
      tanggal_acuan: refDate,
      ringkasan: {
        total_mendesak_retur: mendesakRetur.length,
        total_mendekati_kedaluwarsa: mendekatiKedaluwarsa.length,
        total_stok_menipis: stokMenipis.length
      },
      data: {
        mendesakRetur,
        mendekatiKedaluwarsa,
        stokMenipis
      }
    };
  },

  // Penyesuaian stok (stock opname)
  async simpanPenyesuaianStok(batchId, jumlahSesudah, alasan, petugasNama = 'Karyawan') {
    await new Promise((r) => setTimeout(r, 300));
    const batches = getStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    const logs = getStorage(STORAGE_KEYS.LOGS, INITIAL_STOCK_LOGS);

    const batchIndex = batches.findIndex((b) => b.id === Number(batchId));
    if (batchIndex === -1) throw new Error('Batch tidak ditemukan');

    const targetBatch = batches[batchIndex];
    const jumlahSebelum = targetBatch.jumlah_saat_ini;
    const selisih = jumlahSesudah - jumlahSebelum;

    // Update stok batch
    targetBatch.jumlah_saat_ini = jumlahSesudah;
    targetBatch.nilai_total = jumlahSesudah * targetBatch.harga_beli_satuan;
    batches[batchIndex] = targetBatch;
    setStorage(STORAGE_KEYS.BATCHES, batches);

    // Tambah riwayat log
    const newLog = {
      id: Date.now(),
      batch_id: targetBatch.id,
      nama_obat: targetBatch.nama_obat,
      nomor_batch: targetBatch.nomor_batch,
      jumlah_sebelum: jumlahSebelum,
      jumlah_sesudah: jumlahSesudah,
      selisih,
      alasan: alasan || 'Penyesuaian cek fisik',
      petugas: petugasNama,
      tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedLogs = [newLog, ...logs];
    setStorage(STORAGE_KEYS.LOGS, updatedLogs);

    return { sukses: true, data: { batch: targetBatch, log: newLog } };
  },

  async getRiwayatPenyesuaian() {
    return getStorage(STORAGE_KEYS.LOGS, INITIAL_STOCK_LOGS);
  },

  // Ringkasan dashboard
  async getDashboardSummary() {
    await new Promise((r) => setTimeout(r, 200));
    const batches = getStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    const settings = getStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);

    let totalNilaiPersediaan = 0;
    let totalNilaiBerisiko = 0;
    let batchBerisikoTinggi = 0;
    const distributorRiskMap = {};

    batches.forEach((b) => {
      totalNilaiPersediaan += b.nilai_total;
      if (b.status_risiko === 'tinggi' || b.status_retur === 'lewat_batas') {
        totalNilaiBerisiko += b.nilai_total;
        batchBerisikoTinggi++;

        if (!distributorRiskMap[b.nama_distributor]) {
          distributorRiskMap[b.nama_distributor] = {
            nama: b.nama_distributor,
            nilai: 0,
            batch_count: 0
          };
        }
        distributorRiskMap[b.nama_distributor].nilai += b.nilai_total;
        distributorRiskMap[b.nama_distributor].batch_count++;
      }
    });

    const distributorRiskList = Object.values(distributorRiskMap).sort((a, b) => b.nilai - a.nilai);

    return {
      sukses: true,
      data: {
        tanggal_acuan: settings.tanggal_acuan,
        total_nilai_persediaan: totalNilaiPersediaan,
        total_batch_aktif: batches.length,
        jumlah_batch_berisiko: batchBerisikoTinggi,
        total_nilai_berisiko: totalNilaiBerisiko,
        persentase_berisiko: totalNilaiPersediaan > 0 ? ((totalNilaiBerisiko / totalNilaiPersediaan) * 100).toFixed(1) : 0,
        distributor_terancam: distributorRiskList.slice(0, 4),
        temuan_ds: [
          'Distributor dengan aturan retur singkat (1 bulan) menyumbang 62% obat yang gagal diretur.',
          'Obat antibiotik dan sirup anak memerlukan pemantauan ketat menjelang pergantian bulan.',
          'Semua estimasi risiko dihitung otomatis berdasarkan sisa hari retur dan masa kedaluwarsa obat.'
        ]
      }
    };
  },

  // Pengaturan operasional
  async getSettings() {
    return getStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  async updateSettings(newSettings) {
    setStorage(STORAGE_KEYS.SETTINGS, newSettings);
    return { sukses: true, data: newSettings };
  },

  async updateAturanDistributor(distributorId, bulanBaru) {
    const distributors = getStorage(STORAGE_KEYS.DISTRIBUTORS, DISTRIBUTORS);
    const dIndex = distributors.findIndex((d) => d.id === Number(distributorId));
    if (dIndex === -1) throw new Error('Distributor tidak ditemukan');

    distributors[dIndex].aturan_retur_bulan = Number(bulanBaru);
    setStorage(STORAGE_KEYS.DISTRIBUTORS, distributors);

    // Hitung ulang semua batas retur batch milik distributor ini
    const batches = getStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    const settings = getStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);

    batches.forEach((b) => {
      if (b.distributor_id === Number(distributorId)) {
        b.batas_retur = hitungBatasRetur(b.tanggal_kedaluwarsa, bulanBaru);
        if (!b.batas_retur) {
          b.status_retur = 'tidak_bisa_diretur';
        } else if (new Date(b.batas_retur) < new Date(settings.tanggal_acuan)) {
          b.status_retur = 'lewat_batas';
        } else {
          b.status_retur = 'bisa_diretur';
        }
      }
    });

    setStorage(STORAGE_KEYS.BATCHES, batches);
    return { sukses: true, data: distributors[dIndex] };
  },

  // Kelola profil sarana apotek & kategori secara persisten di browser
  async getProfile() {
    return { ...DEFAULT_PROFILE, ...getStorage(STORAGE_KEYS.PROFILE, {}) };
  },

  async updateProfile(nextProfile) {
    const merged = { ...DEFAULT_PROFILE, ...nextProfile };
    setStorage(STORAGE_KEYS.PROFILE, merged);
    return { sukses: true, data: merged };
  },

  async getKategoriList() {
    return getStorage(STORAGE_KEYS.KATEGORI, DEFAULT_KATEGORI);
  },

  async saveKategoriList(nextList) {
    setStorage(STORAGE_KEYS.KATEGORI, nextList);
    return { sukses: true, data: nextList };
  },

  async addDistributor(newPbf) {
    const distributors = getStorage(STORAGE_KEYS.DISTRIBUTORS, DISTRIBUTORS);
    const updated = [...distributors, newPbf];
    setStorage(STORAGE_KEYS.DISTRIBUTORS, updated);
    return { sukses: true, data: updated };
  },

  async deleteDistributor(id) {
    const distributors = getStorage(STORAGE_KEYS.DISTRIBUTORS, DISTRIBUTORS);
    const updated = distributors.filter((d) => d.id !== Number(id));
    setStorage(STORAGE_KEYS.DISTRIBUTORS, updated);
    return { sukses: true, data: updated };
  },

  // Cadangkan, pulihkan, dan reset data lokal (100% frontend)
  async exportFullBackup() {
    return {
      aplikasi: 'SIMAAF Apotek Asahan Farma',
      versi_skema: 1,
      dieksport_pada: new Date().toISOString(),
      data: {
        profile: { ...DEFAULT_PROFILE, ...getStorage(STORAGE_KEYS.PROFILE, {}) },
        settings: getStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
        distributors: getStorage(STORAGE_KEYS.DISTRIBUTORS, DISTRIBUTORS),
        kategori: getStorage(STORAGE_KEYS.KATEGORI, DEFAULT_KATEGORI),
        batches: getStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES),
        logs: getStorage(STORAGE_KEYS.LOGS, INITIAL_STOCK_LOGS),
        default_page: localStorage.getItem('simaaf_default_page') || 'dashboard',
        privacy_mode: localStorage.getItem('simaaf_privacy_mode') === 'true',
      },
    };
  },

  async importFullBackup(backupJson) {
    const payload = backupJson?.data || backupJson;
    if (!payload || !Array.isArray(payload.batches) || !Array.isArray(payload.distributors)) {
      throw new Error('Format berkas cadangan tidak valid atau rusak.');
    }
    setStorage(STORAGE_KEYS.BATCHES, payload.batches);
    setStorage(STORAGE_KEYS.DISTRIBUTORS, payload.distributors);
    if (payload.settings) setStorage(STORAGE_KEYS.SETTINGS, payload.settings);
    if (payload.profile) setStorage(STORAGE_KEYS.PROFILE, payload.profile);
    if (Array.isArray(payload.kategori)) setStorage(STORAGE_KEYS.KATEGORI, payload.kategori);
    if (Array.isArray(payload.logs)) setStorage(STORAGE_KEYS.LOGS, payload.logs);
    if (payload.default_page) localStorage.setItem('simaaf_default_page', payload.default_page);
    if (typeof payload.privacy_mode === 'boolean') {
      localStorage.setItem('simaaf_privacy_mode', String(payload.privacy_mode));
    }
    return { sukses: true, jumlah_batch: payload.batches.length };
  },

  async resetDemoData() {
    setStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    setStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setStorage(STORAGE_KEYS.DISTRIBUTORS, DISTRIBUTORS);
    setStorage(STORAGE_KEYS.LOGS, INITIAL_STOCK_LOGS);
    setStorage(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    setStorage(STORAGE_KEYS.KATEGORI, DEFAULT_KATEGORI);
    return { sukses: true };
  },
};
