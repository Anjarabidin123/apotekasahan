# Rencana dan Skenario Pengujian Sistem (Test Plan)

## Sistem Pemantauan Stok dan Kedaluwarsa — Apotek Asahan Farma

---

| | |
|---|---|
| **Versi Dokumen** | 1.0 |
| **Tanggal Dibuat** | 17 November 2026 |
| **Terakhir Direvisi** | 18 November 2026 |
| **Penyusun** | Dio Stania Adinata, Charlene Silver |
| **Metode Pengujian** | Black Box Testing, Integration Testing, User Acceptance Testing (UAT) |
| **Status** | Disetujui Tim Pengembang (A26-CS114) |

### Catatan Pengantar Pengujian

> Dokumen ini disusun untuk memandu jalannya pengujian sistem selama periode pengembangan (Minggu 2–4). Pengujian difokuskan pada pemenuhan seluruh kriteria kelulusan (Main Quest) Capstone Asah 2026, memastikan keandalan integrasi antara frontend, backend Node.js, layanan AI FastAPI, serta memastikan aplikasi layak didemokan secara langsung kepada **Bu Anni (Komisaris Apotek Asahan Farma)** tanpa kendala teknis.

---

## BAB 1: STRATEGI & RUANG LINGKUP PENGUJIAN

### 1.1 Pendekatan Pengujian
1. **Pengujian Fungsional (Black Box):** Menguji setiap fitur dari sisi antarmuka pengguna tanpa melihat kode internal, untuk memastikan input dan output sesuai dengan spesifikasi SRS.
2. **Pengujian Ketahanan Error (Negative Testing):** Memasukkan data tidak valid, file rusak, memutus koneksi internet, atau mematikan layanan AI untuk memastikan sistem tidak crash dan menampilkan pesan kesalahan berbahasa Indonesia yang jelas.
3. **Pengujian Konsistensi Data:** Memastikan angka total nilai persediaan dan jumlah batch berisiko di Dashboard sama persis dengan hasil kalkulasi di Menu Tabel Persediaan dan data sintetis awal.
4. **Pengujian Kompatibilitas Perangkat:** Memastikan antarmuka berjalan lancar di browser desktop (laptop) dan browser mobile (layar smartphone karyawan apotek).

### 1.2 Lingkungan Pengujian (Test Environment)
- **Frontend URL:** Vercel Staging Environment
- **Backend API:** Render Web Service (Node.js Express)
- **AI Service:** Render Web Service (Python FastAPI)
- **Database:** PostgreSQL Neon Cloud Database
- **Perangkat Uji:**
  - Laptop: Google Chrome v120 (Resolusi 1920x1080 & 1366x768)
  - Ponsel: Android Chrome & iOS Safari (Resolusi 390x844 & 412x915)

---

## BAB 2: MATRIKS SKENARIO PENGUJIAN UTAMA

Setiap kasus uji memiliki kode referensi unik: `TC-[MODUL]-[NOMOR]`.

### 2.1 Modul Autentikasi & Hak Akses (AUTH)

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Penanggung Jawab |
|---|---|---|---|---|
| `TC-AUTH-001` | Login Akun Admin Valid | Masukkan email `admin@apotek.local` dan password benar, klik Masuk | Berhasil login, menerima token JWT, diarahkan ke Dashboard dengan semua menu aktif | Charlene Silver |
| `TC-AUTH-002` | Login Akun Karyawan Valid | Masukkan email `karyawan@apotek.local` dan password benar, klik Masuk | Berhasil login, diarahkan ke Halaman Input Faktur/Stok. Menu Pengaturan dan Dashboard disembunyikan | Charlene Silver |
| `TC-AUTH-003` | Login Password Salah | Masukkan email terdaftar dengan password salah | Muncul toast merah: "Email atau kata sandi tidak cocok. Silakan coba lagi." Form tidak submit | Nugroho Anjar |
| `TC-AUTH-004` | Pembatasan URL Pengaturan | Akun karyawan mencoba membuka paksa URL `/pengaturan` via address bar | Sistem menolak akses, menampilkan halaman 403 Forbidden atau me-redirect kembali ke halaman stok | Charlene Silver |
| `TC-AUTH-005` | Logout Pengguna | Klik tombol Keluar di pojok kanan atas, konfirmasi dialog | Token di localStorage dihapus, sesi berakhir, pengguna diarahkan ke layar `/login` | Nugroho Anjar |

---

