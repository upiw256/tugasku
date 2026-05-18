import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Kelompok, Member, Guru } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function GuruDataKelompokPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  
  const guru_id = (session.user as any).guru_id;

  await connectDB();

  // 1. Ambil Info Guru untuk filter kelas
  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) redirect('/login');

  const availableClasses = (guruInfo as any).pengajaran.reduce((acc: string[], curr: any) => {
    curr.kelas.forEach((c: string) => {
      if (!acc.includes(c)) acc.push(c);
    });
    return acc;
  }, []).sort();

  // 2. Ambil Params
  const params = await searchParams;
  const query = params.q || '';

  // 3. Query Database (Hanya fetch jika query eksis)
  let kelompokList: any[] = [];
  if (query) {
    kelompokList = await Kelompok.find({ kelas: query })
      .populate('anggota')
      .sort({ nama_kelompok: 1 })
      .lean();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold font-black text-foreground uppercase tracking-tight">
          Manajemen Kelompok Siswa
        </h1>

        <div className="flex gap-2 flex-wrap justify-end">
          <form className="flex gap-2 items-center bg-surface p-1 rounded-xl border border-border-custom">
            <select
              name="q"
              defaultValue={query}
              className="bg-transparent px-3 py-1.5 rounded-lg text-xs font-bold outline-none text-foreground min-w-[120px]"
            >
              <option value="">-- Pilih Kelas --</option>
              {availableClasses.map((cls: string) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-400 transition shadow-md shadow-primary-500/20"
            >
              Lihat
            </button>
          </form>

          <Link
            href="/guru/tugas-kelompok/tambah"
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 whitespace-nowrap flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <span>👥</span> Buat Baru
          </Link>
        </div>
      </div>

      {query ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kelompokList.map((k: any) => (
            <div key={k._id} className="bg-surface rounded-2xl shadow-sm border border-border-custom p-6 hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="font-black text-lg text-foreground leading-tight">{k.nama_kelompok}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[10px] bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter border border-primary-500/20">Kelas {k.kelas}</span>
                     <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">{k.anggota.length} Anggota</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 border-t border-border-custom pt-4 relative z-10">
                <ul className="space-y-2">
                  {k.anggota.map((siswa: any, idx: number) => {
                    const isKetua = k.ketua && k.ketua.toString() === siswa._id.toString();
                    return (
                      <li key={siswa._id || idx} className={`text-sm flex items-center gap-3 p-2 rounded-xl transition-colors ${isKetua ? 'bg-amber-500/5 border border-amber-500/20 shadow-sm' : 'hover:bg-foreground/[0.02]'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isKetua ? 'bg-amber-500 text-white' : 'bg-foreground/5 text-foreground/40'}`}>
                            {idx + 1}
                        </div>
                        <span className={`truncate flex-1 ${isKetua ? 'font-black text-foreground' : 'text-foreground/70'}`}>{siswa.nama_lengkap}</span>
                        {isKetua && <span className="text-amber-500" title="Ketua Kelompok">👑</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}

          {kelompokList.length === 0 && (
            <div className="col-span-full py-20 text-center bg-foreground/[0.02] border-2 border-dashed border-border-custom rounded-3xl">
               <div className="text-4xl mb-4">😿</div>
               <p className="text-foreground/40 font-black uppercase tracking-widest text-sm">Belum ada kelompok di kelas ini.</p>
               <Link href="/guru/tugas-kelompok/tambah" className="mt-4 inline-block text-primary-500 font-bold hover:underline">Mulai buat kelompok sekarang &rarr;</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="py-32 text-center bg-primary-500/5 border border-dashed border-primary-500/20 rounded-3xl">
           <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-6 rotate-12 group-hover:rotate-0 transition-transform">
              <span className="text-3xl">👈</span>
           </div>
           <p className="text-foreground/60 font-bold">Silakan pilih kelas untuk mengelola data kelompok.</p>
        </div>
      )}
    </div>
  );
}
