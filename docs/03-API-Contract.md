# Dokumentasi Kontrak API (API Contract)

## Sistem Pemantauan Stok dan Kedaluwarsa — Apotek Asahan Farma

---

| | |
|---|---|
| **Versi Dokumen** | 1.0 |
| **Tanggal Dibuat** | 16 November 2026 |
| **Terakhir Direvisi** | 18 November 2026 |
| **Disusun Oleh** | Charlene Silver, Dio Stania Adinata, Fachri Abdullah Shiddiq |
| **Basis URL Utama** | `/api/v1` (Express.js Backend - Render) |
| **Basis URL AI Service** | Internal Backend-to-FastAPI (`http://127.0.0.1:8000` / Private Render Service) |
| **Status** | Disepakati Tim Full-Stack & AI Engineer |

### Catatan Kesepakatan Tim

> **PENTING UNTUK FRONTEND (Nugroho & Tim):**
> 1. Frontend **TIDAK PERNAH** memanggil endpoint FastAPI langsung. Semua request lewat backend Node.js (`/api/v1/...`). API key Gemini dan model inferensi tersimpan aman di server.
> 2. Semua kalkulasi tanggal pengingat dan batas retur dihitung di sisi backend berdasarkan `tanggal_acuan`. Frontend tinggal me-render data yang dikembalikan.
> 3. Format tanggal request/response selalu `YYYY-MM-DD` (ISO string tanpa jam), kecuali field timestamp (`created_at`, `updated_at`) yang berformat ISO 8601 UTC.
> 4. Jika microservice prediksi risiko sedang *cold-start* atau error, backend tetap menyimpan batch dengan `skor_risiko: null` dan `status_risiko: "belum_tersedia"`. Frontend harus menangani badge fallback ini dengan baik.

---

## BAB 1: KETENTUAN UMUM & STANDAR RESPONSE

### 1.1 Autentikasi & Header

Semua request (kecuali endpoint `/auth/login` dan `/health`) mewajibkan header:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

Untuk upload berkas faktur:
```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### 1.2 Format Response Standar

#### A. Response Berhasil (2xx)
```json
{
  "sukses": true,
  "pesan": "Operasi berhasil dilakukan",
  "data": { ... }
}
```

#### B. Response Berhasil dengan Pagination (List Data)
```json
{
  "sukses": true,
  "pesan": "Data batch berhasil diambil",
  "data": [ ... ],
  "meta": {
    "halaman": 1,
    "limit": 20,
    "total_data": 1409,
    "total_halaman": 71
  }
}
```

#### C. Response Gagal / Validasi Error (4xx / 5xx)
```json
{
  "sukses": false,
  "pesan": "Validasi input gagal",
  "error_kode": "ERR_VALIDASI",
  "detail": [
    {
      "field": "tanggal_kedaluwarsa",
      "pesan": "Tanggal kedaluwarsa tidak boleh lebih lampau dari tanggal masuk"
    }
  ]
}
```

### 1.3 Kode Status HTTP yang Digunakan

| Kode | Keterangan | Penggunaan di Sistem |
|---|---|---|
| `200 OK` | Berhasil | Pengambilan data (GET), pembaruan data (PUT/PATCH) |
| `201 Created` | Data Dibuat | Input batch baru, tambah penyesuaian stok |
| `400 Bad Request` | Request Cacat | Validasi form gagal, file bukan gambar, payload kosong |
| `401 Unauthorized` | Belum Login / Token Expired | Header Authorization kosong atau token tidak valid |
| `403 Forbidden` | Dilarang Akses | Karyawan mencoba ubah pengaturan retur/tanggal acuan |
| `404 Not Found` | Data Tidak Ditemukan | Batch ID atau Obat ID tidak ada di database |
| `413 Payload Too Large` | Berkas Terlalu Besar | Foto faktur melebihi batas 5MB |
| `422 Unprocessable` | Logika Bisnis Gagal | Jumlah penyesuaian bernilai negatif |
| `500 Server Error` | Gangguan Backend | Database down atau crash yang tidak tertangani |
| `503 Service Unavailable`| Service AI Sibuk | Kuota Gemini habis / AI timeout (fallback manual aktif) |

---

## BAB 2: ENDPOINT AUTENTIKASI (`/api/v1/auth`)

### 2.1 Login Pengguna
* **Method & URL:** `POST /api/v1/auth/login`
* **Akses:** Publik (tanpa token)
* **Deskripsi:** Autentikasi username/email dan password. Mengembalikan token JWT dan profil singkat pengguna.

**Request Body:**
```json
{
  "email": "admin@apotek.local",
  "password": "Password123!"
}
```

**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "pengguna": {
      "id": 1,
      "nama": "Anni (Komisaris)",
      "email": "admin@apotek.local",
      "role": "admin"
    }
  }
}
```

