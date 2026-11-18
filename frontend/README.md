# SIMAAF - Frontend Web Application

Aplikasi web frontend untuk pemantauan stok obat, prioritas FEFO, tenggat retur distributor (PBF), penyesuaian stok fisik, dan penjadwalan operasional Apotek Asahan Farma (Kisaran Timur, Asahan, Sumatera Utara).

## Menjalankan di Lokal

```bash
cd frontend
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`.

Build produksi dan verifikasi responsif:

```bash
npm run build
npm run test:responsive
```

## Konfigurasi Lingkungan

Salin `.env.example` menjadi `.env` dan sesuaikan `VITE_API_BASE_URL` saat menghubungkan ke backend REST API. Tanpa konfigurasi backend aktif, layanan pada `src/services/api.js` menggunakan data awal lokal serta penyimpanan browser (`localStorage`) sebagai fallback.

## Akun Uji Coba

- **Admin / Pemilik:** `admin@apotek.local` / `admin123`
- **Karyawan Apotek:** `karyawan@apotek.local` / `karyawan123`

Pengalihan peran cepat juga tersedia pada tombol profil di header aplikasi.

## Modul Antarmuka Utama

- **Dashboard:** Ringkasan aset persediaan, batch berisiko, eksposur PBF, antrean prioritas, dan pemilihan halaman awal.
- **Input Faktur:** Impor dokumen faktur (gambar, CSV, Excel, Word, PDF, TXT, JSON) atau input baris manual sebelum disimpan ke batch inventori.
- **Stok & Batch:** Penjelajahan persediaan berbasis folder (kategori, PBF, kondisi retur, abjad, atau rak kustom) dengan pencarian lintas folder dan daftar batch FEFO per produk.
- **Pengingat & Retur:** Daftar batch mendesak retur, mendekati ED, dan stok menipis beserta kontak WhatsApp PIC distributor dan cetak Berita Acara Pengembalian (BAP).
- **Stok Opname:** Penyesuaian fisik rak satuan maupun impor dokumen stok massal beserta log riwayat audit.
- **Kalender PBF:** Kalender operasional bulanan dengan penanda tanggal merah nasional, batas retur PBF, tanggal ED, catatan harian, dan ekspor `.ics` / `.csv`.
- **Pengaturan:** Profil dan logo apotek, parameter tanggal acuan, aturan retur per distributor, kategori obat, panduan SOP CDOB yang dapat disunting, serta cadangan/pemulihan JSON.
