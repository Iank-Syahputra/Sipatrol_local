SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK

ELIF
(Electronic Learning Informatika)








DAFTAR PERUBAHAN
Revisi
Deskripsi
A




B




C




D




E




F




G








INDEX
TGL
-
A
B
C
D
E
F
G
Ditulis oleh
















Diperiksa oleh
















Disetujui oleh


















Daftar Halaman Perubahan
Halaman
Revisi
Halaman
Revisi























Daftar Isi
1. Pendahuluan	6
1.1	Tujuan Penulisan Dokumen	6
1.2	Lingkup Masalah	6
1.3	Definisi, Istilah  dan Singkatan	7
1.4	Referensi	7
1.5	Deskripsi umum Dokumen (Ikhtisar)	7
2	Deskripsi Umum Perangkat Lunak	8
2.1	Deskripsi Umum Sistem	8
2.2	Fungsi Produk	9
2.3	Karakteristik Pengguna	10
2.4	Batasan	10
2.5	Lingkungan Operasi	11
3	Deskripsi Umum Kebutuhan	11
3.1	Kebutuhan antarmuka eksternal	11
3.2	Deskripsi Fungsional	12
3.2.1	Context Diagram	12
3.2.1.1	DFD Level 1	14
3.3	Data  Requirement	15
3.3.1	E-R diagram	16
3.4	Non Functional Requirement	17
3.5	Batasan Perancangan	17
3.6	Ringkasan Kebutuhan	18
3.6.1	Functional Requirement Summary	18
3.6.2	Non Functional Requirement Summary	19

1. Pendahuluan
Tujuan Penulisan Dokumen
Penulisan dokumen Spesifikasi Kebutuhan Perangkat Lunak (SKPL) ini bertujuan untuk mendefinisikan secara menyeluruh dan rinci seluruh kebutuhan sistem SiPatrol yang dikembangkan untuk lingkungan PT PLN Nusantara Power UP Kendari. Dokumen ini disusun sebagai acuan teknis utama guna menyelaraskan pemahaman antara tim pengembang dengan pihak departemen K3 (Health, Safety, and Environment) selaku pengguna sistem, sehingga fitur yang dibangun sesuai dengan prosedur patroli yang berlaku. Selain itu, dokumen ini berfungsi sebagai landasan dalam tahap perancangan, pengodean, hingga pengujian perangkat lunak, serta menjadi standar verifikasi untuk memastikan bahwa aplikasi SiPatrol mampu
Lingkup Masalah
Lingkup masalah dalam pengembangan SiPatrol mencakup batasan fungsionalitas sistem yang dirancang untuk mengotomatisasi alur kerja patroli K3 di PT PLN Nusantara Power UP Kendari. Sistem ini fokus pada penyediaan platform digital yang mampu menangani manajemen data patroli dari tahap input di lapangan hingga tahap pelaporan manajemen.
Adapun hal-hal yang dapat dilakukan melalui sistem SiPatrol ini meliputi:Dosen dapat Mengupload Materi Perkuliahan .
Menggantikan metode pencatatan temuan patroli dari formulir berbasis google form dan grup chat WA menjadi entri data digital melalui aplikasi guna memanajemen serta mengelola data dengan lebih efisien dan terstruktur.
Sistem mencakup pengelolaan daftar lokasi atau titik-titik krusial di area UP Kendari yang wajib diperiksa secara berkala oleh petugas.
Fokus pada penginputan data temuan yang mencakup deskripsi kondisi, kategori bahaya (K3), serta bukti foto langsung dari lapangan menggunakan kamera perangkat.
Proses pengolahan data hasil patroli menjadi laporan berkala yang dapat diakses oleh pihak manajemen atau admin K3 untuk proses tindak lanjut (validasi) temuan.
Sistem ini secara khusus dirancang untuk digunakan di wilayah operasional PT PLN Nusantara Power UP Kendari dan tidak mencakup integrasi dengan sistem PLN di unit wilayah lain dalam tahap ini.
Lingkup akses dibatasi pada dua peran utama, yaitu petugas lapangan (inputer), dan admin K3 (verifikator).

