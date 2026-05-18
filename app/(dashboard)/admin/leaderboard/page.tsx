import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Nilai, PengerjaanKuis } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StaggerList from '@/components/ui/StaggerList';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

export default async function LeaderboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ type?: string, kelas?: string }> 
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();
  const params = await searchParams;
  const viewType = params.type || 'global'; // 'global' or 'kelas'
  const selectedKelas = params.kelas || '';

  // 1. Ambil List Kelas untuk Filter
  const distinctClasses = await Member.distinct('kelas');

  // 2. Query Agregasi Leaderboard (Lebih efisien & aman dari stack overflow)
  const leaderboardData = await Member.aggregate([
    // A. Filter Kelas (Jika mode Kelas)
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
        // Filter kuis yang sudah SUBMITTED
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">🏆 Hall of Fame</h1>
          <p className="text-foreground/60">Peringkat siswa terbaik berdasarkan akumulasi seluruh aktivitas.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-foreground/10 p-1 rounded-xl">
          <Link 
            href={`/admin/leaderboard?type=global`}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewType === 'global' ? 'bg-surface text-blue-500 shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
          >
            🌍 Global
          </Link>
          <Link 
            href={`/admin/leaderboard?type=kelas&kelas=${selectedKelas || distinctClasses[0]}`}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewType === 'kelas' ? 'bg-surface text-blue-500 shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
          >
            🏫 Per Kelas
          </Link>
        </div>
      </div>

      {/* Filter Kelas (Hanya muncul jika mode Sekelas) */}
      {viewType === 'kelas' && (
        <div className="bg-surface p-4 rounded-xl shadow-sm border border-border-custom flex gap-2 items-center">
             <span className="text-sm font-bold text-foreground/70">Pilih Kelas:</span>
             <div className="flex flex-wrap gap-2">
                {distinctClasses.sort().map(cls => (
                    <Link 
                        key={cls}
                        href={`/admin/leaderboard?type=kelas&kelas=${cls}`}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${selectedKelas === cls ? 'bg-blue-600 text-white border-blue-600' : 'bg-surface text-foreground/70 border-border-custom hover:bg-foreground/5'}`}
                    >
                        {cls}
                    </Link>
                ))}
             </div>
        </div>
      )}

      {/* Leaderboard List */}
      <StaggerList className="grid gap-4">
        {leaderboard.map((item, index) => {
          const rank = index + 1;
          
          return (
            <div 
              key={item._id.toString()}
              className={`
                stagger-item opacity-0
                relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                ${rank === 1 ? 'bg-amber-500/10 border-amber-500/20 shadow-md scale-[1.02] z-10' : 'bg-surface border-border-custom hover:border-blue-400/50'}
              `}
            >
              {/* Rank Label */}
              <div className="flex items-center gap-4">
                <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl font-black border
                    ${rank === 1 ? 'bg-amber-400 text-white shadow-lg border-amber-300' : 
                      rank === 2 ? 'bg-slate-300 text-white border-slate-200' : 
                      rank === 3 ? 'bg-orange-400 text-white border-orange-300' : 'bg-foreground/5 text-foreground/40 border-border-custom'}
                `}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                </div>
                
                <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                        {item.nama}
                        {viewType === 'global' && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded uppercase font-bold">{item.kelas}</span>
                        )}
                    </h3>
                    <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-foreground/40 font-medium tracking-tight">📚 Tugas: {item.detail.tugas}</span>
                        <span className="text-[10px] text-foreground/40 font-medium tracking-tight">📝 Kuis: {item.detail.kuis}</span>
                        <span className="text-[10px] text-amber-500 font-bold tracking-tight">⭐ Aktif: {item.detail.aktif}</span>
                    </div>
                </div>
              </div>

              {/* Score Display */}
              <div className="text-right">
                <div className="text-2xl font-black text-foreground">
                    <AnimatedNumber value={item.totalScore} decimals={1} />
                </div>
                <div className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">Total Poin</div>
              </div>
              
              {/* Special Badge for Rank 1 */}
              {rank === 1 && (
                <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg animate-bounce border-2 border-white dark:border-gray-800">
                    THE KING 👑
                </div>
              )}
            </div>
          );
        })}

        {leaderboard.length === 0 && (
            <div className="bg-surface p-20 text-center rounded-2xl border border-dashed border-border-custom text-foreground/40 italic">
                Belum ada data skor untuk ditampilkan.
            </div>
        )}
      </StaggerList>
    </div>
  );
}
