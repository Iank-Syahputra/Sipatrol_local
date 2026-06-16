# SOFTWARE DETAILED DESIGN (SDD)
## SiPatrol - Sistem Monitoring Keamanan Terintegrasi

**Studi Kasus:** PLN Nusantara Power UP Kendari  
**Versi Dokumen:** 1.0  
**Tanggal:** 30 Maret 2026  
**Status:** Draft untuk Implementasi  

---

## DAFTAR ISI

1. [Introduction](#1-introduction)
   - 1.1 [Document Overview](#11-document-overview)
   - 1.2 [References](#12-references)
2. [Software Architecture Overview](#2-software-architecture-overview)
3. [Software Design Description](#3-software-design-description)
   - 3.1 [Components](#31-components)
   - 3.2 [Workflows and Algorithms](#32-workflows-and-algorithms)
4. [Critical Requirements](#4-critical-requirements)

---

# 1. Introduction

## 1.1 Document Overview

Dokumen **Software Detailed Design (SDD)** ini berfungsi sebagai **cetak biru implementasi definitif** untuk sistem SiPatrol (Sistem Patrol), yang mentransformasikan kebutuhan konseptual dari dokumen SKPL (Spesifikasi Kebutuhan Perangkat Lunak) menjadi instruksi teknis yang siap diimplementasikan oleh tim pengembang.

### Tujuan Dokumen

Dokumen ini memiliki tujuan spesifik:

1. **Transisi What → How**: Mengubah "Apa" yang harus dibangun (dari SKPL) menjadi "Bagaimana" cara membangunnya secara teknis
2. **Discrete Unit Decomposition**: Memecah sistem menjadi komponen-komponen diskrit yang dapat diimplementasikan secara independen
3. **Traceability Maintenance**: Mempertahankan keterlacakan ketat ke setiap ID kebutuhan di SKPL (SRS-F-OUT-xxx dan SRS-NF-xxx)
4. **Implementation Blueprint**: Menyediakan pseudo-code, algoritma, dan spesifikasi teknis yang cukup detail untuk coding

### Ruang Lingkup

Dokumen ini mencakup:
- Arsitektur perangkat lunak tingkat tinggi
- Desain komponen UI/UX (8 layar utama)
- Komponen UI reusable
- Algoritma dan workflow kritis (4 algoritma utama)
- Matriks keterlacakan ke SKPL

### Target Pembaca

| Peran | Penggunaan Dokumen |
|-------|-------------------|
| **Frontend Developer** | Implementasi halaman UI, komponen, dan interaksi |
| **Backend Developer** | Implementasi API endpoint, logika bisnis, database |
| **QA Engineer** | Penyusunan test case berdasarkan spesifikasi |
| **Project Manager** | Tracking progress implementasi per komponen |

## 1.2 References

### 1.2.1 Project References

| Dokumen | Lokasi | Versi | Keterangan |
|---------|--------|-------|------------|
| **SKPL SiPatrol** | `SKPL_SIPATROL.md` | 1.0 | Spesifikasi Kebutuhan Perangkat Lunak - sumber semua ID SRS |
| **WBS SiPatrol** | `WBS_SIPATROL.md` | 1.0 | Work Breakdown Structure - penjadwalan 7 fase |
| **Gantt Chart** | `Gantt_Chart_Summary.md` | 1.0 | Timeline proyek 31 hari |
| **Dokumen Spesifikasi** | `DokumenSipatrol.md` | 1.1 | Overview proyek dan tech stack |
| **SPEK SiPatrol** | `SPEK_SIPATROL.md` | 2.0 | Spesifikasi teknis detail |

### 1.2.2 Standard and Regulatory References

| Standar/Teknologi | Versi | URL Referensi | Penggunaan |
|-------------------|-------|---------------|------------|
| **Next.js** | 15.x | https://nextjs.org/docs | Framework React dengan App Router |
| **TypeScript** | 5.9.x | https://www.typescriptlang.org/docs | Typed JavaScript |
| **Prisma ORM** | 5.22.x | https://www.prisma.io/docs | Database ORM type-safe |
| **MySQL** | 8.x | https://dev.mysql.com/doc | Relational database |
| **NextAuth.js** | 4.24.x | https://next-auth.js.org | Authentication framework |
| **Serwist (PWA)** | 9.5.x | https://serwist.app/docs | Service worker untuk offline mode |
| **IndexedDB** | W3C Standard | https://www.w3.org/TR/IndexedDB | Client-side storage |
| **Leaflet** | 1.9.x | https://leafletjs.com | Interactive maps |
| **shadcn/ui** | Terbaru | https://ui.shadcn.com | UI component library |
| **Tailwind CSS** | 4.x | https://tailwindcss.com/docs | Utility-first CSS |
| **Vercel AI SDK** | 4.x | https://sdk.vercel.ai/docs | AI/LLM integration |
| **Groq API** | Terbaru | https://console.groq.com/docs | LLM inference (Llama 3.3 70B) |
| **bcryptjs** | 3.x | https://www.npmjs.com/package/bcryptjs | Password hashing |
| **Zod** | 3.25.x | https://zod.dev | Schema validation |
| **IEEE Std 830-1993** | - | IEEE Standards | Software Requirements Specification |

---

# 2. Software Architecture Overview

## 2.1 High-Level Architecture

SiPatrol menggunakan arsitektur **Progressive Web App (PWA)** dengan pendekatan **offline-first** yang memungkinkan aplikasi berfungsi penuh meskipun tanpa koneksi internet, dengan sinkronisasi otomatis saat koneksi tersedia.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Browser/PWA)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────┐  │
│  │   Security Module    │    │    Admin Module      │    │   PWA Service    │  │
│  │   (Mobile-First)     │    │   (Desktop-First)    │    │     Worker       │  │
│  │                      │    │                      │    │                  │  │
│  │  - Login Page        │    │  - Dashboard        │    │  - Pre-cache     │  │
│  │  - Report Form       │    │  - Live Feed        │    │  - Runtime Cache │  │
│  │  - Report History    │    │  - Map View         │    │  - Background    │  │
│  │  - Profile Page      │    │  - CRUD Pages       │    │    Sync          │  │
│  │                      │    │  - Chatbot AI       │    │                  │  │
│  └──────────┬───────────┘    └──────────┬───────────┘    └─────────┬────────┘  │
│             │                           │                          │           │
│             └───────────────────────────┼──────────────────────────┘           │
│                                         │                                       │
│                              ┌──────────▼──────────┐                           │
│                              │   Service Worker    │                           │
│                              │   (Serwist 9.5)     │                           │
│                              └──────────┬──────────┘                           │
│                                         │                                       │
│                    ┌────────────────────┼────────────────────┐                 │
│                    │                    │                    │                 │
│           ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐       │
│           │   IndexedDB     │  │   Cache API     │  │  LocalStorage   │       │
│           │                 │  │                 │  │                 │       │
│           │ - offlineReports│  │ - Static Assets │  │ - Session Data  │       │
│           │ - pendingSync   │  │ - Images        │  │ - UI State      │       │
│           └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ HTTPS/REST API
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER (Next.js Server)                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 15 App Router                                │   │
│  │                                                                         │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │   │
│  │  │   API Routes     │  │  Server Actions  │  │   Middleware     │      │   │
│  │  │  /api/*          │  │  (report-actions)│  │  (auth guard)    │      │   │
│  │  │                  │  │                  │  │                  │      │   │
│  │  │ - /auth/[...next│  │ - getReportCate- │  │ - /admin/:path*  │      │   │
│  │  │   auth]          │  │   gories()       │  │ - /security/:    │      │   │
│  │  │ - /reports       │  │ - getUnitLocat-  │  │   path*          │      │   │
│  │  │ - /admin/reports │  │   ions()         │  │ - /login         │      │   │
│  │  │ - /admin/users   │  │ - deleteReport() │  │                  │      │   │
│  │  │ - /admin/units   │  │                  │  │                  │      │   │
│  │  │ - /chat/assis-   │  │                  │  │                  │      │   │
│  │  │   tant           │  │                  │  │                  │      │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘      │   │
│  │                                                                         │   │
│  │  ┌───────────────────────────────────────────────────────────────┐     │   │
│  │  │              Authentication Layer (NextAuth.js)               │     │   │
│  │  │                                                               │     │   │
│  │  │  - Credentials Provider (username/password)                   │     │   │
│  │  │  - JWT Session Strategy                                       │     │   │
│  │  │  - bcryptjs Password Hashing                                  │     │   │
│  │  │  - Role-based Callback (admin/security)                       │     │   │
│  │  └───────────────────────────────────────────────────────────────┘     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                  │
│                              ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                   Business Logic Layer (lib/)                           │   │
│  │                                                                         │   │
│  │  - sipatrol-db.ts    : Database helper functions (typed)                │   │
│  │  - prisma.ts         : Prisma Client singleton                          │   │
│  │  - db-readonly.ts    : Read-only DB connection untuk AI                 │   │
│  │  - user.ts           : User utilities                                   │   │
│  │  - utils.ts          : General utilities (cn, formatters)               │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                  │
│                              ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      AI/LLM Integration Layer                           │   │
│  │                                                                         │   │
│  │  - Vercel AI SDK (streaming)                                            │   │
│  │  - Groq API (Llama 3.3 70B - llama-3.3-70b-versatile)                   │   │
│  │  - Natural Language → SQL Query Generation                              │   │
│  │  - Read-only DB access dengan user khusus (ai_reader)                   │   │
│  │  - Query validation & sanitization                                      │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ Prisma ORM
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER (MySQL Database)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐              │
│  │     profiles     │  │      units       │  │     reports      │              │
│  │  ──────────────  │  │  ──────────────  │  │  ──────────────  │              │
│  │  id (PK)         │  │  id (PK)         │  │  id (PK)         │              │
│  │  username        │  │  name            │  │  user_id (FK)    │              │
│  │  password (hash) │  │  district        │  │  unit_id (FK)    │              │
│  │  full_name       │  │  created_at      │  │  category_id(FK) │              │
│  │  role (ENUM)     │  └────────┬─────────┘  │  location_id(FK) │              │
│  │  phone_number    │           │            │  image_path      │              │
│  │  assigned_unit_..│           │ 1:N        │  notes           │              │
│  │  created_at      │           ▼            │  latitude        │              │
│  └──────────────────┘  ┌──────────────────┐  │  longitude       │              │
│                        │ unit_locations   │  │  captured_at     │              │
│                        │  ──────────────  │  │  is_offline_...  │              │
│                        │  id (PK)         │  │  created_at      │              │
│                        │  unit_id (FK)    │  └──────────────────┘              │
│                        │  name            │                                    │
│                        │  created_at      │  ┌──────────────────┐              │
│                        └──────────────────┘  │report_categories │              │
│                                              │  ──────────────  │              │
│                                              │  id (PK)         │              │
│                                              │  name            │              │
│                                              │  color           │              │
│                                              │  created_at      │              │
│                                              └──────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Technology Stack Mapping

| Layer | Teknologi | Fungsi | File Konfigurasi |
|-------|-----------|--------|------------------|
| **Frontend** | React 19.1, Next.js 15 | UI rendering, routing | `package.json`, `next.config.ts` |
| **Styling** | Tailwind CSS 4, shadcn/ui | Component styling | `globals.css`, `components.json` |
| **State** | React Hooks, Server Actions | Client & server state | `src/hooks/*`, `src/actions/*` |
| **PWA** | Serwist 9.5 | Service worker, offline | `src/lib/sw.ts`, `serwist.config.ts` |
| **Backend** | Next.js API Routes | REST API endpoints | `src/app/api/**` |
| **Auth** | NextAuth.js 4.24 | Session management | `src/app/api/auth/[...nextauth]/route.ts` |
| **ORM** | Prisma 5.22 | Database access | `prisma/schema.prisma` |
| **Database** | MySQL 8 | Data persistence | `.env.local` (DATABASE_URL) |
| **AI/LLM** | Vercel AI SDK + Groq | Natural language query | `src/app/api/chat/assistant/route.ts` |
| **Maps** | Leaflet 1.9 | Geospatial visualization | `src/components/patrol-map.tsx` |

## 2.3 Data Flow Architecture

### 2.3.1 Online Report Submission Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Security  │────►│  Next.js    │────►│   Prisma    │────►│    MySQL    │
│   Browser   │     │  API Route  │     │    ORM      │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │ 1. POST /api/     │                   │                   │
       │    reports        │                   │                   │
       │ (FormData:        │                   │                   │
       │  image, notes,    │                   │                   │
       │  lat, lng, etc)   │                   │                   │
       │                   │                   │                   │
       │                   │ 2. Validate with  │                   │
       │                   │    Zod schema     │                   │
       │                   │                   │                   │
       │                   │ 3. Process image  │                   │
       │                   │    (upload to     │                   │
       │                   │     /uploads)     │                   │
       │                   │                   │                   │
       │                   │ 4. prisma.report. │                   │
       │                   │    .create()      │                   │
       │                   │                   │                   │
       │                   │                   │ 5. INSERT INTO    │
       │                   │                   │    reports (...)  │
       │                   │                   │                   │
       │                   │                   │                   │ │
       │                   │                   │                   │ │
       │                   │ 6. Return success │                   │
       │◄──────────────────────────────────────────────────────────┘
       │    { id, status } │
       │                   │
       │ 7. Toast success  │
       │    notification   │
       │                   │
```

### 2.3.2 Offline Report Submission Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Security  │────►│  IndexedDB  │────►│  Service    │
│   Browser   │     │ (SiPatrolDB)│     │   Worker    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │ 1. Check online   │                   │
       │    status         │                   │
       │    (navigator.    │                   │
       │     onLine)       │                   │
       │                   │                   │
       │ 2. OFFLINE:       │                   │
       │    Save to        │                   │
       │    IndexedDB      │                   │
       │                   │                   │
       │◄──────────────────┘                   │
       │    Success        │ 3. Register        │
       │                   │    backgroundSync  │
       │                   │    event           │
       │                   │                   │
       │                   │ 4. Store pending   │
       │                   │    report with     │
       │                   │    metadata        │
       │                   │                   │
       │                   │ 5. On 'online'     │
       │                   │    event: trigger  │
       │                   │    sync            │
       │                   │                   │
       │ 6. Auto-sync when │◄──────────────────┘
       │    online again   │
       │                   │
       │ 7. POST pending   │
       │    reports to     │
       │    /api/reports   │
       │    (batch)        │
       │                   │
```

---

# 3. Software Design Description

## 3.1 Components

### 3.1.1 Component Interfaces (Desain Layar Utama)

#### **LC-01: Login Page** (`/login`)

**File:** `src/app/login/page.tsx`  
**Tipe:** Public Page (Unauthenticated users only)  
**Role:** Security & Admin

**UI Components:**
- Header dengan logo SiPatrol + status indicator
- Role-based toggle switch (Security vs Admin)
- Username input field dengan icon
- Password input field dengan show/hide toggle
- Submit button dengan loading state
- Error alert (invalid credentials)
- Back button ke homepage

**State Management:**
```typescript
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
```

**Props:**
- None (Client Component dengan searchParams untuk role)

**Events:**
- `handleSubmit(e)`: Form submission ke NextAuth signIn
- `handleShowPasswordToggle()`: Toggle password visibility

**Validation:**
- Username: Required, trimmed
- Password: Required, min 4 characters

**Navigation:**
- Success → Redirect based on role:
  - Admin → `/admin/dashboard`
  - Security → `/security`
- Back button → `/`

**Traceability:** SRS-F-OUT-001, SRS-F-OUT-002, SRS-F-OUT-003, SRS-F-OUT-004

---

#### **LC-02: Security Dashboard** (`/security`)

**File:** `src/app/security/page.tsx`  
**Tipe:** Protected Page (Security role only)  
**Role:** Security

**UI Components:**
- Header dengan shield icon + welcome message
- Online/Offline status indicator
- Stats cards (3):
  - Unit Penugasan
  - Total Log Laporan
  - Log Terakhir
- Quick Action card (Create Report button)
- Recent Reports List widget

**Data Fetching:**
```typescript
// Server Component - fetch di server
const reports = await prisma.report.findMany({
  where: { userId: session.user.id },
  include: { unit, category, location, user },
  orderBy: { capturedAt: 'desc' },
  take: 10
});

const totalReportsCount = await prisma.report.count({
  where: { userId: session.user.id }
});

const assignedUnit = await prisma.unit.findUnique({
  where: { id: session.user.unitId }
});
```

**Props:**
- `session`: NextAuth session object

**Navigation:**
- Create Report button → `/security/report`
- View Full History → `/security/reports`

**Traceability:** SRS-F-OUT-005, SRS-F-OUT-015, SRS-F-OUT-017

---

#### **LC-03: Report Form** (`/security/report`)

**File:** `src/app/security/report/page.tsx`  
**Tipe:** Protected Page (Security role only)  
**Role:** Security

**UI Components:**
- Header dengan back button + title
- Online/Offline indicator
- Camera capture section:
  - Video preview (live camera)
  - Capture button
  - Retake option
  - Image preview
- Form inputs:
  - Combobox Kategori (Aman, Unsafe Condition, Unsafe Action)
  - Combobox Lokasi Spesifik (dari unit_locations)
  - GPS coordinates display + "Get Location" button
  - Notes textarea
- Submit button (dynamic text: "Kirim Laporan" vs "SAVE OFFLINE")
- Success popup modal

**State Management:**
```typescript
const [imagePreview, setImagePreview] = useState<string | undefined>();
const [imageFile, setImageFile] = useState<File | null>(null);
const [notes, setNotes] = useState('');
const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [isOnline, setIsOnline] = useState(true);
const [isImageCaptured, setIsImageCaptured] = useState(false);
const [category, setCategory] = useState<string>('');
const [locationRoom, setLocationRoom] = useState<string>('');
const [showSuccessPopup, setShowSuccessPopup] = useState(false);
const [successMessage, setSuccessMessage] = useState('');
```

**Props:**
- None (Client Component)

**Events:**
- `startCamera()`: Request camera access, start video stream
- `capturePhoto()`: Capture frame from video, convert to File
- `getLocation()`: Request geolocation via browser API
- `submitReport()`: Submit form (online/offline mode)

**Validation:**
- Image: Required, camera-only (anti-fraud)
- Category: Required
- Location: Required (from dropdown)
- GPS: Required (auto-capture)
- Notes: Optional

**API Calls:**
- `GET /api/user/unit`: Fetch assigned unit
- `POST /api/reports`: Submit report (online)
- Server Actions: `getReportCategories()`, `getUnitLocations()`

**IndexedDB Operations:**
```typescript
await addOfflineReport({
  userId: session.user.id,
  unitId: assignedUnit.id,
  imageData: imagePreview,
  notes,
  latitude: location.lat,
  longitude: location.lng,
  categoryId: category,
  locationId: locationRoom,
  capturedAt: new Date().toISOString()
});
```

**Traceability:** SRS-F-OUT-006, SRS-F-OUT-007, SRS-F-OUT-008, SRS-F-OUT-009, SRS-F-OUT-010, SRS-F-OUT-012

---

#### **LC-04: Report History** (`/security/reports`)

**File:** `src/app/security/reports/page.tsx`  
**Tipe:** Protected Page (Security role only)  
**Role:** Security

**UI Components:**
- Header dengan title + icon
- Stats card (Total Laporan)
- Date range filter (start date, end date)
- Reports table/list:
  - Thumbnail image
  - Date/time
  - Category badge
  - Location
  - Notes preview
  - Offline submission badge (if applicable)
- Pagination controls

**Data Fetching:**
```typescript
const reports = await prisma.report.findMany({
  where: {
    userId: session.user.id,
    capturedAt: {
      gte: startDate ? new Date(startDate) : undefined,
      lte: endDate ? new Date(endDate) : undefined
    }
  },
  include: { unit, category, location, user },
  orderBy: { capturedAt: 'desc' },
  skip: (page - 1) * 10,
  take: 10
});

const totalCount = await prisma.report.count({
  where: { /* same filters */ }
});
```

**Props:**
- `searchParams`: { page, startDate, endDate }

**Navigation:**
- Report detail → Modal view

**Traceability:** SRS-F-OUT-015

---

#### **LC-05: User Profile** (`/security/profile`)

**File:** `src/app/security/profile/page.tsx`  
**Tipe:** Protected Page (Security role only)  
**Role:** Security

**UI Components:**
- Personal Info card (read-only):
  - Full Name
  - Username
  - Assigned Unit
- Phone Number card (editable):
  - Input field
  - Save button
  - Success toast
- Password Change card:
  - Current password input
  - New password input
  - Confirm password input
  - Show/hide toggles
  - Save button

**State Management:**
```typescript
const [fullName, setFullName] = useState('');
const [username, setUsername] = useState('');
const [phoneNumber, setPhoneNumber] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [currentPassword, setCurrentPassword] = useState('');
const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
```

**API Calls:**
- `GET /api/user/profile`: Fetch profile data
- `PUT /api/user/profile`: Update phone number
- `POST /api/user/change-password`: Change password

**Validation:**
- Phone: 10-15 digits, no letters
- Password: Min 4 characters

**Traceability:** SRS-F-OUT-027, SRS-F-OUT-028

---

#### **LC-06: Admin Dashboard** (`/admin/dashboard`)

**File:** `src/app/admin/dashboard/page.tsx`  
**Tipe:** Protected Page (Admin role only)  
**Role:** Admin

**UI Components:**
- Header dengan title + system status indicator
- Stats cards (3):
  - Jumlah Personel
  - Laporan Masuk
  - Unit Operasional
- Tab navigation (Live Monitoring vs HSE Analytics)
- Live Feed section:
  - 5 latest reports dengan thumbnail
  - Real-time badge
- Analytics section:
  - Date range filter
  - Pie chart (Safety stats)
  - Bar chart (Unit ranking)
  - Trend analysis

**Data Fetching:**
```typescript
// Server-side via API
const response = await fetch('/api/admin/stats');
const dashboardData = await response.json();
// Returns: totalUsers, totalReports, totalUnits, recentReports, safetyStats, unitRanking
```

**Props:**
- None (Client Component)

**Navigation:**
- View report detail → Modal
- Manage units → `/admin/units`

**Traceability:** SRS-F-OUT-016, SRS-F-OUT-017

---

#### **LC-07: Admin Reports Management** (`/admin/reports`)

**File:** `src/app/admin/reports/page.tsx`  
**Tipe:** Protected Page (Admin role only)  
**Role:** Admin

**UI Components:**
- Header dengan title + action buttons:
  - Selection mode toggle
  - Export to Excel button
  - Delete All button
- Advanced filter panel:
  - Search input
  - Multi-select dropdowns (Units, Categories, Locations)
  - Date range pickers
  - Apply/Reset buttons
- Reports table (desktop) / list (mobile):
  - Checkbox selection
  - Thumbnail image
  - Category badge
  - Location badge
  - Date/time
  - Reporter name
  - Unit name
  - Actions (view, delete)
- Pagination controls
- Storage usage indicator

**State Management:**
```typescript
const [reports, setReports] = useState<any[]>([]);
const [selectedReports, setSelectedReports] = useState<string[]>([]);
const [isSelectionMode, setIsSelectionMode] = useState(false);
const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
```

**API Calls:**
- `GET /api/admin/reports`: Fetch reports dengan pagination & filters
- `DELETE /api/admin/reports/:id`: Delete single report
- `DELETE /api/admin/reports/bulk`: Delete multiple reports
- `GET /api/admin/units`: Fetch units for filter
- `GET /api/admin/categories`: Fetch categories for filter
- `GET /api/admin/locations`: Fetch locations for filter

**Export Logic:**
```typescript
const handleExport = () => {
  const dataToExport = reports.map(report => ({
    "Tanggal": new Date(report.capturedAt).toLocaleDateString('id-ID'),
    "Waktu": new Date(report.capturedAt).toLocaleTimeString('id-ID'),
    "Nama Petugas": report.user?.fullName,
    "Unit": report.unit?.name,
    "Kategori": report.category?.name,
    "Lokasi": report.location?.name,
    "Catatan": report.notes,
    "Link Foto": report.imagePath
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
  XLSX.writeFile(workbook, `Reports_${date}.xlsx`);
};
```

**Traceability:** SRS-F-OUT-024, SRS-F-OUT-025, SRS-F-OUT-026

---

#### **LC-08: Patrol Map** (`/admin/map`)

**File:** `src/app/admin/map/page.tsx`  
**Tipe:** Protected Page (Admin role only)  
**Role:** Admin

**UI Components:**
- Header dengan title
- Filter card:
  - Date range pickers
  - Apply Filter button
- Map card (Leaflet):
  - Full-screen interactive map
  - Markers untuk setiap report dengan GPS
  - Popup detail laporan
- Legend card

**Data Fetching:**
```typescript
const reports = await getReportsByFilters(undefined, dateFrom, dateTo);

const locations = reports
  .filter(report => report.latitude && report.longitude)
  .map(report => ({
    id: report.id,
    lat: report.latitude!,
    lng: report.longitude!,
    title: `${report.profiles?.full_name} - ${report.units?.name}`,
    description: report.notes,
    timestamp: report.captured_at
  }));
```

**Props:**
- `searchParams`: { dateFrom, dateTo }

**Traceability:** SRS-F-OUT-023

---

#### **LC-09: AI Chatbot** (`/admin/chatbot`)

**File:** `src/app/admin/chatbot/page.tsx`  
**Tipe:** Protected Page (Admin role only)  
**Role:** Admin

**UI Components:**
- Header dengan back button + title
- Quick questions section:
  - "Berapa banyak laporan minggu ini?"
  - "Apa laporan terbaru?"
  - "Tren bahaya minggu ini?"
  - "Lokasi dengan laporan tertinggi?"
- Chat messages container:
  - User messages (right-aligned, amber)
  - Assistant messages (left-aligned, slate)
  - Markdown rendering
  - Loading indicator (typing animation)
- Input area:
  - Text input
  - Send button

**State Management:**
```typescript
const [messages, setMessages] = useState<Message[]>([
  { id: '1', content: 'Halo! Saya asisten...', role: 'assistant', timestamp: new Date() }
]);
const [inputValue, setInputValue] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

**API Calls:**
```typescript
const response = await fetch('/api/chat/assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: inputValue })
});
const data = await response.json();
// data.response: AI response text
```

**Traceability:** SRS-F-OUT-029, SRS-F-OUT-030, SRS-F-OUT-031, SRS-F-OUT-032

---

#### **LC-10: Unit Management** (`/admin/units`)

**File:** `src/app/admin/units/page.tsx`  
**Tipe:** Protected Page (Admin role only)  
**Role:** Admin

**UI Components:**
- Header dengan title + Add Unit button
- Units table:
  - Unit name
  - District
  - Created date
  - Actions (Edit, Delete)
- Create/Edit modal:
  - Unit name input
  - District input
  - Save button

**CRUD Operations:**
- Create: `POST /api/admin/units`
- Read: `GET /api/admin/units`
- Update: `PUT /api/admin/units/:id`
- Delete: `DELETE /api/admin/units/:id`

**Traceability:** SRS-F-OUT-019

---

#### **LC-11: User Management** (`/admin/users`)

**File:** `src/app/admin/users/page.tsx`  
**Tipe:** Protected Page (Admin role only)  
**Role:** Admin

**UI Components:**
- Header dengan title + Add User button
- Users table:
  - Full name
  - Username
  - Role badge
  - Assigned unit
  - Phone number
  - Actions (Edit, Delete)
- Create/Edit form:
  - Full name input
  - Username input
  - Password input (create mode)
  - Role dropdown (admin/security)
  - Unit dropdown
  - Phone input
  - Save button

**CRUD Operations:**
- Create: `POST /api/admin/users`
- Read: `GET /api/admin/users`
- Update: `PUT /api/admin/users/:id`
- Delete: `DELETE /api/admin/users/:id`

**Traceability:** SRS-F-OUT-020

---

#### **LC-12: Unit Locations Management** (`/admin/unit-locations`)

**File:** `src/app/admin/unit-locations/page.tsx`  
**Tipe:** Protected Page (Admin role only)  
**Role:** Admin

**UI Components:**
- Header dengan title + Add Location button
- Locations table grouped by parent unit
- Create/Edit modal:
  - Parent unit dropdown
  - Location name input
  - Save button

**CRUD Operations:**
- Create: `POST /api/admin/unit-locations`
- Read: `GET /api/admin/unit-locations`
- Update: `PUT /api/admin/unit-locations/:id`
- Delete: `DELETE /api/admin/unit-locations/:id`

**Traceability:** SRS-F-OUT-021

---

#### **LC-13: Category Management** (`/admin/categories` - implied)

**File:** Implied dari `getReportCategories()` action  
**Tipe:** Protected Page (Admin role only)  
**Role:** Admin

**UI Components:**
- Categories table:
  - Category name
  - Color badge
  - Actions (Edit, Delete)
- Create/Edit modal:
  - Category name input
  - Color picker

**Traceability:** SRS-F-OUT-022

---

### 3.1.2 Component Design Description (Komponen UI Reusable)

#### **UI Components Library (shadcn/ui)**

Proyek menggunakan **46 komponen shadcn/ui** yang di-customize dengan tema SiPatrol (cyan/amber color scheme).

**File Lokasi:** `src/components/ui/*.tsx`

| Komponen | File | Penggunaan |
|----------|------|------------|
| Button | `button.tsx` | Semua tombol aksi |
| Input | `input.tsx` | Form text inputs |
| Textarea | `textarea.tsx` | Multi-line text inputs |
| Label | `label.tsx` | Form field labels |
| Card | `card.tsx` | Container widgets |
| Badge | `badge.tsx` | Status indicators, category tags |
| Dialog | `dialog.tsx` | Modal popups |
| Combobox | `combobox.tsx` | Dropdown dengan search |
| Table | `table.tsx` | Data tables |
| Toast (Sonner) | `sonner.tsx` | Notifications |
| Calendar | `calendar.tsx` | Date pickers |
| Popover | `popover.tsx` | Dropdown containers |
| Select | `select.tsx` | Dropdown selects |
| Checkbox | `checkbox.tsx` | Multi-select options |
| Switch | `switch.tsx` | Toggle switches |
| Skeleton | `skeleton.tsx` | Loading placeholders |
| Avatar | `avatar.tsx` | User profile images |
| Progress | `progress.tsx` | Progress bars |
| Tooltip | `tooltip.tsx` | Hover tooltips |
| Alert | `alert.tsx` | Warning/error messages |

#### **Custom Components**

**1. OnlineStatusIndicator**  
**File:** `src/components/online-status-indicator.tsx`  
**Props:** None  
**Fungsi:** Menampilkan status online/offline dengan icon dan label

**2. PatrolMap**  
**File:** `src/components/patrol-map.tsx`  
**Props:** `{ locations: Array<{ id, lat, lng, title, description, timestamp }> }`  
**Fungsi:** Render Leaflet map dengan markers

**3. ReportDetailsModal**  
**File:** `src/components/report-details-modal.tsx`  
**Props:** `{ report, isOpen, onClose }`  
**Fungsi:** Modal untuk menampilkan detail laporan lengkap

**4. ConfirmationDialog**  
**File:** `src/components/confirmation-dialog.tsx`  
**Props:** `{ isOpen, onClose, onConfirm, title, description }`  
**Fungsi:** Dialog konfirmasi untuk delete actions

**5. AdminSidebar**  
**File:** `src/components/admin-sidebar.tsx`  
**Props:** None  
**Fungsi:** Sidebar navigation untuk admin pages

**6. SecuritySidebar**  
**File:** `src/components/security-sidebar.tsx`  
**Props:** None  
**Fungsi:** Sidebar navigation untuk security pages

**7. RecentReportList**  
**File:** `src/components/security/recent-report-list.tsx`  
**Props:** `{ reports: Array }`  
**Fungsi:** List widget untuk recent reports di dashboard

**8. ReportList**  
**File:** `src/components/security/report-list.tsx`  
**Props:** `{ reports, totalPages, currentPage, totalCount, initialStartDate, initialEndDate }`  
**Fungsi:** Table/list component untuk report history dengan pagination

**9. Chat**  
**File:** `src/components/chat.tsx`  
**Props:** None  
**Fungsi:** Base chat interface component

**10. ThemeProvider & ThemeToggle**  
**File:** `src/components/theme-provider.tsx`, `theme-toggle.tsx`  
**Fungsi:** Dark mode support dengan next-themes

**11. AccessDenied & AdminForbidden**  
**File:** `src/components/access-denied.tsx`, `admin-forbidden.tsx`  
**Fungsi:** Error pages untuk unauthorized access

**12. ForceLogout**  
**File:** `src/components/force-logout.tsx`  
**Fungsi:** Auto-logout component untuk session expiry

---

## 3.2 Workflows and Algorithms

### 3.2.1 Algoritma Autentikasi RBAC

**File Implementasi:**  
- `src/app/api/auth/[...nextauth]/route.ts` (Backend)
- `src/middleware.ts` (Route Protection)

**Pseudo-code:**

```
ALGORITHM: RBAC Authentication Flow

INPUT: username (string), password (string)
OUTPUT: session (JWT) OR error (string)

BEGIN
    // 1. Credential Validation
    IF username is empty OR password is empty THEN
        RETURN error "Username dan Password wajib diisi"
    END IF
    
    cleanUsername ← TRIM(username)
    
    // 2. User Lookup
    user ← prisma.profile.findFirst({
        where: { username: cleanUsername }
    })
    
    IF user is null THEN
        RETURN error "User tidak ditemukan"
    END IF
    
    // 3. Password Verification
    isValid ← FALSE
    
    TRY
        isValid ← bcrypt.compare(password, user.password)
    CATCH error
        // Fallback untuk backward compatibility
        isValid ← (password == user.password)
    END TRY
    
    // Special case: plain text password match
    IF NOT isValid AND password == user.password THEN
        isValid ← TRUE
    END IF
    
    IF NOT isValid THEN
        RETURN error "Password salah"
    END IF
    
    // 4. Session Creation (JWT)
    sessionPayload ← {
        id: user.id,
        name: user.fullName,
        email: user.username,
        role: user.role,  // 'admin' or 'security'
        unitId: user.assignedUnitId
    }
    
    jwtToken ← sign(sessionPayload, NEXTAUTH_SECRET)
    
    // 5. Return to NextAuth
    RETURN sessionPayload
END

// ============================================

MIDDLEWARE: Route Protection

INPUT: request (NextRequest), token (JWT)
OUTPUT: NextResponse (redirect or next)

BEGIN
    token ← getToken(request, NEXTAUTH_SECRET)
    pathname ← request.nextUrl.pathname
    
    // Define route patterns
    isAdminRoute ← pathname.startsWith('/admin')
    isSecurityRoute ← pathname.startsWith('/security')
    isLoginRoute ← pathname.startsWith('/login')
    
    // Case 1: Accessing protected route without login
    IF (isAdminRoute OR isSecurityRoute) AND token is null THEN
        RETURN redirect('/login')
    END IF
    
    // Case 2: Already logged in, accessing login page
    IF isLoginRoute AND token is not null THEN
        IF token.role == 'admin' THEN
            RETURN redirect('/admin/dashboard')
        ELSE
            RETURN redirect('/security')
        END IF
    END IF
    
    // Case 3: Role-based access control
    IF isAdminRoute AND token.role != 'admin' THEN
        RETURN redirect('/security')  // Demote to security
    END IF
    
    IF isSecurityRoute AND token.role NOT IN ['security', 'admin'] THEN
        RETURN redirect('/login')
    END IF
    
    // Case 4: Authorized access
    RETURN next()
END
```

**Flow Diagram:**

```
┌─────────────┐
│   Login     │
│   Form      │
└──────┬──────┘
       │ POST /api/auth/[...nextauth]
       ▼
┌─────────────────────────────────┐
│  NextAuth Credentials Provider  │
│  1. Find user in database       │
│  2. Verify password (bcrypt)    │
│  3. Create JWT with role        │
└──────────────┬──────────────────┘
               │
               ▼
        ┌──────────────┐
        │  JWT Token   │
        │  - id        │
        │  - role      │
        │  - unitId    │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │  Middleware  │
        │  Check role  │
        └──────┬───────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│   Admin     │ │  Security   │
│  Dashboard  │ │  Dashboard  │
└─────────────┘ └─────────────┘
```

**Traceability:** SRS-F-OUT-001, SRS-F-OUT-002, SRS-F-OUT-003, SRS-F-OUT-004, SRS-F-PR-018, SRS-NF-001, SRS-NF-002

---

### 3.2.2 Algoritma Deteksi Offline, Penyimpanan ke IndexedDB, dan Auto-Sync

**File Implementasi:**  
- `src/hooks/use-offline-reports.ts` (Custom Hook)
- `src/app/security/report/page.tsx` (Usage)
- `src/lib/sw.ts` (Service Worker)

**Pseudo-code:**

```
ALGORITHM: Offline Detection & Storage

INPUT: reportData (object), isOnline (boolean)
OUTPUT: success (boolean), message (string)

BEGIN
    // 1. Check Online Status
    isOnline ← navigator.onLine
    
    IF isOnline THEN
        // ONLINE MODE: Direct submission
        TRY
            formData ← new FormData()
            formData.append('image', reportData.imageFile)
            formData.append('notes', reportData.notes)
            formData.append('latitude', reportData.latitude.toString())
            formData.append('longitude', reportData.longitude.toString())
            formData.append('unitId', reportData.unitId)
            formData.append('categoryId', reportData.categoryId)
            formData.append('locationId', reportData.locationId)
            formData.append('capturedAt', new Date().toISOString())
            
            response ← fetch('/api/reports', {
                method: 'POST',
                body: formData
            })
            
            IF response.ok THEN
                RETURN success=true, message="Laporan telah berhasil dikirim."
            ELSE
                errorText ← await response.text()
                THROW error(errorText)
            END IF
            
        CATCH error
            // Fallback to offline mode if network error
            GOTO OFFLINE_MODE
        END TRY
        
    ELSE
        // OFFLINE MODE: Save to IndexedDB
        OFFLINE_MODE:
        TRY
            // Open IndexedDB connection
            db ← indexedDB.open('SiPatrolDB', 1)
            
            db.onupgradeneeded ← (event) =>
                database ← event.target.result
                IF NOT database.objectStoreNames.contains('offlineReports') THEN
                    database.createObjectStore('offlineReports', {
                        keyPath: 'id',
                        autoIncrement: true
                    })
                END IF
            END
            
            db.onsuccess ← (event) =>
                database ← event.target.result
                transaction ← database.transaction(['offlineReports'], 'readwrite')
                store ← transaction.objectStore('offlineReports')
                
                // Store report with metadata
                offlineReport ← {
                    userId: reportData.userId,
                    unitId: reportData.unitId,
                    imageData: reportData.imageData,  // Base64
                    notes: reportData.notes,
                    latitude: reportData.latitude,
                    longitude: reportData.longitude,
                    categoryId: reportData.categoryId,
                    locationId: reportData.locationId,
                    capturedAt: reportData.capturedAt,
                    createdAt: new Date().toISOString(),
                    synced: false
                }
                
                request ← store.add(offlineReport)
                
                request.onsuccess ← () =>
                    RETURN success=true, 
                           message="Laporan telah disimpan secara lokal dan akan disinkronkan saat online."
                
                request.onerror ← () =>
                    RETURN success=false, message="Gagal menyimpan laporan offline."
                
            END
            
        CATCH error
            RETURN success=false, message="IndexedDB tidak didukung."
        END TRY
    END IF
END

// ============================================

ALGORITHM: Background Auto-Sync

TRIGGER: 'online' event OR service worker sync event

BEGIN
    // 1. Listen for online event
    window.addEventListener('online', handleOnline)
    
    handleOnline() ←
        // Check for pending reports
        pendingReports ← getPendingOfflineReports()
        
        IF pendingReports.length > 0 THEN
            FOR EACH report IN pendingReports DO
                TRY
                    // Attempt to sync
                    success ← syncReportToServer(report)
                    
                    IF success THEN
                        // Remove from IndexedDB
                        deleteOfflineReport(report.id)
                        
                        // Show notification
                        showNotification(`Laporan #${report.id} berhasil disinkronkan.`)
                    END IF
                    
                CATCH error
                    // Keep in IndexedDB for next sync attempt
                    console.error(`Sync failed for report ${report.id}:`, error)
                END TRY
            END FOR
        END IF
    END
    
    // 2. Service Worker Background Sync (if supported)
    IF 'serviceWorker' in navigator AND 'SyncManager' in window THEN
        registration ← await navigator.serviceWorker.ready
        
        registration.sync.register('sync-reports')
            .then(() => console.log('Background sync registered'))
            .catch((err) => console.error('Sync registration failed:', err))
    END IF
END

// ============================================

FUNCTION: syncReportToServer(report)

BEGIN
    // Convert base64 imageData back to File/Blob
    blob ← base64ToBlob(report.imageData, 'image/jpeg')
    file ← new File([blob], `photo_${report.capturedAt}.jpg`, { type: 'image/jpeg' })
    
    formData ← new FormData()
    formData.append('image', file)
    formData.append('notes', report.notes)
    formData.append('latitude', report.latitude.toString())
    formData.append('longitude', report.longitude.toString())
    formData.append('unitId', report.unitId)
    formData.append('categoryId', report.categoryId)
    formData.append('locationId', report.locationId)
    formData.append('capturedAt', report.capturedAt)
    formData.append('isOfflineSubmission', 'true')  // Flag for audit
    
    response ← fetch('/api/reports', {
        method: 'POST',
        body: formData
    })
    
    RETURN response.ok
END
```

**Flow Diagram:**

```
┌──────────────────┐
│  User Submits    │
│     Report       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Check Online?    │
│ (navigator.      │
│  onLine)         │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│ ONLINE  │ │ OFFLINE  │
│         │ │          │
│ POST    │ │ Save to  │
│ /api/   │ │ IndexedDB│
│ reports │ │          │
│         │ │ synced=  │
│         │ │ false    │
└────┬────┘ └────┬─────┘
     │           │
     │           │ Wait for
     │           │ 'online' event
     │           │
     │    ┌──────┴──────┐
     │    │             │
     │    ▼             ▼
     │    ┌─────────────────┐
     │    │ Background Sync │
     │    │ (Service Worker)│
     │    └────────┬────────┘
     │             │
     │             │ POST pending
     │             │ reports
     │             │
     └──────┬──────┘
            │
            ▼
     ┌──────────────┐
     │   Success    │
     │   Response   │
     └──────────────┘
```

**Traceability:** SRS-F-OUT-011, SRS-F-OUT-012, SRS-F-OUT-013, SRS-F-OUT-014, SRS-NF-003, SRS-NF-005

---

### 3.2.3 Algoritma Validasi Foto dari Kamera (Anti-Fraud)

**File Implementasi:**  
- `src/app/security/report/page.tsx`

**Pseudo-code:**

```
ALGORITHM: Camera-Only Photo Capture (Anti-Fraud)

INPUT: None (User interaction)
OUTPUT: imageFile (File object), imagePreview (base64 string)

BEGIN
    // 1. Check Browser Support
    IF NOT navigator.mediaDevices OR NOT navigator.mediaDevices.getUserMedia THEN
        SET cameraError = "Camera not supported by browser."
        RETURN
    END IF
    
    // 2. Request Camera Permission
    TRY
        stream ← await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment'  // Use back camera on mobile
            }
        })
        
        // 3. Display Live Preview
        videoElement.srcObject ← stream
        streamRef.current ← stream
        isCameraActive ← TRUE
        
    CATCH error
        SET cameraError = "Camera access denied: " + error.message
        isCameraActive ← FALSE
        RETURN
    END TRY
    
    // 4. Capture Photo (on button click)
    capturePhoto() ←
        IF NOT videoElement OR NOT canvasElement THEN
            RETURN
        END IF
        
        // Set canvas dimensions to match video
        canvas.width ← video.videoWidth
        canvas.height ← video.videoHeight
        
        // Draw current video frame to canvas
        ctx ← canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert to base64
        imageData ← canvas.toDataURL('image/jpeg')
        
        // Convert to File object
        blob ← await fetch(imageData).then(res => res.blob())
        file ← new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        
        // Update state
        imageFile ← file
        imagePreview ← imageData
        isImageCaptured ← TRUE
        
        // Stop camera
        stopCamera()
    END
    
    // 5. Anti-Fraud Enforcement
    // IMPORTANT: NO file input with accept="image/*" that allows gallery
    // ONLY camera capture is allowed
    
    validateImageSource() ←
        // Check if image was captured from camera
        IF NOT isImageCaptured THEN
            RETURN error "Photo must be taken with camera."
        END IF
        
        // Verify file type
        IF imageFile.type NOT STARTS WITH 'image/' THEN
            RETURN error "Invalid file type."
        END IF
        
        // Verify file size (max 5MB)
        IF imageFile.size > 5 * 1024 * 1024 THEN
            RETURN error "File size exceeds 5MB."
        END IF
        
        RETURN success
    END
END
```

**Implementation Notes:**

```typescript
// ✅ CORRECT: Camera-only capture
const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  });
  videoRef.current.srcObject = stream;
};

// ❌ WRONG: Allows gallery upload (vulnerable to fraud)
// <input type="file" accept="image/*" />

// ✅ CORRECT: Hidden file input, only triggered by camera capture
const capturePhoto = () => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoRef.current, 0, 0);
  const imageData = canvas.toDataURL('image/jpeg');
  // Convert to File...
};
```

**Security Measures:**

1. **No Gallery Access**: File input dengan `accept="image/*"` TIDAK digunakan
2. **Camera Stream Only**: Foto hanya bisa diambil dari live camera stream
3. **Timestamp Filename**: Nama file includes timestamp untuk audit
4. **EXIF Data Stripped**: Canvas conversion removes EXIF metadata
5. **Server-Side Validation**: Backend memverifikasi file type dan size

**Traceability:** SRS-F-OUT-010, SRS-NF-006

---

### 3.2.4 Algoritma Chatbot AI (Natural Language → Read-Only SQL Query)

**File Implementasi:**  
- `src/app/api/chat/assistant/route.ts` (Backend)
- `src/app/admin/chatbot/page.tsx` (Frontend)

**Pseudo-code:**

```
ALGORITHM: Natural Language to SQL Query Generation

