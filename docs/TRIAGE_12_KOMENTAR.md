# Triage 12 Komentar Review & Jawaban Tim Backend (`apotekasahan` / SIMAAF)

Dokumen ini memetakan seluruh **12 komentar review (#1–#12)** pada aplikasi **SIMAAF (Apotek Asahan Farma)** ke dalam cakupan **Frontend** dan **Backend**, menjelaskan alasan teknis pemisahannya, serta menyediakan **jawaban siap pakai berbahasa Indonesia** untuk tim backend.

> **Catatan Ruang Lingkup Repositori:**
> Saat ini repositori `apotekasahan` hanya berisi kode `frontend/` (React + Vite + Tailwind CSS) dan dokumentasi spesifikasi di `docs/`. Tidak ada direktori `backend/` di dalam repositori ini, dan `frontend/src/services/api.js` berjalan pada mode simulasi lokal (`mockData.js` + `localStorage`). Oleh karena itu, seluruh item yang bersifat **Backend** tidak diubah di repositori ini dan diserahkan ke tim backend menggunakan panduan jawaban di bawah.

---

## Ringkasan Pemetaan 12 Komentar (#1–#12)

| No | Ringkasan Komentar Review | Cakupan | Status di Repo Ini | Keterangan Singkat |
|---|---|---|---|---|
| **#1** | Konsistensi tema hijau emerald & ilustrasi SVG kustom (serta perbaikan tampilan Login & sisa warna biru) | **Frontend** | **Dikerjakan (Frontend)** | Seluruh komponen menggunakan palet `emerald-*`/`teal-*`, SVG apotek dipertahankan & diperkaya, sisa kelas `blue-*` dibersihkan, dan penghapusan badge `"Mode Lokal"` di Faktur dipertahankan. |
| **#2** | Tombol `Kembali` pada semua halaman kecuali Login dan Dashboard utama | **Frontend** | **Dikerjakan (Frontend)** | Riwayat navigasi `pageHistory` di `App.jsx` + tombol `Kembali` global di `Header.jsx` aktif untuk seluruh halaman selain Login dan Dashboard. |
| **#3** | Migrasi Gemini API Key keluar dari browser ke proxy backend / FastAPI | **Backend** (+ tetap pertahankan BYOK opsional di Frontend) | **Dilewati (Backend)** | Kunci API produksi tidak boleh ditanam di frontend (`VITE_*`). Alur kunci opsional per-perangkat (`simaaf_ai_config` di `utils/fileTools.js`) dibiarkan utuh untuk mode demo mandiri. |
| **#4** | Hapus seluruh field, label, dan default `NIB` | **Frontend** (+ skema profil Backend) | **Dikerjakan (Frontend)** | Dihapus dari `Sidebar`, `BeritaAcaraModal`, `PengaturanPage`, dan `DEFAULT_PROFILE` di `api.js`. |
| **#5** | Tambahkan label `"Data Simulasi"` pada tampilan data tiruan & ganti metrik hardcoded `"96.4% Sesuai"`, serta pensiunkan `mockData.js` saat produksi | **Frontend + Backend** | **Dikerjakan (Frontend)** / **Dilewati (Backend)** | Label `"Data Simulasi"` ditambahkan pada tampilan simulasi & metrik Opname dihitung dinamis; pensiun total `mockData.js` menunggu koneksi API backend. |
| **#6** | Hapus klaim kepatuhan `CDOB` dan `BPOM` yang belum terverifikasi | **Frontend** | **Dikerjakan (Frontend)** | Diganti menjadi label operasional netral di `LoginPage`, `BeritaAcaraModal`, `PengingatReturPage`, dan `PengaturanPage`. |
| **#7** | Pada batch `lewat_batas`: hapus tombol retur, ganti dengan `Prioritas Jual` (belum ED) atau `Catat Dibuang` (sudah ED) | **Frontend + Backend** | **Dikerjakan (Frontend)** / **Dilewati (Backend)** | Sudah diterapkan di `InventoriBatchPage`, `PengingatReturPage`, `DashboardPage` + `api.js` lokal; backend perlu endpoint & kolom DB terkait. |
| **#8** | Tombol `Proses Retur` dan `Retur` menjalankan alur pencatatan retur, bukan sekadar pindah halaman atau cetak | **Frontend + Backend** | **Dikerjakan (Frontend)** / **Dilewati (Backend)** | Modal konfirmasi retur & tombol `"Konfirmasi & Catat Retur"` di BAP mencatat retur ke state; backend perlu endpoint `POST /api/v1/retur`. |
| **#9** | Pencatatan retur/pembuangan menurunkan stok, menandai status batch, dan menghapus batch selesai/stok-0 dari pengingat & notifikasi | **Frontend (State Browser) + Backend (DB Atomik)** | **Dikerjakan (Frontend)** / **Dilewati (Backend)** | State browser (`simaaf_batches`, `simaaf_return_logs`, `simaaf_disposal_logs`, `simaaf_stock_logs`) sudah sinkron otomatis; backend perlu transaksi atomik di PostgreSQL. |
| **#10** | Tambahkan tab `Lewat Batas Retur` pada halaman Retur & endpoint `pengingat` | **Frontend + Backend** | **Dikerjakan (Frontend)** / **Dilewati (Backend)** | Tab & kartu ringkasan `Lewat Batas Retur` aktif di `PengingatReturPage` & `DashboardPage`; backend perlu mengembalikan daftar `lewat_batas_retur` pada `GET /api/v1/pengingat`. |
| **#11** | Seragamkan 4 kategori status di semua halaman: `Bisa Diretur`, `Lewat Batas Retur`, `Dekat ED`, `Stok Tipis` | **Frontend + Backend** | **Dikerjakan (Frontend)** / **Dilewati (Backend)** | Diseragamkan di `api.getPengingat()`, `DashboardPage`, `PengingatReturPage`, dan `InventoriBatchPage`; backend perlu menyelaraskan enum & respons API. |
| **#12** | Aturan saling eksklusif (*mutual exclusion*): satu batch tidak boleh menampilkan `Lewat Batas` sekaligus `Risiko Tinggi` | **Frontend + Backend** | **Dikerjakan (Frontend)** / **Dilewati (Backend)** | Frontend menekan badge `Risiko Tinggi` whenever `status_retur === 'lewat_batas'`; backend perlu menjaga `status_risiko` konsisten pada database & layanan prediksi. |

---

## Jawaban Siap Pakai untuk Tim Backend (Bahasa Indonesia)

Berikut adalah poin-poin jawaban dan spesifikasi kebutuhan yang dapat langsung diteruskan kepada tim backend (Express.js + PostgreSQL + FastAPI AI):

### 1. Keamanan Gemini API Key — Proxy Backend / FastAPI (#3)
> **Jawaban untuk Tim Backend:**
> "Untuk kebutuhan produksi, **Gemini API Key milik apotek tidak boleh disimpan atau dipanggil langsung dari browser maupun variabel `VITE_*`** karena `VITE_*` ikut ter-bundle secara publik ke file JavaScript klien. Mohon sediakan endpoint proxy di backend Express (`POST /api/v1/faktur/ekstraksi`) yang meneruskan berkas faktur ke layanan FastAPI AI (`POST /extract-invoice`) menggunakan environment variable server `GEMINI_API_KEY`. Di sisi frontend saat ini, fitur token AI pada modal `Token AI` dan `Pengaturan` hanya berfungsi sebagai opsi *Bring-Your-Own-Key* (BYOK) di `localStorage` perangkat pengguna untuk mode demo tanpa server."

### 2. Persistensi Atomik Retur, Pembuangan (`Catat Dibuang`), dan `Prioritas Jual` (#7, #8, #9)
> **Jawaban untuk Tim Backend:**
> "Alur baru di frontend kini tidak lagi sekadar mencetak BAP atau berpindah halaman, melainkan mencatat aksi nyata terhadap batch. Mohon tambahkan transaksi atomik di PostgreSQL beserta endpoint berikut:
> 1. **Catat Retur (`POST /api/v1/retur`):** Menerima daftar `{ batch_id, jumlah_retur, catatan }`, mengurangi `jumlah_saat_ini` secara atomik (validasi `jumlah_retur <= jumlah_saat_ini`), memperbarui `nilai_total`, mengubah `status_retur = 'sudah_diretur'` dan `status_risiko = 'rendah'` jika sisa stok menjadi `0`, serta mencatat ke tabel riwayat retur (`return_logs`) dan mutasi stok (`penyesuaian_stok`).
> 2. **Catat Dibuang (`POST /api/v1/batch/:id/buang`):** Untuk batch `lewat_batas` yang sudah melewati tanggal ED. Mengurangi/mengenolkan `jumlah_saat_ini`, menandai `status_batch = 'dibuang'` / `status_retur = 'dibuang'` bila stok habis, dan menulis log pemusnahan + mutasi stok.
> 3. **Prioritas Jual (`PATCH /api/v1/batch/:id/prioritas-jual`):** Untuk batch `lewat_batas` yang belum ED. Menambahkan kolom boolean `prioritas_jual` (default `false`) pada tabel `batch`, serta opsional mencatat pengurangan unit terjual beserta log penjualan prioritas FEFO.
> 4. **Filter Query Pengingat & Dashboard (`GET /api/v1/pengingat` & `GET /api/v1/dashboard/ringkasan`):** Wajib mengecualikan seluruh batch yang memiliki `jumlah_saat_ini <= 0`, `status_retur IN ('sudah_diretur', 'dibuang')`, atau `status_batch = 'dibuang'` agar batch yang sudah diretur/dibuang langsung hilang dari daftar pengingat, hitungan badge, dan notifikasi lonceng."

### 3. Penyelarasan `lewat_batas_retur` & 4 Kategori Baku (#10, #11)
> **Jawaban untuk Tim Backend:**
> "Mohon selaraskan struktur respons `GET /api/v1/pengingat` dan `GET /api/v1/batch` agar konsisten dengan **4 kategori baku** di seluruh aplikasi:
> 1. **`bisa_diretur`** (`Bisa Diretur`) — seluruh batch aktif yang masih berhak diretur (`status_retur = 'bisa_diretur'`, `jumlah_saat_ini > 0`), dilengkapi `sisa_hari_retur` dan sub-hitungan `mendesak_retur` (`0 < sisa_hari_retur <= batas_retur_warning_hari`) untuk badge prioritas.
> 2. **`lewat_batas_retur`** (`Lewat Batas Retur`) — seluruh batch aktif dengan `status_retur = 'lewat_batas'` (atau `batas_retur < tanggal_acuan`) dan `jumlah_saat_ini > 0`. Saat ini field `lewat_batas_retur` belum ada di kontrak `GET /api/v1/pengingat`.
> 3. **`mendekati_kedaluwarsa`** (`Dekat ED`) — batch aktif dengan `sisa_hari_exp <= batas_kedaluwarsa_warning_hari` dan `jumlah_saat_ini > 0`.
> 4. **`stok_menipis`** (`Stok Tipis`) — batch aktif dengan `0 < jumlah_saat_ini <= stok_minimum` (disarankan mengecek `stok_minimum` per master obat atau default pengaturan, dan jangan memasukkan stok `0`)."

### 4. Konsistensi `status_risiko` vs `lewat_batas` (#12)
> **Jawaban untuk Tim Backend:**
> "Sesuai aturan UX bahwa satu batch tidak boleh menampilkan label **Lewat Batas** dan **Risiko Tinggi** secara bersamaan, mohon pastikan logika penilaian risiko di backend dan layanan FastAPI `/predict-risk` memperlakukan `status_retur = 'lewat_batas'` sebagai status terminal fase retur (bukan dikembalikan sebagai `status_risiko = 'tinggi'` yang bertabrakan di tampilan), atau memisahkan status fase retur dari skor risiko kedaluwarsa secara eksplisit pada payload API."

### 5. Pensiun Data Tiruan `mockData.js` & Sinkronisasi Pengaturan (#4, #5)
> **Jawaban untuk Tim Backend:**
> "Saat ini frontend menampilkan penanda **Data Simulasi** karena seluruh layanan di `frontend/src/services/api.js` masih membaca `mockData.js` dan `localStorage`. Untuk fase integrasi produksi:
> - Hubungkan `api.js` ke endpoint live `VITE_API_BASE_URL` dan hentikan inisialisasi otomatis dari `mockData.js`.
> - Hapus keharusan field `nib` dari skema profil apotek/pengaturan karena NIB telah dihapus dari UI (#4).
> - Pastikan endpoint master obat (`GET /api/v1/obat`) dan pengaturan sarana apotek (profil, kategori, SOP tanpa klaim CDOB/BPOM) tersedia di database agar data tidak lagi terisolasi di browser."