**Response 401 Unauthorized:**
```json
{
  "sukses": false,
  "pesan": "Email atau kata sandi tidak cocok",
  "error_kode": "AUTH_INVALID_CREDENTIALS"
}
```

---

### 2.2 Profil Pengguna Saat Ini
* **Method & URL:** `GET /api/v1/auth/me`
* **Akses:** Wajib Bearer Token (Admin & Karyawan)
* **Deskripsi:** Cek keabsahan sesi dan ambil data pengguna aktif saat aplikasi dibuka.

**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Profil berhasil dimuat",
  "data": {
    "id": 2,
    "nama": "Karyawan Shift Pagi",
    "email": "karyawan@apotek.local",
    "role": "karyawan"
  }
}
```

---

## BAB 3: ENDPOINT EKSTRAKSI FAKTUR & BATCH INPUT (`/api/v1/faktur`)

Ini adalah modul utama penerimaan obat. Mengakomodasi alur upload foto faktur, ekstraksi AI via Gemini, review koreksi manual, hingga penyimpanan ke database.

### 3.1 Upload & Ekstraksi Foto Faktur (AI Vision)
* **Method & URL:** `POST /api/v1/faktur/ekstraksi`
* **Akses:** Admin & Karyawan
* **Content-Type:** `multipart/form-data`
* **Deskripsi:** Menerima file foto faktur fisik/dummy, backend meneruskan ke layanan Gemini API untuk membaca data per baris.

**Form Data Params:**
- `file_faktur`: File gambar (`image/jpeg`, `image/png`, `image/webp`). Maksimum 5MB.

**Response 200 OK (Ekstraksi Berhasil):**
```json
{
  "sukses": true,
  "pesan": "Faktur berhasil diekstrak oleh sistem. Silakan periksa kembali sebelum menyimpan.",
  "data": {
    "nomor_faktur": "FAK-2026/10/089",
    "distributor_id_terdeteksi": 3,
    "nama_distributor_terdeteksi": "PBF Bina Farma Medan",
    "tanggal_faktur": "2026-10-15",
    "daftar_item": [
      {
        "nama_obat": "Amoxicillin 500mg",
        "kode_obat_terpilih": "OBT-001",
        "nomor_batch": "BMX2610A",
        "tanggal_kedaluwarsa": "2027-10-01",
        "jumlah": 50,
        "satuan": "box",
        "harga_beli_satuan": 42000.00
      },
      {
        "nama_obat": "Paracetamol Sirup 60ml",
        "kode_obat_terpilih": "OBT-014",
        "nomor_batch": "PCT2608B",
        "tanggal_kedaluwarsa": "2027-04-15",
        "jumlah": 24,
        "satuan": "botol",
        "harga_beli_satuan": 18500.00
      }
    ]
  }
}
```

**Response 400 Bad Request (Bukan Gambar / Rusak):**
```json
{
  "sukses": false,
  "pesan": "Berkas harus berupa gambar JPG/PNG dan berukuran di bawah 5MB",
  "error_kode": "ERR_FILE_INVALID"
}
```

**Response 503 / 422 (Ekstraksi Gagal / Foto Terlalu Buram):**
```json
{
  "sukses": false,
  "pesan": "Teks pada foto faktur tidak terbaca dengan jelas. Silakan masukkan data secara manual melalui form yang tersedia.",
  "error_kode": "ERR_OCR_UNREADABLE",
  "data": {
    "alihkan_ke_manual": true
  }
}
```

---

### 3.2 Simpan Batch yang Telah Diperiksa (Konfirmasi User)
* **Method & URL:** `POST /api/v1/faktur/simpan-batch`
* **Akses:** Admin & Karyawan
* **Deskripsi:** Menyimpan sekumpulan batch hasil koreksi pengguna ke database. Backend otomatis menghitung `batas_retur` dan meminta `skor_risiko` ke microservice klasifikasi.

**Request Body:**
```json
{
  "distributor_id": 3,
  "tanggal_masuk": "2026-10-18",
  "catatan": "Pengiriman rutin via faktur FAK-2026/10/089",
  "items": [
    {
      "obat_id": 1,
      "nomor_batch": "BMX2610A",
      "tanggal_kedaluwarsa": "2027-10-01",
      "jumlah": 50,
      "harga_beli_satuan": 42000.00
    },
    {
      "obat_id": 14,
      "nomor_batch": "PCT2608B",
      "tanggal_kedaluwarsa": "2027-04-15",
      "jumlah": 24,
      "harga_beli_satuan": 18500.00
    }
  ]
}
```

**Response 201 Created:**
```json
{
  "sukses": true,
  "pesan": "2 batch obat berhasil disimpan ke inventori",
  "data": {
    "total_tersimpan": 2,
    "batch_tersimpan": [
      {
        "id": 1410,
        "nomor_batch": "BMX2610A",
        "obat_id": 1,
        "nama_obat": "Amoxicillin 500mg",
        "jumlah_saat_ini": 50,
        "batas_retur": "2027-04-01",
        "skor_risiko": 0.1420,
        "status_risiko": "rendah",
        "status_retur": "bisa_diretur"
      },
      {
        "id": 1411,
        "nomor_batch": "PCT2608B",
        "obat_id": 14,
        "nama_obat": "Paracetamol Sirup 60ml",
        "jumlah_saat_ini": 24,
        "batas_retur": "2026-10-15",
        "skor_risiko": 0.7850,
        "status_risiko": "tinggi",
        "status_retur": "lewat_batas"
      }
    ]
  }
}
```

---

## BAB 4: ENDPOINT MANAJEMEN BATCH & INVENTORI (`/api/v1/batches`)

### 4.1 Daftar Seluruh Batch (Tabel Agregasi)
* **Method & URL:** `GET /api/v1/batches`
* **Akses:** Admin & Karyawan
* **Query Params:**
  - `page`: integer (default: 1)
  - `limit`: integer (default: 20)
  - `search`: string (cari nomor batch atau nama obat)
  - `distributor_id`: integer (filter distributor)
  - `status_risiko`: string (`rendah` | `sedang` | `tinggi`)
  - `status_retur`: string (`bisa_diretur` | `lewat_batas` | `belum_diretur`)
  - `exp_start`: string YYYY-MM-DD
  - `exp_end`: string YYYY-MM-DD
  - `sort_by`: string (`tanggal_kedaluwarsa` | `batas_retur` | `skor_risiko` | `jumlah_saat_ini`)
  - `order`: `asc` | `desc`

**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Daftar batch berhasil diambil",
  "data": [
    {
      "id": 102,
      "nomor_batch": "KLA-2511-9",
      "obat": {
        "id": 45,
        "kode_obat": "OBT-045",
        "nama_obat": "Klindamisin 300mg",
        "satuan": "kapsul",
        "stok_minimum": 15
      },
      "distributor": {
        "id": 2,
        "nama": "PBF Kimia Farma Trading Medan",
        "aturan_retur_bulan": 3
      },
      "tanggal_masuk": "2025-11-20",
      "tanggal_kedaluwarsa": "2026-12-10",
      "batas_retur": "2026-09-10",
      "jumlah_awal": 60,
      "jumlah_saat_ini": 18,
      "harga_beli_satuan": 3500.00,
      "nilai_total": 63000.00,
      "skor_risiko": 0.8210,
      "status_risiko": "tinggi",
      "status_retur": "lewat_batas"
    }
  ],
  "meta": {
    "halaman": 1,
    "limit": 20,
    "total_data": 1409,
    "total_halaman": 71
  }
}
```