INPUT: userQuestion (string), conversationHistory (array)
OUTPUT: aiResponse (string), sqlQuery (string, optional), queryResult (array, optional)

BEGIN
    // 1. System Prompt Engineering
    systemPrompt ← """
    Anda adalah asisten analis data keamanan untuk sistem SiPatrol.
    
    TUGAS ANDA:
    1. Terjemahkan pertanyaan bahasa natural pengguna menjadi SQL query
    2. Query HANYA boleh SELECT (read-only)
    3. Gunakan database schema berikut:
    
    TABLES:
    - profiles (id, username, full_name, role, phone_number, assigned_unit_id, created_at)
    - units (id, name, district, created_at)
    - reports (id, user_id, unit_id, category_id, location_id, image_path, notes, 
                latitude, longitude, captured_at, is_offline_submission, created_at)
    - report_categories (id, name, color, created_at)
    - unit_locations (id, unit_id, name, created_at)
    
    ATURAN KEAMANAN:
    - HANYA gunakan SELECT query
    - JANGAN gunakan INSERT, UPDATE, DELETE, DROP, ALTER, CREATE
    - JANGAN gunakan query yang bisa memodifikasi data
    - Jika pertanyaan tidak terkait database, jawab dengan sopan bahwa Anda hanya bisa 
      menjawab pertanyaan tentang data laporan keamanan.
    
    FORMAT RESPON:
    - Jika pertanyaan bisa dijawab dengan SQL:
      ```sql
      [SQL query di sini]
      ```
      [Penjelasan hasil query dalam bahasa Indonesia]
    
    - Jika pertanyaan tidak terkait database:
      [Jawaban dalam bahasa Indonesia]
    """
    
    // 2. Prepare Messages for AI
    messages ← [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userQuestion }
    ]
    
    // 3. Call Groq API (Llama 3.3 70B)
    TRY
        response ← await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.3,  // Low temperature for deterministic SQL
            max_tokens: 1000,
            stream: false
        })
        
        aiContent ← response.choices[0].message.content
        
    CATCH error
        RETURN error "Gagal mendapatkan respons dari AI: " + error.message
    END TRY
    
    // 4. Extract SQL Query from Response
    sqlMatch ← regex.match(aiContent, /```sql\s*([\s\S]*?)\s*```/)
    
    IF sqlMatch THEN
        sqlQuery ← sqlMatch[1].trim()
        
        // 5. Validate SQL Query (Security Check)
        isValid ← validateSQLQuery(sqlQuery)
        
        IF NOT isValid THEN
            RETURN error "Query tidak valid atau berpotensi berbahaya."
        END IF
        
        // 6. Execute Read-Only Query
        TRY
            // Use read-only database connection
            result ← await executeReadOnlyQuery(sqlQuery)
            
            // 7. Format Result as Natural Language
            formattedResult ← formatQueryResult(result, sqlQuery)
            
            // 8. Build Final Response
            finalResponse ← `
**SQL Query:**
\`\`\`sql
${sqlQuery}
\`\`\`

**Hasil:**
${formattedResult}
            `
            
            RETURN finalResponse, sqlQuery, result
            
        CATCH error
            RETURN error "Error executing query: " + error.message
        END TRY
        
    ELSE
        // No SQL query detected, return AI response as-is
        RETURN aiContent
    END IF