Definisi, Istilah  dan Singkatan
No.
Akronim / Singkatan
Keterangan
1
SKPL
Spesifikasi Kebutuhan Perangkat Lunak 
Merupakan hasil analisis yang berisi spesifikasi kebutuhan user
2
ERD
Entity Relationship Diagram 
Merupakan diagram yang menggambarkan relasi antara entitas dan atribut dari masing-masing entitas
3
HSE
Health, Safety, and Environment 
Istilah internasional yang sering digunakan secara bergantian dengan K3 di lingkungan PLN.
4
Geo-tagging
Proses penambahan informasi identifikasi geografis (koordinat GPS) ke dalam data foto atau laporan temuan di aplikasi.
5
PWA
Progressive Web App
Aplikasi web yang memiliki kemampuan menyerupai aplikasi native, dapat diinstal, dan mampu berjalan saat kondisi offline.
6
RBAC
Role-Based Access Control
Metode pengaturan hak akses pengguna berdasarkan peran tertentu (misal: Admin vs Security).




Aturan Penomoran


Dokumen-dokumen yang digunakan sebagai referensi dalam pembuatan SKPL ini adalah sebagai berikut :
Panduan Penggunaan dan Pengisian Spesifikasi Perangkat Lunak , Jurusan Teknik Informatika , ITS Surabaya
IEEE Std 830-1993, IEEE Recommended Practice for Software Requirement Specification 
Deskripsi umum Dokumen (Ikhtisar)
Dokumen spesifikasi kebutuhan Perangkat Lunak (SKPL) ini disusun dalam beberapa bagian utama yang mencakup pendahuluan, deskripsi umum sistem, dan rincian kebutuhan perangkat lunak.
Bagian pendahuluan menjelaskan landasan awal pembuatan dokumen, yang meliputi tujuan penulisan sebagai penyamaan persepsi pengembangan, lingkup masalah yang membatasi fungsi aplikasi SiPatrol, serta glosarium istilah teknis dan singkatan. Bagian ini juga memuat aturan penomoran dokumen, referensi yang digunakan, serta ikhtisar singkat mengenai struktur penulisan ini.
Bagian deskripsi umum Perangkat Lunak memaparkan gambaran menyeluruh tentang sistem yang dibangun, mencakup karakteristik pengguna yang akan beroperasi di dalamnya, batasan-batasan teknis yang berlaku, serta lingkungan operasi yang diperlukan agar sistem dapat berjalan dengan baik di lapangan.
Bagian deskripsi kebutuhan merupakan inti dari dokumen yang menguraikan kebutuhan antarmuka eksternal meliputi pemakai, perangkat keras, perangkat lunak, dan komunikasi. Kebutuhan fungsional dipetakan secara detail melalui Data Flow Diagram (DFD) mulai dari diagram konteks hingga level 2, disertai penjelasan pada setiap data store dan spesifikasi prosesnya. Kebutuhan data direpresentasikan melalui Entity Relationship Diagram (E-R Diagram), sementara kebutuhan non-fungsional dan batasan perancangan ditetapkan sebagai panduan bagi pengembang. Terakhir, bagian ini menyertakan kerunutan (traceability) untuk memastikan keselarasan antara kebutuhan fungsional dengan proses DFD, serta pemetaan data store terhadap struktur E-R Diagram.

Deskripsi Umum Perangkat Lunak
Deskripsi Umum Sistem 
SiPatrol merupakan perangkat lunak berbasis Progressive Web App (PWA) yang dirancang untuk mendigitalisasi prosedur patroli K3 di lingkungan PT PLN Nusantara Power UP Kendari, guna menggantikan metode pelaporan berbasis google form dan grup wa yang dinilai kurang efisien dan kurang terkelola dengan baik. Sistem ini memungkinkan petugas Security melakukan inspeksi pada titik-titik lokasi (check-point) yang telah ditentukan dengan mendokumentasikan kondisi ruangan melalui foto dan memberikan klasifikasi laporan berupa Safe Condition, Unsafe Condition, atau Unsafe Action. Melalui fitur offline-first, petugas tetap dapat melakukan input data meskipun berada di area tanpa sinyal, di mana laporan akan tersimpan sementara secara lokal dan tersinkronisasi otomatis ke server pusat segera setelah perangkat kembali mendapatkan jaringan internet.
Di sisi manajemen, sistem ini menyediakan platform bagi Admin K3 untuk melakukan pemeriksaan dan validasi terhadap setiap laporan yang masuk secara real-time. Admin memiliki akses penuh untuk memantau aktivitas patroli di lapangan serta melakukan pengolahan data melalui fitur ekspor laporan ke dalam format Excel. Hal ini bertujuan untuk memudahkan proses dokumentasi, mempercepat alur informasi dari lapangan ke pusat kontrol, serta menyediakan data yang akurat bagi manajemen PLN dalam mengambil keputusan terkait keselamatan dan kesehatan kerja di wilayah operasional perusahaan.


