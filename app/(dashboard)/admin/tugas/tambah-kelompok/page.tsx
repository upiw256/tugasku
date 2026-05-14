import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CreateTaskKelompokForm from '@/components/ui/CreateTaskKelompokForm';

export default async function TambahTugasKelompokPage() {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();

  // Ambil semua kelas untuk dropdown
  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tugas" className="text-foreground/60 hover:text-foreground transition">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Buat Tugas Kelompok</h1>
      </div>

      <div className="bg-surface p-8 rounded-xl shadow-sm border border-border-custom border-t-4 border-t-indigo-600">
        <CreateTaskKelompokForm availableClasses={sortedClasses} />
      </div>
    </div>
  );
}