END

// ============================================

FUNCTION: validateSQLQuery(sql)

BEGIN
    // Convert to uppercase for case-insensitive check
    sqlUpper ← UPPER(sql)
    
    // Forbidden keywords
    forbiddenKeywords ← [
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
        'TRUNCATE', 'REPLACE', 'GRANT', 'REVOKE', 'LOCK', 'UNLOCK'
    ]
    
    // Check for forbidden keywords
    FOR EACH keyword IN forbiddenKeywords DO
        IF sqlUpper.CONTAINS(keyword) THEN
            RETURN false
        END IF
    END FOR
    
    // Must start with SELECT
    IF NOT sqlUpper.STARTS_WITH('SELECT') THEN
        RETURN false
    END IF
    
    // Check for multiple statements (prevent SQL injection)
    IF sql.CONTAINS(';') AND sql.LAST_INDEX_OF(';') < sql.LENGTH - 1 THEN
        RETURN false
    END IF
    
    RETURN true
END

// ============================================

FUNCTION: executeReadOnlyQuery(sql)

BEGIN
    // Use dedicated read-only database user
    connection ← mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.READ_ONLY_DB_USER,  // 'ai_reader'
        password: process.env.READ_ONLY_DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: false  // Prevent multiple statement execution
    })
    
    // Set session to read-only
    await connection.query('SET SESSION TRANSACTION READ ONLY')
    
    // Execute query
    result ← await connection.query(sql)
    
    await connection.end()
    
    RETURN result