### 2.2 Modul Input Faktur & Ekstraksi AI (INP)

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Penanggung Jawab |
|---|---|---|---|---|
| `TC-INP-001` | Upload Foto Faktur Valid (Dummy) | Unggah file JPG faktur contoh berukuran 2MB | File diterima, muncul loader AI, form terisi otomatis dengan nama obat, batch, exp date, qty, dan harga | Nugroho / Fachri |
| `TC-INP-002` | Upload File Bukan Gambar | Coba unggah file berkas PDF atau DOCX | Sistem langsung menolak di sisi frontend dengan pesan: "Format berkas harus berupa gambar JPG atau PNG" | Nugroho Anjar |
| `TC-INP-003` | Upload Foto Melebihi 5MB | Coba unggah gambar kamera resolusi tinggi 8MB | Muncul pesan peringatan: "Ukuran berkas melebihi batas maksimal 5MB. Silakan kompres atau pilih foto lain" | Nugroho / Charlene |
| `TC-INP-004` | Ekstraksi Gagal (Foto Buram) | Unggah gambar faktur yang sengaja dibuat buram / teks kabur | Sistem menampilkan banner peringatan: "Teks tidak terbaca jelas. Silakan lengkapi lewat form manual di bawah", form kosong terbuka | Fachri / Nugroho |
| `TC-INP-005` | Koreksi Data Ekstraksi | Ubah salah satu kolom tanggal kedaluwarsa hasil AI, lalu klik Simpan | Data yang tersimpan di database adalah data hasil koreksi pengguna, bukan teks mentah OCR | Nugroho / Charlene |
| `TC-INP-006` | Validasi Field Wajib Kosong | Kosongkan field nomor batch atau tanggal exp pada form, klik Simpan | Tombol simpan dicegah, input bergaris merah dengan pesan: "Kolom ini wajib diisi" | Nugroho Anjar |
| `TC-INP-007` | Validasi Tanggal Kedaluwarsa Lampau | Masukkan tanggal kedaluwarsa yang sudah lewat (misal tahun 2023) | Sistem menolak input dengan pesan: "Tanggal kedaluwarsa tidak boleh lebih lampau dari tanggal saat ini" | Dio Stania |

---

### 2.3 Modul Integrasi Model Prediksi Risiko (RSK)

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Penanggung Jawab |
|---|---|---|---|---|
| `TC-RSK-001` | Pemanggilan Model Normal | Simpan batch baru saat microservice FastAPI aktif | Batch tersimpan di database, nilai `skor_risiko` terisi desimal (misal 0.78), dan badge risiko (Tinggi/Sedang/Rendah) muncul | Fachri / Dio |
| `TC-RSK-002` | Penanganan Layanan AI Mati (Fallback) | Matikan sementara service FastAPI, lakukan simpan batch | Batch tetap berhasil tersimpan di PostgreSQL, kolom keterangan terisi "Skor belum tersedia", aplikasi tidak crash | Charlene Silver |
| `TC-RSK-003` | Format Request Prediksi Cacat | Kirim payload ke endpoint FastAPI dengan field `jumlah_awal` berupa teks string | FastAPI mengembalikan error 422 Unprocessable Entity dengan deskripsi validasi field yang jelas | Fachri Abdullah |

---

### 2.4 Modul Pengingat, Retur, & Pengaturan (REM & SET)

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Penanggung Jawab |
|---|---|---|---|---|
| `TC-REM-001` | Kalkulasi Batas Retur Otomatis | Input obat dengan exp date `2027-06-01` dari distributor dengan aturan 3 bulan | Sistem secara otomatis mencatat `batas_retur` pada tanggal `2027-03-01` | Dio Stania |
| `TC-REM-002` | Tampilan Batch Lewat Batas Retur | Buat batch yang batas returnya mendahului `tanggal_acuan` | Batch tampil dengan label merah `Lewat Batas Retur`, tidak masuk ke rekomendasi retur aktif | Dio Stania |
| `TC-REM-003` | Distributor Tanpa Retur (0 Bulan) | Input batch dari distributor konsinyasi (aturan 0 bulan) | Batch tidak pernah muncul di daftar pengingat retur, hanya muncul jika kedaluwarsa/stok tipis | Dio Stania |
| `TC-REM-004` | Perubahan Aturan Retur Distributor | Admin mengubah aturan retur Distributor A dari 6 bulan menjadi 3 bulan di halaman Pengaturan | Semua batch aktif milik Distributor A langsung diperbarui batas returnya di database dan tabel | Dio / Charlene |
| `TC-REM-005` | Pengubahan Tanggal Acuan Sistem | Admin mengubah tanggal acuan dari `2026-10-31` menjadi `2026-12-01` | Daftar pengingat dan statistik dashboard seketika menghitung ulang selisih hari berdasarkan tanggal baru | Dio / Nugroho |

---

