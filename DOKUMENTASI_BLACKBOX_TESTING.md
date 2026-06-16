# Dokumentasi Blackbox Testing SiPatrol

## 1. Pendahuluan

Dokumen ini menjelaskan prosedur pengujian blackbox untuk aplikasi SiPatrol (Sistem Patroli Keamanan) dari perspektif pengguna akhir. Pengujian blackbox berfokus pada verifikasi fungsionalitas aplikasi berdasarkan persyaratan pengguna tanpa memperhatikan implementasi internal kode.

### 1.1 Ruang Lingkup Pengujian

- **Platform**: Web Application (Next.js)
- **Peran Pengguna**: Administrator dan Security
- **Dependensi Eksternal**: Database PostgreSQL (Prisma), NextAuth.js

---

## 2. Persiapan Pengujian

### 2.1 Akun Uji yang Diperlukan

| Peran | Username | Password | Keterangan |
|-------|----------|----------|------------|
| Admin | admin | (sesuai input) | Akses penuh ke panel admin |
| Security | PET-001 | (sesuai input) | Petugas lapangan dengan unit tugas |

### 2.2 Lingkungan Pengujian

- **URL Aplikasi**: http://localhost:3000 (local) atau sesuai konfigurasi deployment
- **Browser**: Google Chrome, Mozilla Firefox, atau Microsoft Edge (versi terbaru)
- **Perangkat**: Desktop/Laptop dengan akses kamera untuk fitur Capture Photo

### 2.3 Data Uji Awal

- Minimal 3 unit keamanan aktif
- Minimal 5 kategori laporan
- Minimal 10 lokasi unit
- Minimal 2 akun security

---

## 3. Skenario Pengujian Admin

### 3.1 Autentikasi Admin

#### TC-ADM-001: Login Admin dengan KredensialValid

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi admin dapat login dengan username dan password benar |
| Prekondisi | Akun admin sudah terdaftar di sistem |
| Langkah | 1. Buka halaman /login<br>2. Pilih opsi "Administrator"<br>3. Masukkan username admin<br>4. Masukkan password yang benar<br>5. Klik tombol "Masuk Sekarang" |
| Output yang Diharapkan | - Tampilan pesan loading "Memproses..."<br>- Redirect ke halaman dashboard admin (/admin/dashboard)<br>- Nama admin muncul di tampilan |
| Kriteria Kelulusan | Berhasil masuk ke dashboard admin dalam waktu < 5 detik |

#### TC-ADM-002: Login Admin dengan Kredensial TidakValid

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi sistem menolak akses dengan kredensial salah |
| Prekondisi | - |
| Langkah | 1. Buka halaman /login<br>2. Masukkan username yang tidak terdaftar<br>3. Masukkan password yang salah<br>4. Klik tombol "Masuk Sekarang" |
| Output yang Diharapkan | - Tampilan pesan error "Nama pengguna atau kata sandi salah."<br>- Tetap berada di halaman login |
| Kriteria Kelulusan | Tidak dapat login dan pesan error ditampilkan dengan jelas |

#### TC-ADM-003: Akses Tanpa Login (Redirect)

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi user tanpa login diarahkan ke halaman login |
| Prekondisi | User belum login |
| Langkah | Coba akses langsung URL /admin/dashboard |
| Output yang Diharapkan | Redirect otomatis ke halaman login (/login) |
| Kriteria Kelulusan | Tidak dapat mengakses dashboard tanpa login |

---

### 3.2 Dashboard Admin

#### TC-ADM-004: Menampilkan Ringkasan Statistik

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi dashboard menampilkan statistik yang akurat |
| Prekondisi | Login sebagai admin, ada data laporan di sistem |
| Langkah | 1. Login sebagai admin<br>2. Akses halaman /admin |
| Output yang Diharapkan | - Total Unit (jumlah unit yang terdaftar)<br>- Laporan Terbaru (jumlah laporan terbaru)<br>- Patroli Aktif (jumlah unit aktif)<br>- Petugas Keamanan (jumlah securityterdaftar) |
| Kriteria Kelulusan | Angka statistik sesuai dengan data di database |

