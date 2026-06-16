# Metodologi Penelitian

## SiPatrol — Sistem Monitoring Keamanan Terintegrasi

**Studi Kasus:** PLN Nusantara Power UP Kendari

---

## 1. Jenis dan Pendekatan Penelitian

Penelitian ini menggunakan metode **Research & Development (R&D)** dengan model **Waterfall** (System Development Life Cycle). Model Waterfall dipilih karena kebutuhan sistem telah terdefinisi secara jelas dan stabil sejak awal, mengingat proyek ini dikembangkan untuk lingkungan operasional yang spesifik di PLN Nusantara Power UP Kendari. Pendekatan ini memungkinkan pelacakan yang ketat (*traceability*) dari setiap tahap pengembangan, mulai dari analisis kebutuhan hingga evaluasi akhir.

Acuan yang digunakan dalam pengembangan perangkat lunak ini adalah standar **IEEE Std 830-1993** (*IEEE Recommended Practice for Software Requirements Specification*), yang dirujuk langsung dalam dokumen Spesifikasi Kebutuhan Perangkat Lunak (SKPL).

---

## 2. Tahapan Penelitian

Penelitian ini dilaksanakan dalam lima tahap berurutan sebagaimana diilustrasikan berikut:

```
┌──────────────────┐
│  1. Analisis     │
│     Kebutuhan    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  2. Perancangan  │
│     Sistem       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  3. Implementasi │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  4. Pengujian    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  5. Evaluasi     │
│     (EUCS)       │
└──────────────────┘
```

---

### 2.1 Analisis Kebutuhan

Tahap ini bertujuan untuk mengidentifikasi dan mendokumentasikan seluruh kebutuhan sistem berdasarkan permasalahan nyata di lapangan.

#### 2.1.1 Metode Pengumpulan Data

| Metode | Keterangan |
|--------|------------|
| **Observasi** | Pengamatan langsung terhadap prosedur patroli keamanan di PLN Nusantara Power UP Kendari untuk memahami alur kerja sistem manual yang sedang berjalan |
| **Wawancara** | Wawancara dengan dua kategori pengguna: **Security** (petugas lapangan) dan **Admin K3** (supervisor/pusat kontrol) untuk menggali permasalahan dan harapan terhadap sistem baru |
| **Studi Dokumentasi** | Analisis terhadap dokumen prosedur patroli, formulir laporan yang digunakan, dan arsip data pelaporan yang ada |

#### 2.1.2 Hasil Analisis

Dari kegiatan observasi dan wawancara, ditemukan lima permasalahan utama pada sistem manual:

| Masalah | Dampak |
|---------|--------|
| Akurasi Waktu Rendah | Catatan waktu patroli tidak dapat divalidasi kebenarannya |
| Validasi Lokasi Lemah | Tidak ada bukti petugas benar-benar berada di lokasi patroli |
| Delay Informasi | Laporan terlambat sampai ke pusat kontrol |
| Area Blank Spot | Kehilangan data di area tanpa sinyal |
| Potensi Manipulasi | Upload foto dari galeri (bukan real-time) |

#### 2.1.3 Spesifikasi Kebutuhan Perangkat Lunak

Hasil analisis kebutuhan didokumentasikan ke dalam **SKPL (Spesifikasi Kebutuhan Perangkat Lunak)** yang mencakup:

- **34 kebutuhan fungsional** (SRS-F-OUT-001 s.d. SRS-F-OUT-034)
- **6 kebutuhan non-fungsional** (SRS-NF-001 s.d. SRS-NF-006)
- Pemetaan dalam bentuk **Data Flow Diagram (DFD)** level 0 (Context Diagram) dan level 1
- **Entity Relationship Diagram (ERD)** sebagai representasi kebutuhan data

---

### 2.2 Perancangan Sistem

Tahap perancangan mengubah *"apa"* yang harus dibangun (dari SKPL) menjadi *"bagaimana"* cara membangunnya secara teknis.

#### 2.2.1 Arsitektur Sistem

Arsitektur SiPatrol menggunakan pendekatan **offline-first Progressive Web App (PWA)** dengan tiga lapisan:

```
┌─────────────────────────────────────────────────────┐
│                 CLIENT LAYER                         │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │  Security Module │  │   Admin Module   │         │
│  │  (Mobile-First)  │  │ (Desktop-First)  │         │
│  └────────┬─────────┘  └────────┬─────────┘         │
│           │                     │                    │
│           └──────────┬──────────┘                    │
│                      ▼                               │
│           ┌──────────────────────┐                   │
│           │   Service Worker     │                   │
│           │  (Serwist 9.5)       │                   │
│           └──────────────────────┘                   │
│           │              │              │            │
│  ┌────────▼──┐  ┌───────▼───────┐  ┌───▼────────┐  │
│  │ IndexedDB │  │  Cache API    │  │LocalStorage │  │
│  └───────────┘  └───────────────┘  └────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               APPLICATION LAYER                      │
│  ┌─────────────────────────────────────────────────┐│
│  │           Next.js 15 App Router                 ││
│  │  ┌──────────────┐ ┌──────────┐ ┌─────────────┐ ││
│  │  │  API Routes  │ │  Server  │ │ Middleware   │ ││
│  │  │  /api/*      │ │ Actions  │ │ (Auth Guard) │ ││
│  │  └──────────────┘ └──────────┘ └─────────────┘ ││
│  │  ┌──────────────────────────────────────────────┐││
│  │  │     Authentication (NextAuth.js)             │││
│  │  │  Credentials + JWT + bcrypt + RBAC          │││
│  │  └──────────────────────────────────────────────┘││
│  │  ┌──────────────────────────────────────────────┐││
│  │  │   AI/LLM Integration (Vercel AI SDK + Groq) │││
│  │  │   Read-only NL → SQL Query                  │││
│  │  └──────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────┘│
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                 DATA LAYER                           │
│              MySQL Database                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ profiles │ │  units   │ │ reports  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐                          │
│  │ unit_    │ │ report_  │                          │
│  │ locations│ │categories│                          │
│  └──────────┘ └──────────┘                          │
└─────────────────────────────────────────────────────┘
```

#### 2.2.2 Spesifikasi Teknis

Perancangan sistem menghasilkan dua dokumen utama:

| Dokumen | Isi |
|---------|-----|
| **SDD (Software Detailed Design)** | Cetak biru implementasi: arsitektur perangkat lunak, desain 13 layar utama (LC-01 s.d. LC-13), komponen UI reusable, pseudo-code 4 algoritma kritis, dan matriks keterlacakan ke SKPL |
| **SPEK (Spesifikasi Teknis)** | Tech stack lengkap, struktur database detail, konfigurasi environment, alur operasional, dan panduan deployment |

#### 2.2.3 Perancangan Basis Data

Basis data dirancang dengan lima entitas utama:

- **profiles** — Data pengguna dengan role (admin/security) dan penugasan unit
- **units** — Data unit operasional dengan distrik/wilayah
- **unit_locations** — Data lokasi patroli per unit induk
- **report_categories** — Data kategori laporan (Aman, Unsafe Condition, Unsafe Action) dengan color coding
- **reports** — Data inti laporan patroli dengan relasi ke seluruh entitas

Selain penyimpanan server, dirancang pula penyimpanan **client-side** menggunakan **IndexedDB** untuk menampung data laporan saat mode offline.

#### 2.2.4 Perancangan Algoritma Kritis

Empat algoritma utama dirancang dalam bentuk pseudo-code di dokumen SDD:

1. **RBAC Authentication** — Alur autentikasi dengan verifikasi bcrypt dan pembuatan sesi JWT
2. **Offline Detection & Storage** — Deteksi koneksi dan penyimpanan laporan ke IndexedDB
3. **Auto GPS Lock & Timestamp** — Penguncian koordinat dan waktu otomatis saat pengambilan foto
4. **AI Read-only Query** — Generasi SQL dari bahasa natural dengan akses SELECT saja

---

### 2.3 Implementasi

Tahap implementasi menerjemahkan perancangan ke dalam kode program menggunakan teknologi sebagai berikut:

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Next.js (App Router) | 15.x |
| Bahasa | TypeScript | 5.9.x |
| Authentication | NextAuth.js (Credentials Provider) | 4.24.x |
| Database ORM | Prisma | 5.22.x |
| Database | MySQL | 8.x |
| UI Components | shadcn/ui | New York style |
| Styling | Tailwind CSS | 4.x |
| PWA | Serwist | 9.5.x |
| Maps | Leaflet + React-Leaflet | 1.9.x |
| AI/LLM | Vercel AI SDK + Groq (Llama 3.3 70B) | Terbaru |
| Validasi | Zod | 3.25.x |
| Password Hashing | bcryptjs | 3.x |

