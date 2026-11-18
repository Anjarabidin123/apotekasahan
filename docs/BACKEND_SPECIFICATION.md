# Spesifikasi Integrasi Frontend - Backend SIMAAF

Dokumen ini merangkum seluruh titik integrasi data pada aplikasi frontend SIMAAF (Apotek Asahan Farma) yang perlu disambungkan dengan layanan backend. Penjelasan difokuskan pada struktur data yang saat ini dikonsumsi antarmuka beserta status fallback lokal di sisi klien.

Basis kode referensi: `frontend/src/services/api.js`, `frontend/src/utils/fileTools.js`, dan modul halaman terkait.

---

## 1. Konvensi Umum Antarmuka

- Basis URL REST API mengacu pada variabel lingkungan `VITE_API_BASE_URL` (misalnya `/api/v1`).
- Pertukaran data menggunakan JSON berformat atribut `snake_case`, dengan tanggal `YYYY-MM-DD` kecuali field log/riwayat yang juga menampilkan jam (`HH:mm`).
- Sesi pengguna memakai header `Authorization: Bearer <token>` dengan peran `admin` dan `karyawan`.

---

## 2. Daftar Kebutuhan Integrasi per Modul

### 2.1 Autentikasi & Sesi
Frontend mengonsumsi objek pengguna `{ id, nama, email, role }`. Antarmuka juga menyediakan pengalihan akun cepat pada tahap demo, sedangkan untuk lingkungan produksi sesi diharapkan berasal dari token login aktif (`/auth/login`, `/auth/me`).

### 2.2 Dashboard & Notifikasi Header
Selain ringkasan aset persediaan (`/dashboard/ringkasan`), header aplikasi memuat daftar notifikasi aktif pada ikon lonceng (`getHeaderNotifications`) yang menggabungkan:
- Batch lewat batas retur (`lewat_batas`)
- Batch mendekati batas retur sesuai `batas_retur_warning_hari`
- Batch mendekati kedaluwarsa sesuai `batas_kedaluwarsa_warning_hari`
- Batch dengan `jumlah_saat_ini <= stok_minimum`

Tiap item notifikasi membutuhkan penanda sumber (`id`, `nomor_batch`, `nama_obat`, `title`, `detail`, `tone`, `targetPage`) agar pengguna dapat diarahkan langsung ke halaman Retur atau Opname.

### 2.3 Penerimaan Faktur & Impor Multi-Format
Pada halaman Input Faktur (`POST /faktur/ekstraksi` dan `POST /faktur/simpan-batch`):
- Frontend mendukung pembacaan dokumen CSV, Excel (`.xlsx/.xls`), Word (`.docx`), PDF, TXT, JSON, serta gambar faktur.
- Apabila petugas mengisi konfigurasi token AI secara lokal pada browser, frontend meneruskan informasi provider/model untuk ekstraksi dokumen; bila tidak, proses dapat memakai konfigurasi AI di server.
- Saat menyimpan baris faktur atau hasil migrasi, item tidak selalu berpasangan dengan `obat_id` dari master awal. Input manual maupun dokumen lama dapat mengirim nama obat dan satuan baru (`nama_obat`, `satuan`) agar otomatis tercatat sebagai produk/batch aktif tanpa tertolak validasi ID master.

### 2.4 Stok, Kategori & Pengelompokan Folder Rak
Halaman Stok & Batch mendukung filter lintas folder (`search`, `distributor_id`, `status_risiko`, `status_retur`) serta pengelompokan batch menjadi level Produk (urut FEFO) berdasarkan kategori, PBF, status, abjad, maupun folder lokasi rak.

Data master kategori obat (`{ id, nama, jenis, stok_minimum }`), daftar folder rak kustom (`simaaf_rack_folders`), serta pemetaan batch ke folder rak (`simaaf_batch_folder_map`) saat ini masih tersimpan di penyimpanan lokal browser dan dapat digabungkan ke entitas inventori bila ingin disinkronkan antar-perangkat.

### 2.5 Pengingat Retur & Dokumen BAP
Halaman Pengingat & Retur mengonsumsi tiga kelompok daftar (`mendesakRetur`, `mendekatiKedaluwarsa`, `stokMenipis`) beserta kontak PIC distributor (`telepon` / WhatsApp) dan data profil sarana apotek untuk kop surat cetak Berita Acara Pengembalian (BAP).

