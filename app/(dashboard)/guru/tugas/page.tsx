import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Tugas, Guru } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import GuruTaskTable from '@/components/guru/GuruTaskTable';

export default async function GuruTaskPage({
    searchParams
}: {
    searchParams: Promise<{ mapel?: string }>
}) {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  
  const guru_id = (session.user as any).guru_id;
  const params = await searchParams;
  const selectedMapel = params.mapel || '';

  await connectDB();

  const guruInfo = await Guru.findById(guru_id);
  if (!guruInfo) redirect('/login');

  const filter: any = { guru_id };
  if (selectedMapel) {
      filter.mapel = selectedMapel;
  }

  const tasks = await Tugas.find(filter).sort({ deadline: -1 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-foreground">Kelola Tugas</h1>
            <p className="text-sm text-foreground/60 mt-1">Kelola tugas untuk mata pelajaran yang Anda ampu.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <Link 
                href="/guru/tugas/tambah" 
                className="flex-1 md:flex-none bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 text-center transition"
            >
                + Buat Tugas
            </Link>
        </div>
      </div>



      <GuruTaskTable 
        tasks={tasks.map((t: any) => ({
            _id: t._id.toString(),
            judul: t.judul,
            mapel: t.mapel,
            deadline: t.deadline.toISOString(),
            kelas: t.kelas,
            is_active: t.is_active
        }))} 
      />
    </div>
  );
}