---

### 4.2 Detail Batch Tertentu
* **Method & URL:** `GET /api/v1/batches/:id`
* **Akses:** Admin & Karyawan
* **Deskripsi:** Mengambil info detail batch beserta riwayat penyesuaian stoknya.

**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Detail batch berhasil dimuat",
  "data": {
    "id": 102,
    "nomor_batch": "KLA-2511-9",
    "obat": {
      "id": 45,
      "nama_obat": "Klindamisin 300mg",
      "satuan": "kapsul"
    },
    "distributor": {
      "id": 2,
      "nama": "PBF Kimia Farma Trading Medan"
    },
    "tanggal_kedaluwarsa": "2026-12-10",
    "batas_retur": "2026-09-10",
    "jumlah_saat_ini": 18,
    "skor_risiko": 0.8210,
    "status_risiko": "tinggi",
    "status_retur": "lewat_batas",
    "riwayat_penyesuaian": [
      {
        "id": 12,
        "tanggal": "2026-08-30T10:15:00Z",
        "jumlah_sebelum": 30,
        "jumlah_sesudah": 18,
        "selisih": -12,
        "alasan": "Pemeriksaan fisik rak B2, 12 kapsul rusak kemasan",
        "petugas": "Karyawan"
      }
    ]
  }
}
```

---

## BAB 5: ENDPOINT PENGINGAT & ALERT (`/api/v1/pengingat`)

Endpoint ini mendukung fitur inti aplikasi: memonitor obat yang mendekati batas retur, kedaluwarsa, dan stok menipis berdasarkan `tanggal_acuan`.

### 5.1 Daftar Seluruh Pengingat Aktif
* **Method & URL:** `GET /api/v1/pengingat`
* **Akses:** Admin & Karyawan
* **Query Params:**
  - `tipe`: `semua` | `retur` | `kedaluwarsa` | `stok_menipis` (default: `semua`)
  - `limit`: integer (default: 50)

**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Daftar pengingat aktif berhasil diambil",
  "data": {
    "tanggal_acuan_sistem": "2026-10-31",
    "total_pengingat": 18,
    "ringkasan": {
      "mendesak_retur": 6,
      "mendekati_kedaluwarsa": 8,
      "stok_menipis": 4
    },
    "daftar_item": [
      {
        "batch_id": 108,
        "nama_obat": "Cefixime 100mg Kapsul",
        "nomor_batch": "CFX-2601",
        "distributor": "PBF Enseval Putera Megatrading",
        "sisa_stok": 15,
        "tanggal_kedaluwarsa": "2027-01-15",
        "batas_retur": "2026-11-15",
        "hari_menuju_batas_retur": 15,
        "kategori_alert": "mendesak_retur",
        "status_retur": "bisa_diretur",
        "skor_risiko": 0.89,
        "pesan_peringatan": "Batas retur 15 hari lagi (15 Nov 2026). Segera ajukan retur ke distributor!"
      },
      {
        "batch_id": 84,
        "nama_obat": "Salep Mata Kloramfenikol",
        "nomor_batch": "KLM-2509",
        "distributor": "PBF Antar Mitra Sembada",
        "sisa_stok": 5,
        "tanggal_kedaluwarsa": "2026-11-20",
        "batas_retur": "2026-08-20",
        "hari_menuju_kedaluwarsa": 20,
        "kategori_alert": "mendekati_kedaluwarsa",
        "status_retur": "lewat_batas",
        "skor_risiko": 1.00,
        "pesan_peringatan": "Obat kedaluwarsa 20 hari lagi. Batas retur sudah terlewat (20 Agu 2026)!"
      }
    ]
  }
}
```