Karakteristik Pengguna
Tabel .
Kategori Pengguna
Tugas
Hak Akses ke Aplikasi
Security
Melakukan pemeriksaan di titik lokasi (check-point), mengambil foto kondisi lapangan, serta melaporkan temuan berdasarkan kategori Safe Condition, Unsafe Condition, atau Unsafe Action.
Melakukan sign in sebagai petugas, menginput data laporan (online/offline), dan melihat riwayat laporan pribadi.
Admin K3
Memantau seluruh laporan yang masuk, melakukan verifikasi dan pemeriksaan terhadap validitas data serta foto temuan, dan mengelola data master titik patroli.
Sign in sebagai admin, kontrol panel pusat, validasi laporan, dan mengunduh rekapitulasi laporan dalam format Excel.


Batasan
Sistem SiPatrol ini memiliki beberapa batasan dalam pengembangan dan pengoperasiannya guna menjaga fokus fungsionalitas utama, antara lain:
Akses fitur ditentukan oleh peran pengguna (admin dan security).
Pelaporan memerlukan autentikasi akun yang valid.
Foto laporan wajib dari kamera langsung untuk mengurangi manipulasi data.
Sistem beroperasi pada lingkungan berbasis web dengan dukungan browser modern.
Integrasi AI assistant bersifat pendukung analisis data, bukan pengganti keputusan operasional.
AI assistant hanya memiliki akses read-only ke database untuk keamanan.
Mode offline bergantung pada kapasitas penyimpanan browser (IndexedDB).
Sinkronisasi offline memerlukan koneksi internet untuk mengirim data tertunda.
Lingkungan Operasi
Agar sistem SiPatrol dapat berjalan dengan optimal dan mendukung fitur offline-first serta anti-fraud, maka diperlukan spesifikasi lingkungan operasi sebagai berikut:
Server :
Node.js 18+ 
Next.js 15 dengan App Router
Prisma ORM 5 untuk akses database
MySQL sebagai database relasional
NextAuth.js untuk manajemen sesi
Client :
Browser modern pada desktop
Dukungan Service Worker untuk PWA
Akses kamera dan GPS via browser API
IndexedDB untuk penyimpanan offline
Jaringan :
HTTP/HTTPS untuk komunikasi client-server
REST API internal untuk operasi CRUD
Sistem Operasi :
Server: Linux/Windows
Client: Android/iOS/Windows/macOS 

Deskripsi Umum Kebutuhan 
Kebutuhan antarmuka eksternal
3.1.1 Antarmuka Pemakai
Sistem SiPatrol akan menyediakan antarmuka yang responsif dan intuitif dengan ketentuan sebagai berikut:
Halaman Login: Form autentikasi dengan validasi username/password.
Dashboard Security: Halaman utama security dengan akses cepat ke pembuatan laporan.
Form Pembuatan Laporan: Interface capture foto, pilih kategori, lokasi, dan catatan.
Riwayat Laporan Petugas: Daftar laporan yang pernah dibuat oleh security.
Dashboard Admin: Live feed 5 laporan terbaru dan statistik unit.
Manajemen Unit: CRUD unit operasional dengan distrik/wilayah.
Manajemen Pengguna: CRUD pengguna dengan assignment unit dan role.
Manajemen Lokasi Unit: CRUD lokasi patroli per unit.
Manajemen Kategori: CRUD kategori laporan dengan color coding.
Laporan Admin: Tabel laporan dengan filter advanced dan bulk actions.
Chatbot AI: Interface chat untuk query database dengan bahasa natural.
Profil User: Halaman pengelolaan profil dan perubahan password.
3.1.2 Antarmuka Perangkat Keras
Sistem SiPatrol akan berinteraksi dengan komponen perangkat keras pada perangkat mobile melalui browser API:
Kamera
GPS (Global Positioning System)
Penyimpanan Lokal (Storage)
 
3.1.3 Antarmuka Perangkat Lunak
NextAuth.js 4.24
Prisma ORM 5
MySQL
Leaflet 1.9
Serwist 9.5
IndexedDB
shadcn/ui
Tailwind CSS 4
Vercel AI SDK
bcryptjs
Zod
3.1.4 Antarmuka Komunikasi
HTTP/HTTPS
REST API Internal
Service Worker Communication
Kebutuhan Fungsional
ID Kebutuhan
Penjelasan
SRS-F-OUT-001
Sistem menampilkan halaman login dengan form username dan password.
SRS-F-OUT-002
Sistem menerima masukan username dan password dari peng- guna.
SRS-F-OUT-003
Sistem memverifikasi kredensial dengan hash bcrypt dan mem- buat sesi JWT.
SRS-F-OUT-004
Sistem melakukan redirect berdasarkan role (admin → /admin/dashboard, security →/security)


