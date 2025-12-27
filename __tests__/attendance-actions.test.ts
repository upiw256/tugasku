import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User, Member, Absensi } from '@/models';
import { doAttendanceAction, upsertAttendanceAction } from '@/actions/attendance-actions';
import md5 from 'md5';

// --- MOCKS ---
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn(async () => {
    if (mongoose.connection.readyState === 0) {
      // Logic handled in beforeAll
    }
  })
}));

let mockSessionUser = { email: 'siswa@test.com', role: 'siswa' };

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: mockSessionUser
  }))
}));

describe('Attendance Actions Tests', () => {
  let mongoServer: MongoMemoryServer;
  let studentId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const newMember = await Member.create({
      nama_lengkap: 'Budi Santoso',
      nis: '12345',
      kelas: 'X 1'
    });
    studentId = newMember._id.toString();

    await User.create({
      user: 'siswa@test.com',
      password: md5('123456'),
      role: 'siswa',
      member_id: newMember._id
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Member.deleteMany({});
    await Absensi.deleteMany({});
  });

  // ================= TEST CASE: ABSENSI SISWA =================
  it('Siswa harus BERHASIL absen jika belum absen hari ini', async () => {
    mockSessionUser = { email: 'siswa@test.com', role: 'siswa' };

    const result = await doAttendanceAction();

    expect(result.success).toBe(true);
    // Kita cek kata kunci umum saja biar aman
    expect(result.message).toMatch(/berhasil/i); 

    const absen = await Absensi.findOne({ member_id: studentId });
    expect(absen).toBeTruthy();
    expect(absen?.status).toBe('Hadir');
  });

  it('Siswa harus GAGAL absen jika sudah absen hari ini (Duplikasi)', async () => {
    mockSessionUser = { email: 'siswa@test.com', role: 'siswa' };

    // 1. Absen pertama kali
    await doAttendanceAction();

    // 2. Absen kedua kali
    const result = await doAttendanceAction();

    expect(result.success).toBe(false);
    
    // --- PERBAIKAN DI SINI ---
    // Sesuaikan dengan pesan error asli dari aplikasi Anda
    expect(result.message).toContain('sudah mengisi absensi'); 
    
    const count = await Absensi.countDocuments({ member_id: studentId });
    expect(count).toBe(1);
  });


  // ================= TEST CASE: ADMIN UPDATE ABSEN =================
  it('Admin harus bisa update status absensi siswa (Upsert)', async () => {
    mockSessionUser = { email: 'admin@test.com', role: 'admin' };
    
    const todayStr = new Date().toISOString().split('T')[0]; 

    // Admin set Budi jadi "Sakit"
    const result = await upsertAttendanceAction(studentId, todayStr, 'Sakit');

    expect(result.success).toBe(true);

    const absen = await Absensi.findOne({ member_id: studentId });
    expect(absen?.status).toBe('Sakit');

    // Admin ubah lagi jadi "Hadir"
    await upsertAttendanceAction(studentId, todayStr, 'Hadir');
    
    const updatedAbsen = await Absensi.findOne({ member_id: studentId });
    expect(updatedAbsen?.status).toBe('Hadir');
    
    const count = await Absensi.countDocuments({ member_id: studentId });
    expect(count).toBe(1);
  });
});