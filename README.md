# SiPatrol (Security Monitoring System)

Sistem pelaporan patroli keamanan digital untuk **PLN Nusantara Power UP Kendari**. Aplikasi web berbasis PWA yang menghubungkan petugas lapangan (*Security*) dengan pusat kendali (*Admin*).

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Authentication:** [NextAuth v4](https://next-auth.js.org/) (Credentials Provider + bcrypt)
- **Database:** MySQL via [Prisma ORM](https://www.prisma.io/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (New York style)
- **AI Integration:** [Vercel AI SDK](https://sdk.vercel.ai/) (Groq, OpenAI, Anthropic)
- **PWA / Offline:** [Serwist](https://serwist.pages.dev/)
- **Maps:** [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/)
- **Theme:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Validation:** [Zod](https://zod.dev/) + react-hook-form

## Fitur Utama

### Modul Security (Petugas Lapangan)
- 🔐 Autentikasi sesi dengan NextAuth
- 📸 Pengambilan foto *real-time* via kamera (anti-fraud, gallery disabled)
- 📍 Geo-Tagging otomatis (Lat/Lng) menggunakan Leaflet
- 📡 Mode offline — laporan disimpan lokal & sinkronisasi otomatis saat online (Serwist PWA)
- 📋 Riwayat laporan pribadi (Pending / Verified)

### Modul Admin (Pusat Kendali)
- 📊 **Live Feed** — 5 laporan terbaru secara real-time
- 🏢 **Manajemen Unit** — CRUD master data unit
- 👥 **Manajemen Pengguna** — Kelola akun & penempatan Security
- 🔍 **Filter Lanjutan** — Filter laporan berdasarkan Unit, Rentang Tanggal, & Nama Petugas
- 📑 **Ekspor Excel** — Export data laporan ke format XLSX
- 🤖 **AI Chat** — Tanya jawab data laporan dengan AI (Groq)

### Keamanan
- Role-based access control (Admin / Security)
- Middleware proteksi route
- Password di-hash dengan bcryptjs
- Session token terenkripsi (JWT)

## Prerequisites

- Node.js 18+
- MySQL server (atau XAMPP / Laragon)
- Akun [Groq](https://console.groq.com/keys) untuk fitur AI (opsional)

## Getting Started

1. **Clone repositori**
   ```bash
   git clone <repository-url>
   cd sipatrol
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   - Salin `.env.example` ke `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Isi konfigurasi database MySQL dan API key

4. **Setup database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Jalankan development server**
   ```bash
   npm run dev
   ```

6. Buka [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
# Database MySQL
DATABASE_URL="mysql://root:password@localhost:3306/sipatrol_db"

# AI Read-Only Database (user ai_reader)
READ_ONLY_DATABASE_URL="mysql://ai_reader:password@localhost:3306/sipatrol_db"

# Groq AI API Key (https://console.groq.com/keys)
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxx"

# Model AI (default: llama-3.3-70b-versatile)
AI_MODEL_NAME="llama-3.3-70b-versatile"

# NextAuth Secret (generate: openssl rand -base64 32)
NEXTAUTH_SECRET="string_acak_rahasia"
NEXTAUTH_URL="http://localhost:3000"
```

## Project Structure

```
sipatrol/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Data awal (unit, user default)
├── src/
│   ├── app/
│   │   ├── admin/             # Halaman admin (dashboard, units, users, reports)
│   │   ├── api/               # REST API routes
│   │   │   ├── auth/[...nextauth]/  # NextAuth handler
│   │   │   ├── admin/         # Admin API (units, users, reports, stats)
│   │   │   ├── reports/       # Report CRUD + sync
│   │   │   └── chat/          # AI Chat API
│   │   ├── login/             # Halaman login
│   │   ├── security/          # Halaman security (dashboard, report form, history)
│   │   ├── globals.css        # Global styles + dark mode
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── admin-sidebar.tsx
│   │   ├── security-sidebar.tsx
│   │   ├── report-form.tsx    # Form laporan + kamera
│   │   ├── patrol-map.tsx     # Leaflet map component
│   │   └── chat.tsx           # AI Chat interface
│   ├── hooks/
│   │   └── use-auto-sync.ts   # Offline sync hook
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── sipatrol-db.ts     # Query helpers
│   │   ├── user.ts            # User utilities
│   │   └── utils.ts           # General utilities
│   └── middleware.ts          # Route protection
├── types/
│   └── next-auth.d.ts         # NextAuth type extensions
├── .env.example
└── components.json
```

## Role Default

Setelah `npx prisma db seed`, akun default:

| Role     | Username    | Password     |
| -------- | ----------- | ------------ |
| Admin    | admin       | admin123     |
| Security | security1   | security123  |

> **Catatan:** Ganti password default segera setelah pertama login.

## Sinkronisasi Offline

Aplikasi menggunakan **Serwist** (Service Worker) untuk menyimpan laporan secara lokal saat tidak ada koneksi internet. Laporan akan otomatis dikirim (*sync*) ketika perangkat kembali online.

## Lisensi

MIT
