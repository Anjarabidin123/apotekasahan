# SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK (SRS)

## Sistem Manajemen Inventori Apotek Asahan Farma (SIMAAF)

---

| Item               | Keterangan                                      |
| ------------------ | ----------------------------------------------- |
| **Versi Dokumen**  | v1.0                                            |
| **Tanggal Dibuat** | 15 November 2026                                |
| **Terakhir Revisi**| 18 November 2026                                |
| **Penulis**        | Tim Pengembang SIMAAF                           |
| **Klien / PIC**    | Bu Anni (Komisaris, Apotek Asahan Farma)         |
| **Status**         | Draft — Menunggu Persetujuan Klien               |

---

### Catatan Revisi

| Versi | Tanggal          | Penulis              | Perubahan                                                                                                     |
| ----- | ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| 0.1   | 10 November 2026 | Tim Pengembang       | Draft awal setelah sesi wawancara pertama dengan Bu Anni                                                      |
| 0.2   | 12 November 2026 | Tim Pengembang       | Penambahan detail modul batch dan retur berdasarkan observasi lapangan di apotek                               |
| 0.9   | 15 November 2026 | Tim Pengembang       | Revisi menyeluruh, penambahan matriks kebutuhan, penyesuaian prioritas setelah diskusi internal               |
| 1.0   | 18 November 2026 | Tim Pengembang       | Finalisasi draft v1.0 — perbaikan tabel database, penambahan kebutuhan non-fungsional, siap review klien     |

> *Catatan: Versi ini masih berstatus draft dan akan disesuaikan kembali setelah mendapat feedback dari Bu Anni. Beberapa bagian (terutama soal kebijakan retur supplier) mungkin perlu dikonfirmasi ulang karena setiap supplier punya ketentuan yang berbeda-beda.*

---

## BAB 1: PENDAHULUAN

### 1.1 Latar Belakang

Apotek Asahan Farma berlokasi di Jl. Imam Bonjol No.331, Kisaran Timur, Kabupaten Asahan, Sumatera Utara 21211. Apotek ini telah beroperasi sejak tahun 2022 dengan NIB 1210210063257 dan saat ini dikelola oleh Bu Anni selaku Komisaris, dengan total 4 orang karyawan yang terdiri dari apoteker dan tenaga kasir.

Berdasarkan hasil wawancara dengan Bu Anni selaku Komisaris pada 10 November 2026, diperoleh gambaran bahwa operasional pencatatan stok obat di apotek masih dilakukan secara manual menggunakan Microsoft Excel. Yang cukup mengejutkan adalah pembaruan data stok di file Excel tersebut hanya dilakukan kurang lebih setahun sekali — artinya selama berbulan-bulan, data stok yang tercatat di komputer tidak mencerminkan kondisi stok sebenarnya di rak dan gudang.

Dari pengamatan langsung di lapangan yang kami lakukan pada 11 November 2026, kami menemukan beberapa kondisi yang cukup memprihatinkan:

1. **Ketidaksesuaian stok catatan vs stok fisik.** Ketika kami coba mencocokkan beberapa item obat populer antara data Excel dengan jumlah fisik di rak, hampir semuanya tidak cocok. Selisihnya bervariasi — ada yang lebih, ada yang kurang. Bu Anni sendiri mengakui bahwa "sudah lama tidak diupdate" datanya.

2. **Obat kedaluwarsa terbuang percuma.** Ini yang paling menyakitkan secara finansial. Karena tidak ada sistem yang melacak tanggal kedaluwarsa per batch, beberapa obat baru diketahui sudah expired saat ditemukan di gudang atau ketika pelanggan komplain. Sebagian obat yang mendekati kedaluwarsa seharusnya bisa diretur ke supplier, tapi karena terlambat diketahui, sudah melewati batas waktu retur. Bu Anni menyebut kerugian dari obat expired ini "lumayan banyak" meskipun beliau tidak bisa menyebutkan angka pastinya.

3. **Tidak ada peringatan stok menipis.** Beberapa kali apotek kehabisan stok obat yang sering dicari pelanggan, baru diketahui saat pelanggan datang dan obatnya ternyata sudah habis. Ini tentu merugikan dari sisi penjualan dan reputasi apotek.

4. **Tidak ada mekanisme tracking batch.** Obat yang masuk dari supplier tidak dicatat per batch dan per tanggal kedaluwarsa, sehingga prinsip FEFO (First Expired First Out) tidak bisa dijalankan dengan baik.

Melihat kondisi ini, kami mengusulkan pembangunan Sistem Manajemen Inventori Apotek Asahan Farma (SIMAAF) — sebuah aplikasi berbasis web yang dirancang khusus untuk mengatasi permasalahan-permasalahan di atas. Sistem ini nantinya akan membantu apotek mengelola stok secara real-time, melacak batch dan kedaluwarsa, memberikan alert otomatis, serta menghasilkan laporan-laporan yang dibutuhkan untuk pengambilan keputusan.

*Catatan: Fitur tracking kedaluwarsa dan alert otomatis menjadi prioritas utama mengingat kerugian akibat obat kedaluwarsa yang terbuang cukup signifikan bagi usaha skala UMKM seperti Apotek Asahan Farma.*

### 1.2 Tujuan Dokumen

Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SRS) ini disusun dengan tujuan:

- Mendokumentasikan secara lengkap kebutuhan fungsional dan non-fungsional dari sistem SIMAAF, berdasarkan hasil wawancara, observasi, dan analisis yang telah dilakukan.
- Menjadi acuan utama bagi tim pengembang dalam proses desain, pengkodean, dan pengujian sistem.
- Menjadi dasar kesepakatan antara pihak apotek (klien) dengan tim pengembang mengenai fitur dan batasan sistem yang akan dibangun.
- Memudahkan proses evaluasi dan acceptance test setelah sistem selesai dikembangkan.

### 1.3 Ruang Lingkup Sistem

SIMAAF mencakup pengelolaan inventori obat secara menyeluruh untuk Apotek Asahan Farma, meliputi:

- Pencatatan data master obat, supplier, dan kategori
- Pencatatan stok per batch lengkap dengan tanggal kedaluwarsa
- Proses pembelian/penerimaan barang dari supplier
- Proses penjualan dengan prinsip FEFO
- Proses retur obat ke supplier
- Penyesuaian stok (stock opname)
- Sistem alert/notifikasi untuk kedaluwarsa dan stok menipis
- Pelaporan operasional (stok, penjualan, kedaluwarsa, retur, laba rugi sederhana)
- Manajemen pengguna dengan 3 level akses

