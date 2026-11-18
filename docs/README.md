# Dokumentasi Proyek Capstone Asah 2026 (Dicoding x GoTo)

## ID Tim: A26-CS114
### Proyek: SIMAAF (Sistem Pemantauan Stok dan Kedaluwarsa)
**Mitra UMKM:** Apotek Asahan Farma (Kisaran Timur, Sumatera Utara)  
**PIC UMKM:** Ibu Anni (Komisaris) | WhatsApp: +62811652751  
**NIB:** 1210210063257  

---

## Komposisi Tim Pengembang

| ID Anggota | Nama | Peran | Tanggung Jawab Utama |
|---|---|---|---|
| `fs834b6x0369` | **Charlene Silver** | AI Full-Stack Developer | Arsitektur Backend (Express.js), Autentikasi JWT, Deployment Render, Dokumen SRS & Database |
| `fs123b6y0469` | **Dio Stania Adinata** | AI Full-Stack Developer | Logika Bisnis Batas Retur, Integrasi Model Risiko, Koordinasi Pengujian Sistem |
| `fs007b6y1954` | **Nugroho Anjar Abidin** | AI Full-Stack Developer | Tampilan Frontend (React + Vite + Tailwind CSS), UI Aplikasi & Pengaturan, Deployment Vercel |
| `ds014b6y1893` | **Kendrick Raphael Ticoalu** | Data Science Specialist | Pengumpulan Data, Skema Dataset Sintetis, Visualisasi Dashboard Persediaan |
| `ds206b6y1745` | **Umar Faruq Manek** | Data Science Specialist | Data Wrangling, Analisis Pola Retur & Kedaluwarsa, Sinkronisasi Angka Metrik Bisnis |
| `ae452b6y0528` | **Fachri Abdullah Shiddiq** | Next-Gen AI Engineer | Pipeline Ekstraksi Faktur (Gemini Vision API), Model Klasifikasi Risiko Mandiri, FastAPI Service |

---

## Daftar Dokumen Perancangan Sistem

Dokumen perancangan sistem tersedia dalam format Markdown (.md) dan PDF:

| No | Dokumen | Berkas Markdown | Berkas PDF | Deskripsi & Fokus Pembahasan |
|---|---|---|---|---|
| 1 | **Spesifikasi Kebutuhan (SRS)** | [`01-SRS-SIMAAF.md`](01-SRS-SIMAAF.md) | [`01-SRS-SIMAAF.pdf`](01-SRS-SIMAAF.pdf) | Latar belakang UMKM, ruang lingkup MVP, kebutuhan fungsional & non-fungsional, matriks prioritas. |
| 2 | **Desain Database & ERD** | [`02-Desain-Database.md`](02-Desain-Database.md) | [`02-Desain-Database.pdf`](02-Desain-Database.pdf) | Skema tabel PostgreSQL Neon, diagram ERD relasional, kamus data, indeks query, dan DDL migration. |
| 3 | **Kontrak API (API Contract)** | [`03-API-Contract.md`](03-API-Contract.md) | [`03-API-Contract.pdf`](03-API-Contract.pdf) | Spesifikasi REST API `/api/v1/...`, format JSON standar, upload faktur, opname, serta modul integrasi lanjutan. |
| 4 | **Spesifikasi UI/UX & Frontend** | [`04-Spesifikasi-UI.md`](04-Spesifikasi-UI.md) | [`04-Spesifikasi-UI.pdf`](04-Spesifikasi-UI.pdf) | Design system (Tailwind CSS), layout navigasi, flow interaksi user, dan struktur halaman. |
| 5 | **Rencana Pengujian (Test Plan)** | [`05-Rencana-Pengujian.md`](05-Rencana-Pengujian.md) | [`05-Rencana-Pengujian.pdf`](05-Rencana-Pengujian.pdf) | Skenario uji fungsional & negatif, penanganan error, formulir User Acceptance Testing (UAT). |
| 6 | **Panduan Pengguna (User Manual)** | [`06-Panduan-Pengguna.md`](06-Panduan-Pengguna.md) | [`06-Panduan-Pengguna.pdf`](06-Panduan-Pengguna.pdf) | Panduan operasional untuk pengelola dan karyawan apotek: input faktur, pemantauan retur, dan opname stok fisik. |
| 7 | **Ringkasan Integrasi Backend** | [`BACKEND_SPECIFICATION.md`](BACKEND_SPECIFICATION.md) | - | Ringkasan kebutuhan penggabungan frontend-backend dan daftar fallback state sementara di sisi klien. |

---

## Ringkasan Arsitektur Teknologi

```
[ Klien Browser: Laptop / HP ]
             │
             ▼
[ Frontend: React 18 + Vite + Tailwind CSS ] (Hosting: Vercel)
             │  REST API calls (JWT Bearer)
             ▼
[ Backend: Node.js + Express.js ] (Hosting: Render)
      │                     │
      │ Internal Call       │ SQL Query (Connection Pool)
      ▼                     ▼
[ AI Service: FastAPI ]  [ Database: PostgreSQL 15 ] (Hosting: Neon Serverless)
   ├─ Gemini Vision (Ekstraksi Faktur)
   └─ Scikit-Learn (Model Klasifikasi Risiko Retur Mandiri)
```

---

*Disusun untuk pemenuhan deliverable resmi Capstone Project Asah 2026.*
