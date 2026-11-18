// Dataset sintetis & konfigurasi awal SIMAAF
// Mengacu pada spesifikasi proyek Capstone Asah 2026 (Apotek Asahan Farma)

export const DISTRIBUTORS = [
  { id: 1, kode: 'DST-001', nama: 'PBF Anugrah Argon Medica (AAM) Medan', aturan_retur_bulan: 6, telepon: '061-7865431', kontak: 'Budi Santoso' },
  { id: 2, kode: 'DST-002', nama: 'PBF Kimia Farma Trading & Distribution', aturan_retur_bulan: 3, telepon: '061-8451290', kontak: 'Rina Wijaya' },
  { id: 3, kode: 'DST-003', nama: 'PBF Bina Farma Medan', aturan_retur_bulan: 1, telepon: '061-7362091', kontak: 'Hendro' },
  { id: 4, kode: 'DST-004', nama: 'PBF Enseval Putera Megatrading', aturan_retur_bulan: 3, telepon: '061-7862211', kontak: 'Siti Rahma' },
  { id: 5, kode: 'DST-005', nama: 'PBF Merapi Utama Pharma', aturan_retur_bulan: 3, telepon: '061-6623098', kontak: 'Agus Salim' },
  { id: 6, kode: 'DST-006', nama: 'PBF Antar Mitra Sembada (AMS)', aturan_retur_bulan: 2, telepon: '061-8461900', kontak: 'Dedi Kurniawan' },
  { id: 7, kode: 'DST-007', nama: 'PBF Sinar Harapan Farma', aturan_retur_bulan: 0, telepon: '061-7341829', kontak: 'Iwan' }, // 0 = tidak terima retur
  { id: 8, kode: 'DST-008', nama: 'PBF Mensa Binasukses', aturan_retur_bulan: 6, telepon: '061-8456711', kontak: 'Dewi Lestari' },
  { id: 9, kode: 'DST-009', nama: 'PBF Dos Ni Roha Medan', aturan_retur_bulan: 3, telepon: '061-7864455', kontak: 'Ferry' },
  { id: 10, kode: 'DST-010', nama: 'PBF Parit Padang Global', aturan_retur_bulan: 3, telepon: '061-6612980', kontak: 'Joko' },
  { id: 11, kode: 'DST-011', nama: 'PBF Penta Valent Medan', aturan_retur_bulan: 6, telepon: '061-7869901', kontak: 'Yusuf' },
  { id: 12, kode: 'DST-012', nama: 'PBF Tempo Scan Pacific Medan', aturan_retur_bulan: 3, telepon: '061-7369988', kontak: 'Rudy' },
  { id: 13, kode: 'DST-013', nama: 'PBF Kebayoran Pharma Medan', aturan_retur_bulan: 2, telepon: '061-8463321', kontak: 'Linda' },
  { id: 14, kode: 'DST-014', nama: 'PBF Tri Sapta Jaya Medan', aturan_retur_bulan: 1, telepon: '061-7861199', kontak: 'Hasan' }
];

