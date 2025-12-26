import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CreateTaskForm from '@/components/ui/CreateTaskForm'; // Import form yang baru kita buat

export default async function TambahTugasPage() {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();

  // 1. Ambil semua kelas yang ada di database Siswa (Member)
  // .distinct('kelas') akan mengambil nama kelas yang unik saja (tidak duplikat)
  const distinctClasses = await Member.distinct('kelas');

  // 2. Urutkan kelas agar rapi (Opsional)
  const sortedClasses = distinctClasses.sort();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tugas" className="text-gray-500 hover:text-gray-800 transition">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Buat Tugas Baru</h1>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        {/* Panggil komponen Form dan kirim data kelas */}
        <CreateTaskForm availableClasses={sortedClasses} />
      </div>
    </div>
  );
}