END

// ============================================

FUNCTION: formatQueryResult(result, sql)

BEGIN
    IF result.length == 0 THEN
        RETURN "Tidak ada data yang ditemukan."
    END IF
    
    // Detect query intent
    IF sql.UPPER().CONTAINS('COUNT') THEN
        RETURN `Ditemukan **${result[0].count}** record.`
    
    ELSE IF sql.UPPER().CONTAINS('AVG') OR sql.UPPER().CONTAINS('SUM') THEN
        // Format numeric result
        value ← Object.values(result[0])[0]
        RETURN `Nilai: **${formatNumber(value)}**`
    
    ELSE IF result.length <= 5 THEN
        // Show full table for small results
        table ← markdown.table(result)
        RETURN table
    
    ELSE
        // Show summary for large results
        RETURN `Ditemukan **${result.length}** record. Berikut 5 pertama:\n\n` + 
               markdown.table(result.slice(0, 5))
    END IF
END
```

**Example Conversation:**

```
User: "Tampilkan semua laporan unsafe condition minggu ini"

AI (Internal):
```sql
SELECT r.*, rc.name as category_name, p.full_name, u.name as unit_name
FROM reports r
JOIN report_categories rc ON r.category_id = rc.id
JOIN profiles p ON r.user_id = p.id
JOIN units u ON r.unit_id = u.id
WHERE rc.name LIKE '%Unsafe Condition%'
  AND r.captured_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY r.captured_at DESC
```

