import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User, Member, Tugas } from '@/models';
import { resetDatabaseAction } from '@/actions/system-actions';
import { changePasswordAction } from '@/actions/user-actions';
import md5 from 'md5';

// --- 1. MOCKING next/cache (FIX ERROR revalidatePath) ---
// Ini penting agar revalidatePath tidak error saat testing
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// --- 2. MOCKING SESSION LOGIN ---
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: { email: 'admin@test.com', role: 'admin' }
  }))
}));

// --- 3. MOCKING DATABASE CONNECTION ---
jest.mock('@/lib/db', () => ({
  connectDB: jest.fn(async () => {
    if (mongoose.connection.readyState === 0) {
      // Logic koneksi akan dihandle di beforeAll
    }
  })
}));

describe('Server Actions Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Member.deleteMany({});
    await Tugas.deleteMany({});
  });

  // ================= TEST CASE 1: RESET DATABASE =================
  it('Harus menghapus semua data KECUALI admin saat Reset Database dijalankan', async () => {
    // Setup Data
    await User.create({ user: 'admin@test.com', password: md5('admin123'), role: 'admin' });
    await User.create({ user: 'siswa@test.com', password: md5('siswa123'), role: 'siswa' });
    await Member.create({ nama_lengkap: 'Budi Santoso', nis: '12345', kelas: 'X 1' });
    await Tugas.create({ judul: 'Tugas Matematika', kelas: 'X 1', deadline: new Date() });

    expect(await User.countDocuments()).toBe(2);
    expect(await Tugas.countDocuments()).toBe(1);

    // Jalankan Action
    const result = await resetDatabaseAction();

    // Validasi
    expect(result.success).toBe(true); // Seharusnya sekarang TRUE karena revalidatePath sudah dimock
    
    const taskCount = await Tugas.countDocuments();
    expect(taskCount).toBe(0);

    const users = await User.find({});
    expect(users.length).toBe(1);
    expect(users[0].role).toBe('admin');
  });


  // ================= TEST CASE 2: GANTI PASSWORD =================
  it('Harus berhasil ganti password jika password lama benar', async () => {
    await User.create({ user: 'admin@test.com', password: md5('passwordLama'), role: 'admin' });

    const formData = new FormData();
    formData.append('oldPass', 'passwordLama');
    formData.append('newPass', 'passwordBaru');
    formData.append('confirmPass', 'passwordBaru');

    const result = await changePasswordAction(formData);

    expect(result.success).toBe(true); // Seharusnya sekarang TRUE

    const updatedUser = await User.findOne({ user: 'admin@test.com' });
    expect(updatedUser?.password).toBe(md5('passwordBaru'));
  });

  it('Harus GAGAL ganti password jika password lama salah', async () => {
    await User.create({ user: 'admin@test.com', password: md5('passwordLama'), role: 'admin' });

    const formData = new FormData();
    formData.append('oldPass', 'passwordSalah'); 
    formData.append('newPass', 'passwordBaru');
    formData.append('confirmPass', 'passwordBaru');

    const result = await changePasswordAction(formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Password lama salah');
  });

});