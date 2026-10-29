# 📚 Dokumentasi Resmi Full REST API — TugasKu (v2.0.0)

> **Sistem Manajemen Akademik & Tugas Siswa — SMAN 1 Margaasih**  
> **Status:** Production Ready | **Spesifikasi:** OpenAPI 3.1.0 | **Autentikasi:** 3-Layer Security

---

## 📌 Akses Cepat & Dokumentasi Interaktif

| Fitur | URL / Lokasi | Keterangan |
| :--- | :--- | :--- |
| **Interactive Swagger UI** | [`/docs`](/docs) | Antarmuka interaktif untuk uji coba live API di browser |
| **OpenAPI Specification** | [`/api/v1/openapi.json`](/api/v1/openapi.json) | Spesifikasi mesin OpenAPI 3.1 (dapat diimpor ke Postman/Insomnia) |
| **Base URL API** | `/api/v1` | Awalan seluruh rute API versi 1 |
| **Health Check** | `GET /api/v1/system/health` | Status realtime server, MongoDB, dan Redis |

---

## 🔒 Arsitektur Keamanan (3-Layer Security)

Semua request yang dikirimkan oleh aplikasi klien eksternal (Aplikasi Mobile Flutter/React Native/Kotlin, Bot WhatsApp/Telegram, Microservices) dilindungi oleh 3 lapis keamanan:

```
[ Client Request ]
       │
       ▼
[ Layer 1: X-API-Key ] ──► Identifikasi Aplikasi Klien & IP Whitelist
       │
       ▼
[ Layer 2: Bearer JWT ] ──► Identifikasi User Login (Sub, Role, Member ID)
       │
       ▼
[ Layer 3: RBAC Matrix ] ─► Otorisasi Aksi (Admin vs Siswa)
       │
       ▼
[ Route Handler Execution ]
```

### 1. Layer 1 — API Key (`X-API-Key`)
Setiap request wajib menyertakan header:
```http
X-API-Key: tk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Format: `tk_live_` (produksi) atau `tk_test_` (development).
- Untuk server internal atau dev testing, gunakan master key yang dikonfigurasi di `MASTER_API_KEY`.
- Dapat dibuat dan dikelola langsung melalui antarmuka web di menu **[REST API Keys](/admin/api-keys)** atau melalui endpoint `POST /api/v1/system/api-keys` (Admin).

### 2. Layer 2 — Bearer JWT Token (`Authorization`)
Endpoint yang membutuhkan login pengguna wajib menyertakan header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Token diperoleh dari `POST /api/v1/auth/login`.
- Masa berlaku Access Token: **7 hari**.
- Refresh Token: **30 hari** (gunakan `POST /api/v1/auth/refresh` untuk memperpanjang).

### 3. Layer 3 — Role-Based Access Control (RBAC)
- **`admin`**: Hak akses penuh (CRUD tugas, siswa, nilai, kuis, absensi, sistem).
- **`siswa`**: Hanya dapat mengakses data kelasnya, melihat kuis tanpa kunci jawaban, dan mengumpulkan tugas miliknya/kelompoknya.

### 4. Rate Limiting & Throttling
Setiap respon menyertakan header rate limiting:
- `X-RateLimit-Limit`: Kuota request per menit (default: 100).
- `X-RateLimit-Remaining`: Sisa kuota pada window saat ini.
- `X-RateLimit-Reset`: Unix timestamp waktu reset kuota.

---

## 📦 Katalog Endpoint Lengkap

### 1. Autentikasi (`/api/v1/auth`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | API Key | Login username/password, mengembalikan JWT `access_token` & `refresh_token` |
| `POST` | `/api/v1/auth/refresh` | API Key | Menukar `refresh_token` dengan `access_token` baru |
| `GET` | `/api/v1/auth/me` | Bearer | Mengambil profil user & data member siswa yang sedang login |
| `PUT` | `/api/v1/auth/change-password` | Bearer | Mengubah password akun login pengguna |

### 2. Siswa / Members (`/api/v1/siswa`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/siswa` | Bearer | Daftar siswa (filter: `kelas`, `search`, pagination: `page`, `limit`) |
| `POST` | `/api/v1/siswa` | Admin | Tambah siswa baru + generate akun user otomatis |
| `GET` | `/api/v1/siswa/:id` | Bearer | Detail profil siswa (Siswa hanya bisa melihat profil sendiri) |
| `PUT` | `/api/v1/siswa/:id` | Admin/Self | Update data profil siswa |
| `DELETE` | `/api/v1/siswa/:id` | Admin | Hapus data siswa + user login + nilai |
| `POST` | `/api/v1/siswa/:id/reset-password` | Admin | Reset password siswa (default `123456`) |
| `GET` | `/api/v1/siswa/classes` | Bearer | Mengambil daftar nama kelas unik |