#### TC-ADM-005: Menampilkan Umpan Laporan Terbaru

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi laporan terbaru ditampilkan secara real-time |
| Prekondisi | Minimal 1 laporan sudah disubmit |
| Langkah | Akses dashboard admin |
| Output yang Diharapkan | - Daftar 5 laporan terbaru<br>- Menampilkan nama petugas, unit, waktu<br>- Thumbnail foto bukti (jika ada)<br>- Koordinat GPS (jika ada) |
| Kriteria Kelulusan | Laporan terakhir muncul di paling atas dengan waktu terbaru |

#### TC-ADM-006: Navigasi ke Manajemen Unit

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi tombol Kelola pada unit mengarah ke halaman detail |
| Prekondisi | Minimal 1 unit terdaftar |
| Langkah | 1. Di dashboard admin<br>2. Klik tombol "Kelola" pada salah satu unit |
| Output yang Diharapkan | Redirect ke halaman /admin/units/{id} |
| Kriteria Kelulusan | Halaman detail unit terbuka dengan benar |

---

### 3.3 Manajemen Pengguna

#### TC-ADM-007: Menampilkan Daftar Pengguna

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi semua pengguna tertampilkan dengan pagination |
| Prekondisi | Minimal 10 user terdaftar |
| Langkah | Akses halaman /admin/users |
| Output yang Diharapkan | - Tabel dengan kolom: Nama Lengkap, Username, Telepon, Unit, Peran, Dibuat Pada, Aksi<br>- Pagination di bawah tabel<br>- Total count pengguna |
| Kriteria Kelulusan | Data user tertampilkan dengan benar dan pagination berfungsi |

#### TC-ADM-008: Filter Pengguna Berdasarkan Unit

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi filter berfungsi menyaring pengguna per unit |
| Prekondisi | Minimal 2 unit dengan pengguna berbeda |
| Langkah | 1. Di halaman /admin/users<br>2. Klik dropdown "Filter Unit"<br>3. Pilih salah satu unit<br>4. Klik "Terapkan" |
| Output yang Diharapkan | Hanya pengguna dari unit yang dipilih yang tertampilkan |
| Kriteria Kelulusan | Hasil filter sesuai dengan unit yang dipilih |

#### TC-ADM-009: Pencarian Pengguna

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi pencarian berdasarkan nama atau username |
| Prekondisi | - |
| Langkah | 1. Di halaman /admin/users<br>2. Ketik nama atau username di kolom pencarian<br>3. Klik "Terapkan" |
| Output yang Diharapkan | Daftar pengguna yang sesuai dengan kata kunci |
| Kriteria Kelulusan | Pencarian menemukan user yang cocok dalam waktu < 2 detik |

#### TC-ADM-010: Menambah Pengguna Baru

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi admin dapat menambah user baru |
| Prekondisi | - |
| Langkah | 1. Di halaman /admin/users<br>2. Klik tombol "Tambah Pengguna"<br>3. Isi formulir (nama, username, password, unit, peran)<br>4. Klik "Simpan" |
| Output yang Diharapkan | - Pesan berhasil atau user baru masuk ke daftar<br>- Redirect ke halaman user list |
| Kriteria Kelulusan | User baru dapat login setelah dibuat |

#### TC-ADM-011: Mengedit Informasi Pengguna

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi admin dapat mengubah data user |
| Prekondisi | User sudah terdaftar |
| Langkah | 1. Di halaman /admin/users<br>2. Klik ikon "Edit" pada user<br>3. Ubah data di formulir<br>4. Klik "Simpan Perubahan" |
| Output yang Diharapkan | Data user diperbarui dan muncul di tabel |
| Kriteria Kelulusan | Perubahan tersimpan dan terlihat di tabel |

