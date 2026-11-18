# SIMAAF — Frontend Web Application
## Sistem Pemantauan Stok dan Kedaluwarsa (Apotek Asahan Farma)
**Pengembang Frontend:** Nugroho Anjar Abidin (fs007b6y1954 - Tim A26-CS114)  
**Mitra UMKM:** Apotek Asahan Farma, Jl. Imam Bonjol No.331, Kisaran Timur, Asahan, Sumatera Utara

---

## 🎨 Karakteristik Desain & Antarmuka
- **Tipografi:** Menggunakan Google Font **Plus Jakarta Sans** untuk kenyamanan membaca optimal.
- **Tema Visual:** Cerah, bersih (*clean slate*), kontras tinggi dengan aksen hijau apotek (`#059669`).
- **Layout Hemat Ruang ("Ga Boros UI"):**
  - Ketinggian baris tabel kompak (`py-2.5 px-3`)
  - Input field dan dropdown `h-8` sampai `h-9`
  - Sidebar ramping (bisa di-collapse)
  - Toolbar pencarian dan filter menyatu langsung di atas tabel data.
- **Human-Written Code:** Penataan komponen React modular, hook yang terisolasi, dan tanpa komentar robotik AI.

---

## 🚀 Cara Menjalankan Aplikasi di Komputer Lokal

### 1. Masuk ke Folder Frontend
```bash
cd frontend
```

### 2. Pasang Dependencies (Jika baru clone)
```bash
npm install
```

### 3. Jalankan Server Pengembangan (Dev Mode)
```bash
npm run dev
```
Buka browser di alamat: `http://localhost:5173`

### 4. Build untuk Production (Vercel / Hosting)
```bash
npm run build
```
Hasil build siap saji akan berada di folder `dist/`.

---

## 🔑 Akun Uji Coba (Demo Credentials)

Aplikasi telah dilengkapi tombol ganti akun instan di pojok kanan atas, atau bisa login manual dengan akun:
1. **Pemilik / Komisaris (Admin):**
   - Email: `admin@apotek.local`
   - Password: `admin123`
   - *Hak akses:* Akses penuh ke seluruh menu, Dashboard nilai keuangan, dan Pengaturan aturan retur distributor.
2. **Karyawan Apotek:**
   - Email: `karyawan@apotek.local`
   - Password: `karyawan123`
   - *Hak akses:* Input faktur, melihat tabel stok, mengecek pengingat retur, dan melakukan penyesuaian stok cek fisik rak. Halaman Pengaturan otomatis terkunci.

---

## 📦 Alur Pengujian Fitur Utama untuk Evaluasi

1. **Uji Input Faktur & AI:**
   - Masuk ke menu **Input Faktur (AI)**.
   - Klik tombol **"Uji Coba Demo Ekstraksi Faktur AI"** atau unggah foto.
   - Sistem akan memunculkan simulasi pembacaan nomor batch, tanggal exp, dan harga.
   - Edit angka pada tabel, lalu klik **Konfirmasi & Simpan ke Inventori**.
2. **Uji Filter Tabel Stok:**
   - Masuk ke menu **Tabel Inventori**.
   - Coba filter berdasarkan Distributor (misal PBF Bina Farma) atau filter Tingkat Risiko Tinggi.
3. **Uji Pengingat Retur:**
   - Masuk ke menu **Pengingat & Retur**.
   - Perhatikan kotak merah (tenggat < 30 hari). Klik **Cek Fisik di Rak** untuk langsung dialihkan ke menu penyesuaian stok.
4. **Uji Penyesuaian Stok (Stock Opname):**
   - Masuk ke menu **Penyesuaian Stok**.
   - Masukkan hasil hitung fisik di rak apotek -> perhatikan selisih otomatis terhitung -> klik Simpan. Riwayat perubahan langsung tercatat di tabel bawah.
5. **Uji Pengaturan Aturan Retur (Admin):**
   - Masuk ke menu **Pengaturan Aturan**.
   - Ubah aturan retur salah satu distributor (misal dari 6 bulan jadi 1 bulan). Batas retur seluruh batch terkait seketika dihitung ulang!

---

*Disusun untuk Capstone Project Asah 2026 led by Dicoding supported by GoTo.*
