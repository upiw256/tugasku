import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CreateGroupForm from '@/components/ui/CreateGroupForm';

export default async function TambahTugasKelompokPage() {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();

  // Ambil semua kelas untuk dropdown
  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tugas-kelompok" className="text-gray-500 hover:text-gray-800 transition bg-gray-100 p-2 rounded-lg">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-3xl">👥</span> Bentuk Data Kelompok
        </h1>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
        <CreateGroupForm availableClasses={sortedClasses} />
      </div>
    </div>
  );
}