AI Response:
```sql
SELECT r.*, rc.name as category_name, p.full_name, u.name as unit_name
FROM reports r
JOIN report_categories rc ON r.category_id = rc.id
JOIN profiles p ON r.user_id = p.id
JOIN units u ON r.unit_id = u.id
WHERE rc.name LIKE '%Unsafe Condition%'
  AND r.captured_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY r.captured_at DESC
```

**Hasil:**
Ditemukan **3** laporan Unsafe Condition minggu ini:

| Tanggal | Petugas | Unit | Kategori | Catatan |
|---------|---------|------|----------|---------|
| 28 Mar 2026 | M. Luffy | ULPLTD WUAWUA | Unsafe Condition | Kabel terkelupas di ruang mesin |
| ... | ... | ... | ... | ... |
```

**Security Measures:**

1. **Read-Only Database User**: AI menggunakan user MySQL dengan privilege SELECT saja
2. **Query Validation**: Regex check untuk forbidden keywords sebelum eksekusi
3. **No Multiple Statements**: `multipleStatements: false` mencegah SQL injection
4. **Session Read-Only**: `SET SESSION TRANSACTION READ ONLY` sebagai defense-in-depth
5. **Audit Logging**: Semua query AI dicatat untuk audit trail

**Traceability:** SRS-F-OUT-029, SRS-F-OUT-030, SRS-F-OUT-031, SRS-F-OUT-032, SRS-NF-006

---

# 4. Critical Requirements

## 4.1 Traceability Matrix

Tabel berikut memetakan setiap komponen desain (Bab 3) ke ID kebutuhan di SKPL, memastikan tidak ada fitur yang terlewat.

| ID Kebutuhan (SKPL) | Nama Kebutuhan | Komponen Desain | File Implementasi | Status |
|---------------------|----------------|-----------------|-------------------|--------|
| **SRS-F-OUT-001** | Sistem menampilkan halaman login dengan form username dan password | LC-01: Login Page | `src/app/login/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-002** | Sistem menerima masukan username dan password dari pengguna | LC-01: Login Page | `src/app/login/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-003** | Sistem memverifikasi kredensial dengan hash bcrypt dan membuat sesi JWT | Auth Algorithm | `src/app/api/auth/[...nextauth]/route.ts` | ✅ Implemented |
| **SRS-F-OUT-004** | Sistem melakukan redirect berdasarkan role | Middleware RBAC | `src/middleware.ts` | ✅ Implemented |
| **SRS-F-OUT-005** | Sistem menampilkan dashboard security dengan akses cepat ke fitur laporan | LC-02: Security Dashboard | `src/app/security/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-006** | Sistem menampilkan form pembuatan laporan patroli dengan field lengkap | LC-03: Report Form | `src/app/security/report/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-007** | Sistem menerima data laporan: kategori, catatan, foto, unit, lokasi patroli | LC-03: Report Form | `src/app/security/report/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-008** | Sistem menerima koordinat GPS (latitude/longitude) otomatis dari browser | LC-03: Report Form | `src/app/security/report/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-009** | Sistem menerima timestamp waktu pengambilan laporan (captured_at) | LC-03: Report Form | `src/app/security/report/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-010** | Sistem memvalidasi foto harus dari kamera langsung (non-upload galeri) | Anti-Fraud Algorithm | `src/app/security/report/page.tsx` | ⚠️ Partial (UI enforced, server validation needed) |
| **SRS-F-OUT-011** | Sistem menyimpan laporan ke database MySQL saat kondisi online | Online Submission | `src/app/api/reports/route.ts` | ✅ Implemented |
| **SRS-F-OUT-012** | Sistem menyimpan laporan ke IndexedDB saat kondisi offline | Offline Algorithm | `src/hooks/use-offline-reports.ts` | ✅ Implemented |
| **SRS-F-OUT-013** | Sistem melakukan sinkronisasi otomatis laporan offline saat koneksi pulih | Auto-Sync Algorithm | `src/lib/sw.ts` | ⚠️ Partial (IndexedDB ready, background sync pending) |
| **SRS-F-OUT-014** | Sistem menandai laporan offline dengan flag is_offline_submission = true | Database Schema | `prisma/schema.prisma` | ✅ Implemented |
| **SRS-F-OUT-015** | Sistem menampilkan riwayat laporan pribadi untuk pengguna security | LC-04: Report History | `src/app/security/reports/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-016** | Sistem menampilkan dashboard admin dengan live feed 5 laporan terbaru | LC-06: Admin Dashboard | `src/app/admin/dashboard/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-017** | Sistem menampilkan statistik cards: total unit, laporan terbaru, patroli aktif, petugas | LC-06: Admin Dashboard | `src/app/admin/dashboard/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-018** | Sistem membatasi akses menu berdasarkan role pengguna (RBAC via middleware) | Middleware RBAC | `src/middleware.ts` | ✅ Implemented |
| **SRS-F-OUT-019** | Sistem menyediakan CRUD untuk pengelolaan data master unit operasional | LC-10: Unit Management | `src/app/admin/units/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-020** | Sistem menyediakan CRUD untuk pengelolaan data pengguna dengan role assignment | LC-11: User Management | `src/app/admin/users/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-021** | Sistem menyediakan CRUD untuk pengelolaan data lokasi unit patroli per unit induk | LC-12: Unit Locations | `src/app/admin/unit-locations/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-022** | Sistem menyediakan CRUD untuk pengelolaan kategori laporan dengan color coding | LC-13: Category Management | `src/actions/report-actions.ts` | ⚠️ Partial (API ready, UI pending) |
| **SRS-F-OUT-023** | Sistem menampilkan visualisasi peta titik laporan patroli dengan Leaflet | LC-08: Patrol Map | `src/app/admin/map/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-024** | Sistem menyediakan filter laporan berdasarkan unit, kategori, rentang tanggal, pelapor | LC-07: Reports Management | `src/app/admin/reports/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-025** | Sistem menyediakan fitur bulk delete untuk multiple reports | LC-07: Reports Management | `src/app/admin/reports/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-026** | Sistem menyediakan ekspor data laporan ke format Excel/CSV (xlsx) | LC-07: Reports Management | `src/app/admin/reports/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-027** | Sistem menampilkan halaman profil pengguna untuk edit data pribadi | LC-05: User Profile | `src/app/security/profile/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-028** | Sistem menyediakan fitur perubahan password dengan validasi bcrypt | LC-05: User Profile | `src/app/security/profile/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-029** | Sistem menampilkan chatbot AI untuk query database dengan bahasa natural | LC-09: AI Chatbot | `src/app/admin/chatbot/page.tsx` | ✅ Implemented |
| **SRS-F-OUT-030** | Sistem menghasilkan SQL query dari pertanyaan natural language via AI | AI Algorithm | `src/app/api/chat/assistant/route.ts` | ✅ Implemented |
| **SRS-F-OUT-031** | Sistem mengeksekusi query read-only (SELECT only) untuk keamanan database | AI Algorithm | `src/app/api/chat/assistant/route.ts` | ✅ Implemented |
| **SRS-F-OUT-032** | Sistem menampilkan hasil query AI dalam format tabel dengan streaming response | LC-09: AI Chatbot | `src/app/admin/chatbot/page.tsx` | ⚠️ Partial (streaming pending) |
| **SRS-F-OUT-033** | Sistem menyediakan caching strategy untuk assets statis (gambar, font, JSON) | Service Worker | `src/lib/sw.ts` | ✅ Implemented |
| **SRS-F-OUT-034** | Sistem menampilkan notifikasi toast untuk feedback operasi (success/error) | Toast (Sonner) | `src/components/ui/sonner.tsx` | ✅ Implemented |
| **SRS-NF-001** | Sistem harus menjaga keamanan autentikasi dengan hash password bcrypt | Auth Algorithm | `src/app/api/auth/[...nextauth]/route.ts` | ✅ Implemented |
| **SRS-NF-002** | Sistem harus menerapkan otorisasi berbasis peran (RBAC) pada seluruh modul dan API endpoint | Middleware RBAC | `src/middleware.ts` | ✅ Implemented |
| **SRS-NF-003** | Sistem harus mendukung operasi offline untuk pelaporan patroli dengan IndexedDB | Offline Algorithm | `src/hooks/use-offline-reports.ts` | ✅ Implemented |
| **SRS-NF-004** | Sistem harus dapat berjalan pada browser modern desktop dan mobile (Chrome 90+, Edge, Firefox) | PWA Compatibility | `src/lib/sw.ts` | ✅ Implemented |
| **SRS-NF-005** | Sistem harus menyimpan jejak audit waktu pelaporan dan status offline untuk pelacakan | Database Schema | `prisma/schema.prisma` | ✅ Implemented |
| **SRS-NF-006** | Sistem harus menggunakan validasi data sisi server (Zod schema) sebelum penyimpanan | API Validation | `src/app/api/reports/route.ts` | ⚠️ Partial (validation needed) |

