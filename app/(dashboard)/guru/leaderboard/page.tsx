import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Guru } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StaggerList from '@/components/ui/StaggerList';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

export default async function GuruLeaderboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ type?: string, kelas?: string }> 
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

  const params = await searchParams;
  const viewType = params.type || 'global'; // 'global' or 'kelas'
  const selectedKelas = params.kelas || (viewType === 'kelas' ? availableClasses[0] : '');

  // 2. Query Agregasi Leaderboard
  const leaderboardData = await Member.aggregate([
    // A. Filter Kelas (Jika mode Kelas atau Global tapi batas ke kelas guru? - Biasanya global ya global)
    ...(viewType === 'kelas' && selectedKelas ? [{ $match: { kelas: selectedKelas } }] : []),
    
    // B. Join ke koleksi Nilai (Tugas)
    {
      $lookup: {
        from: "nilais",
        localField: "_id",
        foreignField: "member_id",
        as: "tugas_data"
      }
    },
    
    // C. Join ke koleksi PengerjaanKuis (Kuis)
    {
      $lookup: {
        from: "pengerjaankuis",
        localField: "_id",
        foreignField: "member_id",
        as: "kuis_data"
      }
    },
    
    // D. Hitung Total per kategori
    {
      $project: {
        nama_lengkap: 1,
        kelas: 1,
        poin_keaktifan: 1,
        totalTugas: { $ifNull: [{ $avg: "$tugas_data.nilai" }, 0] },
        totalKuis: {
          $ifNull: [
            {
              $avg: {
                $map: {
                  input: {
                    $filter: {
                      input: "$kuis_data",
                      as: "k",
                      cond: { $eq: ["$$k.status", "SUBMITTED"] }
                    }
                  },
                  as: "item",
                  in: "$$item.nilai"
                }
              }
            },
            0
          ]
        }
      }
    },
    
    // E. Hitung Skor Akhir
    {
      $project: {
        nama: "$nama_lengkap",
        kelas: 1,
        poinAktif: { $ifNull: ["$poin_keaktifan", 0] },
        totalTugas: 1,
        totalKuis: 1,
        totalScore: {
          $add: [
            { $ifNull: ["$totalTugas", 0] },
            { $ifNull: ["$totalKuis", 0] },
            { $ifNull: ["$poin_keaktifan", 0] }
          ]
        }
      }
    },
    
    // F. Sort & Limit
    { $sort: { totalScore: -1 } },
    { $limit: 20 }
  ]);

  const leaderboard = leaderboardData.map(item => ({
      _id: item._id,
      nama: item.nama,
      kelas: item.kelas,
      totalScore: Math.round(item.totalScore * 10) / 10,
      detail: { 
        tugas: Math.round(item.totalTugas * 10) / 10, 
        kuis: Math.round(item.totalKuis * 10) / 10, 
        aktif: item.poinAktif 
      }
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-surface p-8 rounded-3xl border border-border-custom shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-foreground tracking-tight uppercase leading-none">🏆 Hall of Fame</h1>
          <p className="text-foreground/40 mt-3 font-medium">Peringkat prestasi siswa terbaik di seluruh kelas pengampu.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-foreground/5 p-1.5 rounded-2xl border border-border-custom relative z-10 w-full md:w-auto">
          <Link 
            href={`/guru/leaderboard?type=global`}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${viewType === 'global' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-foreground/40 hover:text-foreground'}`}
          >
            🌍 Global
          </Link>
          <Link 
            href={`/guru/leaderboard?type=kelas&kelas=${selectedKelas || availableClasses[0]}`}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${viewType === 'kelas' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-foreground/40 hover:text-foreground'}`}
          >
            🏫 Per Kelas
          </Link>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>

      {/* Filter Kelas */}
      {viewType === 'kelas' && (
        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-border-custom">
             <div className="flex items-center gap-3 mb-4">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-ping"></span>
                <span className="text-xs font-black text-foreground/70 uppercase tracking-widest">Pilih Kelas :</span>
             </div>
             <div className="flex flex-wrap gap-2">
                {availableClasses.map((cls: string) => (
                    <Link 
                        key={cls}
                        href={`/guru/leaderboard?type=kelas&kelas=${cls}`}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 border ${selectedKelas === cls ? 'bg-primary-500 text-white border-primary-500 shadow-md' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-foreground/10 hover:text-foreground'}`}
                    >
                        {cls}
                    </Link>
                ))}
             </div>
        </div>
      )}

      {/* Leaderboard List */}
      <StaggerList className="grid gap-5">
        {leaderboard.map((item, index) => {
          const rank = index + 1;
          
          return (
            <div 
              key={item._id.toString()}
              className={`
                stagger-item opacity-0
                relative flex items-center justify-between p-6 rounded-[2.5rem] border transition-all duration-500 group
                ${rank === 1 ? 'bg-amber-500/10 border-amber-500/30 shadow-2xl scale-[1.02] z-10' : 
                  rank === 2 ? 'bg-slate-500/5 border-slate-500/20' :
                  rank === 3 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-surface border-border-custom hover:border-primary-400/50 hover:bg-primary-500/[0.02]'}
              `}
            >
              {/* Rank Label */}
              <div className="flex items-center gap-6">
                <div className={`
                    w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black border-2 transition-transform duration-500 group-hover:scale-110
                    ${rank === 1 ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-xl shadow-amber-500/30 border-white/20' : 
                      rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white border-white/20 shadow-lg shadow-slate-500/10' : 
                      rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white border-white/20 shadow-lg shadow-orange-500/10' : 'bg-foreground/5 text-foreground/20 border-border-custom'}
                `}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                </div>
                
                <div>
                    <h3 className="font-black text-xl text-foreground flex items-center gap-3">
                        {item.nama}
                        {viewType === 'global' && (
                            <span className="text-[10px] bg-primary-500/10 text-primary-500 px-3 py-1 rounded-lg uppercase font-black border border-primary-500/20 tracking-tighter">{item.kelas}</span>
                        )}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center gap-1.5 bg-foreground/5 px-2.5 py-1 rounded-full border border-border-custom">
                            <span className="text-[10px] text-foreground/30 font-black uppercase tracking-tighter">📚 Tugas</span>
                            <span className="text-[10px] text-foreground/60 font-black">{item.detail.tugas}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-foreground/5 px-2.5 py-1 rounded-full border border-border-custom">
                            <span className="text-[10px] text-foreground/30 font-black uppercase tracking-tighter">📝 Kuis</span>
                            <span className="text-[10px] text-foreground/60 font-black">{item.detail.kuis}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/10">
                            <span className="text-[10px] text-amber-500/50 font-black uppercase tracking-tighter">⭐ Aktif</span>
                            <span className="text-[10px] text-amber-500 font-black">{item.detail.aktif}</span>
                        </div>
                    </div>
                </div>
              </div>

              {/* Score Display */}
              <div className="text-right">
                <div className={`text-4xl font-black transition-colors duration-500 ${rank === 1 ? 'text-amber-500' : 'text-foreground'}`}>
                    <AnimatedNumber value={item.totalScore} decimals={1} />
                </div>
                <div className="text-[10px] text-foreground/30 font-black uppercase tracking-widest mt-1">Akumulasi Poin</div>
              </div>
              
              {/* Special Badge for Rank 1 */}
              {rank === 1 && (
                <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-2xl animate-pulse border-2 border-white/20 uppercase tracking-widest">
                    THE LEGEND 👑
                </div>
              )}
            </div>
          );
        })}

        {leaderboard.length === 0 && (
            <div className="bg-surface p-32 text-center rounded-[3rem] border-4 border-dashed border-border-custom">
                <div className="text-6xl mb-6 opacity-20 filter grayscale">🏵️</div>
                <p className="text-foreground/40 font-black uppercase tracking-widest text-sm">Mari mulai berikan nilai untuk melihat peringkat!</p>
            </div>
        )}
      </StaggerList>
    </div>
  );
}