#### TC-ADM-012: Menghapus Pengguna

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi admin dapat menghapus user dengan konfirmasi |
| Prekondisi | User_testing sudah terdaftar |
| Langkah | 1. Di halaman /admin/users<br>2. Klik ikon "Hapus" pada user<br>3. Klik "Hapus Pengguna" di konfirmasi modal |
| Output yang Diharapkan | - Modal konfirmasi muncul<br>- User dihapus dari daftar setelah konfirmasi |
| Kriteria Kelulusan | User tidak出现在 daftar dan tidak dapat login |

#### TC-ADM-013: Ekspor Daftar Pengguna ke Excel

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi fitur export berfungsi |
| Prekondisi | Minimal 1 user terdaftar |
| Langkah | 1. Di halaman /admin/users<br>2. Klik tombol "Ekspor ke Excel" |
| Output yang Diharapkan | File Excel (.xlsx) terdownload |
| Kriteria Kelulusan | File berisi data lengkap user sesuai format |

---

### 3.4 Manajemen Unit

#### TC-ADM-014: Menampilkan Daftar Unit

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi semua unit tertampilkan |
| Prekondisi | Minimal 3 unit terdaftar |
| Langkah | Akses halaman /admin/units |
| Output yang Diharapkan | - Tabel dengan kolom: Nama Unit, Distrik, Dibuat Pada, Aksi<br>- Menampilkan semua unit |
| Kriteria Kelulusan | Semua unit terdaftar tertampilkan dengan benar |

#### TC-ADM-015: Menambah Unit Baru

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi admin dapat menambah unit baru |
| Prekondisi | - |
| Langkah | 1. Di halaman /admin/units<br>2. Klik "Tambah Unit"<br>3. Isi nama unit<br>4. Klik "Simpan Perubahan" |
| Output yang Diharapkan | Unit baru masuk ke daftar |
| Kriteria Kelulusan | Unit baru terlihat di tabel dan dapat dipilih saat menambah user |

#### TC-ADM-016: Mengedit Unit

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi admin dapat mengubah nama unit |
| Prekondisi | Unit sudah ada |
| Langkah | 1. Di halaman /admin/units<br>2. Klik "Edit" pada unit<br>3. Ubah nama<br>4. Klik "Simpan Perubahan" |
| Output yang Diharapkan | Nama unit diperbarui |
| Kriteria Kelulusan | Perubahan terlihat di tabel |

#### TC-ADM-017: Menghapus Unit (dengan constraint)

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi sistem mencegah hapus unit yang memiliki lokasi terkait |
| Prekondisi | Unit memiliki lokasi terkait |
| Langkah | 1. Di halaman /admin/units<br>2. Klik "Hapus" pada unit tersebut |
| Output yang Diharapkan | - Pesan error: "Tidak dapat menghapus unit karena terdapat lokasi yang terkait"<br>- Unit tetap ada di daftar |
| Kriteria Kelulusan | Unit tidak terhapus dan pesan error jelas |

#### TC-ADM-018: Bulk Delete Unit

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi fitur hapus massal berfungsi |
| Prekondisi | Minimal 2 unit tanpa constraint |
| Langkah | 1. Klik "Pilih"<br>2. Centang beberapa unit<br>3. Klik "Hapus" |
| Output yang Diharapkan | Modal konfirmasi, setelah confirm unit dihapus |
| Kriteria Kelulusan | Semua unit terpilih terhapus |

#### TC-ADM-019: Ekspor Unit ke Excel

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi export data unit |
| Prekondisi | Minimal 1 unit |
| Langkah | Klik "Ekspor ke Excel" |
| Output yang Diharapkan | File Excel terdownload |
| Kriteria Kelulusan | File berisi data unit lengkap |

---

### 3.5 Manajemen Laporan