### Legend Status:
- ✅ **Implemented**: Fitur sudah diimplementasikan penuh
- ⚠️ **Partial**: Fitur sudah ada tapi belum lengkap/perlu enhancement
- ❌ **Not Implemented**: Fitur belum diimplementasikan

## 4.2 Implementation Priority

Berdasarkan traceability matrix, berikut adalah prioritas implementasi lanjutan:

### **High Priority (Must Complete)**

1. **SRS-F-OUT-010**: Server-side validation untuk anti-fraud (verify image source)
2. **SRS-F-OUT-013**: Background sync mechanism untuk auto-sync offline reports
3. **SRS-NF-006**: Zod schema validation di semua API endpoints

### **Medium Priority (Should Complete)**

1. **SRS-F-OUT-022**: Category management UI (CRUD interface)
2. **SRS-F-OUT-032**: Streaming response untuk AI chatbot

### **Low Priority (Could Enhance)**

1. UI polish untuk mobile responsiveness
2. Performance optimization untuk large datasets

---

## 4.3 Database Schema Traceability

Tabel berikut menunjukkan keterlacakan antara data store (DFD) dengan implementasi Prisma schema:

| Data Store (SKPL) | Entitas E-R | Tabel Prisma | File | Relasi Utama |
|-------------------|-------------|--------------|------|--------------|
| **profiles** | Profile | `profiles` | `prisma/schema.prisma` | 1:N → reports |
| **units** | Unit | `units` | `prisma/schema.prisma` | 1:N → unit_locations, profiles, reports |
| **unit_locations** | UnitLocation | `unit_locations` | `prisma/schema.prisma` | N:1 → units, 1:N → reports |
| **report_categories** | ReportCategory | `report_categories` | `prisma/schema.prisma` | 1:N → reports |
| **reports** | Report | `reports` | `prisma/schema.prisma` | N:1 → profiles, units, unit_locations, report_categories |
| **IndexedDB (offlineReports)** | - | - | `src/hooks/use-offline-reports.ts` | Client-side storage |

