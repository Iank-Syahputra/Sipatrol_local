# Matriks Test Case - SiPatrol Blackbox Testing

## 1. Skenario Pengujian Admin

| No | Skenario Pengujian | Test Case ID | Hasil yang Diharapkan | Hasil Pengujian | Status |
|----|------------------|-------------|---------------------|---------------|---------|
| 1 | Login Admin dengan kredensial valid | TC-ADM-001 | Redirect ke /admin/dashboard, nama admin tampil | | |
| 2 | Login Admin dengan kredensial tidak valid | TC-ADM-002 | Pesan error "Nama pengguna atau kata sandi salah." | | |
| 3 | Akses dashboard tanpa login | TC-ADM-003 | Redirect ke /login | | |
| 4 | Menampilkan ringkasan statistik dashboard | TC-ADM-004 | Total Unit, Laporan Terbaru, Patroli Aktif, Petugas Keamanan | | |
| 5 | Menampilkan umpan laporan terbaru | TC-ADM-005 | 5 laporan terbaru dengan detail lengkap | | |
| 6 | Navigasi ke manajemen unit | TC-ADM-006 | Redirect ke /admin/units/{id} | | |
| 7 | Menampilkan daftar pengguna dengan pagination | TC-ADM-007 | Tabel user dengan kolom lengkap, pagination aktif | | |
| 8 | Filter pengguna berdasarkan unit | TC-ADM-008 | Hanya user dari unit yang dipilih | | |
| 9 | Pencarian pengguna | TC-ADM-009 | User yang cocok ditemukan dalam < 2 detik | | |
| 10 | Menambah pengguna baru | TC-ADM-010 | User masuk ke daftar, bisa login | | |
| 11 | Mengedit informasi pengguna | TC-ADM-011 | Perubahan tersimpan di tabel | | |
| 12 | Menghapus pengguna | TC-ADM-012 | User dihapus setelah konfirmasi | | |
| 13 | Ekspor daftar pengguna ke Excel | TC-ADM-013 | File Excel terdownload | | |
| 14 | Menampilkan daftar unit | TC-ADM-014 | Tabel unit dengan kolom lengkap | | |
| 15 | Menambah unit baru | TC-ADM-015 | Unit baru terlihat di tabel | | |
| 16 | Mengedit unit | TC-ADM-016 | Nama unit diperbarui | | |
| 17 | Menghapus unit (dengan constraint) | TC-ADM-017 | Error "Tidak dapat menghapus unit karena lokasi terkait" | | |
| 18 | Bulk delete unit | TC-ADM-018 | Unit terpilih terhapus setelah konfirmasi | | |
| 19 | Ekspor unit ke Excel | TC-ADM-019 | File Excel terdownload | | |
| 20 | Menampilkan daftar laporan dengan pagination | TC-ADM-020 | Tabel laporan 10 item/halaman | | |
| 21 | Filter laporan berdasarkan tanggal | TC-ADM-021 | Laporan sesuai rentang tanggal | | |
| 22 | Filter laporan berdasarkan unit dan kategori | TC-ADM-022 | Laporan sesuai filter combo | | |
| 23 | Pencarian laporan | TC-ADM-023 | Laporan cocok ditemukan < 2 detik | | |
| 24 | Melihat detail laporan | TC-ADM-024 | Modal dengan foto besar dan detail lengkap | | |
| 25 | Menghapus satu laporan | TC-ADM-025 | Laporan dihapus setelah konfirmasi | | |
| 26 | Bulk delete laporan | TC-ADM-026 | Laporan terpilih terhapus | | |
| 27 | Hapus semua laporan | TC-ADM-027 | Semua laporan dihapus | | |
| 28 | Ekspor laporan ke Excel | TC-ADM-028 | File Excel dengan kolom lengkap | | |
| 29 | Menambah kategori baru | TC-ADM-029 | Kategori masuk daftar | | |
| 30 | Mengedit kategori | TC-ADM-030 | Perubahan terlihat di laporan | | |
| 31 | Menghapus kategori | TC-ADM-031 | Kategori tidak muncul di daftar | | |
| 32 | Menambah lokasi unit | TC-ADM-032 | Lokasi terkait unit muncul di dropdown | | |
| 33 | Mengirim pertanyaan ke Chatbot | TC-ADM-033 | Response AI < 10 detik | | |

---