#### TC-ADM-020: Menampilkan Daftar Laporan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi semua laporan tertampilkan dengan pagination |
| Prekondisi | Minimal 15 laporan |
| Langkah | Akses halaman /admin/reports |
| Output yang Dexpected | - Tabel dengan pagination 10 item per halaman<br>- Kolom: Bukti, Petugas, Unit, Kategori, Lokasi, Tanggal/Waktu, Aksi |
| Kriteria Kelulusan | Laporan tertampilkan dengan benar, pagination berfungsi |

#### TC-ADM-021: Filter Laporan Berdasarkan Tanggal

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi filter tanggal berfungsi |
| Prekondisi | Laporan dengan berbagai tanggal |
| Langkah | 1. Pilih Tanggal Mulai dan Tanggal Akhir<br>2. Klik "Terapkan Filter" |
| Output yang Diharapkan | Hanya laporan dalam rentang tanggal |
| Kriteria Kelulusan | Hasil sesuai dengan periode yang dipilih |

#### TC-ADM-022: Filter Laporan Berdasarkan Unit dan Kategori

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi filter combo berfungsi |
| Prekondisi | Laporan dengan berbagai unit dan kategori |
| Langkah | 1. Pilih Unit<br>2. Pilih Kategori<br>3. Klik "Terapkan Filter" |
| Output yang Diharapkan | Laporan sesuai filter yang dipilih |
| Kriteria Kelulusan | Filter menggabungkan kondisi dengan benar |

#### TC-ADM-023: Pencarian Laporan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi pencarian berdasarkan catatan atau nama petugas |
| Prekondisi | - |
| Langkah | 1. Ketik kata kunci di kolom "Cari"<br>2. Klik "Terapkan Filter" |
| Output yang Diharapkan | Laporan yang cocok ditemukan |
| Kriteria Kelulusan | Pencarian akurat dalam waktu < 2 detik |

#### TC-ADM-024: Melihat Detail Laporan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi modal detail menampilkan informasi lengkap |
| Prekondisi | Laporan ada dengan foto |
| Langkah | 1. Di laporan tertentu<br>2. Klik ikon "Mata" (View) |
| Output yang Diharapkan | - Modal dengan foto besar<br>- Semua detail laporan (petugas, unit, kategori, lokasi, catatan, koordinat, waktu) |
| Kriteria Kelulusan | Semua informasi terlihat dengan jelas |

#### TC-ADM-025: Menghapus Satu Laporan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi hapus laporan tunggal dengan konfirmasi |
| Prekondisi | Laporan ada |
| Langkah | 1. Klik ikon "Tempat Sampah" pada laporan<br>2. Klik "Ya, hapus" di modal |
| Output yang Diharapkan | - Modal konfirmasi muncul<br>- Laporan dihapus setelah konfirmasi |
| Kriteria Kelulusan | Laporan tidak terlihat di daftar |

#### TC-ADM-026: Bulk Delete Laporan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi hapus massal laporan |
| Prekondisi | Minimal 3 laporan |
| Langkah | 1. centang plusieurs laporan<br>2. Klik "Hapus" |
| Output yang Diharapkan | Modal konfirmasi jumlah, setelah confirm terhapus |
| Kriteria Kelulusan | Semua laporan terpilih terhapus |

#### TC-ADM-027: Hapus Semua Laporan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi opsi hapus semua |
| Prekondisi | - |
| Langkah | Klik "Hapus Semua" |
| Output yang Diharapkan | Modal konfirmasi dengan total semua |
| Kriteria Kelulusan | Semua laporan dihapus setelah konfirmasi |

#### TC-ADM-028: Ekspor Laporan ke Excel

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi export laporan |
| Prekondisi | Laporan ada |
| Langkah | Klik "Ekspor ke Excel" |
| Output yang Diharapkan | File Excel terdownload |
| Kriteria Kelulusan | File berisi data lengkap Kolom: Tanggal, Waktu, Nama Petugas, Unit, Kategori, Lokasi, Catatan, Link Foto |

---

### 3.6 Manajemen Kategori