---

## BAB 6: ENDPOINT PENYESUAIAN STOK / STOCK OPNAME (`/api/v1/penyesuaian-stok`)

### 6.1 Simpan Penyesuaian Stok Cek Fisik
* **Method & URL:** `POST /api/v1/penyesuaian-stok`
* **Akses:** Admin & Karyawan
* **Deskripsi:** Memperbarui stok fisik suatu batch. Menyimpan log perubahan ke tabel `penyesuaian_stok`, dan menghitung ulang skor risiko batch tersebut.

**Request Body:**
```json
{
  "batch_id": 102,
  "jumlah_sesudah": 14,
  "alasan": "Hasil cek fisik rak A-1 tanggal 31 Okt 2026. 4 tablet hilang/pecah."
}
```

**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Stok berhasil disesuaikan",
  "data": {
    "batch_id": 102,
    "jumlah_sebelum": 18,
    "jumlah_sesudah": 14,
    "selisih": -4,
    "skor_risiko_baru": 0.8540,
    "status_risiko": "tinggi",
    "waktu_penyesuaian": "2026-10-31T14:20:00Z"
  }
}
```

**Response 422 Unprocessable (Nilai Negatif):**
```json
{
  "sukses": false,
  "pesan": "Jumlah stok fisik sesudah penyesuaian tidak boleh kurang dari 0",
  "error_kode": "ERR_INVALID_STOCK_VALUE"
}
```

---

### 6.2 Pembacaan Foto Kartu Stok (Fitur Tambahan - Gemini Vision)
* **Method & URL:** `POST /api/v1/penyesuaian-stok/scan-kartu`
* **Akses:** Admin & Karyawan
* **Content-Type:** `multipart/form-data`
* **Deskripsi:** Mengekstrak angka sisa stok dari foto fisik kartu stok apotek untuk mempermudah input pengecekan.

**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Angka kartu stok berhasil dibaca. Silakan verifikasi fisik sebelum konfirmasi.",
  "data": {
    "angka_terbaca": 14,
    "tanggal_terakhir_di_kartu": "2026-08-14",
    "keterangan": "Terbaca dari baris terakhir kartu stok"
  }
}
```

