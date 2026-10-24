import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { User, Member } from '@/models';
import { getGuruList, getJadwalKelas } from '@/lib/jadwal-api';
import { GuruMap, JadwalItem } from '@/types/jadwal';
import SiswaJadwalClient from '@/components/siswa/SiswaJadwalClient';

export const metadata: Metadata = {
  title: 'Jadwal Pelajaran Saya - SMAN 1 Margaasih',
  description: 'Jadwal pelajaran harian siswa SMAN 1 Margaasih sesuai dengan kelas masing-masing.',
};

export default async function SiswaJadwalPage() {
  const session = await auth();

  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  await connectDB();

  // 1. Ambil Data Akun & Siswa
  const user = await User.findOne({ user: session.user.email });
  if (!user || !user.member_id) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold bg-surface rounded-2xl border border-border-custom max-w-xl mx-auto mt-10">
        Akun siswa belum terhubung dengan data member sekolah. Silakan hubungi admin.
      </div>
    );
  }

  const student = await Member.findById(user.member_id);
  if (!student || !student.kelas) {
    return (
      <div className="p-8 text-center text-yellow-600 font-semibold bg-surface rounded-2xl border border-border-custom max-w-xl mx-auto mt-10">
        Profil siswa atau data kelas belum diatur di sistem. Silakan hubungi admin.
      </div>
    );
  }

  // student.kelas dari MongoDB adalah format spasi, contoh: "X 1"
  const kelasDb = student.kelas;

  // 2. Pre-fetch Data Jadwal & Guru dari REST API
  // getJadwalKelas otomatis mengonversi "X 1" -> "X-1" saat memanggil endpoint API
  let guruMap: GuruMap = {};
  let schedule: JadwalItem[] = [];

  try {
    const [fetchedGuru, fetchedJadwal] = await Promise.all([
      getGuruList(),
      getJadwalKelas(kelasDb),
    ]);

    guruMap = fetchedGuru || {};
    schedule = fetchedJadwal || [];
  } catch (error) {
    console.error(`Gagal memuat jadwal siswa kelas ${kelasDb}:`, error);
  }

  return (
    <div className="min-h-full">
      <SiswaJadwalClient
        initialSchedule={schedule}
        guruMap={guruMap}
        kelasDb={kelasDb}
        namaSiswa={student.nama_lengkap}
        nis={student.nis}
      />
    </div>
  );
}
