import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Nilai, PengerjaanKuis, User } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function SiswaLeaderboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ type?: string, kelas?: string }> 
}) {
  const session = await auth();
  if (!session) redirect('/login');

  await connectDB();
  const params = await searchParams;
  const viewType = params.type || 'kelas'; // Default siswa liat kelas dulu
  
  // Ambil data diri siswa dari akun (berdasarkan email session)
  const userAccount = await User.findOne({ user: session.user.email });
  const currentUser = userAccount ? await Member.findById(userAccount.member_id).lean() : null;
  const userKelas = currentUser?.kelas || '';
  const selectedKelas = params.kelas || userKelas;

  // 1. Filter (Hanya untuk filter query match)
  const filter = viewType === 'kelas' ? { kelas: selectedKelas } : {};

  // 2. Agregasi Efisien
  const studentStats = await Member.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: "nilais",
        localField: "_id",
        foreignField: "member_id",
        as: "tugas_data"
      }
    },
    {
      $lookup: {
        from: "pengerjaankuis",
        localField: "_id",
        foreignField: "member_id",
        as: "kuis_data"
      }
    },
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
    {
      $project: {
        _id: 1,
        nama: "$nama_lengkap",
        kelas: 1,
        totalScore: {
          $add: [
            { $ifNull: ["$totalTugas", 0] },
            { $ifNull: ["$totalKuis", 0] },
            { $ifNull: ["$poin_keaktifan", 0] }
          ]
        }
      }
    },
    { $sort: { totalScore: -1 } },
    { $limit: 50 }
  ]);

  const leaderboard = studentStats.map(item => ({
      _id: item._id.toString(),
      nama: item.nama,
      kelas: item.kelas,
      totalScore: Number(item.totalScore).toFixed(2).replace(/\.00$/, ''),
      isMe: item._id.toString() === session.user.member_id,
      detail: { 
        tugas: Number(item.totalTugas).toFixed(2).replace(/\.00$/, ''), 
        kuis: Number(item.totalKuis).toFixed(2).replace(/\.00$/, ''), 
        aktif: item.poinAktif 
      }
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center py-6 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-3xl text-white shadow-xl mb-8">
        <h1 className="text-4xl font-black mb-2 flex justify-center gap-3">
            ✨ Papan Peringkat ✨
        </h1>
        <p className="text-blue-100 opacity-80">Jadilah yang terbaik dan raih prestasi setinggi mungkin!</p>
        
        <div className="flex justify-center mt-6 gap-2">
            <Link 
                href="/siswa/leaderboard?type=kelas"
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewType === 'kelas' ? 'bg-white text-blue-700' : 'bg-blue-500/30 text-white hover:bg-blue-500/50'}`}
            >
                🏆 Peringkat Kelas
            </Link>
            <Link 
                href="/siswa/leaderboard?type=global"
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewType === 'global' ? 'bg-white text-blue-700' : 'bg-blue-500/30 text-white hover:bg-blue-500/50'}`}
            >
                🌍 Peringkat Global
            </Link>
        </div>
      </div>

      <div className="bg-surface rounded-3xl shadow-lg border border-border-custom overflow-hidden">
        {leaderboard.map((item, index) => {
          const rank = index + 1;
          const isRank1 = rank === 1;
          
          return (
            <div 
              key={item._id}
              className={`
                flex items-center justify-between p-5 border-b border-border-custom last:border-0 transition-colors
                ${item.isMe ? 'bg-blue-500/10' : 'hover:bg-foreground/5'}
              `}
            >
                <div className="flex items-center gap-5">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-black text-lg
                        ${rank === 1 ? 'bg-amber-400 text-white scale-110 shadow-md' : 
                          rank === 2 ? 'bg-slate-300 text-white' : 
                          rank === 3 ? 'bg-orange-400 text-white' : 'text-foreground/20'}
                    `}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </div>

                    <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                            {item.nama}
                            {item.isMe && <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full uppercase">Saya</span>}
                        </div>
                        <div className="text-xs text-foreground/40 font-medium tracking-tight uppercase">{item.kelas}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-center pr-4">
                        <div className={`text-xl font-black ${isRank1 ? 'text-amber-500' : 'text-foreground'}`}>{item.totalScore}</div>
                        <div className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">Points</div>
                    </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