Implementasi mencakup dua modul utama sesuai dengan peran pengguna:

#### Modul Security (Petugas Lapangan)
- Login berbasis sesi dengan role-based redirect
- Form laporan dengan real-time camera capture
- Auto GPS locking dan timestamp
- Mode offline dengan penyimpanan IndexedDB dan auto-sync
- Riwayat laporan pribadi dengan filter tanggal
- Manajemen profil dan perubahan password

#### Modul Admin (Pusat Kontrol)
- Dashboard live feed 5 laporan terbaru
- CRUD manajemen unit, user, lokasi, kategori
- Filter laporan dengan multi-kriteria
- Bulk delete dan ekspor data ke Excel (xlsx)
- Visualisasi peta patroli dengan Leaflet
- AI chatbot untuk natural language query database

---

### 2.4 Pengujian

Pengujian dilakukan menggunakan metode **Black-box Testing**, yaitu menguji fungsionalitas sistem dari sisi *input/output* tanpa melihat struktur internal kode.

#### 2.4.1 Matriks Test Case

Setiap kebutuhan fungsional pada SKPL dipetakan ke dalam skenario uji yang terdokumentasi dalam **MATRIKS_TEST_CASE.md**. Matriks ini mencakup:

| ID Kebutuhan | Skenario Uji | Input | Output yang Diharapkan | Status |
|--------------|--------------|-------|------------------------|--------|
| SRS-F-OUT-001 | Menampilkan halaman login | Buka URL /login | Form username & password tampil | ✓ |
| SRS-F-OUT-007 | Menerima data laporan | Isi form + upload foto | Data tersimpan di database | ✓ |
| SRS-F-OUT-012 | Menyimpan laporan offline | Submit saat offline | Data tersimpan di IndexedDB | ✓ |
| ... | ... | ... | ... | ... |

#### 2.4.2 Lingkup Pengujian

- **Fungsional**: Seluruh 34 kebutuhan fungsional diuji
- **Keamanan**: RBAC middleware, proteksi route, validasi server-side
- **Offline/Online**: Skenario submit saat online, offline, dan auto-sync
- **Anti-Fraud**: Verifikasi bahwa upload hanya dari kamera langsung

---

### 2.5 Evaluasi Sistem — Metode EUCS (End User Computing Satisfaction)

Tahap akhir penelitian mengevaluasi tingkat kepuasan pengguna terhadap sistem SiPatrol menggunakan model **End User Computing Satisfaction (EUCS)** yang dikembangkan oleh Doll & Torkzadeh (1988).

#### 2.5.1 Dimensi EUCS

Model EUCS mengukur kepuasan pengguna melalui lima dimensi:

| Dimensi | Definisi | Indikator dalam Konteks SiPatrol |
|---------|----------|----------------------------------|
| **Content** | Kualitas dan kelengkapan isi/ informasi yang disediakan sistem | Kelengkapan data laporan, kejelasan informasi kategori, akurasi data GPS dan timestamp, kecukupan informasi di dashboard |
| **Accuracy** | Tingkat keakuratan data yang dihasilkan sistem | Kebenaran koordinat GPS, ketepatan waktu captured_at, validitas data laporan yang tersimpan, kesesuaian data di admin dashboard |
| **Format** | Kualitas tampilan dan tata letak antarmuka sistem | Kemudahan membaca informasi, konsistensi tata letak, warna dan badge kategori yang informatif, responsivitas di perangkat mobile dan desktop |
| **Ease of Use** | Kemudahan pengguna dalam mengoperasikan sistem | Kemudahan membuat laporan, navigasi antar menu, penggunaan mode offline, kemudahan filter dan pencarian data, interaksi dengan AI chatbot |
| **Timeliness** | Kecepatan dan ketepatan waktu sistem dalam menyajikan informasi | Kecepatan submit laporan, real-time live feed di dashboard, kecepatan sinkronisasi offline, responsivitas AI chatbot |

#### 2.5.2 Instrumen Penelitian

Instrumen yang digunakan adalah **kuesioner tertutup** dengan skala **Likert 5 poin**:

| Skor | Keterangan |
|------|------------|
| 1 | Sangat Tidak Setuju (STS) |
| 2 | Tidak Setuju (TS) |
| 3 | Netral (N) |
| 4 | Setuju (S) |
| 5 | Sangat Setuju (SS) |

Setiap dimensi diwakili oleh 3–5 pernyataan, sehingga total item pernyataan berkisar antara 15–25 butir.

#### 2.5.3 Populasi dan Sampel

| Aspek | Keterangan |
|-------|------------|
| **Populasi** | Seluruh pengguna aktif sistem SiPatrol di PLN Nusantara Power UP Kendari |
| **Teknik Sampling** | Total sampling (sensus) — seluruh populasi dijadikan responden |
| **Kriteria** | Pengguna yang telah menggunakan sistem minimal 2 minggu |

#### 2.5.4 Teknik Analisis Data

Data hasil kuesioner dianalisis menggunakan **statistik deskriptif**:

1. **Skor rata-rata per dimensi** dihitung untuk mengetahui tingkat kepuasan pada setiap aspek EUCS
2. **Skor rata-rata keseluruhan** dihitung untuk mengetahui tingkat kepuasan pengguna secara umum
3. **Kategori kepuasan** ditentukan berdasarkan interval skor:

| Interval Skor Rata-rata | Kategori Kepuasan |
|-------------------------|-------------------|
| 1,00 – 1,80 | Sangat Tidak Puas |
| 1,81 – 2,60 | Tidak Puas |
| 2,61 – 3,40 | Netral |
| 3,41 – 4,20 | Puas |
| 4,21 – 5,00 | Sangat Puas |

4. Hasil analisis digunakan sebagai **rekomendasi perbaikan** sistem ke depannya.

---

## 3. Kerangka Berpikir Penelitian

```
┌──────────────────────────────────────────────────────────────────┐
│                        LATAR BELAKANG                            │
│  Sistem manual patroli di PLN UP Kendari memiliki kelemahan:     │
│  akurasi waktu rendah, validasi lokasi lemah, delay informasi,   │
│  blank spot area, potensi manipulasi foto                       │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      RUMUSAN MASALAH                             │
│  Bagaimana merancang dan membangun sistem monitoring patroli     │
│  keamanan terintegrasi berbasis PWA dengan fitur offline,        │
│  validasi GPS, dan anti-fraud?                                   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                        METODE PENELITIAN                         │
│             Research & Development — Model Waterfall             │
├──────────┬──────────┬──────────┬──────────┬─────────────────────┤
│ Analisis │Perancang-│Implement-│Pengujian │    Evaluasi EUCS    │
│Kebutuhan │an Sistem │  tasi    │(Blackbox)├────────┬────────────┤
│(SKPL)    │(SDD,     │(Coding)  │          │Kuesi-  │Analisis    │
│          │ SPEK)    │          │          │oner    │Deskriptif  │
└──────────┴──────────┴──────────┴──────────┴────────┴────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                         OUTPUT PENELITIAN                        │
│  Aplikasi SiPatrol + Dokumen teknis (SKPL, SDD, SPEK) +         │
│  Laporan pengujian + Tingkat kepuasan pengguna (EUCS)           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Jadwal Penelitian

| Tahap | Kegiatan | Durasi |
|-------|----------|--------|
| Analisis Kebutuhan | Observasi, wawancara, studi dokumentasi, penyusunan SKPL | 1 minggu |
| Perancangan Sistem | Perancangan arsitektur, database, UI/UX, penyusunan SDD & SPEK | 1 minggu |
| Implementasi | Coding modul security & admin, integrasi PWA, GPS, AI | 3 minggu |
| Pengujian | Penyusunan matriks test case, eksekusi black-box testing | 1 minggu |
| Evaluasi EUCS | Penyusunan kuesioner, pengambilan data, analisis hasil | 1 minggu |
| **Total** | | **±7 minggu** |

---

## 5. Referensi Metodologi

- Doll, W. J., & Torkzadeh, G. (1988). *The Measurement of End-User Computing Satisfaction*. MIS Quarterly, 12(2), 259–274.
- IEEE Std 830-1993. *IEEE Recommended Practice for Software Requirements Specifications*.
- Pressman, R. S. (2014). *Software Engineering: A Practitioner's Approach*. McGraw-Hill.
- Sugiyono. (2013). *Metode Penelitian Kuantitatif, Kualitatif, dan R&D*. Alfabeta.