### 2.5 Modul Penyesuaian Stok Cek Fisik (STK)

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Penanggung Jawab |
|---|---|---|---|---|
| `TC-STK-001` | Penyesuaian Stok Berkurang | Stok awal 20, diisi stok fisik 15 dengan alasan "Kemasan Bocor" | Stok batch terupdate jadi 15, selisih -5 tercatat di tabel riwayat penyesuaian | Dio Stania |
| `TC-STK-002` | Validasi Stok Negatif | Coba masukkan angka stok fisik `-5` | Input ditolak dengan pesan: "Jumlah stok fisik tidak boleh kurang dari 0" | Nugroho Anjar |
| `TC-STK-003` | Scan Foto Kartu Stok (Gemini Vision) | Unggah foto kartu stok contoh bertuliskan sisa 14 | Angka 14 terdeteksi dan mengisi otomatis input form penyesuaian untuk diverifikasi user | Fachri / Nugroho |

---

### 2.6 Modul Dashboard & Integritas Data (DSH)

| ID Uji | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Penanggung Jawab |
|---|---|---|---|---|
| `TC-DSH-001` | Sinkronisasi Angka Persediaan | Bandingkan total nilai persediaan di kartu Dashboard dengan total agregasi di Tabel Inventori | Nilai rupiah sama persis hingga desimal terakhir, tidak ada selisih perhitungan | Umar Faruq / Dio |
| `TC-DSH-002` | Filter Tabel Inventori | Filter berdasarkan Distributor PBF Bina Farma dan Risiko Tinggi | Hanya baris yang memenuhi kedua kriteria yang tampil, pagination menyesuaikan | Nugroho Anjar |
| `TC-DSH-003` | Tampilan Data Kosong | Lakukan pencarian nama obat yang tidak ada (misal `xyz123`) | Tabel menampilkan ilustrasi data kosong dengan teks: "Tidak ada obat yang cocok dengan pencarian Anda" | Nugroho Anjar |

---

## BAB 3: FORMULIR UAT (USER ACCEPTANCE TESTING)

Formulir ini digunakan saat sesi demonstrasi bersama narasumber apotek:

- **Narasumber / Penguji:** Bu Anni (Komisaris Apotek Asahan Farma)
- **Fasilitator:** Dio Stania Adinata & Tim A26-CS114
- **Tanggal Uji:** Rencana Minggu ke-4 (Pertengahan Desember 2026)

| No | Alur Aktivitas Pengguna | Hasil Pengamatan Lapangan | Status (Diterima / Revisi) |
|---|---|---|---|
| 1 | Pengguna membuka tautan web aplikasi lewat browser HP tanpa instalasi | Halaman login terbuka cepat (< 3 detik) | [ ] Diterima  [ ] Revisi |
| 2 | Pengguna login menggunakan akun admin yang diberikan | Masuk ke dashboard dengan angka persediaan apotek | [ ] Diterima  [ ] Revisi |
| 3 | Pengguna mencoba mengambil foto faktur dan melihat hasil pembacaan AI | Teks nomor batch dan tanggal exp terbaca | [ ] Diterima  [ ] Revisi |
| 4 | Pengguna memeriksa daftar obat yang mendekati batas waktu retur | Daftar obat tersusun rapi dari tenggat terdekat | [ ] Diterima  [ ] Revisi |
| 5 | Pengguna mencoba mengubah stok salah satu obat sesuai hasil cek fisik | Angka stok berubah dan riwayat penyesuaian tercatat | [ ] Diterima  [ ] Revisi |
| 6 | Pengguna mengecek aturan retur distributor dan memahami artinya | Halaman pengaturan mudah dipahami | [ ] Diterima  [ ] Revisi |

---

## BAB 4: PROSEDUR PENANGANAN BUG & PERBAIKAN

1. Setiap bug atau kegagalan uji dicatat pada **Google Sheets Catatan Uji Bersama** dan dibuka sebagai issue di repositori GitHub privat.
2. Format pencatatan issue:
   - **Judul:** `[BUG] [Nama Modul] - Deskripsi singkat kendala`
   - **Tingkat Keparahan:**
     - *Critical:* Aplikasi crash, data tidak tersimpan, perhitungan uang salah.
     - *Major:* Fitur AI gagal tanpa ada fallback, navigasi buntu.
     - *Minor:* Tampilan teks terpotong di HP, typo bahasa Indonesia.
   - **Langkah Reproduksi:** Urutan klik hingga error muncul.
   - **Screenshot / Bukti:** Lampiran tangkapan layar.
3. Bug kategori *Critical* dan *Major* wajib diselesaikan sebelum jadwal demo UAT dengan pihak apotek dimulai.

---

*Dokumen ini menjadi komitmen bersama seluruh anggota tim A26-CS114 untuk menjaga mutu dan kelancaran demonstrasi capstone.*
