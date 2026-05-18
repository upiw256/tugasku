import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Guru } from '@/models';
import { redirect } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import GuruSiswaTable from '@/components/guru/GuruSiswaTable';
import SiswaFilter from '@/components/guru/SiswaFilter';

export default async function GuruDaftarSiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string, kelas?: string; mapel?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  const guru_id = (session.user as any).guru_id;

  await connectDB();

  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) redirect('/login');

  const params = await searchParams;
  const query = params.q || '';
  const selectedKelas = params.kelas || '';
  const selectedMapel = params.mapel || '';
  const page = Number(params.page) || 1;
  const LIMIT = 20;
  const skip = (page - 1) * LIMIT;

  // 1. Dapatkan kelas yang relevan
  let relevantClasses = (guruInfo as any).pengajaran?.reduce((acc: string[], curr: any) => {
    // Jika ada filter mapel, hanya ambil kelas dari mapel tersebut
    if (selectedMapel && curr.mapel !== selectedMapel) return acc;
    
    curr.kelas.forEach((k: string) => {
        if (!acc.includes(k)) acc.push(k);
    });
    return acc;
  }, []) || [];

  // Filter pilihan kelas yang muncul di dropdown (selalu semua kelas yang diampu guru)
  const allMyClasses = (guruInfo as any).pengajaran?.reduce((acc: string[], curr: any) => {
    curr.kelas.forEach((k: string) => {
        if (!acc.includes(k)) acc.push(k);
    });
    return acc;
  }, []) || [];

  // 2. Bangun Filter Query
  const filter: any = {
    kelas: { $in: relevantClasses }
  };
  
  if (query) {
    filter.nama_lengkap = { $regex: query, $options: 'i' };
  }
  if (selectedKelas) {
    filter.kelas = selectedKelas;
  }

  const students = await Member.find(filter)
    .sort({ kelas: 1, nama_lengkap: 1 })
    .skip(skip)
    .limit(LIMIT)
    .lean();
    
  const totalStudents = await Member.countDocuments(filter);
  const totalPages = Math.ceil(totalStudents / LIMIT);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Daftar Siswa</h1>
          <p className="text-foreground/40 text-xs font-medium uppercase tracking-widest mt-1">
            Mengelola data siswa di {relevantClasses.length} kelas {selectedMapel ? `untuk mapel ${selectedMapel}` : 'Anda'}
          </p>
        </div>

        <SiswaFilter 
            myClasses={allMyClasses} 
            defaultKelas={selectedKelas} 
            defaultQuery={query} 
        />
      </div>

      <GuruSiswaTable 
        students={JSON.parse(JSON.stringify(students))}
      />

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
            <Pagination totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