### 3. Tugas (`/api/v1/tugas`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tugas` | Bearer | Daftar tugas (filter: `kelas`, `is_active`, `tipe_pengumpulan`, `tipe_tugas`) |
| `POST` | `/api/v1/tugas` | Admin | Buat tugas baru (individu atau kelompok) |
| `GET` | `/api/v1/tugas/:id` | Bearer | Detail tugas. Jika siswa: melampirkan status pengumpulan sendiri. Jika admin: statistik pengumpulan |
| `PUT` | `/api/v1/tugas/:id` | Admin | Edit judul, deskripsi, deadline, kelas |
| `DELETE` | `/api/v1/tugas/:id` | Admin | Hapus tugas dan seluruh arsip pengumpulan siswa |
| `PATCH` | `/api/v1/tugas/:id/toggle` | Admin | Buka atau kunci pengumpulan tugas |

### 4. Nilai & Pengumpulan (`/api/v1/nilai`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/nilai` | Bearer | Riwayat pengumpulan & nilai (Siswa dibatasi hanya melihat miliknya) |
| `POST` | `/api/v1/nilai/submit` | Siswa | Siswa submit tugas (`file_url`, `catatan`). Menambah poin keaktifan +5 |
| `POST` | `/api/v1/nilai/grade` | Admin | Input nilai angka (0-100) dan catatan guru |
| `GET` | `/api/v1/nilai/:id` | Bearer | Detail pengumpulan spesifik |
| `PUT` | `/api/v1/nilai/:id` | Admin | Koreksi nilai / catatan |
| `DELETE` | `/api/v1/nilai/:id` | Admin | Reset pengumpulan |

### 5. Absensi (`/api/v1/absensi`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/absensi` | Bearer | Rekap kehadiran (filter: `tanggal`, `kelas`, `status`) |
| `POST` | `/api/v1/absensi/check-in` | Siswa | Siswa absen masuk hari ini (cegah dobel absen + hadiah poin keaktifan +2) |
| `PUT` | `/api/v1/absensi/upsert` | Admin | Override manual absensi siswa (`Hadir`, `Izin`, `Sakit`, `Alpha`) |

### 6. Pengumuman (`/api/v1/pengumuman`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/pengumuman` | API Key | Pengumuman sekolah publik (filter: `prioritas`) |
| `POST` | `/api/v1/pengumuman` | Admin | Buat pengumuman + siaran realtime Pusher (`info-baru`) |
| `GET` | `/api/v1/pengumuman/:id` | API Key | Detail pengumuman |
| `PUT` | `/api/v1/pengumuman/:id` | Admin | Update pengumuman |
| `DELETE` | `/api/v1/pengumuman/:id` | Admin | Hapus pengumuman |

### 7. Materi Belajar (`/api/v1/materi`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/materi` | Bearer | Daftar modul/file materi (otomatis filter kelas siswa) |
| `POST` | `/api/v1/materi` | Admin | Unggah materi belajar baru |
| `GET` | `/api/v1/materi/:id` | Bearer | Detail materi |
| `PUT` | `/api/v1/materi/:id` | Admin | Update informasi materi |
| `DELETE` | `/api/v1/materi/:id` | Admin | Hapus materi |
| `POST` | `/api/v1/materi/:id/download`| Bearer | Catat download materi siswa + hadiah poin keaktifan +1 |

### 8. Diskusi Materi (`/api/v1/diskusi`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/diskusi?materi_id=..` | Bearer | Daftar komentar diskusi (Siswa melihat guru & teman sekelas) |
| `POST` | `/api/v1/diskusi` | Bearer | Kirim komentar + broadcast realtime Pusher |
| `DELETE` | `/api/v1/diskusi/:id` | Bearer | Hapus komentar (Admin semua, Siswa hanya miliknya) |

### 9. Kuis & CBT (`/api/v1/kuis`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/kuis` | Bearer | Daftar kuis PG (filter ketersediaan waktu) |
| `POST` | `/api/v1/kuis` | Admin | Buat kuis dengan bank soal PG |
| `GET` | `/api/v1/kuis/:id` | Bearer | Detail soal (Kunci jawaban disembunyikan untuk siswa) |
| `PUT` | `/api/v1/kuis/:id` | Admin | Update jadwal/soal kuis |
| `DELETE` | `/api/v1/kuis/:id` | Admin | Hapus kuis dan riwayat jawaban |
| `GET` | `/api/v1/kuis/:id/pengerjaan` | Siswa | Ambil draft jawaban siswa |
| `POST` | `/api/v1/kuis/:id/pengerjaan` | Siswa | Auto-save draft (`submit: false`) atau Final Submit (`submit: true`) + hitung nilai otomatis + poin keaktifan +10 |