---

## 4.4 API Endpoint Traceability

| Endpoint | Method | Fungsi | Komponen yang Menggunakan | SKPL ID |
|----------|--------|--------|--------------------------|---------|
| `/api/auth/[...nextauth]` | POST | Autentikasi pengguna | Login Page | SRS-F-OUT-001, 002, 003 |
| `/api/reports` | POST | Create report | Report Form | SRS-F-OUT-006, 007, 011 |
| `/api/reports` | GET | Get user reports | Report History | SRS-F-OUT-015 |
| `/api/user/profile` | GET | Get user profile | Profile Page | SRS-F-OUT-027 |
| `/api/user/profile` | PUT | Update profile | Profile Page | SRS-F-OUT-027 |
| `/api/user/change-password` | POST | Change password | Profile Page | SRS-F-OUT-028 |
| `/api/user/unit` | GET | Get assigned unit | Report Form, Dashboard | SRS-F-OUT-005 |
| `/api/admin/stats` | GET | Dashboard statistics | Admin Dashboard | SRS-F-OUT-016, 017 |
| `/api/admin/reports` | GET | Get reports dengan filter | Reports Management | SRS-F-OUT-024 |
| `/api/admin/reports/:id` | DELETE | Delete single report | Reports Management | SRS-F-OUT-025 |
| `/api/admin/reports/bulk` | DELETE | Delete multiple reports | Reports Management | SRS-F-OUT-025 |
| `/api/admin/units` | GET/POST/PUT/DELETE | CRUD units | Unit Management | SRS-F-OUT-019 |
| `/api/admin/users` | GET/POST/PUT/DELETE | CRUD users | User Management | SRS-F-OUT-020 |
| `/api/admin/unit-locations` | GET/POST/PUT/DELETE | CRUD locations | Unit Locations | SRS-F-OUT-021 |
| `/api/admin/categories` | GET | Get categories | Report Form | SRS-F-OUT-022 |
| `/api/chat/assistant` | POST | AI chatbot query | Chatbot Page | SRS-F-OUT-029, 030, 031, 032 |