SRS-F-OUT-005
Sistem menampilkan dashboard security dengan akses cepat ke fitur laporan.
SRS-F-OUT-006
Sistem menampilkan form pembuatan laporan patroli dengan field lengkap.
SRS-F-OUT-007
Sistem menerima data laporan: kategori, catatan, foto, unit, lokasi patroli.
SRS-F-OUT-008
Sistem menerima koordinat GPS (latitude/longitude) otomatis dari browser.
SRS-F-OUT-009
Sistem menerima timestamp waktu pengambilan laporan (cap- tured_at).
SRS-F-OUT-010
Sistem memvalidasi foto harus dari kamera langsung (non- upload galeri).
SRS-F-OUT-011
Sistem menyimpan laporan ke database MySQL saat kondisi online.
SRS-F-OUT-012
Sistem menyimpan laporan ke IndexedDB saat kondisi offline.
SRS-F-OUT-013
Sistem melakukan sinkronisasi otomatis laporan offline saat koneksi pulih.
SRS-F-OUT-014
Sistem	menandai	laporan	offline	dengan flag is_offline_submission = true.
SRS-F-OUT-015
Sistem menampilkan riwayat laporan pribadi untuk pengguna security.
SRS-F-OUT-016
Sistem menampilkan dashboard admin dengan live feed 5 laporan terbaru.
SRS-F-OUT-017
Sistem menampilkan statistik cards: total unit, laporan terbaru, patroli aktif, petugas.
SRS-F-OUT-018
Sistem membatasi akses menu berdasarkan role pengguna (RBAC via middleware).
SRS-F-OUT-019
Sistem menyediakan CRUD untuk pengelolaan data master unit operasional.
SRS-F-OUT-020
Sistem menyediakan CRUD untuk pengelolaan data pengguna dengan role assignment.
SRS-F-OUT-021
Sistem menyediakan CRUD untuk pengelolaan lokasi unit patroli per unit induk.
SRS-F-OUT-022
Sistem menyediakan CRUD untuk pengelolaan kategori laporan dengan color coding.
SRS-F-OUT-023
Sistem menampilkan visualisasi peta titik laporan patroli dengan Leaflet.
SRS-F-OUT-024
Sistem menyediakan filter laporan berdasarkan unit, kategori, rentang tanggal, pelapor.
SRS-F-OUT-025
Sistem menyediakan fitur bulk delete untuk multiple reports.
SRS-F-OUT-026
Sistem menyediakan ekspor data laporan ke format Excel/CSV (xlsx).
SRS-F-OUT-027
Sistem menampilkan halaman profil pengguna untuk edit data pribadi.
SRS-F-OUT-028
Sistem menyediakan fitur perubahan password dengan validasi bcrypt.
SRS-F-OUT-029
Sistem menampilkan chatbot AI untuk query database dengan bahasa natural.
SRS-F-OUT-0030
Sistem menghasilkan SQL query dari pertanyaan natural language via AI.
SRS-F-OUT-031
Sistem mengeksekusi query read-only (SELECT only) untuk keamanan database.
SRS-F-OUT-032
Sistem menampilkan hasil query AI dalam format tabel dengan streaming response.
SRS-F-OUT-033
Sistem menyediakan caching strategy untuk assets statis (gambar, font, JSON).
SRS-F-OUT-034
Sistem menampilkan notifikasi toast untuk feedback operasi (success/error).




Context Diagram 

3.2.2 DFD Level 1

3.2.3 Spesidikasi Proses
3.2.4 Data Store

Data Store
Deskripsi
Profiles
Data akun pengguna dengan role dan assignment unit
Units
Data unit operasional dengan distrik/wilayah
unit_locations
Data lokasi patroli per unit induk
report_categories
Data kategori laporan dengan warna identifikasi
reports
 Data inti laporan patroli dengan relasi ke semua entitas
IndexedDB (offlineReports)
Penyimpanan sementara laporan offline di client


3.3 Kebutuhan Data
3.3.1 E-R Diagram

Gambar 
3.4 Kebutuhan Non Fungsional
Kebutuhan non-fungsional mendefinisikan batasan properti dan kualitas dari sistem SiPatrol agar dapat dioperasikan sesuai dengan standar keamanan dan performa perusahaan.