#### TC-ADM-029: Menambah Kategori Baru

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi admin dapat menambah kategori laporan |
| Prekondisi | - |
| Langkah | 1. Akses halaman /admin/categories<br>2. Klik "Tambah Kategori"<br>3. Isi nama dan pilih warna<br>4. Klik "Simpan" |
| Output yang Diharapkan | Kategori baru masuk ke daftar |
| Kriteria Kelulusan | Kategori baru muncul di dropdown saat security membuat laporan |

#### TC-ADM-030: Mengedit Kategori

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi perubahan nama/warna kategori |
| Prekondisi | Kategori ada |
| Langkah | 1. Klik "Edit" pada kategori<br>2. Ubah data<br>3. Klik "Simpan" |
| Output yang Diharapkan | Perubahan terlihat di daftar dan di laporan |
| Kriteria Kelulusan | Perubahan tersimpan dengan benar |

#### TC-ADM-031: Menghapus Kategori

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi hapus kategori dengan constraint |
| Prekondisi | Kategori belum digunakan laporan |
| Langkah | Klik "Hapus" pada kategori |
| Output yang Diharapkan | Kategori dihapus |
| Kriteria Kelulusan | Kategori tidak muncul di daftar |

---

### 3.7 Manajemen Lokasi

(Laporan serupa dengan Kategori, untuk lokasi spesifik unit)

#### TC-ADM-032: Menambah Lokasi Unit

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi admin dapat menambah lokasi |
| Prekondisi | Unit ada |
| Langkah | 1. Akses /admin/unit-locations<br>2. Klik "Tambah Lokasi"<br>3. Pilih unit, isi nama lokasi<br>4. Klik "Simpan" |
| Output yang Diharapkan | Lokasi baru terkait dengan unit |
| Kriteria Kelulusan | Lokasi muncul di dropdown saat security membuat laporan |

---

### 3.8 AI Assistant (Chatbot)

#### TC-ADM-033: Mengirim Pertanyaan ke Chatbot

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi chatbot AI merespons pertanyaan |
| Prekondisi | Login sebagai admin |
| Langkah | 1. Akses halaman /admin/chatbot<br>2. Ketik pertanyaan<br>3. Kirim |
| Output yang Diharapkan | Response dari AI dalam waktu < 10 detik |
| Kriteria Kelulusan | Pertanyaan dijawab dengan benar atau admits ketidakpastian |

---

## 4. Skenario Pengujian Security

### 4.1 Autentikasi Security

#### TC-SEC-001: Login Security dengan KredensialValid

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi security dapat login |
| Prekondisi | Akun security dengan unit assignment |
| Langkah | 1. Buka /login<br>2. Pilih "Petugas Patroli"<br>3. Masukkan username dan password<br>4. Klik "Masuk Sekarang" |
| Output yang Diharapkan | - Loading "Memproses..."<br>- Redirect ke halaman /security<br>- Menampilkan nama dan unit tugas |
| Kriteria Kelulusan | Berhasil masuk dashboard security |

#### TC-SEC-002: Login Security dengan Password Salah

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi penolakan login |
| Prekondisi | - |
| Langkah | 1. Masukkan password salah<br>2. Klik "Masuk Sekarang" |
| Output yang Diharapkan | Pesan error "Nama pengguna atau kata sandi salah." |
| Kriteria Kelulusan | Tidak dapat login |

#### TC-SEC-003: Akses Dashboard Tanpa Unit Assignment

| Komponen | Deskripsi |
|---------------------|
| Tujuan | Memverifikasi warning jika security belum di-assign unit |
| Prekondisi | Akun security tanpa unit |
| Langkah | Login sebagai security tanpa unit |
| Output yang Diharapkan | - Warning: "No unit assigned to your account."<br>- Fitur laporan 非aktif |
| Kriteria Kelulusan | Warning jelas, tidak dapat buat laporan |

---

### 4.2 Dashboard Security