export const INITIAL_OBAT = [
  { id: 1, kode: 'OBT-001', nama: 'Amoxicillin 500mg', kategori: 'Antibiotik', satuan: 'box', stok_minimum: 15, harga_jual: 55000 },
  { id: 2, kode: 'OBT-002', nama: 'Paracetamol Sirup 60ml', kategori: 'Analgesik / Antipiretik', satuan: 'botol', stok_minimum: 20, harga_jual: 24000 },
  { id: 3, kode: 'OBT-003', nama: 'Cefixime 100mg Kapsul', kategori: 'Antibiotik', satuan: 'box', stok_minimum: 10, harga_jual: 95000 },
  { id: 4, kode: 'OBT-004', nama: 'Asam Mefenamat 500mg', kategori: 'Analgesik / NSAID', satuan: 'strip', stok_minimum: 25, harga_jual: 8000 },
  { id: 5, kode: 'OBT-005', nama: 'Cetirizine 10mg Tablet', kategori: 'Antihistamin', satuan: 'box', stok_minimum: 15, harga_jual: 42000 },
  { id: 6, kode: 'OBT-006', nama: 'Antasida Doen Tablet Kunyah', kategori: 'Antasida / Lambung', satuan: 'box', stok_minimum: 20, harga_jual: 18000 },
  { id: 7, kode: 'OBT-007', nama: 'Omeprazole 20mg Kapsul', kategori: 'PPI / Lambung', satuan: 'box', stok_minimum: 12, harga_jual: 68000 },
  { id: 8, kode: 'OBT-008', nama: 'Metformin 500mg Tablet', kategori: 'Antidiabetes', satuan: 'box', stok_minimum: 30, harga_jual: 35000 },
  { id: 9, kode: 'OBT-009', nama: 'Amlodipine 10mg Tablet', kategori: 'Antihipertensi', satuan: 'box', stok_minimum: 20, harga_jual: 48000 },
  { id: 10, kode: 'OBT-010', nama: 'Salbutamol 2mg Tablet', kategori: 'Asma / Bronkodilator', satuan: 'strip', stok_minimum: 15, harga_jual: 6500 },
  { id: 11, kode: 'OBT-011', nama: 'Dexamethasone 0.5mg', kategori: 'Kortikosteroid', satuan: 'box', stok_minimum: 20, harga_jual: 22000 },
  { id: 12, kode: 'OBT-012', nama: 'Salep Mata Kloramfenikol 1%', kategori: 'Antibiotik Topikal', satuan: 'tube', stok_minimum: 10, harga_jual: 16500 },
  { id: 13, kode: 'OBT-013', nama: 'Betamethasone Krim 5g', kategori: 'Kortikosteroid Topikal', satuan: 'tube', stok_minimum: 12, harga_jual: 14000 },
  { id: 14, kode: 'OBT-014', nama: 'Vitamin C 500mg Tablet', kategori: 'Suplemen / Vitamin', satuan: 'botol', stok_minimum: 20, harga_jual: 45000 },
  { id: 15, kode: 'OBT-015', nama: 'Curcuma Plus Sirup', kategori: 'Suplemen Anak', satuan: 'botol', stok_minimum: 15, harga_jual: 28000 },
  { id: 16, kode: 'OBT-016', nama: 'OBH Tropica Plus Anak 60ml', kategori: 'Obat Batuk & Flu', satuan: 'botol', stok_minimum: 15, harga_jual: 26000 },
  { id: 17, kode: 'OBT-017', nama: 'Ibuprofen 400mg Tablet', kategori: 'Analgesik / NSAID', satuan: 'strip', stok_minimum: 20, harga_jual: 9000 },
  { id: 18, kode: 'OBT-018', nama: 'Loperamide 2mg Tablet', kategori: 'Antidiare', satuan: 'box', stok_minimum: 15, harga_jual: 29000 }
];