ID
Kebutuhan
SRS-NF-001
Sistem harus menjaga keamanan autentikasi dengan hash password bcrypt
SRS-NF-002
Sistem harus menerapkan otorisasi berbasis peran (RBAC) pa- da seluruh modul dan API endpoint.


SRS-NF-003
Sistem harus mendukung operasi offline untuk pelaporan patroli dengan IndexedDB.
SRS-NF-004
Sistem harus dapat berjalan pada browser modern desktop dan mobile (Chrome 90+, Edge, Firefox).
SRS-NF-005
Sistem harus menyimpan jejak audit waktu pelaporan dan status offline untuk pelacakan.
SRS-NF-006
Sistem harus menggunakan validasi data sisi server (Zod schema) sebelum penyimpanan.


3.5 Batasan Perancangan
Selain kebutuhan di atas, perancangan SiPatrol juga terikat oleh beberapa batasan teknis:
Teknologi: Sistem dikembangkan menggunakan stack Next.js 15, Prisma ORM, dan MySQL.
Penyimpanan: Penggunaan Service Worker dan IndexedDB bersifat wajib untuk mendukung fungsionalitas offline.
Aksesibilitas: Sistem hanya dapat dioperasikan secara optimal pada peramban (browser) yang mendukung fitur modern API (Kamera & Geolocation).
3.6 Kerunutan (traceability)
Matriks ini berfungsi untuk memetakan keterkaitan antara kebutuhan fungsional sistem dengan proses pada DFD dan tabel pada basis data yang telah dirancang.
3.6.1 Kebutuhan Fungsional vs Proses
Tabel
ID Kebutuhan
Nama Kebutuhan
Proses Terkait
SRS-F-OUT-001
Tampil form login
P1 Manajemen autentikasi
SRS-F-IN-002
Input kredensial pengguna
P1 Manajemen autentikasi
SRS-F-PR-003
Verifikasi kredensial & sesi
P1 Manajemen autentikasi
SRS-F-PR-004
Redirect berdasarkan role
P1 Manajemen autentikasi
SRS-F-OUT-005
Dashboard security
P2 Pengelolaan laporan
SRS-F-OUT-006
Tampil form laporan
P2 Pengelolaan laporan
SRS-F-IN-007
Input data laporan
P2 Pengelolaan laporan
SRS-F-IN-008
Input GPS otomatis
P2 Pengelolaan laporan
SRS-F-IN-009
Input timestamp
P2 Pengelolaan laporan
SRS-F-PR-010
Validasi foto kamera
P2 Pengelolaan laporan
SRS-F-PR-011
Simpan laporan online
P2 Pengelolaan laporan
SRS-F-PR-012
Simpan laporan offline
P2 Pengelolaan laporan
SRS-F-PR-013
Sinkronisasi saat online
P2 Pengelolaan laporan
SRS-F-PR-014
Flag offline submission
P2 Pengelolaan laporan
SRS-F-OUT-015
Riwayat laporan security
P2 Pengelolaan laporan
SRS-F-OUT-016
Live feed dashboard admin
P3 Monitoring & evaluasi
SRS-F-OUT-017
Statistik cards
P3 Monitoring & evaluasi
SRS-F-PR-018
Kontrol akses RBAC
P1 Manajemen autentikasi
SRS-F-PR-019
Kelola data unit
P4 Pengelolaan data master
SRS-F-PR-020
Kelola data pengguna
P4 Pengelolaan data master
SRS-F-PR-021
Kelola lokasi unit
P4 Pengelolaan data master
SRS-F-PR-022
Kelola kategori laporan
P4 Pengelolaan data master
SRS-F-OUT-023
Visualisasi peta patroli
P3 Monitoring & evaluasi
SRS-F-PR-024
Filter laporan
P3 Monitoring & evaluasi
SRS-F-PR-025
Bulk delete reports
P3 Monitoring & evaluasi
SRS-F-PR-026
Ekspor data Excel/CSV
P3 Monitoring & evaluasi
SRS-F-OUT-027
Halaman profil user
P5 Manajemen profil
SRS-F-PR-028
Perubahan password
P5 Manajemen profil
SRS-F-OUT-029
Chatbot AI interface
P3 Monitoring & evaluasi
SRS-F-PR-030
Generate SQL dari AI
P3 Monitoring & evaluasi
SRS-F-PR-031
Eksekusi read-only query
P3 Monitoring & evaluasi
SRS-F-OUT-032
Tampil hasil query AI
P3 Monitoring & evaluasi
SRS-F-PR-033
Caching assets statis
P1 Infrastruktur
SRS-F-OUT-034
Toast notifications
P1 Infrastruktur


