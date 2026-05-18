import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru, Tugas, Materi, SoalPG, Member, Nilai } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import GuruSetup from '@/components/guru/GuruSetup';

export default async function GuruDashboardPage({
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
  
  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) {
      return <div className="p-10 text-center">Data Guru tidak ditemukan. Silakan hubungi Admin.</div>
  }

  // JIKA BELUM ADA DATA PENGAJARAN -> Tampilkan Setup
  if (!guruInfo.pengajaran || guruInfo.pengajaran.length === 0) {
      const distinctClasses = await Member.distinct('kelas');
      const sortedClasses = distinctClasses.sort();
      return (
          <div className="py-20 flex items-center justify-center">
              <GuruSetup guruId={guru_id.toString()} availableClasses={sortedClasses} />
          </div>
      );
  }

  // Normal Dashboard Logic...
  // 1. Stats Query
  const query: any = { guru_id };
  if (selectedMapel) {
    query.mapel = selectedMapel;
  }

  const [totalTugas, totalMateri, totalKuis] = await Promise.all([
    Tugas.countDocuments(query),
    Materi.countDocuments(query),
    SoalPG.countDocuments(query)
  ]);
  
  // 2. Data Kelas & Siswa
  const relevantPengajaran = selectedMapel 
    ? (guruInfo as any).pengajaran.filter((p: any) => p.mapel === selectedMapel)
    : (guruInfo as any).pengajaran;

  const allClasses = (guruInfo as any).pengajaran.reduce((acc: string[], curr: any) => {
      curr.kelas.forEach((c: string) => {
          if (!acc.includes(c)) acc.push(c);
      });
      return acc;
  }, []);

  const totalSiswa = await Member.countDocuments({ kelas: { $in: allClasses } });

  // 3. Recent Submissions (Nilai Terbaru)
  const tugasGuru = await Tugas.find({ guru_id }).select('_id').lean();
  const tugasIds = tugasGuru.map(t => t._id);

  const recentNilai = await Nilai.find({ tugas_id: { $in: tugasIds } })
    .populate('member_id', 'nama_lengkap nis kelas')
    .populate('tugas_id', 'judul mapel')
    .sort({ tanggal_mengumpulkan: -1 })
    .limit(5)
    .lean();

  return (
    <div className="space-y-8 pb-10">
      {/* --- WELCOME BANNER --- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10 group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                 <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                 <span className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em]">Sistem Akademik Aktif</span>
              </div>
              <h1 className="text-3xl md:text-6xl font-black tracking-tight leading-[1.1] break-words">
                Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">{guruInfo.nama_lengkap}</span>
              </h1>
              <p className="text-indigo-200/60 mt-4 text-[13px] md:text-lg font-medium max-w-md leading-relaxed">
                 Siap untuk mencetak generasi hebat hari ini melalui <span className="text-white font-bold">{selectedMapel || 'pengajaran terbaik Anda'}</span>?
              </p>
              
              <div className="flex flex-wrap gap-3 mt-8">
                 {guruInfo.pengajaran.map((p: any, i: number) => (
                    <Link 
                      key={i} 
                      href={`/guru?mapel=${p.mapel}`}
                      className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedMapel === p.mapel ? 'bg-white text-slate-900 border-white shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}
                    >
                      📖 {p.mapel}
                    </Link>
                 ))}
              </div>
           </div>

           <div className="hidden lg:block relative">
              <div className="w-48 h-48 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-700">
                 <div className="text-6xl group-hover:rotate-12 transition-transform duration-500">🎓</div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-500/20 rounded-xl blur-xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-700"></div>
           </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      </div>

      {/* --- QUICK STATS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Siswa Diampu', value: totalSiswa, sub: 'Total Anak', color: 'blue', icon: '👤' },
          { label: 'Tugas Aktif', value: totalTugas, sub: 'File/Luring', color: 'amber', icon: '📝' },
          { label: 'Modul Materi', value: totalMateri, sub: 'Bahan Ajar', color: 'emerald', icon: '📚' },
          { label: 'Kuis Koleksi', value: totalKuis, sub: 'Ujian PG', color: 'purple', icon: '⚡' },
        ].map((stat, i) => (
          <div key={i} className="group bg-surface hover:bg-foreground/[0.01] p-4 md:p-6 rounded-3xl md:rounded-[2rem] border border-border-custom shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="flex justify-between items-start mb-3 md:mb-4">
               <div className="w-8 h-8 md:w-10 md:h-10 rounded-[1rem] md:rounded-2xl bg-foreground/5 flex items-center justify-center text-lg">
                  {stat.icon}
               </div>
               <span className="text-[8px] md:text-[10px] font-black uppercase text-foreground/20 tracking-widest">{stat.sub}</span>
            </div>
            <div className="text-2xl md:text-4xl font-black text-foreground tracking-tighter mb-1">
               {stat.value}
            </div>
            <p className="text-[8px] md:text-[10px] font-black uppercase text-foreground/40 tracking-wider truncate">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- JADWAL & KELAS (Left Column) --- */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-surface rounded-3xl md:rounded-[2.5rem] border border-border-custom shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 md:p-8 border-b border-border-custom bg-foreground/[0.01] flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Agenda Pengajaran</h3>
                        <p className="text-foreground/40 text-xs font-medium uppercase tracking-widest mt-1">Daftar kelas yang Anda ampu</p>
                    </div>
                </div>
                <div className="divide-y divide-border-custom">
                    {guruInfo.pengajaran.map((p: any, i: number) => (
                        <div key={i} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-foreground/[0.01] transition-all group">
                            <div className="flex items-start md:items-center gap-4 md:gap-6">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-foreground/5 rounded-2xl flex items-center justify-center text-xl shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                                    📖
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-lg md:text-xl text-foreground group-hover:text-primary-500 transition-colors truncate">{p.mapel}</h4>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {p.kelas.map((k: string, ki: number) => (
                                            <span key={ki} className="bg-foreground/5 text-foreground/40 text-[10px] font-black px-2.5 py-1 rounded-lg border border-border-custom uppercase tracking-tighter">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link 
                                  href={`/guru/tugas?mapel=${p.mapel}`} 
                                  className="px-5 py-2.5 bg-foreground/5 text-foreground/60 text-[10px] font-black uppercase tracking-widest rounded-xl border border-border-custom hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-all active:scale-95"
                                >
                                    Tugas
                                </Link>
                                <Link 
                                  href={`/guru/nilai?mapel=${p.mapel}`} 
                                  className="px-5 py-2.5 bg-foreground/5 text-foreground/60 text-[10px] font-black uppercase tracking-widest rounded-xl border border-border-custom hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all active:scale-95"
                                >
                                    Nilai
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- RECENT SUBMISSIONS (Right Column) --- */}
        <div className="space-y-8">
            <div className="bg-surface rounded-3xl md:rounded-[2.5rem] border border-border-custom shadow-sm p-6 md:p-8 flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight relative z-10">Pengumpulan Terbaru</h3>
                <p className="text-foreground/40 text-xs font-medium uppercase tracking-widest mt-1 relative z-10">Monitor tugas siswa</p>
                
                <div className="mt-8 space-y-6 relative z-10">
                    {recentNilai.map((n: any) => (
                        <div key={n._id.toString()} className="flex gap-4 group">
                             <div className="w-1.5 h-12 bg-primary-500 rounded-full shrink-0 group-hover:scale-y-125 transition-transform duration-500"></div>
                             <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">{(n.tugas_id as any)?.judul || 'Tugas Terhapus'}</p>
                                <h5 className="font-bold text-foreground text-sm truncate mt-1">{(n.member_id as any)?.nama_lengkap || 'Siswa Terhapus'}</h5>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] font-bold text-foreground/40">Kelas {(n.member_id as any)?.kelas || '-'}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${n.nilai > 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                        {n.nilai > 0 ? `Nilai: ${n.nilai}` : 'Menunggu Nilai'}
                                    </span>
                                </div>
                             </div>
                        </div>
                    ))}

                    {recentNilai.length === 0 && (
                        <div className="py-20 text-center opacity-20 filter grayscale">
                            <div className="text-5xl mb-4">📭</div>
                            <p className="text-xs font-black uppercase tracking-widest">Belum ada pengumpulan.</p>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-8">
                     <Link href="/guru/nilai" className="flex items-center justify-center gap-2 w-full py-4 bg-foreground/5 text-foreground/60 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-foreground/10 hover:text-foreground transition-all">
                        Semua Pengumpulan &rarr;
                     </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
