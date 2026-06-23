import { connectDB } from '@/lib/db';
import { User } from '@/models';
import md5 from 'md5';

const DEFAULT_ADMIN_EMAIL = 'admin@admin.com';
const DEFAULT_ADMIN_PASSWORD = '5414450';

export async function seedDefaultAdmin() {
  try {
    await connectDB();

    // Cek apakah admin sudah ada, kalau ada skip aja
    const existing = await User.findOne({ user: DEFAULT_ADMIN_EMAIL });

    if (existing) {
      console.log('ℹ️  Seed: Admin default sudah ada, skip.');
      return;
    }

    // Buat akun admin baru
    await User.create({
      user: DEFAULT_ADMIN_EMAIL,
      password: md5(DEFAULT_ADMIN_PASSWORD),
      role: 'admin',
    });

    console.log('✅ Seed: Admin default berhasil dibuat.');
    console.log(`   Email    : ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`   Password : ${DEFAULT_ADMIN_PASSWORD}`);
    console.log(`   Role     : admin`);
  } catch (err) {
    // Jangan sampai crash app, cukup log errornya
    console.error('❌ Seed Error:', err);
  }
}
