# 🏫 Sistem Informasi Manajemen Siswa (SIMS)

Aplikasi berbasis web untuk manajemen data siswa, absensi, nilai, dan tugas sekolah.

## 🌟 Fitur Utama

### 👮‍♂️ Panel Admin
* Dashboard: Grafik kehadiran & nilai.
* Siswa: CRUD & Import Excel.
* Tugas: Buat tugas dengan deadline.
* Nilai: Input & Download Rekap (Excel).
* Absensi: Input & Download Laporan (Excel).
* Settings: Backup (.school), Restore, & Reset Database.

### 👨‍🎓 Panel Siswa
* Absen: Tombol absen harian (1x/hari).
* Info: Statistik kehadiran & rata-rata nilai.
* Tugas: Daftar tugas pending & riwayat nilai.

---

## 🚀 Cara Instalasi

1. Clone Repository
git clone https://github.com/username-anda/sims-sekolah.git
cd sims-sekolah

2. Install Dependencies
npm install

3. Setup Environment (.env.local)
Buat file .env.local dan isi:

MONGODB_URI="mongodb://localhost:27017/sekolah_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="rahasia_123"
BACKUP_SECRET_KEY="kunci_backup_123"

4. Setup Admin (Manual via MongoDB)
Insert ke collection 'users':
{
  "user": "admin@sekolah.com",
  "password": "21232f297a57a5a743894a0e4a801fc3",
  "role": "admin"
}
(Password: admin)

5. Jalankan
npm run dev

Buka: http://localhost:3000