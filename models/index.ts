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
  deadline: Date,
  // Tipe Mixed karena di JSON ada yang string "X 12" dan array ["XI 3", "XI 4"]
  kelas: { type: Schema.Types.Mixed, required: true }, 
}, { timestamps: false });

// 4. Schema untuk Nilai (Pengumpulan Tugas)
const NilaiSchema = new Schema({
  member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  tugas_id: { type: Schema.Types.ObjectId, ref: 'Tugas', required: true },
  nilai: { type: Number, default: 0 },
  tanggal_mengumpulkan: { type: Date, default: Date.now },
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
  
  // 👇👇 PASTIKAN INI ADA DI DALAM 'tugasSchema' 👇👇
  tipe_pengumpulan: { 
    type: String, 
    enum: ['online', 'offline'], 
    default: 'online' 
  },
  // 👆👆 ------------------------------------------ 👆👆
  
  dibuat_pada: { type: Date, default: Date.now }
});
if (mongoose.models.Tugas) {
  delete mongoose.models.Tugas;
}

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

// Cek apakah model sudah ada (biar gak error overwrite saat reload), kalau belum buat baru
export const Member = models.Member || model('Member', MemberSchema);
export const User = models.User || model('User', UserSchema);
export const Tugas = mongoose.models.Tugas || model('Tugas', TugasSchema);
export const Nilai = models.Nilai || model('Nilai', NilaiSchema);
export const Absensi = mongoose.models.Absensi || mongoose.model('Absensi', AbsensiSchema);
export const Pengumuman = mongoose.models.Pengumuman || mongoose.model('Pengumuman', announcementSchema);
export const TugasExtended = mongoose.models.TugasExtended || mongoose.model('TugasExtended', tugasSchema);
export const LogTugas = mongoose.models.LogTugas || mongoose.model('LogTugas', logTugasSchema);