### 2.6 Stok Opname (Satuan & Impor Massal)
Selain penyesuaian per batch (`/penyesuaian-stok`), terdapat mode **Impor Dokumen / Migrasi** (`terapkanOpnameMassal`):
- Menerima array item hasil unggah berkas dengan kecocokan ke `batch_id` atau pencarian berdasarkan `nomor_batch` / `nama_obat`.
- Untuk baris yang cocok dengan batch aktif, jumlah stok diperbarui dan tercatat ke riwayat audit; untuk obat/batch baru yang belum tercatat, sistem membuat batch awal baru sekaligus mencatat log awal.
- Riwayat audit (`getRiwayatPenyesuaian`) menampilkan field `tanggal` (`YYYY-MM-DD`) dan `waktu` (`YYYY-MM-DD HH:mm`).

### 2.7 Kalender Operasional & Catatan Harian
Halaman Kalender menampilkan hari libur nasional Indonesia, hari Minggu, `batas_retur`, dan `tanggal_kedaluwarsa` terhadap `tanggal_acuan`, disertai ekspor `.ics` dan `.csv`.

Fitur pengingat harian per tanggal (`{ id, date, text, category, done, createdAt }`, dengan kategori `merah`, `pbf`, `opname`) saat ini disimpan lokal di `simaaf_calendar_notes`. Jika dibutuhkan sinkronisasi lintas Shift/Admin, data ini perlu dipetakan ke endpoint catatan kalender.

### 2.8 Pengaturan Sistem, Profil, SOP & Cadangan Data
Selain parameter operasional (`tanggal_acuan`, `stok_minimum_default`, `batas_kedaluwarsa_warning_hari`, `batas_retur_warning_hari`) dan perubahan aturan retur per distributor (yang memperbarui ulang `batas_retur` batch terkait), frontend juga mengelola:
- **Profil & Logo Sarana**: `{ nama_apotek, apoteker_pj, nib, sia, sipa, alamat, telepon, whatsapp, logo_url }`
- **Master Distributor PBF**: Tambah dan hapus data PBF (`nama`, `kode`, `aturan_retur_bulan`, `kontak`, `telepon`)
- **Master Kategori Obat**: Tambah dan hapus golongan/kategori beserta stok minimum bawaan
- **Panduan SOP CDOB**: Daftar urutan langkah SOP yang dapat ditambah, diubah, digeser, maupun dihapus (`[{ id, teks }]`)
- **Ekspor / Impor Cadangan JSON**: Bundel struktur data inti apotek untuk pemulihan

---

## 3. Ringkasan State yang Masih Bersifat Lokal (Fallback Klien)

Selama endpoint terkait belum disambungkan ke backend, frontend mempertahankan persistensi sementara pada `localStorage` dengan daftar kunci berikut:

| Kunci `localStorage` | Cakupan Data | Catatan Penggabungan |
|---|---|---|
| `simaaf_profile` & `simaaf_logo_url` | Identitas sarana apotek & gambar logo (data URI/URL) | Perlu penyimpanan profil & berkas/aset logo di backend |
| `simaaf_kategori` | Daftar golongan kategori obat | Dapat digabung ke master kategori / relasi tabel obat |
| `simaaf_sop_steps` | Daftar langkah panduan SOP CDOB | Perlu endpoint konfigurasi teks/urutan SOP per apotek |
| `simaaf_rack_folders` & `simaaf_batch_folder_map` | Daftar folder lokasi rak & relasi ID batch | Opsional disinkronkan sebagai atribut lokasi rak pada batch |
| `simaaf_calendar_notes` | Pengingat & penanda merah harian pada kalender | Opsional disinkronkan sebagai agenda kerja apotek |
| `simaaf_default_page`, `simaaf_privacy_mode`, `simaaf_mobile_queue_first`, `simaaf_stok_groupby`, `simaaf_ai_config` | Preferensi antarmuka pengguna & token AI opsional | Bersifat preferensi per-perangkat; tidak wajib disimpan di server |
