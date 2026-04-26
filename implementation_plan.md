# Rencana Implementasi: Fitur Upload Materi & Pembuatan Soal PG Real-time

Perencanaan ini mencakup langkah-langkah penambahan fitur upload materi pelajaran dan fitur pembuatan soal Pilihan Ganda (PG) untuk aplikasi Next.js ini. Sistem juga akan dilengkapi dengan fitur **Real-time Notification** menggunakan Pusher (yang sudah tersedia di `package.json`) sehingga admin dapat langsung melihat upload atau pembuatan soal baru tanpa perlu *refresh* halaman web.

## User Review Required

> [!IMPORTANT]  
> Mohon tinjau apakah ada kolom tambahan yang diperlukan pada database (seperti durasi waktu untuk pengerjaan soal PG, atau batas waktu pengerjaan). 
> Tolong konfirmasi juga apakah file `file_url` untuk materi akan menggunakan Cloudinary atau platform penyimpanan lain.

## Proposed Changes

---

### Database Models

Penambahan object di `models/index.ts` untuk mengakomodir fitur Materi dan Soal PG.

#### [MODIFY] [index.ts](file:///d:/Js/tugasku/models/index.ts)
- Tambahkan `MateriSchema`:
  - `judul` (String, required)
  - `deskripsi` (String)
  - `file_url` (String, required - untuk link dokumen/PDF dari penyimpanan / Cloudinary)
  - `kelas` (String atau Array dari String, required)
  - `diunggah_oleh` (String, untuk mendata pembuat, bisa Admin maupun Guru)
  - `tanggal_upload` (Date, default Date.now)
- Tambahkan `SoalPGSchema` (Kuis):
  - `judul` (String, required)
  - `deskripsi` (String)
  - `kelas` (String atau Array dari String, required)
  - `daftar_soal` (Array dari Object: `{ id: String, pertanyaan: String, opsi: { A: String, B: String, C: String, D: String, E: String }, jawaban_benar: String }`)
  - `dibuat_oleh` (String, ref: User, admin/guru)
  - `waktu_mulai` (Date, kapan kuis mulai bisa diakses)
  - `waktu_selesai` (Date, kapan kuis tidak bisa lagi dijawab dan ditutup)
  - `tanggal_dibuat` (Date, default Date.now)
- Tambahkan `PengerjaanKuisSchema` (Untuk fungsi fitur '*auto save*' dan status nilai):
  - `kuis_id` (ObjectId, ref: SoalPG)
  - `member_id` (ObjectId, ref: Member/Siswa)
  - `jawaban` (Map atau Array: mapping antara `soal_id` dengan jawaban terpilih `A/B/C/D/E`. Tujuan: Jawaban akan otomatis ter-save (via API polling/Trigger) ke object ini saat siswa memilh supaya tahan *refresh*)
  - `status` (String: `DRAFT` (sedang dikerjakan) / `SUBMITTED` (sudah dinilai))
  - `nilai` (Number, diakumulasikan dan di-*update* ketika status `SUBMITTED` atau batas waktu kuis telah terlewat)

---

### Backend API Routes

Pembuatan endpoint API (App Router) untuk menghandle aksi insert data ke MongoDB, serta memicu trigger push notification via Pusher. 
Termasuk endpoint API *auto-save* pengerjaan kuis.

#### [NEW] [api/materi/route.ts](file:///d:/Js/tugasku/app/api/materi/route.ts)
- Endpoint `POST` untuk meyimpan data materi pelajaran (Hak akses: Keduanya / Guru & Admin).
- Pada aksi simpan berhasil, jalankan *trigger* `pusher.trigger('admin-updates', 'new-materi', data)`.

#### [NEW] [api/soal-pg/route.ts](file:///d:/Js/tugasku/app/api/soal-pg/route.ts)
- Endpoint `POST` untuk menyimpan form soal PG. Mensyaratkan input `waktu_mulai` dan `waktu_selesai`.
- Pada aksi simpan berhasil, jalankan *trigger* `pusher.trigger('admin-updates', 'new-soal-pg', data)`.

#### [NEW] [api/kuis/autosave/route.ts](file:///d:/Js/tugasku/app/api/kuis/autosave/route.ts)
- Endpoint `POST`/`PUT` untuk menyimpan draft (*state*) jawaban siswa seketika diklik, sehingga jika Browser ter-*refresh* maka state diambil dari endpoint ini.
- Terdapat logika filter: `if (new Date() > kues.waktu_selesai) { automatic_grading_as_is() }`

---

### Frontend Components (Upload form & Buat Soal)

Form UI untuk membuat soal dan materi.

#### [NEW] Form Upload Materi (Bisa diakses Admin & Guru)
- Komponen memuat form: Judul, Deskripsi, Dropdown Kelas, File Input.
- Terintegrasi dengan fitur Upload file ke Cloudinary mengembalikan URL untuk disave lewat API.

#### [NEW] Form Buat Soal PG
- Form dilengkapi **Date Picker Time** untuk menentukan `Waktu Mulai` (`open soal`) dan `Waktu Selesai` (`tutup soal`).
- Pembangunan UI secara dinamis menggunakan State (Tambah Pertanyaan, Set Opsi & Kunci Jawaban).

#### [NEW] Halaman Pengerjaan Soal (Untuk Siswa)
- Akan dibuat fitur auto-fetch draft dari db, melakukan debouncing state/`onClick` opsi yang me-request update kecil ke API AutoSave.
- Menampilkan *Countdown Timer*. Bila mencapai nol (batas waktu ditutup), trigger end / paksa kumpul dan *grading* otomatis. 

---

### Frontend Komponen Admin (Real-time View & Report)

#### [MODIFY] Dashboard Admin Layout & List
- Menggunakan `useEffect` pada parent *layout* Admin atau halaman list nya.
- Kode untuk *subscribe* Pusher Channel:
  ```javascript
  const pusher = new Pusher("APP_KEY", { cluster: "APP_CLUSTER" });
  const channel = pusher.subscribe("admin-updates");
  
  channel.bind("new-materi", (data) => {
    toast.success(`Materi dkupload: ${data.judul}`);
  });

  channel.bind("new-soal-pg", (data) => {
    toast.success(`Soal PG baru: ${data.judul}`);
  });
  ```
- Dengan integrasi di atas ditambah *library* seperti `react-hot-toast`, admin seketika akan menyadari aktivitas tanpa memuat ulang layar!

## Verification Plan

### Automated / API Tests
- Pengecekan HTTP POST payload via tool untuk memastikan kedua endpoint API menyimpan record sukses dalam format yang benar.

### Manual Verification
- Buka dua *browser / tab* : Satu untuk user pengunggah dan satu lagi berada di sesi Admin Dashboard.
- Coba tambahkan Data Materi dan Data Soal dari sisi pengunggah.
- Periksa layar Admin - sebuah Popup Toast / Penambahan baris langsung pada halaman (*real time*) harus terlihat secara langsung.