Yang **tidak** termasuk dalam ruang lingkup versi pertama ini:
- Integrasi dengan sistem BPOM atau e-reporting pemerintah
- Modul akuntansi lengkap (hanya laba rugi sederhana)
- Fitur e-commerce / penjualan online
- Manajemen resep digital secara penuh (hanya pencatatan nomor resep)

### 1.4 Definisi, Akronim, dan Istilah

| Istilah / Akronim | Penjelasan                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| SIMAAF             | Sistem Manajemen Inventori Apotek Asahan Farma                                                    |
| SRS                | Software Requirements Specification / Spesifikasi Kebutuhan Perangkat Lunak                       |
| FEFO               | First Expired First Out — metode pengeluaran barang dimana yang paling dekat kedaluwarsanya keluar duluan |
| Batch              | Sekumpulan obat dari satu kali produksi yang memiliki nomor batch dan tanggal kedaluwarsa yang sama |
| Retur              | Pengembalian barang ke supplier karena alasan tertentu (kedaluwarsa, rusak, dll)                   |
| Stock Opname       | Proses penghitungan fisik stok dan pencocokan dengan data di sistem                               |
| JWT                | JSON Web Token — mekanisme autentikasi berbasis token                                              |
| CRUD               | Create, Read, Update, Delete — operasi dasar pengelolaan data                                      |
| API                | Application Programming Interface                                                                  |
| PIC                | Person In Charge — penanggung jawab                                                                |
| UMKM               | Usaha Mikro, Kecil, dan Menengah                                                                   |
| NIB                | Nomor Induk Berusaha                                                                               |

### 1.5 Referensi

- Hasil wawancara dengan Bu Anni (Komisaris) — 10 November 2026
- Hasil observasi lapangan di Apotek Asahan Farma — 11 November 2026
- IEEE 830-1998: Recommended Practice for Software Requirements Specifications
- Peraturan Menteri Kesehatan tentang Standar Pelayanan Kefarmasian di Apotek
- Standar CDOB (Cara Distribusi Obat yang Baik)

---

## BAB 2: DESKRIPSI UMUM

### 2.1 Perspektif Produk

SIMAAF merupakan sistem baru yang berdiri sendiri (*standalone*), bukan merupakan bagian atau perpanjangan dari sistem yang sudah ada. Saat ini Apotek Asahan Farma tidak menggunakan sistem informasi apapun — semua masih manual via spreadsheet, jadi ini benar-benar memulai dari nol.

Sistem ini dibangun berbasis web sehingga bisa diakses melalui browser di komputer desktop, laptop, maupun tablet. Arsitekturnya menggunakan pendekatan client-server dengan REST API sebagai penghubung antara frontend dan backend.

Beberapa poin penting terkait arsitektur:
- **Frontend**: Aplikasi web yang responsif dan bisa diakses via browser modern
- **Backend**: REST API dengan base URL `/api/v1`
- **Autentikasi**: JWT (JSON Web Token) Bearer Token
- **Database**: Relational database (MySQL/PostgreSQL)
- **Deployment**: Cloud-based agar bisa diakses dari mana saja (penting karena Bu Anni kadang memantau dari rumah)

