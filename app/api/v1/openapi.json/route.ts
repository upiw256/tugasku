import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'TugasKu Academic Management REST API',
      version: '2.0.0',
      description: 'Full REST API untuk Sistem Manajemen Akademik SMAN 1 Margaasih (TugasKu). Dilengkapi 3-Layer Security: API Key, Bearer JWT, dan RBAC.',
      contact: {
        name: 'Tim Pengembang TugasKu',
        email: 'admin@sman1margaasih.sch.id',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Current Environment API Server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Client Application API Key (format: tk_live_... atau tk_test_...)',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT User Access Token diperoleh dari /api/v1/auth/login',
        },
      },
      schemas: {
        StandardSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operasi berhasil' },
            data: { type: 'object' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 100 },
                total_pages: { type: 'integer', example: 5 },
              },
            },
          },
        },
        StandardError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Input data tidak valid' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
        BearerAuth: [],
      },
    ],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Autentikasi'],
          summary: 'Login User & Dapatkan JWT Token',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password'],
                  properties: {
                    username: { type: 'string', example: '2201001@siswa.com' },
                    password: { type: 'string', example: '123456' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Login berhasil' },
            '401': { description: 'Kredensial tidak valid' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Autentikasi'],
          summary: 'Refresh JWT Access Token',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refresh_token'],
                  properties: {
                    refresh_token: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Token berhasil di-refresh' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Autentikasi'],
          summary: 'Ambil Profil Pengguna Saat Ini',
          responses: {
            '200': { description: 'Profil pengguna' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/auth/change-password': {
        put: {
          tags: ['Autentikasi'],
          summary: 'Ubah Password Pengguna',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['old_password', 'new_password'],
                  properties: {
                    old_password: { type: 'string' },
                    new_password: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Password berhasil diubah' },
          },
        },
      },
      '/siswa': {
        get: {
          tags: ['Siswa (Members)'],
          summary: 'Daftar Siswa dengan Filter & Pagination',
          parameters: [
            { name: 'kelas', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': { description: 'Daftar siswa' },
          },
        },
        post: {
          tags: ['Siswa (Members)'],
          summary: 'Tambah Siswa Baru (Admin Only)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nis', 'nama_lengkap', 'kelas'],
                  properties: {
                    nis: { type: 'string' },
                    nama_lengkap: { type: 'string' },
                    kelas: { type: 'string' },
                    jenis_kelamin: { type: 'string', enum: ['L', 'P'] },
                    password: { type: 'string', default: '123456' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Siswa berhasil ditambahkan' },
          },
        },
      },
      '/siswa/{id}': {
        get: {
          tags: ['Siswa (Members)'],
          summary: 'Detail Siswa berdasarkan ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Detail siswa' } },
        },
        put: {
          tags: ['Siswa (Members)'],
          summary: 'Update Data Siswa',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Siswa berhasil diperbarui' } },
        },
        delete: {
          tags: ['Siswa (Members)'],
          summary: 'Hapus Siswa (Admin Only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Siswa berhasil dihapus' } },
        },
      },
      '/siswa/classes': {
        get: {
          tags: ['Siswa (Members)'],
          summary: 'Daftar Kelas yang Ada',
          responses: { '200': { description: 'Daftar nama kelas unik' } },
        },
      },
      '/tugas': {
        get: {
          tags: ['Tugas'],
          summary: 'Daftar Tugas dengan Filter',
          parameters: [
            { name: 'kelas', in: 'query', schema: { type: 'string' } },
            { name: 'is_active', in: 'query', schema: { type: 'boolean' } },
            { name: 'tipe_tugas', in: 'query', schema: { type: 'string', enum: ['individu', 'kelompok'] } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { '200': { description: 'Daftar tugas' } },
        },
        post: {
          tags: ['Tugas'],
          summary: 'Buat Tugas Baru (Admin Only)',
          responses: { '201': { description: 'Tugas berhasil dibuat' } },
        },
      },
      '/tugas/{id}': {
        get: {
          tags: ['Tugas'],
          summary: 'Detail Tugas & Rekap Pengumpulan',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Detail tugas' } },
        },
        put: {
          tags: ['Tugas'],
          summary: 'Update Tugas (Admin Only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Tugas berhasil diperbarui' } },
        },
        delete: {
          tags: ['Tugas'],
          summary: 'Hapus Tugas (Admin Only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Tugas berhasil dihapus' } },
        },
      },
      '/tugas/{id}/toggle': {
        patch: {
          tags: ['Tugas'],
          summary: 'Kunci / Buka Pengumpulan Tugas (Admin Only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Status tugas berhasil ditoggle' } },
        },
      },
      '/nilai': {
        get: {
          tags: ['Nilai & Pengumpulan'],
          summary: 'Daftar Nilai & Riwayat Pengumpulan',
          parameters: [
            { name: 'tugas_id', in: 'query', schema: { type: 'string' } },
            { name: 'member_id', in: 'query', schema: { type: 'string' } },
            { name: 'kelas', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Daftar nilai' } },
        },
      },
      '/nilai/submit': {
        post: {
          tags: ['Nilai & Pengumpulan'],
          summary: 'Siswa Mengumpulkan Tugas',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tugas_id'],
                  properties: {
                    tugas_id: { type: 'string' },
                    file_url: { type: 'string' },
                    catatan_siswa: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Tugas berhasil dikumpulkan' } },
        },
      },
      '/nilai/grade': {
        post: {
          tags: ['Nilai & Pengumpulan'],
          summary: 'Input / Koreksi Nilai Siswa (Admin Only)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['member_id', 'tugas_id', 'nilai'],
                  properties: {
                    member_id: { type: 'string' },
                    tugas_id: { type: 'string' },
                    nilai: { type: 'number', minimum: 0, maximum: 100 },
                    catatan: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Nilai berhasil disimpan' } },
        },
      },
      '/absensi': {
        get: {
          tags: ['Absensi'],
          summary: 'Rekap & Log Absensi',
          parameters: [
            { name: 'tanggal', in: 'query', schema: { type: 'string', example: '2026-10-28' } },
            { name: 'kelas', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Data absensi' } },
        },
      },
      '/absensi/check-in': {
        post: {
          tags: ['Absensi'],
          summary: 'Siswa Absen Masuk Hari Ini',
          responses: {
            '201': { description: 'Absen berhasil' },
            '409': { description: 'Sudah absen hari ini' },
          },
        },
      },
      '/absensi/upsert': {
        put: {
          tags: ['Absensi'],
          summary: 'Admin Override Status Absensi',
          responses: { '200': { description: 'Status absensi diperbarui' } },
        },
      },
      '/pengumuman': {
        get: {
          tags: ['Pengumuman'],
          summary: 'Daftar Pengumuman Sekolah (Public Read)',
          security: [{ ApiKeyAuth: [] }],
          responses: { '200': { description: 'Daftar pengumuman' } },
        },
        post: {
          tags: ['Pengumuman'],
          summary: 'Posting Pengumuman Baru (Admin Only)',
          responses: { '201': { description: 'Pengumuman berhasil diposting' } },
        },
      },
      '/materi': {
        get: {
          tags: ['Materi Belajar'],
          summary: 'Daftar Materi Belajar',
          responses: { '200': { description: 'Daftar materi' } },
        },
        post: {
          tags: ['Materi Belajar'],
          summary: 'Upload Materi Baru (Admin Only)',
          responses: { '201': { description: 'Materi berhasil diunggah' } },
        },
      },
      '/materi/{id}/download': {
        post: {
          tags: ['Materi Belajar'],
          summary: 'Catat Event Download Materi & Tambah Poin Siswa',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Download berhasil dicatat' } },
        },
      },
      '/diskusi': {
        get: {
          tags: ['Diskusi Materi'],
          summary: 'Daftar Komentar pada Materi',
          parameters: [{ name: 'materi_id', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Komentar diskusi' } },
        },
        post: {
          tags: ['Diskusi Materi'],
          summary: 'Kirim Komentar Diskusi (Realtime Pusher)',
          responses: { '201': { description: 'Komentar terkirim' } },
        },
      },
      '/kuis': {
        get: {
          tags: ['Kuis & CBT'],
          summary: 'Daftar Kuis Soal PG',
          responses: { '200': { description: 'Daftar kuis' } },
        },
        post: {
          tags: ['Kuis & CBT'],
          summary: 'Buat Kuis Baru (Admin Only)',
          responses: { '201': { description: 'Kuis berhasil dibuat' } },
        },
      },
      '/kuis/{id}': {
        get: {
          tags: ['Kuis & CBT'],
          summary: 'Detail Soal Kuis (Jawaban Benar Disembunyikan untuk Siswa)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Detail kuis' } },
        },
      },
      '/kuis/{id}/pengerjaan': {
        get: {
          tags: ['Kuis & CBT'],
          summary: 'Ambil Draft / Hasil Pengerjaan Siswa',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Hasil/draft pengerjaan' } },
        },
        post: {
          tags: ['Kuis & CBT'],
          summary: 'Auto-save Jawaban atau Final Submit Kuis',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Jawaban tersimpan atau nilai terhitung' } },
        },
      },
      '/kelompok': {
        get: {
          tags: ['Kelompok'],
          summary: 'Daftar Kelompok Belajar',
          responses: { '200': { description: 'Daftar kelompok' } },
        },
        post: {
          tags: ['Kelompok'],
          summary: 'Buat Kelompok Baru (Admin Only)',
          responses: { '201': { description: 'Kelompok berhasil dibuat' } },
        },
      },
      '/jadwal': {
        get: {
          tags: ['Jadwal Pelajaran'],
          summary: 'Jadwal Pelajaran Sekolah (Proxy FastAPI)',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'kelas', in: 'query', schema: { type: 'string' } },
            { name: 'hari', in: 'query', schema: { type: 'string', enum: ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'] } },
          ],
          responses: { '200': { description: 'Jadwal pelajaran' } },
        },
      },
      '/jadwal/guru': {
        get: {
          tags: ['Jadwal Pelajaran'],
          summary: 'Daftar Guru & Jadwal Mengajar Guru',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: 'nama', in: 'query', schema: { type: 'string' } }],
          responses: { '200': { description: 'Daftar / jadwal guru' } },
        },
      },
      '/system/health': {
        get: {
          tags: ['Sistem & Admin'],
          summary: 'Health Check API (Public)',
          security: [],
          responses: { '200': { description: 'Status kesehatan server' } },
        },
      },
      '/leaderboard': {
        get: {
          tags: ['Leaderboard & Poin'],
          summary: 'Peringkat Siswa, Poin Keaktifan, & Rata-rata Nilai',
          parameters: [
            { name: 'kelas', in: 'query', schema: { type: 'string' }, description: 'Filter kelas tertentu' },
            { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['total_score', 'poin_keaktifan'] }, description: 'Urutkan berdasarkan total skor atau poin keaktifan' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 }, description: 'Jumlah data per halaman' },
          ],
          responses: { '200': { description: 'Leaderboard dan poin keaktifan siswa' } },
        },
      },
      '/system/stats': {
        get: {
          tags: ['Sistem & Admin'],
          summary: 'Ringkasan Statistik Sistem (Admin Only)',
          responses: { '200': { description: 'Statistik database' } },
        },
      },
      '/system/activity-logs': {
        get: {
          tags: ['Sistem & Admin'],
          summary: 'Audit Trail Aktivitas Sistem (Admin Only)',
          responses: { '200': { description: 'Log aktivitas' } },
        },
      },
      '/system/api-keys': {
        get: {
          tags: ['Sistem & Admin'],
          summary: 'Daftar Kunci API Klien (Admin Only)',
          responses: { '200': { description: 'Daftar API keys' } },
        },
        post: {
          tags: ['Sistem & Admin'],
          summary: 'Generate Kunci API Klien Baru (Admin Only)',
          responses: { '201': { description: 'API Key berhasil digenerate' } },
        },
      },
      '/upload': {
        post: {
          tags: ['Sistem & Admin'],
          summary: 'Upload File / Dokumen / Foto (Max 10MB)',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'File berhasil diunggah' } },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