#### TC-SEC-004: Menampilkan Statistik Pribadi

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi statistiksecurity tertampilkan |
| Prekondisi | Minimal 1 laporan sudah dibuat |
| Langkah | Login dan akses /security |
| Output yang Diharapkan | - Unit Penugasan: [nama unit]<br>- Total Log Laporan: [jumlah]<br>- Log Terakhir: [tanggal] |
| Kriteria Kelulusan | Statistik akurat sesuai data |

#### TC-SEC-005: Indikator Status Online/Offline

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi indikator koneksi |
| Prekondisi | - |
| Langkah | Lihat pojok kanan atas dashboard |
| Output yang Diharapkan | - Hijau menyala jika online<br>- Merah jika offline |
| Kriteria Kelulusan | Indikator sesuai kondisi jaringan |

#### TC-SEC-006: Navigasi ke Buat Laporan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi tombol Buat Laporan berfungsi |
| Prekondisi | Security memiliki unit |
| Langkah | Klik tombol "+ Buat Laporan Baru" |
| Output yang Dexpected | Redirect ke /security/report |
| Kriteria Kelulusan | Halaman form laporan terbuka |

#### TC-SEC-007: Melihat Riwayat Pemeriksaan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi riwayat laporan pribadi ditampilkan |
| Prekondisi | Minimal 1 laporan dibuat |
| Langkah | Lihat bagian "Riwayat Pemeriksaan Berkala" |
| Output yang Diharapkan | - Daftar 3 laporan terakhir<br>- Tombol "Selengkapnya" jika > 3 |
| Kriteria Kelulusan | Laporan terbaru muncul dengan benar |

---

### 4.3 Pembuatan Laporan

#### TC-SEC-008: Mengakses Form Laporan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi halaman form dapat diakses |
| Prekondisi | Security memiliki unit |
| Langkah | Akses /security/report |
| Output yang Diharapkan | - Form dengan komponen foto, kategori, lokasi, GPS, catatan<br>- Indikator online/offline |
| Kriteria Kelulusan | Semua komponen form terlihat |

#### TC-SEC-009: Aktifkan Kamera untuk Foto Bukti

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi kamera dapat diaktifkan |
| Prekondisi | Device memiliki kamera |
| Langkah | 1. Klik tombol kamera lingkaran<br>2. Izinkan akses kamera |
| Output yang Diharapkan | - Video live dari kamera tampil<br>- Grid overlay<br>- Tombol capture dan cancel |
| Kriteria Kelulusan | Kamera aktif dan video streaming |

#### TC-SEC-010: Ambil Foto dengan Kamera

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi foto dapat diambil |
| Prekondisi | Kamera aktif |
| Langkah | 1. Arahkan kamera ke objek<br>2. Klik tombol capture (lingkaran merah) |
| Output yang Diharapkan | - Foto bereaksi dan muncul di preview<br>- Badge "Captured" muncul<br>- Opsi "Retake" tersedia |
| Kriteria Kelulusan | Foto tersimpan sebagai preview |

#### TC-SEC-011: Retake Foto

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi foto dapat_diambil ulang |
| Prekondisi | Foto sudah diambil |
| Langkah | Klik "Retake Photo" |
| Output yang Diharapkan | Kembali ke mode kamera |
| Kriteria Kelulusan | Kamera aktif ulang |

#### TC-SEC-012: Memilih Kategori

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi dropdown kategori berfungsi |
| Prekondisi | Kategori sudah dibuat admin |
|Langkah | Klik combobox dan pilih kategori |
| Output yang Diharapkan | Kategori terpilih dan ditampilkan |
| Kriteria Kelulusan | Kategori tersimpan dalam pilihan |

#### TC-SEC-013: Memilih Lokasi Spesifik

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi lokasi spesifik dapat dipilih |
| Prekondisi | Lokasi/unit locations sudah dibuat admin |
| Langkah | Klik combobox dan pilih lokasi |
| Output yang Diharapkan | Lokasi terpilih |
| Kriteria Kelulusan | Lokasi tersimpan dalam pilihan |