Format response API yang distandarkan:

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": { },
  "pagination": {
    "halaman": 1,
    "per_halaman": 10,
    "total_data": 50,
    "total_halaman": 5
  }
}
```

### 2.2 Fungsi Utama Sistem

Secara garis besar, SIMAAF terdiri dari 12 modul utama:

| No | Modul                        | Deskripsi Singkat                                                      |
|----|------------------------------|------------------------------------------------------------------------|
| 1  | Autentikasi                  | Login, logout, kelola profil pengguna                                  |
| 2  | Dashboard                    | Ringkasan stok, alert kedaluwarsa, alert stok menipis, grafik penjualan|
| 3  | Master Obat                  | Kelola data obat, kategori, satuan                                     |
| 4  | Manajemen Batch              | Kelola batch per obat, tracking kedaluwarsa                            |
| 5  | Master Supplier              | Kelola data supplier/pemasok                                           |
| 6  | Pembelian / Penerimaan Barang| Pencatatan pembelian dari supplier per batch                           |
| 7  | Penjualan                    | Transaksi penjualan dengan prinsip FEFO                                |
| 8  | Retur ke Supplier            | Pengembalian obat mendekati/sudah kedaluwarsa                          |
| 9  | Penyesuaian Stok             | Stock opname — pencocokan stok fisik vs sistem                         |
| 10 | Laporan                      | Laporan stok, penjualan, kedaluwarsa, retur, laba rugi sederhana       |
| 11 | Notifikasi / Alert           | Peringatan otomatis kedaluwarsa, stok menipis, jadwal retur            |
| 12 | Pengaturan Sistem            | Konfigurasi parameter sistem                                          |

### 2.3 Karakteristik Pengguna

Berdasarkan hasil diskusi dengan Bu Anni, terdapat 3 jenis pengguna yang akan menggunakan sistem ini:

**1. Admin (Pemilik / Komisaris)**
- Diwakili oleh Bu Anni sendiri.
- Memiliki akses penuh ke seluruh modul tanpa terkecuali.
- Bertanggung jawab atas pengaturan sistem, pengelolaan user, dan monitoring keseluruhan operasional.
- Tingkat literasi komputer: menengah — terbiasa menggunakan Excel dan WhatsApp, tapi belum pernah menggunakan sistem informasi berbasis web. Jadi antarmuka harus dibuat sesederhana mungkin.

**2. Apoteker**
- Tenaga profesional yang bertugas mengelola obat, memverifikasi resep, dan mengelola data batch.
- Bisa mengakses modul master obat, batch, pembelian, retur, dan stock opname.
- Biasanya yang paling sering berinteraksi dengan sistem untuk urusan operasional harian.
- Tingkat literasi komputer: menengah ke atas — sudah terbiasa dengan komputer.

**3. Kasir**
- Bertugas melayani penjualan langsung ke pelanggan.
- Hanya bisa mengakses modul penjualan dan melihat stok obat (read-only untuk stok).
- Tidak bisa mengubah data master, batch, atau melakukan stock opname.
- Tingkat literasi komputer: menengah — butuh antarmuka yang simpel dan cepat untuk proses transaksi.

*Catatan: Dengan total 4 karyawan, kemungkinan besar 1 orang berperan sebagai apoteker merangkap beberapa tugas, dan 1-2 orang sebagai kasir. Bu Anni sendiri akan menggunakan akun admin. Jadi awalnya mungkin hanya 3-4 user aktif di sistem.*

### 2.4 Batasan dan Asumsi

**Batasan:**
- Sistem hanya digunakan untuk satu outlet apotek (Apotek Asahan Farma, Kisaran). Tidak ada fitur multi-cabang di versi ini.
- Koneksi internet diperlukan untuk mengakses sistem (tidak ada mode offline).
- Sistem tidak menangani pembayaran elektronik secara langsung — hanya mencatat metode pembayaran (tunai/transfer/QRIS).
- Laporan laba rugi yang disediakan bersifat sederhana, bukan laporan keuangan standar akuntansi.

**Asumsi:**
- Apotek memiliki minimal 1 unit komputer/laptop dan koneksi internet yang stabil.
- Semua pengguna akan diberikan pelatihan dasar sebelum sistem go-live.
- Data obat awal akan diinput secara manual (migrasi dari Excel lama) atau di-import via fitur bulk input.
- Kebijakan retur masing-masing supplier sudah diketahui dan bisa dikonfigurasi di sistem.

### 2.5 Lingkungan Operasi

| Komponen          | Spesifikasi                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| Browser           | Google Chrome (versi terbaru), Mozilla Firefox, Microsoft Edge              |
| Perangkat Klien   | Desktop/Laptop (utama), Tablet (sekunder)                                   |
| Koneksi           | Internet minimal 5 Mbps                                                     |
| Server            | Cloud-based (spesifikasi teknis ditentukan saat fase deployment)            |
| Database          | MySQL 8.x atau PostgreSQL 14+                                              |
| Resolusi Layar    | Minimal 1366 x 768 piksel                                                  |

---

## BAB 3: KEBUTUHAN FUNGSIONAL

Bagian ini menjabarkan kebutuhan fungsional sistem secara detail, dikelompokkan per modul. Setiap kebutuhan memiliki ID unik, nama, deskripsi, prioritas, dan aktor terkait.

Keterangan prioritas:
- **Tinggi**: Harus ada di versi pertama, tanpa fitur ini sistem tidak bisa digunakan
- **Sedang**: Penting tapi bisa ditunda ke iterasi berikutnya jika waktu terbatas
- **Rendah**: Nice-to-have, bisa ditambahkan kemudian

---

### 3.1 Modul Autentikasi (AUTH)

| ID         | Nama                      | Deskripsi                                                                                                                                       | Prioritas | Aktor                    |
| ---------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------ |
| F-AUTH-001 | Login                     | Pengguna dapat masuk ke sistem menggunakan email dan password. Sistem mengembalikan JWT token yang digunakan untuk autentikasi request selanjutnya. | Tinggi    | Admin, Apoteker, Kasir   |
| F-AUTH-002 | Logout                    | Pengguna dapat keluar dari sistem. Token JWT di-invalidasi (atau dihapus dari sisi klien).                                                      | Tinggi    | Admin, Apoteker, Kasir   |
| F-AUTH-003 | Lihat & Edit Profil       | Pengguna dapat melihat dan mengubah data profilnya sendiri (nama, no telepon). Password bisa diubah dengan memasukkan password lama terlebih dulu. | Sedang    | Admin, Apoteker, Kasir   |
| F-AUTH-004 | Manajemen User            | Admin dapat membuat, mengedit, mengaktifkan/menonaktifkan akun pengguna. Admin menentukan role (admin/apoteker/kasir) saat membuat user.          | Tinggi    | Admin                    |
| F-AUTH-005 | Reset Password oleh Admin | Admin dapat mereset password user lain jika user lupa password.                                                                                   | Sedang    | Admin                    |

### 3.2 Modul Dashboard (DASH)

| ID         | Nama                        | Deskripsi                                                                                                                                                                 | Prioritas | Aktor                    |
| ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------ |
| F-DASH-001 | Ringkasan Stok              | Dashboard menampilkan total jumlah item obat aktif, total batch aktif, dan jumlah item yang stoknya di bawah minimum.                                                     | Tinggi    | Admin, Apoteker          |
| F-DASH-002 | Alert Obat Mendekati Kedaluwarsa | Dashboard menampilkan daftar batch obat yang mendekati kedaluwarsa (H-90, H-60, H-30) beserta sisa harinya. Ditampilkan dengan warna berbeda sesuai tingkat urgensi.      | Tinggi    | Admin, Apoteker          |
| F-DASH-003 | Alert Stok Menipis          | Dashboard menampilkan daftar obat yang stoknya sudah di bawah atau sama dengan batas stok minimum yang ditentukan.                                                        | Tinggi    | Admin, Apoteker          |
| F-DASH-004 | Grafik Penjualan            | Dashboard menampilkan grafik penjualan harian/mingguan/bulanan. Admin bisa memilih rentang waktu yang ingin dilihat.                                                       | Sedang    | Admin                    |
| F-DASH-005 | Quick Summary Hari Ini      | Menampilkan ringkasan transaksi hari ini: jumlah transaksi penjualan, total pendapatan hari ini, dan jumlah item terjual.                                                 | Sedang    | Admin, Apoteker, Kasir   |

*Catatan: Bu Anni sangat menekankan bahwa alert kedaluwarsa (F-DASH-002) dan alert stok menipis (F-DASH-003) harus langsung terlihat begitu buka sistem. "Jangan sampai saya harus cari-cari di menu," katanya saat wawancara.*

### 3.3 Modul Master Obat (OBT)

| ID        | Nama                     | Deskripsi                                                                                                                                                                                 | Prioritas | Aktor             |
| --------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------ |
| F-OBT-001 | Tambah Obat              | Pengguna dapat menambahkan data obat baru meliputi: kode obat, nama obat, kategori, satuan, jenis (bebas/bebas terbatas/keras/resep), harga beli terakhir, harga jual, stok minimum, lokasi rak, dan keterangan. | Tinggi    | Admin, Apoteker    |
| F-OBT-002 | Edit Obat                | Pengguna dapat mengubah data obat yang sudah ada. Perubahan harga jual harus tercatat di log.                                                                                             | Tinggi    | Admin, Apoteker    |
| F-OBT-003 | Lihat Daftar Obat        | Menampilkan daftar seluruh obat dengan fitur pencarian (berdasarkan nama/kode), filter (kategori, jenis, status aktif), dan sorting. Mendukung paginasi.                                  | Tinggi    | Admin, Apoteker, Kasir |
| F-OBT-004 | Nonaktifkan Obat         | Obat yang sudah tidak dijual bisa dinonaktifkan (soft delete) agar tidak muncul di transaksi penjualan, tapi datanya tetap tersimpan untuk keperluan laporan historis.                      | Sedang    | Admin, Apoteker    |
| F-OBT-005 | Kelola Kategori Obat     | Admin/Apoteker dapat menambah, mengedit, dan menghapus kategori obat (contoh: antibiotik, analgesik, vitamin, dll).                                                                        | Sedang    | Admin, Apoteker    |
| F-OBT-006 | Kelola Satuan Obat       | Admin/Apoteker dapat menambah dan mengedit satuan obat (tablet, strip, box, botol, tube, sachet, dll).                                                                                     | Sedang    | Admin, Apoteker    |

### 3.4 Modul Manajemen Batch (BATCH)

| ID          | Nama                           | Deskripsi                                                                                                                                                                                              | Prioritas | Aktor             |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------------------ |
| F-BATCH-001 | Tambah Batch Obat              | Pengguna dapat menambahkan data batch baru untuk suatu obat, meliputi: nomor batch, tanggal produksi, tanggal kedaluwarsa, stok awal, supplier asal, harga beli, dan tanggal masuk.                     | Tinggi    | Admin, Apoteker    |
| F-BATCH-002 | Lihat Batch per Obat           | Menampilkan seluruh batch yang dimiliki suatu obat, lengkap dengan stok saat ini, tanggal kedaluwarsa, dan status (aktif/habis/expired).                                                                | Tinggi    | Admin, Apoteker    |
| F-BATCH-003 | Edit Data Batch                | Pengguna dapat mengedit informasi batch (kecuali stok saat ini — stok hanya berubah melalui transaksi pembelian, penjualan, retur, atau stock opname).                                                 | Sedang    | Admin, Apoteker    |
| F-BATCH-004 | Tracking Kedaluwarsa           | Sistem secara otomatis menghitung dan menampilkan sisa hari menuju kedaluwarsa setiap batch. Batch ditandai dengan kode warna: hijau (>90 hari), kuning (60-90 hari), oranye (30-60 hari), merah (<30 hari). | Tinggi    | Admin, Apoteker    |
| F-BATCH-005 | Filter Batch Mendekati Kedaluwarsa | Pengguna dapat memfilter dan menampilkan hanya batch-batch yang mendekati kedaluwarsa berdasarkan rentang hari tertentu (misal: batch yang expired dalam 30/60/90 hari ke depan).                        | Tinggi    | Admin, Apoteker    |

*Catatan: Modul batch ini adalah jantung dari sistem SIMAAF. Tanpa tracking batch yang benar, alert kedaluwarsa dan FEFO tidak akan bisa berjalan. Ini harus dikerjakan dengan sangat teliti.*

### 3.5 Modul Master Supplier (SUP)

| ID        | Nama                  | Deskripsi                                                                                                                                              | Prioritas | Aktor             |
| --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------------------ |
| F-SUP-001 | Tambah Supplier       | Pengguna dapat menambahkan data supplier baru meliputi: kode supplier, nama, alamat, telepon, email, kontak person, dan keterangan.                      | Tinggi    | Admin, Apoteker    |
| F-SUP-002 | Edit Supplier         | Pengguna dapat mengubah data supplier yang sudah ada.                                                                                                    | Tinggi    | Admin, Apoteker    |
| F-SUP-003 | Lihat Daftar Supplier | Menampilkan daftar supplier dengan fitur pencarian dan filter (aktif/nonaktif). Mendukung paginasi.                                                     | Tinggi    | Admin, Apoteker    |
| F-SUP-004 | Nonaktifkan Supplier  | Supplier yang sudah tidak bekerja sama bisa dinonaktifkan. Data historis transaksi dengan supplier tersebut tetap tersimpan.                              | Sedang    | Admin              |

### 3.6 Modul Pembelian / Penerimaan Barang (BEL)

| ID        | Nama                        | Deskripsi                                                                                                                                                                                                                      | Prioritas | Aktor             |
| --------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------------------ |
| F-BEL-001 | Buat Transaksi Pembelian    | Pengguna dapat membuat transaksi pembelian baru dari supplier, meliputi: pilih supplier, nomor faktur, tanggal faktur, tanggal terima, dan catatan. Status awal adalah "draft".                                                  | Tinggi    | Admin, Apoteker    |
| F-BEL-002 | Input Detail Pembelian per Batch | Untuk setiap item dalam pembelian, pengguna harus input: obat, nomor batch, tanggal kedaluwarsa, jumlah, harga satuan, dan diskon item (jika ada). Sistem otomatis membuat record batch baru atau menambah stok ke batch yang sudah ada. | Tinggi    | Admin, Apoteker    |
| F-BEL-003 | Hitung Total Pembelian      | Sistem menghitung subtotal per item, total amount, diskon, PPN, dan grand total secara otomatis.                                                                                                                                | Tinggi    | Admin, Apoteker    |
| F-BEL-004 | Finalisasi Pembelian        | Pembelian yang berstatus "draft" bisa diubah. Setelah difinalisasi (status "selesai"), stok batch otomatis bertambah dan data tidak bisa diubah lagi.                                                                           | Tinggi    | Admin, Apoteker    |
| F-BEL-005 | Lihat Riwayat Pembelian     | Menampilkan daftar transaksi pembelian dengan filter (supplier, rentang tanggal, status). Bisa lihat detail per transaksi.                                                                                                       | Sedang    | Admin, Apoteker    |

*Catatan: Proses input pembelian per batch (F-BEL-002) ini yang paling krusial. Setiap barang masuk HARUS dicatat nomor batch dan tanggal kedaluwarsanya. Bu Anni perlu diberi penjelasan bahwa proses ini memang sedikit lebih lama dari sekadar catat "obat A masuk 100", tapi manfaatnya sangat besar untuk tracking kedaluwarsa.*

### 3.7 Modul Penjualan (JUL)

| ID        | Nama                     | Deskripsi                                                                                                                                                                                                                       | Prioritas | Aktor                    |
| --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------ |
| F-JUL-001 | Buat Transaksi Penjualan | Kasir membuat transaksi penjualan baru. Bisa input nama pelanggan dan nomor resep (keduanya opsional).                                                                                                                          | Tinggi    | Kasir, Apoteker          |
| F-JUL-002 | Input Item Penjualan (FEFO) | Saat kasir memilih obat yang akan dijual, sistem **otomatis memilih batch dengan tanggal kedaluwarsa paling dekat** (prinsip FEFO). Jika stok di batch tersebut tidak mencukupi, sistem otomatis mengambil dari batch berikutnya.   | Tinggi    | Kasir, Apoteker          |
| F-JUL-003 | Hitung Total Penjualan   | Sistem menghitung subtotal per item, total amount, diskon, dan grand total secara otomatis.                                                                                                                                      | Tinggi    | Kasir, Apoteker          |
| F-JUL-004 | Pilih Metode Pembayaran  | Kasir memilih metode pembayaran: tunai, transfer, atau QRIS.                                                                                                                                                                     | Tinggi    | Kasir                    |
| F-JUL-005 | Simpan & Cetak Struk     | Setelah transaksi disimpan, stok batch otomatis berkurang. Kasir bisa mencetak struk penjualan.                                                                                                                                  | Tinggi    | Kasir, Apoteker          |
| F-JUL-006 | Lihat Riwayat Penjualan  | Menampilkan daftar transaksi penjualan dengan filter (rentang tanggal, kasir). Bisa lihat detail per transaksi.                                                                                                                  | Sedang    | Admin, Apoteker, Kasir   |

*Catatan: Implementasi FEFO (F-JUL-002) harus benar-benar otomatis. Kasir tidak perlu tahu batch mana yang diambil — sistem yang mengatur. Ini fitur kunci yang membedakan SIMAAF dari pencatatan manual.*

### 3.8 Modul Retur ke Supplier (RET)

| ID        | Nama                        | Deskripsi                                                                                                                                                                                                                                              | Prioritas | Aktor             |
| --------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------------------ |
| F-RET-001 | Buat Pengajuan Retur        | Pengguna dapat membuat pengajuan retur ke supplier untuk obat-obat yang mendekati atau sudah kedaluwarsa, rusak, atau salah kirim. Retur dibuat per supplier.                                                                                            | Tinggi    | Admin, Apoteker    |
| F-RET-002 | Input Detail Retur per Batch | Untuk setiap item retur, pengguna memilih obat, batch spesifik, jumlah yang diretur, dan alasan (kedaluwarsa/rusak/salah_kirim). Sistem menghitung subtotal berdasarkan harga beli batch tersebut.                                                       | Tinggi    | Admin, Apoteker    |
| F-RET-003 | Alur Status Retur           | Retur memiliki alur status: draft → diajukan → diterima/ditolak. Stok batch hanya berkurang setelah status retur menjadi "diterima" oleh supplier.                                                                                                      | Tinggi    | Admin, Apoteker    |
| F-RET-004 | Jadwal & Reminder Retur     | Sistem menyimpan tanggal jatuh tempo retur (deadline kapan barang harus dikembalikan ke supplier). Sistem mengirim reminder otomatis sebelum jatuh tempo agar retur tidak terlambat diproses.                                                             | Tinggi    | Admin, Apoteker    |
| F-RET-005 | Lihat Riwayat Retur         | Menampilkan daftar retur dengan filter (supplier, status, rentang tanggal). Bisa lihat detail per retur.                                                                                                                                                 | Sedang    | Admin, Apoteker    |

*Catatan: Fitur reminder retur (F-RET-004) ini sangat penting. Berdasarkan cerita Bu Anni, beberapa kali obat yang seharusnya bisa diretur jadi tidak bisa karena terlambat — sudah lewat deadline retur dari supplier. "Rugi dobel," kata beliau — obat tidak bisa dijual, tidak bisa diretur juga.*

### 3.9 Modul Penyesuaian Stok / Stock Opname (STK)

| ID        | Nama                     | Deskripsi                                                                                                                                                                 | Prioritas | Aktor             |
| --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------ |
| F-STK-001 | Buat Penyesuaian Stok    | Pengguna memilih batch obat, lalu input stok fisik hasil hitung manual. Sistem otomatis menghitung selisih antara stok tercatat di sistem dengan stok fisik.                | Tinggi    | Admin, Apoteker    |
| F-STK-002 | Input Alasan Selisih     | Pengguna wajib mengisi alasan jika terdapat selisih stok (misal: barang rusak, kehilangan, salah hitung sebelumnya, dll).                                                 | Tinggi    | Admin, Apoteker    |
| F-STK-003 | Update Stok Otomatis     | Setelah penyesuaian disimpan, stok saat ini di batch yang bersangkutan otomatis diperbarui sesuai stok fisik.                                                              | Tinggi    | Admin, Apoteker    |
| F-STK-004 | Riwayat Penyesuaian Stok | Menampilkan log seluruh penyesuaian stok yang pernah dilakukan, lengkap dengan siapa yang melakukan, kapan, dan selisihnya berapa.                                         | Sedang    | Admin              |

### 3.10 Modul Laporan (LAP)

| ID        | Nama                        | Deskripsi                                                                                                                                                       | Prioritas | Aktor   |
| --------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| F-LAP-001 | Laporan Stok Obat           | Menampilkan laporan stok seluruh obat saat ini (total stok per obat, detail per batch). Bisa difilter per kategori, jenis, atau status. Bisa di-export ke Excel. | Tinggi    | Admin, Apoteker |
| F-LAP-002 | Laporan Penjualan           | Menampilkan laporan penjualan per periode (harian, mingguan, bulanan). Bisa dilihat per obat, per kategori, atau keseluruhan. Bisa di-export ke Excel/PDF.       | Tinggi    | Admin   |
| F-LAP-003 | Laporan Obat Kedaluwarsa    | Menampilkan daftar batch obat yang sudah expired atau akan expired dalam rentang waktu tertentu. Termasuk estimasi nilai kerugian. Bisa di-export.                | Tinggi    | Admin, Apoteker |
| F-LAP-004 | Laporan Retur               | Menampilkan laporan retur per supplier per periode. Mencakup status retur, jumlah, dan nilai. Bisa di-export.                                                    | Sedang    | Admin   |
| F-LAP-005 | Laporan Laba Rugi Sederhana | Menampilkan ringkasan laba rugi sederhana: total penjualan - total harga pokok penjualan (HPP) = laba kotor. Per periode bulanan. Ini bukan laporan akuntansi formal. | Sedang    | Admin   |

*Catatan: Untuk versi awal, laporan laba rugi (F-LAP-005) dibuat sederhana saja. Bu Anni tidak membutuhkan laporan akuntansi yang rumit — beliau cuma ingin tahu "bulan ini untung atau rugi, kira-kira berapa." Kalau nanti butuh yang lebih detail, bisa dikembangkan di versi selanjutnya.*

### 3.11 Modul Notifikasi / Alert (NOT)

| ID        | Nama                              | Deskripsi                                                                                                                                                                              | Prioritas | Aktor             |
| --------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------ |
| F-NOT-001 | Alert Obat Mendekati Kedaluwarsa  | Sistem secara otomatis membuat notifikasi ketika ada batch obat yang memasuki ambang H-90, H-60, dan H-30 hari sebelum kedaluwarsa. Notifikasi ditampilkan di dashboard dan tersimpan di daftar notifikasi. | Tinggi    | Admin, Apoteker    |
| F-NOT-002 | Alert Stok Menipis                | Sistem secara otomatis membuat notifikasi ketika total stok suatu obat (jumlah dari seluruh batch aktif) turun hingga sama dengan atau di bawah batas stok minimum yang dikonfigurasi.    | Tinggi    | Admin, Apoteker    |
| F-NOT-003 | Reminder Jadwal Retur             | Sistem mengirimkan notifikasi pengingat sebelum tanggal jatuh tempo retur ke supplier, agar proses retur tidak terlambat.                                                                | Tinggi    | Admin, Apoteker    |
| F-NOT-004 | Tandai Notifikasi Sudah Dibaca   | Pengguna bisa menandai notifikasi sebagai sudah dibaca. Notifikasi yang belum dibaca ditampilkan dengan indikator (badge angka) di navbar.                                               | Sedang    | Admin, Apoteker    |
| F-NOT-005 | Riwayat Notifikasi               | Pengguna dapat melihat seluruh riwayat notifikasi dengan filter berdasarkan tipe (kedaluwarsa/stok_menipis/retur/sistem) dan status (dibaca/belum dibaca).                                | Sedang    | Admin, Apoteker    |

### 3.12 Modul Pengaturan Sistem (SET)

| ID        | Nama                        | Deskripsi                                                                                                                                                 | Prioritas | Aktor |
| --------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----- |
| F-SET-001 | Pengaturan Ambang Kedaluwarsa | Admin dapat mengubah parameter ambang hari untuk alert kedaluwarsa (default: H-90, H-60, H-30). Misalnya bisa diubah jadi H-120, H-60, H-14.             | Sedang    | Admin |
| F-SET-002 | Pengaturan Informasi Apotek  | Admin dapat mengubah informasi apotek (nama, alamat, telepon) yang akan muncul di struk dan laporan.                                                       | Sedang    | Admin |
| F-SET-003 | Pengaturan Default Stok Minimum | Admin dapat menetapkan nilai default stok minimum yang otomatis terisi saat menambahkan obat baru. Nilai ini bisa di-override per obat.                   | Rendah    | Admin |

---

## BAB 4: KEBUTUHAN NON-FUNGSIONAL

### 4.1 Performa

| ID       | Kebutuhan                                                                                                        | Target                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| NF-01    | Halaman web harus dimuat dalam waktu yang wajar pada koneksi internet standar.                                    | Maks. 3 detik untuk halaman biasa        |
| NF-02    | Proses pencarian obat harus responsif agar tidak menghambat proses penjualan.                                     | Maks. 1 detik untuk hasil pencarian      |
| NF-03    | Sistem harus mampu menangani data obat dan batch dalam jumlah yang realistis untuk apotek skala UMKM.             | Minimal 2.000 item obat, 10.000 batch    |
| NF-04    | Proses generate laporan tidak boleh terlalu lama sehingga pengguna harus menunggu.                                | Maks. 10 detik untuk laporan bulanan     |

### 4.2 Keamanan

| ID       | Kebutuhan                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| NF-05    | Password pengguna harus disimpan dalam bentuk hash (bcrypt atau sejenisnya), tidak boleh plaintext.              |
| NF-06    | Autentikasi menggunakan JWT dengan masa berlaku token yang terbatas (misal 8 jam kerja).                          |
| NF-07    | Setiap endpoint API harus memvalidasi token dan role pengguna (otorisasi).                                        |
| NF-08    | Input dari pengguna harus divalidasi dan disanitasi untuk mencegah SQL injection dan XSS.                         |
| NF-09    | Akses ke modul dibatasi sesuai role pengguna (admin, apoteker, kasir) sebagaimana didefinisikan di kebutuhan fungsional. |

### 4.3 Usability (Kemudahan Penggunaan)

| ID       | Kebutuhan                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| NF-10    | Antarmuka harus sederhana dan intuitif, mengingat pengguna (terutama Bu Anni dan kasir) belum terbiasa dengan sistem informasi berbasis web. |
| NF-11    | Pesan error harus jelas dan dalam Bahasa Indonesia, bukan kode error teknis.                                      |
| NF-12    | Navigasi antar modul harus konsisten — menu sidebar yang selalu terlihat di setiap halaman.                       |
| NF-13    | Proses input penjualan harus bisa dilakukan dengan cepat (minimal langkah) agar tidak menghambat pelayanan ke pelanggan. |

### 4.4 Ketersediaan (Availability)

| ID       | Kebutuhan                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| NF-14    | Sistem harus tersedia selama jam operasional apotek (08:00 - 21:00 WIB, 7 hari seminggu).                        |
| NF-15    | Target uptime minimal 99% per bulan (tidak termasuk jadwal maintenance yang telah diinfokan sebelumnya).          |

### 4.5 Kompatibilitas

| ID       | Kebutuhan                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| NF-16    | Sistem harus berjalan dengan baik di browser Google Chrome, Mozilla Firefox, dan Microsoft Edge versi terbaru.    |
| NF-17    | Tampilan harus responsif untuk layar minimal 1366 x 768 piksel. Responsif di tablet merupakan nilai tambah.       |

### 4.6 Backup & Recovery

| ID       | Kebutuhan                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| NF-18    | Data harus di-backup secara otomatis minimal 1x sehari.                                                          |
| NF-19    | Harus ada mekanisme restore data dari backup jika terjadi kegagalan sistem.                                       |
| NF-20    | Backup disimpan di lokasi terpisah dari server utama (misalnya cloud storage yang berbeda region).                |

---

## BAB 5: MATRIKS KEBUTUHAN

Tabel berikut merangkum seluruh kebutuhan fungsional yang telah didefinisikan, dikelompokkan per modul beserta prioritasnya. Tabel ini bisa digunakan sebagai checklist saat proses pengembangan dan pengujian.

### 5.1 Kebutuhan Fungsional

| ID          | Nama                                     | Modul         | Prioritas |
| ----------- | ---------------------------------------- | ------------- | --------- |
| F-AUTH-001  | Login                                    | Autentikasi   | Tinggi    |
| F-AUTH-002  | Logout                                   | Autentikasi   | Tinggi    |
| F-AUTH-003  | Lihat & Edit Profil                      | Autentikasi   | Sedang    |
| F-AUTH-004  | Manajemen User                           | Autentikasi   | Tinggi    |
| F-AUTH-005  | Reset Password oleh Admin                | Autentikasi   | Sedang    |
| F-DASH-001  | Ringkasan Stok                           | Dashboard     | Tinggi    |
| F-DASH-002  | Alert Obat Mendekati Kedaluwarsa         | Dashboard     | Tinggi    |
| F-DASH-003  | Alert Stok Menipis                       | Dashboard     | Tinggi    |
| F-DASH-004  | Grafik Penjualan                         | Dashboard     | Sedang    |
| F-DASH-005  | Quick Summary Hari Ini                   | Dashboard     | Sedang    |
| F-OBT-001   | Tambah Obat                              | Master Obat   | Tinggi    |
| F-OBT-002   | Edit Obat                                | Master Obat   | Tinggi    |
| F-OBT-003   | Lihat Daftar Obat                        | Master Obat   | Tinggi    |
| F-OBT-004   | Nonaktifkan Obat                         | Master Obat   | Sedang    |
| F-OBT-005   | Kelola Kategori Obat                     | Master Obat   | Sedang    |
| F-OBT-006   | Kelola Satuan Obat                       | Master Obat   | Sedang    |
| F-BATCH-001 | Tambah Batch Obat                        | Manajemen Batch| Tinggi   |
| F-BATCH-002 | Lihat Batch per Obat                     | Manajemen Batch| Tinggi   |
| F-BATCH-003 | Edit Data Batch                          | Manajemen Batch| Sedang   |
| F-BATCH-004 | Tracking Kedaluwarsa                     | Manajemen Batch| Tinggi   |
| F-BATCH-005 | Filter Batch Mendekati Kedaluwarsa       | Manajemen Batch| Tinggi   |
| F-SUP-001   | Tambah Supplier                          | Master Supplier| Tinggi   |
| F-SUP-002   | Edit Supplier                            | Master Supplier| Tinggi   |
| F-SUP-003   | Lihat Daftar Supplier                    | Master Supplier| Tinggi   |
| F-SUP-004   | Nonaktifkan Supplier                     | Master Supplier| Sedang   |
| F-BEL-001   | Buat Transaksi Pembelian                 | Pembelian      | Tinggi   |
| F-BEL-002   | Input Detail Pembelian per Batch         | Pembelian      | Tinggi   |
| F-BEL-003   | Hitung Total Pembelian                   | Pembelian      | Tinggi   |
| F-BEL-004   | Finalisasi Pembelian                     | Pembelian      | Tinggi   |
| F-BEL-005   | Lihat Riwayat Pembelian                  | Pembelian      | Sedang   |
| F-JUL-001   | Buat Transaksi Penjualan                 | Penjualan      | Tinggi   |
| F-JUL-002   | Input Item Penjualan (FEFO)              | Penjualan      | Tinggi   |
| F-JUL-003   | Hitung Total Penjualan                   | Penjualan      | Tinggi   |
| F-JUL-004   | Pilih Metode Pembayaran                  | Penjualan      | Tinggi   |
| F-JUL-005   | Simpan & Cetak Struk                     | Penjualan      | Tinggi   |
| F-JUL-006   | Lihat Riwayat Penjualan                  | Penjualan      | Sedang   |
| F-RET-001   | Buat Pengajuan Retur                     | Retur          | Tinggi   |
| F-RET-002   | Input Detail Retur per Batch             | Retur          | Tinggi   |
| F-RET-003   | Alur Status Retur                        | Retur          | Tinggi   |
| F-RET-004   | Jadwal & Reminder Retur                  | Retur          | Tinggi   |
| F-RET-005   | Lihat Riwayat Retur                      | Retur          | Sedang   |
| F-STK-001   | Buat Penyesuaian Stok                    | Penyesuaian Stok| Tinggi  |
| F-STK-002   | Input Alasan Selisih                     | Penyesuaian Stok| Tinggi  |
| F-STK-003   | Update Stok Otomatis                     | Penyesuaian Stok| Tinggi  |
| F-STK-004   | Riwayat Penyesuaian Stok                 | Penyesuaian Stok| Sedang  |
| F-LAP-001   | Laporan Stok Obat                        | Laporan        | Tinggi   |
| F-LAP-002   | Laporan Penjualan                        | Laporan        | Tinggi   |
| F-LAP-003   | Laporan Obat Kedaluwarsa                 | Laporan        | Tinggi   |
| F-LAP-004   | Laporan Retur                            | Laporan        | Sedang   |
| F-LAP-005   | Laporan Laba Rugi Sederhana              | Laporan        | Sedang   |
| F-NOT-001   | Alert Obat Mendekati Kedaluwarsa         | Notifikasi     | Tinggi   |
| F-NOT-002   | Alert Stok Menipis                       | Notifikasi     | Tinggi   |
| F-NOT-003   | Reminder Jadwal Retur                    | Notifikasi     | Tinggi   |
| F-NOT-004   | Tandai Notifikasi Sudah Dibaca           | Notifikasi     | Sedang   |
| F-NOT-005   | Riwayat Notifikasi                       | Notifikasi     | Sedang   |
| F-SET-001   | Pengaturan Ambang Kedaluwarsa            | Pengaturan     | Sedang   |
| F-SET-002   | Pengaturan Informasi Apotek              | Pengaturan     | Sedang   |
| F-SET-003   | Pengaturan Default Stok Minimum          | Pengaturan     | Rendah   |

### 5.2 Ringkasan Prioritas

| Prioritas | Jumlah | Persentase |
| --------- | ------ | ---------- |
| Tinggi    | 37     | 66%        |
| Sedang    | 19     | 34%        |
| Rendah    | 1      | <2%        |
| **Total** | **57** | **100%**   |

### 5.3 Kebutuhan Non-Fungsional

| ID    | Kategori         | Deskripsi Singkat                              |
| ----- | ---------------- | ---------------------------------------------- |
| NF-01 | Performa         | Load time halaman maks. 3 detik                |
| NF-02 | Performa         | Pencarian obat maks. 1 detik                   |
| NF-03 | Performa         | Kapasitas 2.000 obat, 10.000 batch             |
| NF-04 | Performa         | Generate laporan maks. 10 detik                |
| NF-05 | Keamanan         | Password di-hash (bcrypt)                      |
| NF-06 | Keamanan         | JWT dengan masa berlaku terbatas               |
| NF-07 | Keamanan         | Validasi token & role di setiap endpoint       |
| NF-08 | Keamanan         | Sanitasi input (anti SQL injection/XSS)        |
| NF-09 | Keamanan         | Pembatasan akses sesuai role                   |
| NF-10 | Usability        | Antarmuka sederhana dan intuitif               |
| NF-11 | Usability        | Pesan error dalam Bahasa Indonesia             |
| NF-12 | Usability        | Navigasi konsisten (sidebar)                   |
| NF-13 | Usability        | Proses penjualan cepat (minimal langkah)       |
| NF-14 | Ketersediaan     | Tersedia 08:00-21:00 WIB, 7 hari/minggu       |
| NF-15 | Ketersediaan     | Uptime 99% per bulan                           |
| NF-16 | Kompatibilitas   | Chrome, Firefox, Edge terbaru                  |
| NF-17 | Kompatibilitas   | Responsif minimal 1366x768                     |
| NF-18 | Backup & Recovery| Backup otomatis 1x/hari                        |
| NF-19 | Backup & Recovery| Mekanisme restore dari backup                  |
| NF-20 | Backup & Recovery| Backup di lokasi terpisah                      |

---

## LAMPIRAN

### A. Informasi Kontak Klien

| Item         | Detail                                             |
| ------------ | -------------------------------------------------- |
| Nama PIC     | Bu Anni (Komisaris)                                |
| WhatsApp     | +62811652751                                       |
| Email        | annisalim@gmail.com                                |
| Alamat       | Jl. Imam Bonjol No.331, Kisaran Timur, Kab. Asahan, Sumatera Utara 21211 |
| NIB          | 1210210063257                                      |

### B. Skema Database (Ringkasan)

Berikut adalah daftar tabel database yang akan digunakan dalam sistem SIMAAF. Detail kolom lengkap tersedia di dokumen desain database terpisah.

1. **users** — Data pengguna sistem (id, nama, email, password_hash, role, no_telepon, is_active, created_at, updated_at)
2. **kategori_obat** — Kategori obat (id, nama_kategori, keterangan, created_at)
3. **satuan** — Satuan obat (id, nama_satuan, created_at)
4. **suppliers** — Data supplier (id, kode_supplier, nama, alamat, telepon, email, kontak_person, keterangan, is_active, created_at, updated_at)
5. **obat** — Data master obat (id, kode_obat, nama_obat, kategori_id, satuan_id, jenis, harga_beli_terakhir, harga_jual, stok_minimum, rak_lokasi, keterangan, is_active, created_at, updated_at)
6. **batch_obat** — Data batch per obat (id, obat_id, nomor_batch, tanggal_produksi, tanggal_kedaluwarsa, stok_awal, stok_saat_ini, supplier_id, harga_beli, tanggal_masuk, keterangan, created_at, updated_at)
7. **pembelian** — Transaksi pembelian header (id, kode_pembelian, supplier_id, nomor_faktur, tanggal_faktur, tanggal_terima, total_amount, diskon, ppn, grand_total, status, catatan, user_id, created_at, updated_at)
8. **detail_pembelian** — Detail item pembelian (id, pembelian_id, obat_id, batch_id, jumlah, harga_satuan, diskon_item, subtotal)
9. **penjualan** — Transaksi penjualan header (id, kode_penjualan, tanggal, nama_pelanggan, no_resep, total_amount, diskon, grand_total, metode_bayar, user_id, catatan, created_at)
10. **detail_penjualan** — Detail item penjualan (id, penjualan_id, obat_id, batch_id, jumlah, harga_satuan, subtotal)
11. **retur** — Transaksi retur header (id, kode_retur, supplier_id, tanggal_retur, tanggal_jatuh_tempo_retur, status, total_amount, catatan, user_id, created_at, updated_at)
12. **detail_retur** — Detail item retur (id, retur_id, obat_id, batch_id, jumlah, alasan, subtotal)
13. **penyesuaian_stok** — Log stock opname (id, kode_penyesuaian, batch_id, stok_tercatat, stok_fisik, selisih, alasan, user_id, created_at)
14. **notifikasi** — Data notifikasi (id, judul, pesan, tipe, referensi_id, referensi_tipe, is_read, user_id, created_at)
15. **pengaturan** — Konfigurasi sistem (id, kunci, nilai, keterangan, updated_at)

### C. Catatan Penutup dari Tim Pengembang

Dokumen ini masih berstatus **draft v1.0** dan akan difinalisasi setelah mendapat persetujuan dari Bu Anni selaku Komisaris dan PIC dari Apotek Asahan Farma. Beberapa poin yang masih perlu dikonfirmasi:

1. **Kebijakan retur per supplier** — setiap supplier punya aturan retur yang berbeda (ada yang mau terima retur H-30 sebelum expired, ada yang H-90). Perlu data lebih detail dari Bu Anni.
2. **Jumlah kategori dan item obat** — untuk estimasi data awal yang perlu di-input saat go-live.
3. **Kebutuhan cetak struk** — apakah menggunakan printer thermal 58mm atau 80mm, atau cukup cetak di kertas A4.
4. **Jadwal pelatihan** — perlu disepakati kapan pelatihan untuk 4 karyawan dilakukan sebelum go-live.

Untuk pertanyaan dan feedback, silakan hubungi Tim Pengembang SIMAAF atau langsung koordinasi dengan Bu Anni melalui kontak yang tertera di Lampiran A.

---

*Dokumen ini disiapkan oleh Tim Pengembang SIMAAF — November 2026*