export const INITIAL_BATCHES = [
  {
    id: 101,
    obat_id: 3,
    nama_obat: 'Cefixime 100mg Kapsul',
    distributor_id: 4,
    nama_distributor: 'PBF Enseval Putera Megatrading',
    nomor_batch: 'CFX-2601-A',
    tanggal_masuk: '2026-01-15',
    tanggal_kedaluwarsa: '2027-02-15',
    batas_retur: '2026-11-15', // 3 bulan sebelum exp
    jumlah_awal: 40,
    jumlah_saat_ini: 14,
    harga_beli_satuan: 78000,
    nilai_total: 1092000,
    skor_risiko: 0.88,
    status_risiko: 'tinggi',
    status_retur: 'bisa_diretur',
    keterangan: 'Tenggat retur tinggal 15 hari dari tanggal acuan'
  },
  {
    id: 102,
    obat_id: 12,
    nama_obat: 'Salep Mata Kloramfenikol 1%',
    distributor_id: 6,
    nama_distributor: 'PBF Antar Mitra Sembada (AMS)',
    nomor_batch: 'KLM-2509-X',
    tanggal_masuk: '2025-09-10',
    tanggal_kedaluwarsa: '2026-11-20',
    batas_retur: '2026-09-20', // 2 bulan sebelum exp (sudah lewat dari tanggal acuan 31 Okt)
    jumlah_awal: 25,
    jumlah_saat_ini: 6,
    harga_beli_satuan: 12500,
    nilai_total: 75000,
    skor_risiko: 0.96,
    status_risiko: 'tinggi',
    status_retur: 'lewat_batas',
    keterangan: 'Batas retur terlewat! Segera pisahkan agar tidak terjual.'
  },
  {
    id: 103,
    obat_id: 1,
    nama_obat: 'Amoxicillin 500mg',
    distributor_id: 3,
    nama_distributor: 'PBF Bina Farma Medan',
    nomor_batch: 'AMX-2604-B',
    tanggal_masuk: '2026-04-12',
    tanggal_kedaluwarsa: '2026-12-05',
    batas_retur: '2026-11-05', // 1 bulan sebelum exp
    jumlah_awal: 60,
    jumlah_saat_ini: 22,
    harga_beli_satuan: 42000,
    nilai_total: 924000,
    skor_risiko: 0.82,
    status_risiko: 'tinggi',
    status_retur: 'bisa_diretur',
    keterangan: 'Aturan PBF Bina Farma ketat (1 bulan sebelum exp)'
  },
  {
    id: 104,
    obat_id: 2,
    nama_obat: 'Paracetamol Sirup 60ml',
    distributor_id: 2,
    nama_distributor: 'PBF Kimia Farma Trading & Distribution',
    nomor_batch: 'PCT-2605-1',
    tanggal_masuk: '2026-05-18',
    tanggal_kedaluwarsa: '2027-05-18',
    batas_retur: '2027-02-18',
    jumlah_awal: 50,
    jumlah_saat_ini: 34,
    harga_beli_satuan: 18500,
    nilai_total: 629000,
    skor_risiko: 0.24,
    status_risiko: 'rendah',
    status_retur: 'bisa_diretur',
    keterangan: 'Stok perputaran lancar'
  },
  {
    id: 105,
    obat_id: 7,
    nama_obat: 'Omeprazole 20mg Kapsul',
    distributor_id: 5,
    nama_distributor: 'PBF Merapi Utama Pharma',
    nomor_batch: 'OMZ-2606-K',
    tanggal_masuk: '2026-06-02',
    tanggal_kedaluwarsa: '2027-01-30',
    batas_retur: '2026-10-30', // tepat batas hari kemarin
    jumlah_awal: 30,
    jumlah_saat_ini: 11,
    harga_beli_satuan: 54000,
    nilai_total: 594000,
    skor_risiko: 0.74,
    status_risiko: 'sedang',
    status_retur: 'lewat_batas',
    keterangan: 'Batas retur baru saja terlewat pada tanggal acuan'
  },
  {
    id: 106,
    obat_id: 16,
    nama_obat: 'OBH Tropica Plus Anak 60ml',
    distributor_id: 8,
    nama_distributor: 'PBF Mensa Binasukses',
    nomor_batch: 'OBH-2602-C',
    tanggal_masuk: '2026-02-20',
    tanggal_kedaluwarsa: '2027-06-20',
    batas_retur: '2026-12-20', // 6 bulan sebelum exp
    jumlah_awal: 36,
    jumlah_saat_ini: 19,
    harga_beli_satuan: 20500,
    nilai_total: 389500,
    skor_risiko: 0.65,
    status_risiko: 'sedang',
    status_retur: 'bisa_diretur',
    keterangan: 'Mendekati batas retur 50 hari lagi'
  },
  {
    id: 107,
    obat_id: 5,
    nama_obat: 'Cetirizine 10mg Tablet',
    distributor_id: 1,
    nama_distributor: 'PBF Anugrah Argon Medica (AAM) Medan',
    nomor_batch: 'CTZ-2603-9',
    tanggal_masuk: '2026-03-05',
    tanggal_kedaluwarsa: '2027-09-05',
    batas_retur: '2027-03-05',
    jumlah_awal: 80,
    jumlah_saat_ini: 52,
    harga_beli_satuan: 33000,
    nilai_total: 1716000,
    skor_risiko: 0.15,
    status_risiko: 'rendah',
    status_retur: 'bisa_diretur',
    keterangan: 'Kondisi stok dan perputaran sangat aman'
  },
  {
    id: 108,
    obat_id: 8,
    nama_obat: 'Metformin 500mg Tablet',
    distributor_id: 7,
    nama_distributor: 'PBF Sinar Harapan Farma',
    nomor_batch: 'MTF-2512-H',
    tanggal_masuk: '2025-12-10',
    tanggal_kedaluwarsa: '2026-12-15',
    batas_retur: null, // PBF 7 aturan 0 bulan (tidak terima retur)
    jumlah_awal: 100,
    jumlah_saat_ini: 8, // di bawah minimum (30)
    harga_beli_satuan: 28000,
    nilai_total: 224000,
    skor_risiko: 0.90,
    status_risiko: 'tinggi',
    status_retur: 'tidak_bisa_diretur',
    keterangan: 'Distributor tidak menerima retur barang. Stok menipis!'
  }
];

