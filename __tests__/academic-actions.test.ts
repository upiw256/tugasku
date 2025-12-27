import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User, Member, Tugas, Nilai } from '@/models';
import { createTugasAction, deleteTugasAction, inputNilaiAction } from '@/actions/academic-actions';

// --- MOCKING ---
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn(async () => {
    if (mongoose.connection.readyState === 0) { /* Handled in beforeAll */ }
  })
}));

// Variabel Session Mock agar bisa diganti-ganti (Admin/Siswa)
let mockSessionUser = { email: 'admin@test.com', role: 'admin' };

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: mockSessionUser }))
}));

describe('Academic Actions Tests (Tugas & Nilai)', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Bersihkan data sebelum tiap test
  afterEach(async () => {
    await User.deleteMany({});
    await Member.deleteMany({});
    await Tugas.deleteMany({});
    await Nilai.deleteMany({});
  });

  // ================= TEST GROUP 1: MANAJEMEN TUGAS =================
  it('Admin harus bisa MEMBUAT Tugas baru', async () => {
    // 1. Setup sebagai Admin
    mockSessionUser = { email: 'admin@test.com', role: 'admin' };

    const formData = new FormData();
    formData.append('judul', 'PR Fisika Bab 1');
    formData.append('deskripsi', 'Kerjakan LKS halaman 5');
    formData.append('deadline', new Date().toISOString());
    formData.append('kelas', 'X 1');

    // 2. Eksekusi
    const res = await createTugasAction(formData);

    // 3. Validasi
    expect(res.success).toBe(true);
    
    const tugasDB = await Tugas.findOne({ judul: 'PR Fisika Bab 1' });
    expect(tugasDB).toBeTruthy();
    expect(tugasDB?.kelas).toBe('X 1');
  });

  it('Siswa TIDAK BOLEH membuat tugas (Unauthorized)', async () => {
    // 1. Setup sebagai Siswa
    mockSessionUser = { email: 'siswa@test.com', role: 'siswa' }; 

    const formData = new FormData();
    formData.append('judul', 'Tugas Palsu');
    formData.append('deadline', new Date().toISOString());
    formData.append('kelas', 'X 1');

    // 2. Eksekusi
    const res = await createTugasAction(formData);

    // 3. Validasi
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Unauthorized/i); // Harus ada pesan Unauthorized

    const count = await Tugas.countDocuments();
    expect(count).toBe(0); // DB harus tetap kosong
  });

  it('Admin harus bisa MENGHAPUS Tugas', async () => {
    mockSessionUser = { email: 'admin@test.com', role: 'admin' };

    // Buat tugas dummy dulu
    const tugas = await Tugas.create({ 
        judul: 'Tugas Hapus', 
        kelas: 'X 1', 
        deadline: new Date() 
    });

    // Eksekusi Hapus
    const res = await deleteTugasAction(tugas._id.toString());
    
    expect(res.success).toBe(true);
    
    // Pastikan hilang dari DB
    const check = await Tugas.findById(tugas._id);
    expect(check).toBeNull();
  });


  // ================= TEST GROUP 2: INPUT NILAI =================
  it('Admin harus bisa INPUT nilai dan UPDATE nilai (Upsert)', async () => {
    mockSessionUser = { email: 'admin@test.com', role: 'admin' };

    // Setup Data: 1 Siswa & 1 Tugas
    const member = await Member.create({ nama_lengkap: 'Ahmad', nis: '111', kelas: 'X 1' });
    const tugas = await Tugas.create({ judul: 'Ulangan Harian', kelas: 'X 1', deadline: new Date() });

    const sId = member._id.toString();
    const tId = tugas._id.toString();

    // 1. INPUT NILAI AWAL (Misal: 75)
    const res1 = await inputNilaiAction(sId, tId, 75);
    expect(res1.success).toBe(true);

    const nilai1 = await Nilai.findOne({ member_id: sId, tugas_id: tId });
    expect(nilai1?.nilai).toBe(75);

    // 2. UPDATE NILAI (Revisi jadi: 90)
    // Sistem harus cerdas mengupdate data yang ada, BUKAN membuat data baru
    const res2 = await inputNilaiAction(sId, tId, 90);
    expect(res2.success).toBe(true);

    const nilai2 = await Nilai.findOne({ member_id: sId, tugas_id: tId });
    expect(nilai2?.nilai).toBe(90); // Nilai harus berubah
    
    // Cek Jumlah Data: Harus tetap 1, tidak boleh duplikat
    const totalData = await Nilai.countDocuments({});
    expect(totalData).toBe(1);
  });

});