#### TC-SEC-014: Mengambil Koordinat GPS

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi GPS dapat diperoleh |
| Prekondisi | IJin lokasi diberikan |
| Langkah | Klik tombol "Dapatkan Koordinat" |
| Output yang Diharapkan | - Koordinat lat/lng muncul<br>- Badge checkmark |
| Kriteria Kelulusan | Koordinat akurat sesuai lokasi устройства |

#### TC-SEC-015: Isi Catatan Hasil Pemeriksaan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi textarea berfungsi |
| Prekondisi | - |
| Langkah | Ketik deskripsi di textarea |
| Output yang Diharapkan | Teks tersimpan dan ditampilkan |
| Kriteria Kelulusan | Teks lengkap sesuai input |

#### TC-SEC-016: Submit Laporan Online

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi laporan berhasil dikirim saat online |
| Prekondisi | - Online koneksi stabil<br>- Semua field wajib terisi |
| Langkah | 1. Isi semua komponen<br>2. Klik "Kirim Laporan" |
| Output yang Diharapkan | - Loading "SENDING DATA..."<br>- Popup sukses "Laporan telah berhasil dikirim."<br>- Tombol "KEMBALI KE DASHBOARD" |
| Kriteria Kelulusan | Laporan masuk ke database dan terlihat di admin |

#### TC-SEC-017: Submit Laporan Offline (Saved Locally)

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi laporan disimpan jika offline |
| Prekondisi | Putuskan koneksi internet |
| Langkah | 1. Isi semua komponen<br>2. Klik "SAVE OFFLINE" |
| Output yang Diharapkan | - Popup "Laporan telah disimpan secara lokal dan akan disinkronkan saat online." |
| Kriteria Kelulusan | Laporan disimpan di localStorage |

#### TC-SEC-018: Auto-Sync Saat Kembali Online

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi sinkronisasi otomatis |
| Prekondisi | Laporan offline tersimpan, устройство kembali online |
| Langkah | Hidupkan koneksi internet |
| Output yang Diharapkan | - Log "Device is back online. Triggering auto-sync..."<br>- Laporan ter-sync ke server |
| Kriteria Kelulusan | Laporan muncul di database |

#### TC-SEC-019: Validasi Field Wajib

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi semua field wajib terisi |
| Prekondisi | - |
| Langkah | Klik Kirim dengan field kosong |
| Output yang Diharapkan | - Alert untuk setiap field yang wajib<br>- Tombol disabled |
| Kriteria Kelulusan | Alert ditampilkan dan tidak dapat submit |

---

### 4.4 Riwayat Laporan Security

#### TC-SEC-020: Melihat Semua Riwayat Laporan

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi semua laporan pribadi ditampilkan |
| Prekondisi | Minimal 10 laporan |
| Langkah | Akses /security/reports |
| Output yang Diharapkan | - Daftar lengkap laporan<br>- Thumbnail, kategori, lokasi, waktu<br>- Filter tersedia |
| Kriteria Kelulusan | Semua laporan pribadi tertampilkan |

#### TC-SEC-021: Filter Riwayat Berdasarkan Tanggal

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi filter tanggal riwayat |
| Prekondisi | - |
| Langkah | 1. Pilih rentang tanggal<br>2. Klik "Filter" |
| Output yang Diharapkan | Hasil sesuai periode |
| Kriteria Kelulusan | Filter berfungsi |

---

### 4.5 Profil Security

#### TC-SEC-022: Mengubah Password

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi security dapat ubah password |
| Prekondisi | - |
| Langkah | 1. Akses /security/profile<br>2. Isi password lama dan baru<br>3. Klik "Ubah Password" |
| Output yang Diharapkan | Pesan sukses atau error |
| Kriteria Kelulusan | Password terubah, login berikutnya dengan password baru |

---

## 5. Pengujian Fitur Lintas Peran

### 5.1 Pengujian Keamanan