3.6.2 Data Store vs E-R
Tabel ini menunjukkan keterkaitan antara media penyimpanan data pada aliran proses (DFD) dengan entitas yang telah didefinisikan pada perancangan basis data (ERD).

Data Store
Entitas E-R
Relasi Utama
Keterangan
Data Store
Entitas E-R
Relasi Utama
Keterangan
profiles
Profile
1:N ke reports
Menyimpan data akun, role (Security/Admin), dan penugasan (assignment).
units
Unit
1:N ke unit_locations, profiles, reports
Data unit operasional PLN (UP Kendari) yang terhubung dengan distrik.
unit_locations
UnitLocation
N:1 ke units, 1:N ke reports
Daftar titik atau lokasi patroli spesifik yang berada di bawah unit induk.
report_categories
ReportCategory
1:N ke reports
Master kategori laporan (Safe/Unsafe) lengkap dengan sistem color coding.
reports
Report
N:1 ke profiles, units, unit_locations, report_categories
Penyimpanan utama data laporan patroli (foto, koordinat, dan status).


3.7 Ringkasan Kebutuhan
3.7.1 Ringkasan Kebutuhan Fungsional

Kelompok Fungsi
Cakupan Fungsionalitas
ID Terkait
Autentikasi & Otorisasi
Login pengguna, verifikasi sesi (JWT), Role-Based Access Control (RBAC), dan redirect berdasarkan peran.
SRS-F-OUT-001 s.d. SRS-F-PR-004, SRS-F-PR-018
Operasional Patroli
Input laporan K3, pengambilan foto, penentuan koordinat GPS, sinkronisasi online/offline, dan riwayat laporan.
SRS-F-OUT-005 s.d. SRS-F-OUT-015
Monitoring Admin
Live feed laporan, dashboard statistik, pemetaan lokasi, filter data, bulk actions, dan ekspor laporan ke Excel.
SRS-F-OUT-016 s.d. SRS-F-PR-026
AI Assistant
Pencarian data dengan bahasa alami (Natural Language Query), SQL generation, dan eksekusi baca-saja (read-only).
SRS-F-OUT-029 s.d. SRS-F-OUT-032
Manajemen Data Master
Operasi CRUD (Tambah, Baca, Ubah, Hapus) untuk data Unit, Pengguna, Lokasi Patroli, dan Kategori K3.
SRS-F-PR-019 s.d. SRS-F-PR-022
Manajemen Profil
Peninjauan profil pengguna, pengeditan informasi dasar, dan fitur perubahan kata sandi (password).
SRS-F-OUT-027, SRS-F-PR-028
Infrastruktur
Pengelolaan caching (PWA), pengiriman notifikasi, dan manajemen Service Worker untuk kestabilan aplikasi.
SRS-F-PR-033, SRS-F-OUT-034


3.7.2 Ringkasan Kebutuhan Non Fungsional 

Aspek
Ringkasan
Keamanan
Implementasi hashing password menggunakan bcryptjs, penerapan Role-Based Access Control (RBAC), validasi data di sisi server (server-side), penggunaan read-only AI, dan enkripsi HTTPS pada lingkungan produksi.
Keandalan
Dukungan offline mode melalui penyimpanan IndexedDB, fitur sinkronisasi data otomatis saat internet kembali tersedia, serta pencatatan jejak audit (audit trail) yang lengkap untuk setiap aktivitas.
Performa
Waktu respon sistem (response time) diupayakan di bawah 3 detik, mampu menangani lebih dari 100 pengguna secara bersamaan (concurrent users), dan menggunakan strategi caching yang optimal.
Kompatibilitas
Dapat diakses melalui peramban (browser) modern baik pada perangkat desktop maupun mobile, dengan desain responsif yang mengutamakan pendekatan Mobile-First.
Usability
Menyediakan umpan balik pengguna yang intuitif melalui toast notifications, ketersediaan fitur dark mode, status pemuatan (loading states), serta navigasi yang ramah pengguna.
Auditabilitas
Pencatatan otomatis timestamp pada setiap pelaporan, pemberian tanda (flag) untuk pengiriman data saat offline, serta dokumentasi log terhadap setiap query yang dijalankan oleh AI Assistant.