---

## BAB 7: ENDPOINT DASHBOARD & ANALISIS (`/api/v1/dashboard`)

### 7.1 Ringkasan Eksekutif (Untuk Pemilik / Bu Anni)
* **Method & URL:** `GET /api/v1/dashboard/ringkasan`
* **Akses:** Admin
* **Deskripsi:** Mengembalikan metrik agregasi persediaan, nilai uang yang berisiko hangus, dan distributor paling kritis.

**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Ringkasan dashboard berhasil dimuat",
  "data": {
    "tanggal_acuan": "2026-10-31",
    "total_nilai_persediaan": 185420000.00,
    "total_batch_aktif": 342,
    "jumlah_batch_berisiko_tinggi": 28,
    "total_nilai_berisiko_hangus": 14250000.00,
    "persentase_nilai_berisiko": 7.68,
    "distributor_berisiko_terbanyak": [
      {
        "distributor_id": 3,
        "nama_distributor": "PBF Bina Farma Medan",
        "jumlah_batch_berisiko": 9,
        "nilai_berisiko": 5120000.00,
        "aturan_retur_bulan": 1
      },
      {
        "distributor_id": 5,
        "nama_distributor": "PBF Merapi Utama Pharma",
        "jumlah_batch_berisiko": 7,
        "nilai_berisiko": 3840000.00,
        "aturan_retur_bulan": 3
      }
    ],
    "tindakan_segera": [
      {
        "batch_id": 108,
        "nama_obat": "Cefixime 100mg Kapsul",
        "nomor_batch": "CFX-2601",
        "distributor": "PBF Enseval Putera Megatrading",
        "nilai_stok": 825000.00,
        "hari_tersisa_retur": 15,
        "status": "bisa_diretur"
      }
    ]
  }
}
```

---

### 7.2 Temuan & Rekomendasi Data Science
* **Method & URL:** `GET /api/v1/dashboard/analisis-ds`
* **Akses:** Admin
* **Deskripsi:** Mengambil hasil temuan analisis pola kedaluwarsa dan rekomendasi bisnis untuk ditampilkan di tab khusus dashboard.

**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Hasil analisis data science berhasil dimuat",
  "data": {
    "temuan_utama": [
      "Distributor dengan aturan retur singkat (≤ 1 bulan) menyumbang 62% dari total kerugian obat kedaluwarsa yang tidak sempat diretur.",
      "Kategori obat antibiotik dan sirup anak memiliki variasi perputaran stok tertinggi antar musim.",
      "Sebanyak 14 batch obat berisiko terdeteksi memiliki umur kedaluwarsa di bawah 6 bulan sejak pertama kali diterima dari distributor."
    ],
    "rekomendasi_aksi": [
      "Negosiasikan ulang klausul retur minimal 3 bulan sebelum kedaluwarsa untuk distributor PBF Bina Farma Medan.",
      "Terapkan aturan pemesanan ulang (reorder) dalam kuantitas lebih kecil untuk kelompok obat fast-moving berumur simpan pendek.",
      "Lakukan audit stok fisik mingguan terfokus pada 28 batch yang memiliki skor risiko di atas 0.75."
    ]
  }
}
```

---

## BAB 8: ENDPOINT PENGATURAN SISTEM (`/api/v1/pengaturan`)

Halaman ini hanya boleh diakses oleh Admin (Komisaris).