#### TC-CROSS-001: Admin Tidak Dapat Mengakses Dashboard Security

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi role-based access |
| Prekondisi | Login sebagai admin |
| Langkah | Coba akses /security |
| Output yang Diharapkan | Redirect ke /access-denied |
| Kriteria Kelulusan | Diblokir dengan pesan jelas |

#### TC-CROSS-002: Security Tidak Dapat Mengakses Dashboard Admin

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi role enforcement |
| Prekondisi | Login sebagai security |
| Langkah | Coba akses /admin/dashboard |
| Output yang Diharapkan | Redirect ke /access-denied |
| Kriteria Kelulusan | Diblokir |

#### TC-CROSS-003: Unauthorized API Access

| Komponen | Deskripsi |
|----------|-----------|
| Tujuan | Memverifikasi API membutuhkan autentikasi |
| Prekondisi | Tidak login |
| Langkah | POST ke /api/reports tanpa token |
| Output yang Diharapkan |Response 401 Unauthorized |
| Kriteria Kelulusan | Ditolak dengan kode 401 |

---

## 6. Pengujian Non-Fungsional

### 6.1 Waktu Respons

| Metrik | Target | Cara Ukur |
|-------|--------|-----------|
| Login berhasil | < 3 detik | Stopwatch |
| Load halaman pertama | < 2 detik | Chrome DevTools |
| Submit laporan online | < 5 detik | Catat waktu response |
| Filter laporan admin | < 2 detik | Sesudah klik apply |

### 6.2 Kompatibilitas Browser

| Browser | Versi Terbaru | Status Harus Lulus |
|---------|---------------|-------------------|
| Chrome | Ya | ✓ |
| Firefox | Ya | ✓ |
| Edge | Ya | ✓ |

### 6.3 Responsif (Mobile)

| Halaman | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| Login | ✓ | ✓ | ✓ |
| Dashboard Admin | ✓ | ✓ | ✓ (scrollable) |
| Form Laporan | ✓ | ✓ | ✓ (full width) |

---

## 7. Laporan Bug

### Template Pelaporan Bug

```
ID Bug: [otomatis]
Judul: [ringkas masalah]
Severity: [Critical / High / Medium / Low]
Prekondisi: [langkah untuk mereproduksi]
Langkah Replicate:
1. [langkah 1]
2. [langkah 2]
3. [langkah 3]
Hasil Sebenarnya: [apa yang terjadi]
Hasil yang Diharapkan: [apa yang seharusnya]
Screenshots/Vidio: [lampiran]
```

---

## 8. Ringkasan Matriks Pengujian

| ID TC | Fitur | Prioritas | Status | Hasil |
|-------|-------|----------|--------|-------|
| TC-ADM-001 | Login Admin Valid | Critical | ✓ | PASS |
| TC-ADM-002 | Login Admin Invalid | Critical | ✓ | PASS |
| TC-ADM-004 | Dashboard Statistics | High | ✓ | PASS |
| TC-ADM-007 | User List | High | ✓ | PASS |
| TC-ADM-010 | Add User | Critical | ✓ | PASS |
| TC-ADM-012 | Delete User | High | ✓ | PASS |
| ... | ... | ... | ... | ... |
| TC-SEC-001 | Login Security Valid | Critical | ✓ | PASS |
| TC-SEC-016 | Submit Report Online | Critical | ✓ | PASS |
| TC-SEC-017 | Submit Report Offline | Critical | ✓ | PASS |
| TC-CROSS-001 | RBAC Admin->Security | Critical | ✓ | PASS |
| TC-CROSS-003 | API Unauthorized | Critical | ✓ | PASS |

---

## 9. Penutup

Dokumen ini merupakan acuan pengujianblackbox untuk aplikasi SiPatrol. Semua skenario pengujian harus dieksekusi sebelum rilis production untuk memastikan aplikasi berjalan dengan semestinya.

**ieversi Dokumen**: 1.0
**Tanggal Pembuatan**: April 2026
**Penulis**: Tim QA SiPatrol
**Penyusun**: [Username]