---

# Appendix A: File Structure

```
sipatrol/
├── prisma/
│   ├── schema.prisma              # Database schema (5 tables + enum)
│   └── seed.ts                    # Database seeding script
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── chatbot/
│   │   │   │   └── page.tsx       # LC-09: AI Chatbot
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # LC-06: Admin Dashboard
│   │   │   ├── map/
│   │   │   │   └── page.tsx       # LC-08: Patrol Map
│   │   │   ├── reports/
│   │   │   │   └── page.tsx       # LC-07: Reports Management
│   │   │   ├── unit-locations/
│   │   │   │   └── page.tsx       # LC-12: Unit Locations
│   │   │   ├── units/
│   │   │   │   └── page.tsx       # LC-10: Unit Management
│   │   │   ├── users/
│   │   │   │   ├── page.tsx       # LC-11: User Management
│   │   │   │   ├── create/
│   │   │   │   └── [id]/edit/
│   │   │   ├── layout.tsx         # Admin layout dengan sidebar
│   │   │   └── page.tsx           # Admin redirect
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── reports/
│   │   │   │   ├── units/
│   │   │   │   ├── users/
│   │   │   │   └── ...
│   │   │   ├── auth/[...nextauth]/
│   │   │   │   └── route.ts       # NextAuth configuration
│   │   │   ├── chat/assistant/
│   │   │   │   └── route.ts       # AI chatbot endpoint
│   │   │   ├── reports/
│   │   │   │   └── route.ts       # Reports CRUD
│   │   │   └── user/
│   │   ├── check-auth/
│   │   ├── login/
│   │   │   └── page.tsx           # LC-01: Login Page
│   │   ├── security/
│   │   │   ├── profile/
│   │   │   │   └── page.tsx       # LC-05: User Profile
│   │   │   ├── report/
│   │   │   │   └── page.tsx       # LC-03: Report Form
│   │   │   ├── reports/
│   │   │   │   └── page.tsx       # LC-04: Report History
│   │   │   ├── layout.tsx         # Security layout
│   │   │   └── page.tsx           # LC-02: Security Dashboard
│   │   ├── favicon.ico
│   │   ├── globals.css            # Global styles + Tailwind
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Homepage (Landing)
│   ├── actions/
│   │   └── report-actions.ts      # Server Actions untuk reports
│   ├── components/
│   │   ├── security/
│   │   │   ├── recent-report-list.tsx
│   │   │   └── report-list.tsx
│   │   ├── ui/                    # 46 shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── access-denied.tsx
│   │   ├── admin-forbidden.tsx
│   │   ├── admin-sidebar.tsx
│   │   ├── chat.tsx
│   │   ├── confirmation-dialog.tsx
│   │   ├── force-logout.tsx
│   │   ├── online-status-indicator.tsx
│   │   ├── patrol-map.tsx
│   │   ├── providers.tsx
│   │   ├── report-details-modal.tsx
│   │   ├── report-form.tsx
│   │   ├── security-sidebar.tsx
│   │   ├── security-unregistered.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── hooks/
│   │   └── use-offline-reports.ts # Custom hook untuk IndexedDB
│   ├── lib/
│   │   ├── db-readonly.ts         # Read-only DB untuk AI
│   │   ├── prisma.ts              # Prisma Client singleton
│   │   ├── sipatrol-db.ts         # Database helper functions
│   │   ├── sw.ts                  # Service Worker (Serwist)
│   │   ├── user.ts                # User utilities
│   │   └── utils.ts               # General utilities
│   └── middleware.ts              # Route protection (RBAC)
├── .env.local                     # Environment variables
├── next.config.ts                 # Next.js configuration
├── package.json                   # Dependencies
├── prisma/schema.prisma           # Database schema
├── serwist.config.ts              # PWA configuration
├── tailwind.config.ts             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
└── SDD_SIPATROL.md                # Dokumen ini
```

---

# Appendix B: Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/sipatrol"
READ_ONLY_DATABASE_URL="mysql://ai_reader:password@localhost:3306/sipatrol"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="rahasia_dapur_sipatrol_2026"

# Application
PUBLIC_APP_NAME="SiPatrol"

# AI/LLM (Groq)
GROQ_API_KEY="gsk_xxx"
AI_MODEL_NAME="llama-3.3-70b-versatile"

# File Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="5242880"  # 5MB in bytes
```

---

# Appendix C: Revision History

| Versi | Tanggal | Deskripsi Perubahan | Penulis |
|-------|---------|---------------------|---------|
| 1.0 | 30 Maret 2026 | Draft awal SDD berdasarkan analisis kode existing | System Architect |

---

**Dokumen ini adalah properti intelektual dari tim pengembang SiPatrol.**  
Dilarang menduplikasi atau mendistribusikan tanpa izin.
