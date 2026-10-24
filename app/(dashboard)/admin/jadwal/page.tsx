import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getGuruList, getJadwalKelas, naturalSortKelas } from '@/lib/jadwal-api';
import { GuruMap, JadwalItem } from '@/types/jadwal';
import AdminJadwalClient from '@/components/admin/jadwal/AdminJadwalClient';

export const metadata: Metadata = {
  title: 'Jadwal Pelajaran - Admin SMAN 1 Margaasih',
  description: 'Manajemen dan pemantauan jadwal pelajaran terintegrasi REST API SMAN 1 Margaasih.',
};

// Daftar 36 rombel resmi sekolah sebagai fallback jika koneksi API awal butuh cadangan
const DEFAULT_CLASSES = [
  'X-1', 'X-2', 'X-3', 'X-4', 'X-5', 'X-6', 'X-7', 'X-8', 'X-9', 'X-10', 'X-11', 'X-12',
  'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5', 'XI-6', 'XI-7', 'XI-8', 'XI-9', 'XI-10', 'XI-11', 'XI-12',
  'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5', 'XII-6', 'XII-7', 'XII-8', 'XII-9', 'XII-10', 'XII-11', 'XII-12',
];

export default async function AdminJadwalPage() {
  const session = await auth();

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
    redirect('/login');
  }

  // Pre-fetch data guru & jadwal kelas pertama (X-1) di sisi server untuk performa instant
  let guruMap: GuruMap = {};
  let initialClassSchedule: JadwalItem[] = [];

  try {
    const [fetchedGuru, fetchedJadwal] = await Promise.all([
      getGuruList(),
      getJadwalKelas('X-1'),
    ]);

    guruMap = fetchedGuru || {};
    initialClassSchedule = fetchedJadwal || [];
  } catch (error) {
    console.error('Gagal memuat pre-fetch jadwal:', error);
  }

  const sortedClasses = naturalSortKelas(DEFAULT_CLASSES);

  return (
    <div className="min-h-full">
      <AdminJadwalClient
        initialClasses={sortedClasses}
        initialGuruMap={guruMap}
        initialClassSchedule={initialClassSchedule}
        defaultKelas="X-1"
        totalSesi={1735}
      />
    </div>
  );
}
