import mongoose, { Schema, model, models } from 'mongoose';

// 1. Schema untuk Data Siswa (Members)
const MemberSchema = new Schema({
  nis: { type: String, required: true, unique: true },
  nama_lengkap: { type: String, required: true },
  kelas: { type: String, required: true },
}, { timestamps: false });

// 2. Schema untuk Login (Users)
const UserSchema = new Schema({
  user: { type: String, required: true, unique: true }, // Email/Username
  password: { type: String, required: true }, // Password MD5
  role: { type: String, enum: ['admin', 'siswa'], default: 'siswa' },
  member_id: { type: Schema.Types.ObjectId, ref: 'Member' }, // Nyambung ke Member
}, { timestamps: false });

// 3. Schema untuk Tugas
const TugasSchema = new Schema({
  judul: { type: String, required: true },
  deskripsi: String,
  deadline: { type: Date, required: true },
  kelas: { type: Schema.Types.Mixed, required: true },
  is_active: { type: Boolean, default: true }, // Kolom gembok
  tipe_pengumpulan: { 
    type: String, 
    enum: ['online', 'offline'], 
    default: 'online' 
  },
  tipe_tugas: {
    type: String,
    enum: ['individu', 'kelompok'],
    default: 'individu'
  },
  dibuat_pada: { type: Date, default: Date.now }
}, { 
  timestamps: false,
  strict: false // Biar aman kalau ada kolom tambahan mendadak
});

// 4. Schema untuk Nilai (Pengumpulan Tugas)
const NilaiSchema = new Schema({
  member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  tugas_id: { type: Schema.Types.ObjectId, ref: 'Tugas', required: true },
  nilai: { type: Number, default: 0 },
  tanggal_mengumpulkan: { type: Date, default: Date.now },
  // 👇 TAMBAHKAN DUA BARIS INI 👇
  file_url: { type: String },
  catatan_siswa: { type: String },
}, { timestamps: false });

const AbsensiSchema = new mongoose.Schema({
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  tanggal: { type: Date, required: true }, // Disimpan format YYYY-MM-DD (jam 00:00) untuk mencegah dobel
  waktu: { type: Date, default: Date.now }, // Jam spesifik saat klik (contoh: 07:15)
  status: { type: String, default: 'Hadir' }, // Hadir, Izin, Sakit (Nanti bisa dikembangkan)
}, { timestamps: true });

const announcementSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  konten: { type: String, required: true },
  prioritas: { type: String, enum: ['Penting', 'Info', 'Libur'], default: 'Info' },
  dibuat_oleh: { type: String }, // Email admin
  tanggal: { type: Date, default: Date.now }
});

const tugasSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  deskripsi: { type: String },
  deadline: { type: Date, required: true },
  kelas: { type: mongoose.Schema.Types.Mixed, required: true },
  is_active: { type: Boolean, default: true },
  tipe_pengumpulan: { 
    type: String, 
    enum: ['online', 'offline'], 
    default: 'online' 
  },
  tipe_tugas: {
    type: String,
    enum: ['individu', 'kelompok'],
    default: 'individu'
  },
  dibuat_pada: { type: Date, default: Date.now }
},{ strict: false });

const logTugasSchema = new mongoose.Schema({
  admin_email: { type: String, required: true }, // Siapa yang ubah
  tugas_judul: { type: String, required: true }, // Judul tugas saat itu
  aksi: { 
    type: String, 
    enum: ['CREATE', 'UPDATE', 'DELETE'], 
    required: true 
  },
  perubahan: { type: String }, // Deskripsi text: "Mengubah deadline dari A ke B"
  waktu: { type: Date, default: Date.now }
});

// Model untuk Kelompok (digunakan pada Tugas Kelompok)
const KelompokSchema = new mongoose.Schema({
  nama_kelompok: { type: String, required: true },
  kelas: { type: String, required: true },
  ketua: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  anggota: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }]
}, { timestamps: true });

// Schema untuk Materi Belajar
const MateriSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  deskripsi: { type: String },
  file_url: { type: String, required: true },
  kelas: { type: mongoose.Schema.Types.Mixed, required: true },
  diunggah_oleh: { type: String, required: true }, // Nama pengunggah (Admin / Guru)
  tanggal_upload: { type: Date, default: Date.now }
});

// Schema untuk Kuis (Soal PG)
const SoalPGSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  deskripsi: { type: String },
  kelas: { type: mongoose.Schema.Types.Mixed, required: true },
  daftar_soal: [{
    id: { type: String },
    pertanyaan: { type: String, required: true },
    opsi: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
      E: { type: String, required: true }
    },
    jawaban_benar: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], required: true }
  }],
  dibuat_oleh: { type: String, required: true }, // Nama pembuat (Admin / Guru)
  waktu_mulai: { type: Date, required: true },
  waktu_selesai: { type: Date, required: true },
  status_manual: { type: String, enum: ['AUTO', 'OPEN', 'CLOSED'], default: 'AUTO' },
  tanggal_dibuat: { type: Date, default: Date.now }
});

// Schema untuk Auto-save Kuis Siswa
const PengerjaanKuisSchema = new mongoose.Schema({
  kuis_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SoalPG', required: true },
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  jawaban: { type: mongoose.Schema.Types.Mixed, default: {} }, // map: soal_id -> opsi (contoh: { "soal_1": "B" })
  status: { type: String, enum: ['DRAFT', 'SUBMITTED'], default: 'DRAFT' },
  nilai: { type: Number, default: 0 },
  mulai_mengerjakan: { type: Date, default: Date.now },
  selesai_mengerjakan: { type: Date }
}, { timestamps: true });

// Schema untuk Log Aktivitas Kuis
const logKuisSchema = new mongoose.Schema({
  admin_email: { type: String, required: true },
  kuis_judul: { type: String, required: true },
  aksi: { 
    type: String, 
    enum: ['CREATE', 'UPDATE', 'DELETE', 'TOGGLE_STATUS'], 
    required: true 
  },
  keterangan: { type: String },
  waktu: { type: Date, default: Date.now }
});

// Cek apakah model sudah ada (biar gak error overwrite saat reload), kalau belum buat baru
export const Member = models.Member || model('Member', MemberSchema);
export const User = models.User || model('User', UserSchema);
export const Tugas = mongoose.models.Tugas || model('Tugas', TugasSchema);
export const Nilai = models.Nilai || model('Nilai', NilaiSchema);
export const Absensi = mongoose.models.Absensi || mongoose.model('Absensi', AbsensiSchema);
export const Pengumuman = mongoose.models.Pengumuman || mongoose.model('Pengumuman', announcementSchema);
export const TugasExtended = mongoose.models.TugasExtended || mongoose.model('TugasExtended', tugasSchema);
export const LogTugas = mongoose.models.LogTugas || mongoose.model('LogTugas', logTugasSchema);
if (mongoose.models.Kelompok) {
  delete mongoose.models.Kelompok;
}
export const Kelompok = mongoose.model('Kelompok', KelompokSchema);

// Export model baru jika belum diinisialisasi
export const Materi = mongoose.models.Materi || mongoose.model('Materi', MateriSchema);

if (mongoose.models.SoalPG) delete mongoose.models.SoalPG;
export const SoalPG = mongoose.model('SoalPG', SoalPGSchema);

if (mongoose.models.PengerjaanKuis) delete mongoose.models.PengerjaanKuis;
export const PengerjaanKuis = mongoose.model('PengerjaanKuis', PengerjaanKuisSchema);

if (mongoose.models.LogKuis) delete mongoose.models.LogKuis;
export const LogKuis = mongoose.model('LogKuis', logKuisSchema);