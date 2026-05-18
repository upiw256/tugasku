import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru, Member, Tugas, Nilai } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NilaiRekapTable from '@/components/guru/NilaiRekapTable';

export default async function GuruNilaiPage({
    searchParams
}: {
    searchParams: Promise<{ mapel?: string, kelas?: string }>
}) {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  
  const guru_id = (session.user as any).guru_id;
  const params = await searchParams;
  const selectedMapel = params.mapel || '';
  const selectedKelas = params.kelas || '';

  await connectDB();
  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) redirect('/login');

  const pengajaran = (guruInfo as any).pengajaran.find((p: any) => p.mapel === selectedMapel);

  if (!selectedMapel) {
    return (
        <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-foreground">Pilih Mata Pelajaran</h2>
            <p className="text-foreground/60">Silakan pilih mata pelajaran di bagian atas untuk melihat rekap nilai.</p>
        </div>
    );
  }

  const listKelas = pengajaran?.kelas || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-foreground">Rekap Nilai Tugas</h1>
            <p className="text-sm text-foreground/60 mt-1">Melihat dan mengelola nilai siswa pada mata pelajaran <strong>{selectedMapel}</strong>.</p>
        </div>
      </div>

      {/* Filter Kelas */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {listKelas.map((k: string) => (
              <Link 
                key={k}
                href={`/guru/nilai?mapel=${selectedMapel}&kelas=${k}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${selectedKelas === k ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20' : 'bg-surface text-foreground/40 border-border-custom hover:bg-foreground/5'}`}
              >
                  Kelas {k}
              </Link>
          ))}
      </div>

      {selectedKelas ? (
          <NilaiRekapTable mapel={selectedMapel} kelas={selectedKelas} guru_id={guru_id} />
      ) : (
        <div className="bg-surface p-10 rounded-2xl border border-border-custom text-center">
            <p className="text-foreground/40 italic text-sm">Pilih kelas untuk melihat daftar nilai siswa.</p>
        </div>
      )}
    </div>
  );
}
