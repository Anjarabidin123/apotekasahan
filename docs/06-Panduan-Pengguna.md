# Panduan Pengguna Sistem (User Manual)

## SIMAAF — Sistem Pemantauan Stok dan Kedaluwarsa
### Apotek Asahan Farma, Kisaran Timur

---

| | |
|---|---|
| **Penyusun** | Tim Pengembang Capstone Asah 2026 (A26-CS114) |
| **Ditujukan Untuk** | Ibu Anni (Komisaris) & Karyawan Apotek Asahan Farma |
| **Versi Panduan** | 1.0 (Edisi Desember 2026) |
| **Format Akses** | Aplikasi Web (Dapat dibuka via Laptop & Handphone) |

---

## KATA PENGANTAR

Panduan ini disusun khusus untuk membantu pengelola dan karyawan **Apotek Asahan Farma** dalam mengoperasikan aplikasi **SIMAAF**. Aplikasi ini dirancang sederhana untuk menggantikan pencatatan manual di buku dan Excel yang rawan selisih, serta membantu apotek memantau tanggal kedaluwarsa obat dan batas waktu retur ke distributor secara otomatis.

Dengan sistem ini, apotek tidak perlu lagi cemas obat kedaluwarsa terlewat tanpa sempat dikembalikan ke distributor, sehingga modal usaha apotek dapat terlindungi dengan baik.

---

## 1. CARA MEMBUKA & MASUK KE SISTEM (LOGIN)

1. Buka browser (Google Chrome atau Safari) di laptop atau handphone Anda.
2. Masukkan alamat website aplikasi SIMAAF yang telah dibagikan tim pengembang.
3. Pada halaman login, masukkan akun Anda:
   - **Untuk Pemilik / Ibu Anni (Admin):**
     - Email: `admin@apotek.local`
     - Kata Sandi: `admin123`
   - **Untuk Karyawan Apotek:**
     - Email: `karyawan@apotek.local`
     - Kata Sandi: `karyawan123`
4. Klik tombol hijau **"Masuk ke Aplikasi"**.
5. Sistem akan menampilkan halaman utama sesuai hak akses Anda.

---

## 2. CARA MENCATAT OBAT DARI FAKTUR DISTRIBUTOR (FITUR FOTO AI)

Ketika obat kiriman dari distributor tiba di apotek, Anda tidak perlu lagi mengetik satu per satu. Cukup gunakan fitur pembacaan faktur:

### Langkah-langkah:
1. Klik menu **"Input Faktur"** di bilah menu samping.
2. Di area kotak unggah:
   - Jika menggunakan **Laptop**: Klik kotak dan pilih foto faktur yang sudah tersimpan di laptop.
   - Jika menggunakan **Handphone**: Klik kotak dan pilih opsi **Kamera** untuk langsung memfoto lembar faktur fisik.
3. Pastikan foto faktur terlihat terang, tulisan nama obat, nomor batch, dan tanggal kedaluwarsa tidak terpotong atau buram.
4. Tunggu sekitar 5–10 detik sementara sistem kecerdasan buatan (Gemini AI) membaca data faktur secara otomatis.
5. **Pemeriksaan & Koreksi (Sangat Penting):**
   - Hasil pembacaan AI akan tampil di layar dalam bentuk tabel formulir.
   - Periksa kembali apakah nama obat, nomor batch, dan tanggal kedaluwarsa sudah sesuai dengan fisik barang yang diterima.
   - Jika ada salah baca (misal huruf batch kurang pas), Anda dapat langsung mengklik kolom tersebut dan memperbaikinya.
6. Klik tombol hijau **"Konfirmasi & Simpan ke Stok"**.
7. Data obat otomatis masuk ke inventori apotek, dan sistem seketika menghitung tanggal batas retur serta tingkat risikonya.

> **Tips Bermanfaat:** Jika lembaran faktur basah, terlipat parah, atau foto tidak terbaca oleh sistem, jangan khawatir! Cukup klik tombol **"Isi Formulir Manual Tanpa Foto"** di bawah kotak unggah untuk mengetik langsung data obat seperti biasa.

---

## 3. CARA MEMANTAU OBAT YANG HARUS SEGERA DIRETUR

Ini adalah fitur utama untuk mencegah kerugian apotek:

1. Klik menu **"Pengingat & Retur"**.
2. Pada bagian atas layar, perhatikan **Kotak Pengingat**:
   - **Kotak Merah (Mendesak Retur):** Menampilkan daftar obat yang batas waktu pengembaliannya ke distributor tinggal sedikit (kurang dari 30 hari).
   - **Kotak Kuning (Mendekati Kedaluwarsa):** Menampilkan obat yang akan kedaluwarsa dalam 90 hari ke depan.
   - **Kotak Biru (Stok Menipis):** Menampilkan obat yang jumlah fisiknya di rak sudah di bawah batas minimum.