### 10. Kelompok Belajar (`/api/v1/kelompok`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/kelompok` | Bearer | Daftar kelompok (filter: `kelas`, `tugas_id`) |
| `POST` | `/api/v1/kelompok` | Admin | Buat kelompok baru |
| `GET` | `/api/v1/kelompok/:id` | Bearer | Detail kelompok dengan ketua & daftar anggota terpopulasi |
| `PUT` | `/api/v1/kelompok/:id` | Admin | Update anggota / ketua kelompok |
| `DELETE` | `/api/v1/kelompok/:id` | Admin | Hapus kelompok |

### 11. Jadwal Pelajaran (`/api/v1/jadwal`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/jadwal` | API Key | Jadwal pelajaran terformat (filter: `kelas`, `hari`) |
| `GET` | `/api/v1/jadwal/guru` | API Key | Cari jadwal mengajar guru (`?nama=...`) atau list semua guru |

### 12. Leaderboard & Poin Keaktifan (`/api/v1/leaderboard`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/leaderboard` | Bearer | Peringkat siswa + akumulasi nilai tugas, kuis, dan **Poin Keaktifan** (filter: `kelas`, `sort_by`: `total_score` atau `poin_keaktifan`, `limit`) |

### 13. Sistem & API Keys (`/api/v1/system`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/system/health` | Public | Cek status server, MongoDB, Redis, dan Memory |
| `GET` | `/api/v1/system/stats` | Admin | Statistik agregasi (total siswa, tugas, kuis, absensi) |
| `GET` | `/api/v1/system/activity-logs`| Admin | Log aktivitas audit trail |
| `GET` | `/api/v1/system/api-keys` | Admin | Daftar API Keys terdaftar |
| `POST` | `/api/v1/system/api-keys` | Admin | Buat API Key baru untuk aplikasi eksternal |
| `PATCH`| `/api/v1/system/api-keys/:id`| Admin | Aktifkan/nonaktifkan API Key |
| `DELETE`| `/api/v1/system/api-keys/:id`| Admin | Cabut / hapus API Key |

### 14. File Upload (`/api/v1/upload`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/upload` | Bearer | Upload file (multipart/form-data, max 10MB) |

---

## 💻 Contoh Integrasi Klien

### 1. Flutter / Dart (Mobile App)
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class TugasKuApi {
  static const String baseUrl = 'https://tugas.sman1margaasih.sch.id/api/v1';
  static const String apiKey = 'tk_live_your_api_key_here';
  String? _accessToken;

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
  };

  // Login
  Future<bool> login(String username, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers,
      body: jsonEncode({'username': username, 'password': password}),
    );
    final json = jsonDecode(res.body);
    if (json['success'] == true) {
      _accessToken = json['data']['access_token'];
      return true;
    }
    return false;
  }

  // Ambil Jadwal
  Future<List<dynamic>> getJadwal({String? kelas, String? hari}) async {
    final query = <String, String>{};
    if (kelas != null) query['kelas'] = kelas;
    if (hari != null) query['hari'] = hari;

    final uri = Uri.parse('$baseUrl/jadwal').replace(queryParameters: query);
    final res = await http.get(uri, headers: _headers);
    final json = jsonDecode(res.body);
    return json['data']['jadwal'];
  }
}
```

### 2. Node.js / TypeScript / Bot WhatsApp
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://tugas.sman1margaasih.sch.id/api/v1',
  headers: {
    'X-API-Key': process.env.TUGASKU_API_KEY!,
  },
});

// Contoh: Cek Pengumuman Terbaru
async function getLatestAnnouncements() {
  const { data } = await api.get('/pengumuman?limit=5');
  return data.data; // Array of pengumuman
}
```

### 3. cURL
```bash
# 1. Login Siswa
curl -X POST "https://tugas.sman1margaasih.sch.id/api/v1/auth/login" \
  -H "X-API-Key: tk_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"username":"2201001@siswa.com","password":"mypassword"}'

# 2. Siswa Absen Masuk
curl -X POST "https://tugas.sman1margaasih.sch.id/api/v1/absensi/check-in" \
  -H "X-API-Key: tk_live_your_api_key" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"Hadir"}'
```

---

> Dikelola oleh Tim Pengembang TugasKu — SMAN 1 Margaasih.  
> Untuk penambahan izin atau permohonan API Key, silakan hubungi administrator sistem.