## 2. Skenario Pengujian Security

| No | Skenario Pengujian | Test Case ID | Hasil yang Diharapkan | Hasil Pengujian | Status |
|----|------------------|-------------|---------------------|---------------|---------|
| 1 | Login Security dengan kredensial valid | TC-SEC-001 | Redirect ke /security, nama dan unit tampil | | |
| 2 | Login Security dengan password salah | TC-SEC-002 | Pesan error ditampilkan | | |
| 3 | Akses dashboard tanpa unit assignment | TC-SEC-003 | Warning "No unit assigned", form 非aktif | | |
| 4 | Menampilkan statistik pribadi | TC-SEC-004 | Unit Penugasan, Total Log, Log Terakhir | | |
| 5 | Indikator status online/offline | TC-SEC-005 | Hijau=online, Merah=offline | | |
| 6 | Navigasi ke Buat Laporan | TC-SEC-006 | Redirect ke /security/report | | |
| 7 | Melihat riwayat pemeriksaan | TC-SEC-007 | 3 laporan terakhir, tombol Selengkapnya | | |
| 8 | Mengakses form laporan | TC-SEC-008 | Form dengan semua komponen terlihat | | |
| 9 | Aktifkan kamera untuk foto bukti | TC-SEC-009 | Video live dengan grid overlay | | |
| 10 | Ambil foto dengan kamera | TC-SEC-010 | Foto capture, badge "Captured" | | |
| 11 | Retake foto | TC-ADM-011 | Kembali ke mode kamera | | |
| 12 | Memilih kategori | TC-SEC-012 | Kategori terpilih tersimpan | | |
| 13 | Memilih lokasi spesifik | TC-SEC-013 | Lokasi terpilih tersimpan | | |
| 14 | Mengambil koordinat GPS | TC-SEC-014 | Koordinat lat/lng muncul | | |
| 15 | Isi catatan hasil pemeriksaan | TC-SEC-015 | Teks tersimpan dan tampil | | |
| 16 | Submit laporan online | TC-SEC-016 | Popup sukses, laporan di database | | |
| 17 | Submit laporan offline | TC-SEC-017 | Popup "disimpan lokal", sync saat online | | |
| 18 | Auto-sync saat kembali online | TC-SEC-018 | Laporan ter-sync ke server | | |
| 19 | Validasi field wajib | TC-SEC-019 | Alert per field, tombol disabled | | |
| 20 | Melihat semua riwayat laporan | TC-SEC-020 | Daftar lengkap dengan filter | | |
| 21 | Filter riwayat berdasarkan tanggal | TC-SEC-021 | Hasil sesuai periode | | |
| 22 | Mengubah password | TC-SEC-022 | Password terubah | | |

---

## 3. Skenario Pengujian Lintas Peran (Cross-Feature)

| No | Skenario Pengujian | Test Case ID | Hasil yang Diharapkan | Hasil Pengujian | Status |
|----|------------------|-------------|---------------------|---------------|---------|
| 1 | Admin tidak dapat akses dashboard Security | TC-CROSS-001 | Redirect ke /access-denied | | |
| 2 | Security tidak dapat akses dashboard Admin | TC-CROSS-002 | Redirect ke /access-denied | | |
| 3 | Unauthorized API access | TC-CROSS-003 | Response 401 Unauthorized | | |

---

## 4. Ringkasan Total Test Case

| Kategori | Jumlah Test Case |
|----------|----------------|
| Admin | 33 |
| Security | 22 |
| Cross-Feature | 3 |
| **Total** | **58** |

---

## 5. Format Pelaporan Hasil Pengujian

| Kolom | Keterangan |
|-------|------------|
| No | Nomor urut |
| Skenario Pengujian | Nama fitur/scenario yang diuji |
| Test Case ID | Identifikasi test case |
| Hasil yang Diharapkan | Output yang diharapkan sesuai spesifikasi |
| Hasil Pengujian | (Diisi saat pengujian executes) |
| Status | PASS / FAIL / PENDING / BLOCKED |

---

## 6. Keterangan Status

| Status | Arti |
|--------|------|
| PASS | Test berhasil, hasil sesuai harapan |
| FAIL | Test gagal, hasil tidak sesuai harapan |
| PENDING | Belum diuji |
| BLOCKED | Tidak dapat uji karena dependensi belum ready |
| N/A | Not Applicable |