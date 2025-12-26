# 🏫 Sistem Informasi Manajemen Siswa (SIMS)

Aplikasi berbasis web yang komprehensif untuk manajemen data siswa, absensi, nilai, dan tugas sekolah. Dibangun menggunakan teknologi web modern (Next.js 15 App Router) untuk performa cepat dan keamanan data yang handal.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

---

## 🌟 Fitur Unggulan

### 👮‍♂️ Panel Admin
1. **Dashboard Eksekutif**
   - Visualisasi data kehadiran (Grafik Garis & Batang Bertumpuk).
   - Statistik rata-rata nilai akademik per kelas.
   
2. **Manajemen Siswa**
   - Tambah, Edit, Hapus data siswa.
   - **Import Excel:** Upload data siswa massal dari file Excel.

3. **Manajemen Akademik**
   - **Tugas:** Membuat tugas dengan judul, deskripsi, dan tenggat waktu (deadline).
   - **Nilai:** Input nilai siswa dan lihat status pengerjaan.
   - **Rekap Nilai:** Download transkrip nilai per kelas dalam format Excel.

4. **Sistem Absensi**
   - Input manual status kehadiran (Hadir, Sakit, Izin, Alpha).
   - Rekapitulasi kehadiran berdasarkan rentang tanggal dan kelas.
   - **Laporan Absensi:** Download laporan kehadiran bulanan (Excel).

5. **Pengaturan Sistem (Danger Zone)**
   - **Ganti Password:** Update keamanan akun.
   - **Backup Database:** Unduh seluruh data database dalam file terenkripsi (.school).
   - **Restore Database:** Pulihkan data dari file backup dengan validasi duplikasi.
   - **Reset Database:** Menghapus seluruh data (Factory Reset) kecuali akun Admin.

### 👨‍🎓 Panel Siswa
1. **Smart Attendance**
   - Tombol absen masuk (Hadir) yang hanya aktif 1x sehari.
   - Validasi jam dan tanggal otomatis.

2. **Dashboard Personal**
   - Statistik persentase kehadiran pribadi.
   - Rata-rata nilai akademik.
   - Notifikasi tugas yang belum dikerjakan.

3. **Manajemen Tugas**
   - Daftar tugas dengan status: Pending (Kuning), Terlewat (Merah), Selesai (Hijau).
   - Indikator nilai untuk tugas yang sudah diperiksa guru.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS.
- **Backend:** Next.js Server Actions.
- **Database:** MongoDB dengan Mongoose ODM.
- **Autentikasi:** NextAuth.js v5 (Credentials Provider).
- **Tools Tambahan:**
  - `exceljs`: Untuk export/import file Excel.
  - `recharts`: Untuk visualisasi grafik statistik.
  - `sweetalert2`: Untuk notifikasi popup yang modern.
  - `crypto`: Untuk enkripsi AES-256 pada file backup.

---

## 🚀 Panduan Instalasi

Ikuti langkah-langkah ini untuk menjalankan proyek di komputer lokal Anda:

### 1. Prasyarat
Pastikan komputer Anda sudah terinstall:
- Node.js (Versi 18 atau lebih baru)
- MongoDB (Bisa menggunakan MongoDB Compass/Lokal atau MongoDB Atlas)

### 2. Clone Repository
Buka terminal dan jalankan:
git clone [https://github.com/username-anda/sims-sekolah.git](https://github.com/upiw256/tugasku.git)
cd sims-sekolah

### 3. Install Dependencies
npm install

### 4. Konfigurasi Environment
Buat file baru bernama `.env.local` di folder utama proyek (root), lalu isi dengan konfigurasi berikut:

MONGODB_URI="mongodb://localhost:27017/sekolah_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="rahasia_random_string_minimal_32_karakter"
BACKUP_SECRET_KEY="kunci_rahasia_untuk_enkripsi_backup_jangan_hilang"

*(Sesuaikan MONGODB_URI jika Anda menggunakan MongoDB Atlas/Cloud)*

### 5. Setup Akun Admin
Karena aplikasi belum memiliki halaman registrasi publik, Anda harus memasukkan data admin pertama secara manual ke database.

1. Buka MongoDB Compass.
2. Buat database `sekolah_db` (jika belum ada).
3. Buat collection `users`.
4. Insert document berikut:
{
  "user": "admin@sekolah.com",
  "password": "21232f297a57a5a743894a0e4a801fc3",
  "role": "admin"
}
*(Catatan: Password di atas adalah hash MD5 dari kata "admin")*

### 6. Jalankan Aplikasi
npm run dev

Buka browser dan akses: http://localhost:3000
Login menggunakan email: admin@sekolah.com dan password: admin

---

## 🔐 Keamanan Data

- **Password Hashing:** Password pengguna disimpan menggunakan format MD5 (Dapat diupgrade ke Bcrypt jika diperlukan).
- **Enkripsi Backup:** File backup yang diunduh dari sistem menggunakan ekstensi `.school` dan dienkripsi menggunakan algoritma AES-256-CBC. File ini tidak dapat dibaca atau dimodifikasi tanpa `BACKUP_SECRET_KEY` yang sesuai di server.

---

## 📂 Struktur Folder Proyek

/actions      -> Server Actions (Logika Backend & Database)
/app          -> Halaman Website (Next.js App Router)
  /(dashboard)-> Layout Dashboard Admin & Siswa
  /api        -> API Routes (Download Excel, Backup)
  /login      -> Halaman Login
/components   -> Komponen UI (Grafik, Tombol, Form, Alert)
/lib          -> Konfigurasi (Auth, DB Connection, Crypto Helper)
/models       -> Schema Database Mongoose (User, Member, Nilai, dll)
/public       -> File Aset Statis (Gambar, Icon)

---

Dibuat untuk tujuan edukasi dan pengembangan sistem informasi sekolah.
