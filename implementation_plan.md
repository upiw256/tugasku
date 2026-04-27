# Penambahan Menu Baru: Laporan Rekap Absensi & Rekap Nilai per Kelas

Berdasarkan pengecekan sistem, rute logika (halaman) untuk **Rekap Absen** dan **Rekap Nilai** sebenarnya sudah dibuat dalam sistem Next.js ini, dan dapat menampilkan data spesifik per-kelas. Halaman tersebut berada di lokasi berikut:
1. `/admin/absensi/rekap` (Menampilkan persentase kehadiran, Sakit, Izin, Alpha secara bulanan dengan filter tanggal dan kelas).
2. `/admin/nilai/rekap` (Menampilkan daftar siswa per kelas beserta seluruh jejak nilai dari semua penugasan secara rata-rata).

Namun saat ini, halaman tersebut tersembunyi di dalam sub-menu halaman lain, dan bukan berupa instansi menu mandiri. Rencana ini ditujukan untuk mempromosikan halaman-halaman laporan rekap tersebut agar menjadi menu mandiri di *Sidebar* yang mudah diakses kapan saja.

## User Review Required

> [!IMPORTANT]
> Halaman *Rekap Absensi* sudah terinstal secara otomatis *default* menargetkan *view* bulanan (dari tanggal 1 di bulan yang sama, hingga hari ini). Jika Anda merasa rentang datanya kurang tepat, itu bisa diubah. Apakah Anda setuju kita langsung tambahkan kedua rute ini ke daftar navigasi *Sidebar* dengan desain laporan standar yang sudah ada (tabel + Ekspor Excel)?

## Proposed Changes

Kita akan menambahkan susunan menu utama untuk mempermudah operasional Admin.

### Komponen Antarmuka Navigasi (Sidebar)

Menyisipkan dua navigasi link baru kedalam daftar referensi menu Admin.

#### [MODIFY] [Sidebar.tsx](file:///d:/Js/tugasku/components/ui/Sidebar.tsx)
- Di dalam array pendefinisi menu (`allMenus`), sisipkan objek baru bertajuk **Laporan Absensi** dengan endpoint aksi `href: '/admin/absensi/rekap'`. Terapkan ikon yang berkaitan seperti piktogram Grafik/Laporan.
- Lalu, sisipkan juga objek **Rekapitulasi Nilai** dengan endpoint `href: '/admin/nilai/rekap'`.

## Open Questions

> [!WARNING]
> Untuk halaman laporan rekap saat dirender, hak akses sementara ini dikunci ke otorisasi model `'admin'`. Apakah Anda juga ingin agar 'Guru' bisa melihat rekap ini, atau cukup Admin saja?

## Verification Plan

### Manual Verification
- Lakukan login ke *dashboard* menggunakan *role* Admin.
- Tinjau *Sidebar* yang terletak pada bilah menu di sebelah kiri antarmuka. Pastikan penambahan link baru ("Laporan Absensi" & "Rekapitulasi Nilai") sudah muncul.
- Klik navigasinya dan uji coba *filtering* dropdown Kelas di masing-masing panel utama guna memastikan data tampil normal dan valid per kelas.