3. Lihat daftar rincian di bawah kotak:
   - Sistem mencantumkan **nama distributor** dan **tanggal batas retur**.
   - Contoh: *"Amoxicillin Batch BMX-20 - Batas Retur: 15 November 2026 (Sisa 12 hari lagi)"*.
4. Segera ambil obat fisik dari rak apotek, pisahkan dari stok pajangan, dan hubungi sales distributor terkait untuk memproses pengembalian obat.

---

## 4. CARA MENYESUAIKAN STOK DENGAN HASIL CEK FISIK (STOCK OPNAME)

Jika saat membersihkan rak atau mengecek berkala Anda mendapati ada obat yang botolnya pecah, kemasan rusak, atau jumlah fisik berbeda dari catatan:

1. Klik menu **"Penyesuaian Stok"**.
2. Cari dan pilih nama obat atau nomor batch yang akan disesuaikan.
3. Sistem akan menampilkan stok yang saat ini tercatat di aplikasi (misalnya: 20 botol).
4. Masukkan **jumlah fisik yang sebenarnya** Anda temukan di rak (misalnya: 18 botol).
5. Sistem secara otomatis menghitung selisihnya (-2 botol).
6. Pilih alasan penyesuaian:
   - *Kemasan Rusak / Pecah*
   - *Selisih Hitung Rutin*
   - *Lain-lain (Tulis keterangan singkat)*
7. Klik tombol **"Simpan Hasil Cek Fisik"**.
8. Catatan stok apotek langsung terbarukan, dan riwayat penyesuaian akan tersimpan rapi beserta nama karyawan yang melakukan perubahan.

---

## 5. PANDUAN KHUSUS PEMILIK (DASHBOARD & PENGATURAN)

Fitur ini hanya dapat dibuka oleh akun Ibu Anni (Komisaris / Admin):

### A. Melihat Ringkasan Keuangan di Dashboard
- Buka menu **"Dashboard"**.
- Anda dapat langsung melihat:
  - **Total Nilai Persediaan Apotek:** Nilai modal seluruh obat yang ada di apotek saat ini.
  - **Nilai Stok Berisiko Hangus:** Perkiraan nilai uang obat yang terancam tidak laku sebelum batas retur tiba.
  - **Distributor Paling Rawan:** Daftar distributor yang memiliki aturan retur ketat sehingga obatnya sering terlewat untuk dikembalikan.

### B. Mengatur Aturan Retur Per Distributor
Karena setiap distributor (PBF) memiliki perjanjian retur yang berbeda-beda:
1. Buka menu **"Pengaturan"**.
2. Pilih tab **"Aturan Retur Distributor"**.
3. Cari nama distributor yang ingin diubah (misalnya PBF Bina Farma).
4. Klik tombol **Edit** dan pilih batas retur yang berlaku:
   - *6 Bulan Sebelum Expired*
   - *3 Bulan Sebelum Expired*
   - *1 Bulan Sebelum Expired*
   - *Tidak Menerima Retur (0 Bulan)*
5. Klik **Simpan**. Sistem akan secara otomatis menghitung ulang tanggal batas retur untuk seluruh batch obat dari distributor tersebut.

---

## 6. PERTANYAAN YANG SERING DIAJUKAN (FAQ)

**T: Mengapa di bagian atas aplikasi tertulis "Tanggal Acuan Sistem: 31 Oktober 2026"?**
> **J:** Untuk keperluan demonstrasi dan penilaian proyek capstone, data yang digunakan adalah data simulasi apotek periode 2025–2026. Tanggal acuan sengaja disetel ke 31 Oktober 2026 agar pengingat retur dan kedaluwarsa dapat diperagakan secara realistis kepada penguji dan penilai. Tanggal ini dapat diubah oleh Admin di menu Pengaturan.

**T: Bagaimana jika koneksi internet di apotek mendadak lambat saat upload foto faktur?**
> **J:** Jika proses membaca foto membutuhkan waktu lebih lama atau gagal terhubung ke layanan AI, sistem akan otomatis memunculkan formulir biasa. Anda tetap bisa mencatat data obat secara manual tanpa terhambat.

**T: Siapa yang dapat dihubungi jika terjadi kendala pada aplikasi?**
> **J:** Silakan menghubungi tim pengembang capstone (Dio, Charlene, atau Nugroho) melalui grup koordinasi WhatsApp proyek.

---

*Panduan Pengguna — Sistem Pemantauan Stok dan Kedaluwarsa Apotek Asahan Farma (2026)*