### 8.1 Daftar Pengaturan Aktif
* **Method & URL:** `GET /api/v1/pengaturan`
* **Akses:** Admin Saja
* **Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Pengaturan sistem berhasil dimuat",
  "data": {
    "tanggal_acuan": "2026-10-31",
    "stok_minimum_default": 10,
    "batas_kedaluwarsa_warning_hari": 90,
    "batas_retur_warning_hari": 30
  }
}
```

---

### 8.2 Simpan Perubahan Pengaturan
* **Method & URL:** `PUT /api/v1/pengaturan`
* **Akses:** Admin Saja
* **Request Body:**
```json
{
  "tanggal_acuan": "2026-10-31",
  "stok_minimum_default": 12,
  "batas_kedaluwarsa_warning_hari": 90,
  "batas_retur_warning_hari": 30
}
```
**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Pengaturan sistem berhasil diperbarui",
  "data": { ... }
}
```

---

### 8.3 Daftar Aturan Retur Per Distributor
* **Method & URL:** `GET /api/v1/pengaturan/aturan-retur`
* **Akses:** Admin Saja
* **Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Aturan retur per distributor berhasil dimuat",
  "data": [
    {
      "distributor_id": 1,
      "kode_distributor": "DST-001",
      "nama_distributor": "PBF Anugrah Argon Medica Medan",
      "bulan_sebelum_kedaluwarsa": 6,
      "keterangan": "Default pabrik 6 bulan"
    },
    {
      "distributor_id": 3,
      "kode_distributor": "DST-003",
      "nama_distributor": "PBF Bina Farma Medan",
      "bulan_sebelum_kedaluwarsa": 1,
      "keterangan": "Aturan ketat dari distributor, konfirmasi Bu Anni"
    },
    {
      "distributor_id": 7,
      "kode_distributor": "DST-007",
      "nama_distributor": "PBF Sinar Harapan Farma",
      "bulan_sebelum_kedaluwarsa": 0,
      "keterangan": "Tidak menerima retur barang konsinyasi/promo"
    }
  ]
}
```

---

### 8.4 Ubah Aturan Retur Distributor
* **Method & URL:** `PUT /api/v1/pengaturan/aturan-retur/:distributor_id`
* **Akses:** Admin Saja
* **Deskripsi:** Memperbarui aturan retur. Backend akan langsung mengkalkulasi ulang kolom `batas_retur` pada semua batch terkait di database.

**Request Body:**
```json
{
  "bulan_sebelum_kedaluwarsa": 3,
  "keterangan": "Perjanjian baru per 1 November 2026"
}
```

**Response 200 OK:**
```json
{
  "sukses": true,
  "pesan": "Aturan retur berhasil diperbarui. 48 batch terkait telah dihitung ulang batas returnya.",
  "data": {
    "distributor_id": 3,
    "bulan_sebelum_kedaluwarsa": 3,
    "total_batch_terdampak": 48
  }
}
```

---

## BAB 9: KONTRAK LAYANAN MICROSERVICE AI (FASTAPI)

Bagian ini adalah acuan komunikasi internal antara **Backend Express.js** dan **FastAPI Service (Fachri)**.

### 9.1 Endpoint Prediksi Risiko Batch
* **Method & URL:** `POST http://fastapi-ai-service/predict-risk`
* **Headers:** `X-Internal-Secret: <shared_token>`

**Request Body (Batch Features):**
```json
{
  "batch_id": 102,
  "distributor_id": 3,
  "jumlah_awal": 50,
  "jumlah_saat_ini": 50,
  "harga_beli_satuan": 42000.0,
  "sisa_hari_ke_kedaluwarsa": 348,
  "sisa_hari_ke_batas_retur": 165,
  "aturan_retur_bulan": 3,
  "rasio_stok_tersisa": 1.0
}
```

**Response 200 OK:**
```json
{
  "sukses": true,
  "batch_id": 102,
  "skor_risiko": 0.8145,
  "kategori_risiko": "tinggi",
  "faktor_kunci": [
    "Sisa hari ke batas retur di bawah median kategori",
    "Distributor memiliki histori retur rendah"
  ]
}
```

### 9.2 Endpoint Ekstraksi Faktur (Gemini Multimodal Proxy)
* **Method & URL:** `POST http://fastapi-ai-service/extract-invoice`
* **Headers:** `Content-Type: multipart/form-data`
* **Payload:** `image`: byte stream gambar faktur

**Response 200 OK:**
Struktur JSON terstandarisasi yang berisi nomor faktur, distributor, dan array item obat (nama, batch, exp_date, qty, unit_price).

---

*Dokumen ini menjadi kontrak sah antar tim pengembang A26-CS114. Jika ada perubahan nama field atau endpoint, harap hubungi Charlene atau Dio terlebih dahulu.*