export const INITIAL_SETTINGS = {
  tanggal_acuan: '2026-10-31',
  stok_minimum_default: 10,
  batas_kedaluwarsa_warning_hari: 90,
  batas_retur_warning_hari: 30
};

export const INITIAL_STOCK_LOGS = [
  {
    id: 1,
    batch_id: 101,
    nama_obat: 'Cefixime 100mg Kapsul',
    nomor_batch: 'CFX-2601-A',
    jumlah_sebelum: 16,
    jumlah_sesudah: 14,
    selisih: -2,
    alasan: 'Pemeriksaan rutin rak antibiotik, 2 strip kemasan sobek/rusak',
    petugas: 'Karyawan',
    tanggal: '2026-10-28 09:30'
  },
  {
    id: 2,
    batch_id: 104,
    nama_obat: 'Paracetamol Sirup 60ml',
    nomor_batch: 'PCT-2605-1',
    jumlah_sebelum: 35,
    jumlah_sesudah: 34,
    selisih: -1,
    alasan: '1 botol pecah di rak sirup anak',
    petugas: 'Karyawan',
    tanggal: '2026-10-25 14:15'
  }
];

// Contoh template ekstraksi faktur dummy untuk demonstrasi fitur AI
export const SAMPLE_FAKTUR_EXTRACTION = {
  nomor_faktur: 'FAK-2026/10/089-AAM',
  distributor_id: 1,
  nama_distributor: 'PBF Anugrah Argon Medica (AAM) Medan',
  tanggal_faktur: '2026-10-18',
  items: [
    {
      obat_id: 1,
      nama_obat: 'Amoxicillin 500mg',
      nomor_batch: 'AMX-2610-Z1',
      tanggal_kedaluwarsa: '2027-10-18',
      jumlah: 30,
      harga_beli_satuan: 42000,
      satuan: 'box'
    },
    {
      obat_id: 4,
      nama_obat: 'Asam Mefenamat 500mg',
      nomor_batch: 'AMF-2609-Y4',
      tanggal_kedaluwarsa: '2027-08-30',
      jumlah: 50,
      harga_beli_satuan: 6500,
      satuan: 'strip'
    },
    {
      obat_id: 14,
      nama_obat: 'Vitamin C 500mg Tablet',
      nomor_batch: 'VTC-2610-K8',
      tanggal_kedaluwarsa: '2028-02-10',
      jumlah: 20,
      harga_beli_satuan: 36000,
      satuan: 'botol'
    }
  ]
};
