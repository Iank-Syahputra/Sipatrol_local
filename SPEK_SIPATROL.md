# Dokumen Spesifikasi Proyek SiPatrol
## Sistem Monitoring Keamanan Terintegrasi

**Studi Kasus:** PLN Nusantara Power UP Kendari  
**Versi Dokumen:** 2.0 (Revisi Berdasarkan Implementasi Aktual)  
**Tanggal:** 13 Maret 2026

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang Proyek](#2-latar-belakang-proyek)
3. [Tujuan dan Ruang Lingkup](#3-tujuan-dan-ruang-lingkup)
4. [Arsitektur Sistem](#4-arsitektur-sistem)
5. [Spesifikasi Teknis](#5-spesifikasi-teknis)
6. [Struktur Database](#6-struktur-database)
7. [Fitur Utama](#7-fitur-utama)
8. [Alur Operasional](#8-alur-operasional)
9. [Keamanan dan Otorisasi](#9-keamanan-dan-otorisasi)
10. [Struktur Folder Proyek](#10-struktur-folder-proyek)
11. [Panduan Deployment](#11-panduan-deployment)

---

## 1. Ringkasan Eksekutif

**SiPatrol** (Sistem Patrol) adalah aplikasi web berbasis **Progressive Web App (PWA)** yang dirancang untuk mendigitalkan proses pelaporan keamanan dan patroli di lingkungan operasional vital dengan banyak unit yang tersebar (±15 unit).

### Stakeholder
| Peran | Deskripsi |
|-------|-----------|
| **Security/Petugas Patroli** | Pengguna lapangan yang melakukan patroli dan melaporkan kondisi |
| **Admin/Supervisor** | Pengawas yang memonitor aktivitas dan mengelola data master |

### Value Proposition
- ✅ Akurasi waktu dan lokasi real-time dengan GPS locking
- ✅ Validasi lokasi patroli dengan geo-tagging otomatis
- ✅ Solusi area blank spot dengan mode offline (store-and-forward)
- ✅ Anti-fraud dengan pembatasan upload dari kamera langsung
- ✅ Dashboard monitoring real-time untuk supervisi

---

## 2. Latar Belakang Proyek

### 2.1 Permasalahan Sistem Lama

Sistem manual sebelumnya memiliki kelemahan signifikan:

| Masalah | Dampak |
|---------|--------|
| **Akurasi Waktu Rendah** | Catatan waktu patroli tidak dapat divalidasi |
| **Validasi Lokasi Lemah** | Tidak ada bukti petugas benar-benar berada di lokasi patroli |
| **Delay Informasi** | Laporan terlambat sampai ke pusat kontrol |
| **Area Blank Spot** | Kehilangan data di area tanpa sinyal |
| **Potensi Manipulasi** | Upload foto dari galeri (bukan real-time) |

### 2.2 Solusi SiPatrol

Aplikasi web-based yang menghubungkan:
- **Petugas Lapangan (Security)** → Melaporkan kondisi secara real-time
- **Pusat Kontrol (Admin)** → Monitoring dan audit laporan

---

## 3. Tujuan dan Ruang Lingkup

### 3.1 Tujuan Fungsional

1. **Digitalisasi Laporan Patroli** - Mengganti sistem manual dengan laporan digital
2. **Validasi Lokasi Real-time** - GPS auto-lock saat pelaporan
3. **Mode Offline** - Simpan data lokal saat tidak ada sinyal, sinkronisasi otomatis saat online
4. **Anti-Fraud** - Kamera langsung, nonaktifkan upload dari galeri
5. **Dashboard Monitoring** - Live feed 5 laporan terbaru

### 3.2 Ruang Lingkup Fitur

#### Modul Security (Petugas Lapangan)
- Login dengan akun personal
- Create laporan dengan foto real-time
- Auto GPS locking (latitude/longitude)
- Mode offline dengan auto-sync
- Riwayat laporan pribadi

#### Modul Admin (Pusat Kontrol)
- Dashboard dengan live feed
- Manajemen master data (Unit, User, Lokasi)
- Filtering dan audit laporan
- Manajemen kategori laporan
- Visualisasi peta patroli

---

## 4. Arsitektur Sistem

### 4.1 Tech Stack

| Komponen | Teknologi | Versi | Deskripsi |
|----------|-----------|-------|-----------|
| **Framework** | Next.js | 15.x | App Router dengan Server Components |
| **Bahasa** | TypeScript | 5.9.x | Type-safe development |
| **Authentication** | NextAuth.js | 4.24.x | Session management dengan credentials provider |
| **Database ORM** | Prisma | 5.22.x | Type-safe database access |
| **Database** | MySQL | - | Relational database via mysql2 |
| **UI Framework** | shadcn/ui | - | 40+ komponen UI modern |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **PWA** | Serwist | 9.5.x | Service worker untuk offline mode |
| **Maps** | Leaflet | 1.9.x | Visualisasi lokasi patroli |
| **Icons** | Lucide React | 0.532.x | Icon library modern |
| **AI/LLM** | Vercel AI SDK + Groq | Terbaru | AI chatbot dengan Llama 3.3 70B |

### 4.2 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Security UI   │  │    Admin UI     │  │   PWA Service   │ │
│  │   (Mobile)      │  │   (Desktop)     │  │   Worker        │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js App Router (Server)                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ API Routes   │  │ Server       │  │ Middleware   │  │   │
│  │  │ /api/*       │  │ Actions      │  │ (Auth Guard) │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │  ┌──────────────┐                                       │   │
│  │  │ AI Streaming │  (Vercel AI SDK)                      │   │
│  │  │ /api/chat    │                                       │   │
│  │  └──────────────┘                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Prisma ORM Layer                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
┌───────────────────┐ ┌───────────────────────────────────────────┐
│    DATA LAYER     │ │         AI/LLM LAYER                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    MySQL Database                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │  units   │  │ profiles │  │  reports │  │categories│ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Groq Cloud API (LLM Provider)              │   │
│  │  Model: Llama 3.3 70B (llama-3.3-70b-versatile)         │   │
│  │  - Read-only DB access untuk query natural language     │   │
│  │  - Streaming response untuk chat interface              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Spesifikasi Teknis

### 5.1 Dependencies Utama

```json
{
  "dependencies": {
    "next": "^15.5.11",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "next-auth": "^4.24.13",
    "mysql2": "^3.16.3",
    "@prisma/client": "^5.19.1",
    "@serwist/next": "^9.5.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^5.0.0",
    "lucide-react": "^0.532.0",
    "zod": "^3.25.76",
    "bcryptjs": "^3.0.3",
    "ai": "^4.x",
    "groq-sdk": "^0.x"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "typescript": "^5.9.3",
    "tailwindcss": "^4",
    "eslint": "^9"
  }
}
```

### 5.2 Requirements Sistem

| Komponen | Minimum | Rekomendasi |
|----------|---------|-------------|
| **Node.js** | 18.x | 20.x LTS |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 1 GB | 5 GB+ |
| **Browser** | Chrome 90+ | Chrome/Edge terbaru |

### 5.3 Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/sipatrol"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="rahasia_dapur_sipatrol_2026"

# Application
PUBLIC_APP_NAME="SiPatrol"

# AI/LLM Configuration (Groq)
GROQ_API_KEY="gsk_xxx"
AI_MODEL_NAME="llama-3.3-70b-versatile"

# Read-only DB untuk AI (keamanan query)
READ_ONLY_DATABASE_URL="mysql://ai_reader:password@localhost:3306/sipatrol"
```

---

## 6. Struktur Database

### 6.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      units      │       │ report_categories│
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ name            │
│ district        │       │ color           │
│ created_at      │       │ created_at      │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │ 1:N                     │ 1:N
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│  unit_locations │       │     reports     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ unit_id (FK)    │       │ user_id (FK)    │
│ name            │       │ unit_id (FK)    │
│ created_at      │       │ category_id(FK) │
└─────────────────┘       │ location_id(FK) │
                          │ image_path      │
                          │ notes           │
                          │ latitude        │
                          │ longitude       │
                          │ captured_at     │
                          │ is_offline_...  │
                          │ created_at      │
                          └────────┬────────┘
                                   │ N:1
                                   ▼
                          ┌─────────────────┐
                          │    profiles     │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ username        │
                          │ password        │
                          │ full_name       │
                          │ role (enum)     │
                          │ phone_number    │
                          │ assigned_unit_..│
                          │ created_at      │
                          └─────────────────┘
```

### 6.2 Schema Detail

#### Tabel: `units`
| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | VARCHAR(36) | PRIMARY KEY, UUID | Identifier unik unit |
| `name` | VARCHAR | NOT NULL | Nama unit (contoh: "ULPLTD WUAWUA") |
| `district` | VARCHAR | NOT NULL | Wilayah/distrik unit |
| `created_at` | DATETIME | DEFAULT NOW() | Waktu pembuatan record |

#### Tabel: `profiles`
| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | VARCHAR(36) | PRIMARY KEY, UUID | Identifier unik user |
| `username` | VARCHAR | UNIQUE | Username untuk login |
| `password` | VARCHAR | - | Hash password (bcrypt) |
| `full_name` | VARCHAR | NOT NULL | Nama lengkap |
| `role` | ENUM | DEFAULT 'security' | Role: 'admin' atau 'security' |
| `phone_number` | VARCHAR | - | Nomor telepon |
| `assigned_unit_id` | VARCHAR(36) | FOREIGN KEY → units.id | Unit penugasan |
| `created_at` | DATETIME | DEFAULT NOW() | Waktu pembuatan record |

#### Tabel: `reports`
| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | VARCHAR(36) | PRIMARY KEY, UUID | Identifier unik laporan |
| `user_id` | VARCHAR(36) | FOREIGN KEY → profiles.id | Pelapor |
| `unit_id` | VARCHAR(36) | FOREIGN KEY → units.id | Unit terkait |
| `category_id` | VARCHAR(36) | FOREIGN KEY → report_categories.id | Kategori laporan |
| `location_id` | VARCHAR(36) | FOREIGN KEY → unit_locations.id | Lokasi spesifik |
| `image_path` | VARCHAR | - | Path file gambar bukti |
| `notes` | TEXT | - | Catatan/deskripsi laporan |
| `latitude` | FLOAT | - | Koordinat latitude GPS |
| `longitude` | FLOAT | - | Koordinat longitude GPS |
| `captured_at` | DATETIME | NOT NULL | Waktu pengambilan data |
| `is_offline_submission` | BOOLEAN | DEFAULT FALSE | Flag mode offline |
| `location_name_cached` | VARCHAR | - | Cache nama lokasi |
| `created_at` | DATETIME | DEFAULT NOW() | Waktu pembuatan record |

#### Tabel: `report_categories`
| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | VARCHAR(36) | PRIMARY KEY, UUID | Identifier unik kategori |
| `name` | VARCHAR | UNIQUE | Nama kategori |
| `color` | VARCHAR | DEFAULT 'gray' | Warna identifikasi |
| `created_at` | DATETIME | DEFAULT NOW() | Waktu pembuatan record |

#### Tabel: `unit_locations`
| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | VARCHAR(36) | PRIMARY KEY, UUID | Identifier unik lokasi |
| `unit_id` | VARCHAR(36) | FOREIGN KEY → units.id, ON DELETE CASCADE | Unit induk |
| `name` | VARCHAR | NOT NULL | Nama lokasi (contoh: "Pos Security") |
| `created_at` | DATETIME | DEFAULT NOW() | Waktu pembuatan record |

**Unique Constraint:** `(unit_id, name)` - Nama lokasi unik per unit

### 6.3 Enum: `Role`

```typescript
enum Role {
  admin      // Administrator dengan akses penuh
  security   // Petugas keamanan lapangan
}
```

---

## 7. Fitur Utama

### 7.1 Modul Security (Petugas Lapangan)

#### 7.1.1 Authentication
- **Login berbasis session** dengan NextAuth.js credentials provider
- **Password hashing** menggunakan bcryptjs
- **Session persistence** dengan JWT token
- **Role-based redirect** - Security diarahkan ke `/security`

#### 7.1.2 Create Laporan
| Fitur | Deskripsi |
|-------|-----------|
| **Real-time Camera** | Akses kamera langsung via browser API |
| **Anti-Gallery Upload** | Pembatasan hanya capture real-time (anti-fraud) |
| **Auto GPS Lock** | Latitude/longitude otomatis saat foto diambil |
| **Auto Timestamp** | Waktu captured_at terkunci otomatis |
| **Kategori Laporan** | Pilihan: Aman, Unsafe Condition, Unsafe Action |
| **Lokasi Patroli** | Dropdown lokasi berdasarkan unit penugasan |
| **Notes/Catatan** | Input teks deskripsi kondisi |

#### 7.1.3 Mode Offline (Store-and-Forward)
```
┌─────────────────────────────────────────────────────────────┐
│                    OFFLINE FLOW                             │
│                                                             │
│  1. User create report ──► No internet? ──► YES            │
│                              │                              │
│                              ▼                              │
│  2. Save to IndexedDB/LocalStorage                          │
│     - Image (base64/blob)                                   │
│     - Form data                                             │
│     - GPS coordinates                                       │
│                              │                              │
│                              ▼                              │
│  3. Background sync when online ──► Auto upload to server  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Teknologi:** Serwist (PWA) + Dexie.js (IndexedDB wrapper)

#### 7.1.4 Riwayat Laporan
- Daftar semua laporan yang pernah dibuat
- Filter berdasarkan tanggal
- Status laporan (pending/verified)
- Preview foto dan detail laporan

### 7.2 Modul Admin (Pusat Kontrol)

#### 7.2.1 Dashboard
**Live Feed - 5 Laporan Terbaru**
- Chronological order (terbaru pertama)
- Informasi: Nama pelapor, unit, waktu, lokasi GPS
- Preview foto bukti
- Badge kategori dengan color coding

**Statistik Cards**
| Metric | Deskripsi |
|--------|-----------|
| Total Unit | Jumlah unit aktif |
| Laporan Terbaru | Aktivitas terkini |
| Patroli Aktif | Unit dengan aktivitas |
| Petugas Keamanan | Personel terdaftar |

#### 7.2.2 Manajemen Unit
- **CRUD Operations** untuk unit keamanan
- **Nested Locations** - Kelola lokasi patroli per unit
- **District Mapping** - Pengelompokan berdasarkan wilayah

#### 7.2.3 Manajemen User
- **User Management** - Create, update, delete profiles
- **Role Assignment** - Set role admin/security
- **Unit Assignment** - Tugaskan security ke unit tertentu
- **Password Management** - Reset password dengan bcrypt hashing

#### 7.2.4 Laporan & Filtering
**Advanced Filter:**
- Filter berdasarkan Unit
- Filter berdasarkan Rentang Tanggal
- Filter berdasarkan Pelapor
- Filter berdasarkan Kategori

**Bulk Actions:**
- Delete multiple reports
- Export data (xlsx)

#### 7.2.5 Peta Patroli
- Visualisasi lokasi patroli dengan Leaflet
- Marker untuk setiap laporan
- Cluster marker untuk area padat
- Popup detail laporan

### 7.3 Fitur Tambahan

| Fitur | Deskripsi |
|-------|-----------|
| **Dark Mode** | next-themes dengan system preference detection |
| **Responsive Design** | Mobile-first dengan Tailwind CSS |
| **Real-time Updates** | Revalidate on mutation |
| **Form Validation** | Zod schema validation |
| **Toast Notifications** | Sonner untuk feedback user |
| **Loading States** | Skeleton loaders dan spinners |

### 7.4 Asisten AI (AI Chatbot)

**Fitur AI-powered untuk membantu Admin dalam analisis data**

#### 7.4.1 Natural Language Query Database
| Fitur | Deskripsi |
|-------|-----------|
| **Query Bahasa Natural** | Admin dapat bertanya menggunakan bahasa sehari-hari |
| **Read-Only Access** | AI hanya memiliki akses SELECT ke database |
| **SQL Generation** | AI menghasilkan SQL query yang aman dan tervalidasi |
| **Streaming Response** | Jawaban ditampilkan secara real-time |

**Contoh Pertanyaan:**
- "Tampilkan semua laporan unsafe condition minggu ini"
- "Berapa jumlah patroli di ULPLTD WUAWUA bulan ini?"
- "Siapa security yang paling aktif melapor?"
- "Tampilkan rata-rata laporan per hari"

#### 7.4.2 Arsitektur AI Assistant
```
┌──────────────────────────────────────────────────────────────┐
│                    AI ASSISTANT FLOW                         │
└──────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   User asks  │────►│  Vercel AI   │────►│   Groq API   │
  │   question   │     │    SDK       │     │  (Llama 3.3) │
  └──────────────┘     └──────────────┘     └──────┬───────┘
                                                   │
                    ┌──────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐     ┌─────────────────┐
         │  Generate SQL Query │────►│  Read-Only DB   │
         │  (validated & safe) │     │  (SELECT only)  │
         └─────────────────────┘     └────────┬────────┘
                                              │
                    ┌─────────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐     ┌─────────────────┐
         │  Format Response    │────►│  Stream to UI   │
         │  (natural language) │     │  (typewriter)   │
         └─────────────────────┘     └─────────────────┘
```

#### 7.4.3 Keamanan AI Assistant
| Aspek | Implementasi |
|-------|--------------|
| **Read-Only User** | Database user khusus dengan privilege SELECT saja |
| **Query Validation** | SQL query divalidasi sebelum eksekusi (hanya SELECT) |
| **Rate Limiting** | Membatasi jumlah request per menit |
| **Audit Log** | Semua query AI dicatat untuk audit trail |
| **Prompt Engineering** | System prompt membatasi hanya untuk query database |

#### 7.4.4 UI/UX Chatbot
- **Chat Interface** - Interface chat modern dengan streaming response
- **Query Preview** - Menampilkan SQL query yang dihasilkan (transparansi)
- **Result Table** - Hasil query ditampilkan dalam tabel
- **Export Option** - Ekspor hasil query ke CSV/Excel
- **Chat History** - Riwayat percakapan tersimpan per session

---

## 8. Alur Operasional

### 8.1 Flow Security - Create Laporan

```
┌─────────────────────────────────────────────────────────────────┐
│              SECURITY REPORTING FLOW                            │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  LOGIN   │────►│ DASHBOARD│────►│  CREATE  │
  │          │     │  SECURITY│     │  REPORT  │
  └──────────┘     └──────────┘     └────┬─────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
             ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
             │   CAPTURE   │     │   SELECT    │     │   FILL      │
             │    PHOTO    │     │  CATEGORY   │     │   NOTES     │
             │  (Camera)   │     │  & Location │     │  (Optional) │
             └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
                    │                   │                    │
                    └───────────────────┼────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │   CHECK INTERNET│
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │ ONLINE           │OFFLINE           │
                    ▼                  ▼                  ▼
           ┌────────────────┐  ┌────────────────┐  ┌──────────────┐
           │  UPLOAD TO     │  │  SAVE TO       │  │  BACKGROUND  │
           │  SERVER        │  │  LOCAL STORAGE │  │  SYNC LATER  │
           └────────────────┘  └────────────────┘  └──────────────┘
```

### 8.2 Flow Admin - Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN MONITORING FLOW                        │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  LOGIN   │────►│ DASHBOARD│────►│  VIEW    │
  │  ADMIN   │     │   ADMIN  │     │  REPORTS │
  └──────────┘     └──────────┘     └────┬─────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
             ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
             │   FILTER    │     │   EXPORT    │     │   DELETE    │
             │  BY CRITERIA│     │    DATA     │     │  (BULK)     │
             └─────────────┘     └─────────────┘     └─────────────┘
```

### 8.3 Skenario Penggunaan

#### Skenario 1: Patroli Normal (Online)
1. Security login dengan username/password
2. Navigasi ke menu "Buat Laporan"
3. Pilih kategori "Aman"
4. Pilih lokasi "Pos Security Utama"
5. Capture foto kondisi lapangan
6. Tambahkan catatan "Kondisi normal, tidak ada anomali"
7. Submit → Data langsung terkirim ke server
8. Admin melihat laporan di dashboard dalam hitungan detik

#### Skenario 2: Patroli di Area Blank Spot (Offline)
1. Security berada di area tanpa sinyal
2. Create laporan seperti biasa
3. Aplikasi mendeteksi tidak ada koneksi internet
4. Data disimpan di IndexedDB browser
5. Security melanjutkan patroli
6. Ketika kembali ke area bersinyal:
   - Service worker mendeteksi koneksi kembali
   - Background sync mengirim data tertunda
7. Laporan muncul di server dengan timestamp asli (`captured_at`)
8. Flag `is_offline_submission = true` untuk audit trail

---

## 9. Keamanan dan Otorisasi

### 9.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  NEXTAUTH AUTHENTICATION                        │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  CREDENTIAL│    │  VERIFY  │     │  CREATE  │
  │   INPUT   │────►│  PASSWORD│────►│  SESSION │
  └──────────┘     └──────────┘     └────┬─────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │  JWT TOKEN (Signed) │
                              │  - user.id          │
                              │  - user.role        │
                              │  - user.username    │
                              └─────────────────────┘
```

### 9.2 Middleware Protection

| Route Pattern | Akses | Redirect Jika Denied |
|---------------|-------|---------------------|
| `/admin/*` | Admin only | `/security` |
| `/security/*` | Security & Admin | `/login` |
| `/login` | Unauthenticated users | Dashboard berdasarkan role |

### 9.3 Role-Based Access Control

```typescript
// Middleware logic
if (isAdminRoute && token?.role !== 'admin') {
  return NextResponse.redirect(new URL('/security', req.url));
}

if (isSecurityRoute && token?.role !== 'security' && token?.role !== 'admin') {
  return NextResponse.redirect(new URL('/login', req.url));
}
```

### 9.4 Password Security

- **Hashing Algorithm:** bcryptjs
- **Salt Rounds:** 10
- **Storage:** Hashed password di database (bukan plain text)

```typescript
// Password hashing (seed.ts)
const hashedPassword = await bcrypt.hash('password123', 10);

// Password verification (API route)
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

### 9.5 Database Security

| Aspek | Implementasi |
|-------|--------------|
| **Connection String** | Environment variable (`.env`) |
| **SQL Injection** | Prevented by Prisma ORM (parameterized queries) |
| **Data Validation** | Zod schema validation di server actions |
| **Audit Trail** | `created_at`, `is_offline_submission` flags |

---

## 10. Struktur Folder Proyek

```
Sipatrol_local/
├── prisma/
│   ├── schema.prisma          # Database schema & models
│   └── seed.ts                # Seed data untuk development
│
├── public/
│   ├── image.jpeg             # Background image
│   └── sw.js                  # Generated service worker
│
├── src/
│   ├── actions/
│   │   └── report-actions.ts  # Server actions untuk reports
│   │
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   ├── reports/       # Admin report management
│   │   │   ├── units/         # Unit management
│   │   │   ├── users/         # User management
│   │   │   ├── map/           # Patrol map visualization
│   │   │   └── chatbot/       # AI chatbot assistant (NEW)
│   │   │                      # Fitur: Natural language query database
│   │   │
│   │   ├── security/
│   │   │   ├── report/        # Create report form
│   │   │   ├── reports/       # Security report history
│   │   │   └── profile/       # Security profile
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx       # Login page
│   │   │
│   │   ├── api/
│   │   │   └── auth/          # NextAuth API routes
│   │   │
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage (landing)
│   │   └── globals.css        # Global styles
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── security/          # Security-specific components
│   │   ├── admin-sidebar.tsx  # Admin navigation
│   │   ├── security-sidebar.tsx # Security navigation
│   │   ├── report-form.tsx    # Report creation form
│   │   ├── patrol-map.tsx     # Leaflet map component
│   │   └── theme-toggle.tsx   # Dark mode toggle
│   │
│   ├── hooks/                 # Custom React hooks
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── sipatrol-db.ts     # Database helper functions
│   │   ├── db-readonly.ts     # Read-only database utilities (untuk AI)
│   │   ├── ai-config.ts       # AI/LLM configuration (Groq, Vercel AI SDK)
│   │   ├── sw.ts              # Service worker definition
│   │   ├── user.ts            # User utilities
│   │   └── utils.ts           # General utilities (cn, etc.)
│   │
│   └── middleware.ts          # Next.js middleware (auth guard)
│
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment template
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies & scripts
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── serwist.config.ts          # Serwist (PWA) configuration
└── README.md                  # Project documentation
```

---

## 11. Panduan Deployment

### 11.1 Development Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd Sipatrol_local

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env dengan konfigurasi database Anda

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma migrate dev

# 6. Seed database (optional, untuk development data)
npx prisma db seed

# 7. Start development server
npm run dev
```

### 11.2 Default Credentials (Development)

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Security | `luffy` | `luffy123` |

### 11.3 Production Build

```bash
# 1. Build aplikasi
npm run build

# 2. Run database migrations di production
npx prisma migrate deploy

# 3. Start production server
npm start
```

### 11.4 PWA Deployment

Service worker akan di-generate otomatis saat build:

```bash
# Build akan menghasilkan:
public/sw.js  # Service worker untuk offline mode
```

**Catatan:** PWA memerlukan HTTPS di production (kecuali localhost).

### 11.5 Database Migration Production

```bash
# Skema production
npx prisma migrate deploy --preview-feature

# Reset database (HATI-HATI: menghapus semua data!)
npx prisma migrate reset
```

---

## Lampiran

### A. Default Data (Seed)

#### Kategori Laporan
| ID | Nama | Warna |
|----|------|-------|
| 1 | Aman | Green |
| 2 | Unsafe Condition (Kondisi Tidak Aman) | Yellow |
| 3 | Unsafe Action (Perilaku Tidak Aman) | Red |

#### Sample Unit
- ULPLTD WUAWUA (Kendari)
- ULPLTD RAHA (Muna)

#### Sample Locations (per Unit)
**ULPLTD WUAWUA:**
- Pos Security Utama
- Ruang Mesin
- Gudang BBM
- Area Parkir

**ULPLTD RAHA:**
- Gerbang Depan
- Ruang Control Room

### B. API Endpoints

| Method | Endpoint | Deskripsi | Auth Required |
|--------|----------|-----------|---------------|
| POST | `/api/auth/signin` | Login | No |
| POST | `/api/auth/signout` | Logout | Yes |
| GET | `/api/auth/session` | Get session | No |
| POST | `/api/reports` | Create report | Yes (Security) |
| GET | `/api/reports` | Get reports | Yes |
| DELETE | `/api/reports/:id` | Delete report | Yes (Admin) |

### C. Changelog

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.0 | - | Initial specification (DokumenSipatrol.md) |
| 2.0 | 13 Mar 2026 | Revisi berdasarkan implementasi aktual: NextAuth instead of Clerk, MySQL instead of Supabase, Prisma ORM, Serwist PWA |

---

## Kontak dan Dukungan

Untuk pertanyaan teknis atau dukungan terkait dokumentasi ini, silakan hubungi tim development.

---

**Dokumen ini dibuat berdasarkan analisis kode sumber aktual proyek SiPatrol.**  
*Terakhir diperbarui: 13 Maret 2026*
