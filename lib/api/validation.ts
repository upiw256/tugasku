import { z } from 'zod';

// ==========================================
// 1. Auth Schemas
// ==========================================
export const LoginSchema = z.object({
  username: z.string().min(1, 'Username atau email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token wajib diisi'),
});

export const ChangePasswordSchema = z.object({
  old_password: z.string().min(1, 'Password lama wajib diisi'),
  new_password: z.string().min(6, 'Password baru minimal 6 karakter'),
});

export const ResetPasswordSchema = z.object({
  new_password: z.string().min(6, 'Password baru minimal 6 karakter').optional(),
});

// ==========================================
// 2. Siswa / Member Schemas
// ==========================================
export const CreateMemberSchema = z.object({
  nis: z.string().min(1, 'NIS wajib diisi'),
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  jenis_kelamin: z.enum(['L', 'P']).optional(),
  poin_keaktifan: z.number().default(0).optional(),
  password: z.string().min(6).optional(), // initial password, defaults to NIS or 123456
});

export const UpdateMemberSchema = z.object({
  nis: z.string().min(1).optional(),
  nama_lengkap: z.string().min(1).optional(),
  kelas: z.string().min(1).optional(),
  jenis_kelamin: z.enum(['L', 'P']).optional(),
  poin_keaktifan: z.number().optional(),
});

// ==========================================
// 3. Tugas Schemas
// ==========================================
export const CreateTugasSchema = z.object({
  judul: z.string().min(1, 'Judul tugas wajib diisi'),
  deskripsi: z.string().optional().default(''),
  deadline: z.string().or(z.date()).refine(val => !isNaN(new Date(val).getTime()), 'Format deadline tidak valid'),
  kelas: z.union([z.string(), z.array(z.string())]),
  is_active: z.boolean().default(true).optional(),
  tipe_pengumpulan: z.enum(['online', 'offline']).default('online').optional(),
  tipe_tugas: z.enum(['individu', 'kelompok']).default('individu').optional(),
});

export const UpdateTugasSchema = CreateTugasSchema.partial();

// ==========================================
// 4. Nilai & Pengumpulan Schemas
// ==========================================
export const SubmitNilaiSchema = z.object({
  tugas_id: z.string().min(1, 'ID Tugas wajib diisi'),
  file_url: z.string().optional(),
  catatan_siswa: z.string().optional(),
});

export const GradeNilaiSchema = z.object({
  member_id: z.string().min(1, 'ID Siswa (member_id) wajib diisi'),
  tugas_id: z.string().min(1, 'ID Tugas wajib diisi'),
  nilai: z.number().min(0).max(100, 'Nilai harus antara 0 sampai 100'),
  catatan: z.string().optional(),
});

// ==========================================
// 5. Absensi Schemas
// ==========================================
export const AbsensiCheckInSchema = z.object({
  status: z.enum(['Hadir', 'Izin', 'Sakit', 'Alpha']).default('Hadir').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const AbsensiUpsertSchema = z.object({
  member_id: z.string().min(1, 'ID Siswa wajib diisi'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi (YYYY-MM-DD)'),
  status: z.enum(['Hadir', 'Izin', 'Sakit', 'Alpha']),
});

// ==========================================
// 6. Pengumuman Schemas
// ==========================================
export const CreatePengumumanSchema = z.object({
  judul: z.string().min(1, 'Judul pengumuman wajib diisi'),
  konten: z.string().min(1, 'Konten pengumuman wajib diisi'),
  prioritas: z.enum(['Penting', 'Info', 'Libur']).default('Info').optional(),
});

export const UpdatePengumumanSchema = CreatePengumumanSchema.partial();

// ==========================================
// 7. Materi Belajar Schemas
// ==========================================
export const CreateMateriSchema = z.object({
  judul: z.string().min(1, 'Judul materi wajib diisi'),
  deskripsi: z.string().optional().default(''),
  file_url: z.string().min(1, 'File URL materi wajib diisi'),
  kelas: z.union([z.string(), z.array(z.string())]),
});

export const UpdateMateriSchema = CreateMateriSchema.partial();

// ==========================================
// 8. Diskusi Materi Schemas
// ==========================================
export const CreateDiskusiSchema = z.object({
  materi_id: z.string().min(1, 'ID Materi wajib diisi'),
  komentar: z.string().min(1, 'Komentar tidak boleh kosong'),
});

// ==========================================
// 9. Kuis (Soal PG) Schemas
// ==========================================
export const OpsiPGSchema = z.object({
  A: z.string().min(1, 'Opsi A wajib diisi'),
  B: z.string().min(1, 'Opsi B wajib diisi'),
  C: z.string().min(1, 'Opsi C wajib diisi'),
  D: z.string().min(1, 'Opsi D wajib diisi'),
  E: z.string().min(1, 'Opsi E wajib diisi'),
});

export const SoalItemSchema = z.object({
  id: z.string().optional(),
  pertanyaan: z.string().min(1, 'Pertanyaan wajib diisi'),
  opsi: OpsiPGSchema,
  jawaban_benar: z.enum(['A', 'B', 'C', 'D', 'E']),
  gambar_url: z.string().optional(),
});

export const CreateKuisSchema = z.object({
  judul: z.string().min(1, 'Judul kuis wajib diisi'),
  deskripsi: z.string().optional(),
  kelas: z.union([z.string(), z.array(z.string())]),
  daftar_soal: z.array(SoalItemSchema).min(1, 'Minimal sertakan 1 butir soal'),
  waktu_mulai: z.string().or(z.date()),
  waktu_selesai: z.string().or(z.date()),
  durasi: z.number().min(1).default(60),
  status_manual: z.enum(['AUTO', 'OPEN', 'CLOSED']).default('AUTO').optional(),
});

export const SavePengerjaanKuisSchema = z.object({
  kuis_id: z.string().min(1, 'ID Kuis wajib diisi'),
  jawaban: z.record(z.string(), z.string()), // map: soal_id -> opsi
  submit: z.boolean().default(false).optional(),
});

// ==========================================
// 10. Kelompok Schemas
// ==========================================
export const CreateKelompokSchema = z.object({
  tugas_id: z.string().min(1, 'ID Tugas wajib diisi'),
  nama_kelompok: z.string().min(1, 'Nama kelompok wajib diisi'),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  ketua_id: z.string().optional(),
  anggota_ids: z.array(z.string()).default([]).optional(),
});

// ==========================================
// 11. API Key Admin Management Schemas
// ==========================================
export const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'Nama aplikasi klien wajib diisi'),
  owner: z.string().min(1, 'Email/pemilik wajib diisi'),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).default(['read', 'write']),
  rate_limit: z.number().min(10).max(5000).default(100),
  allowed_ips: z.array(z.string()).default(['*']).optional(),
  expires_in_days: z.number().optional(), // optional days until expiration
});
