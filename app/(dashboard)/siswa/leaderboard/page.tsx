import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Nilai, PengerjaanKuis } from '@/models';
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
  
  // Ambil data diri siswa dari session
  const currentUser = await Member.findOne({ _id: session.user.member_id }).lean();
  const userKelas = currentUser?.kelas || '';
  const selectedKelas = params.kelas || userKelas;

  // 1. Filter
  const filter = viewType === 'kelas' ? { kelas: selectedKelas } : {};
  const students = await Member.find(filter).lean();

  // 2. Agregasi (Sama dengan Admin)
  const studentStats = await Promise.all(students.map(async (s: any) => {
    const resTugas = await Nilai.aggregate([
      { $match: { member_id: s._id } },
      { $group: { _id: null, total: { $sum: "$nilai" } } }
    ]);
    const resKuis = await PengerjaanKuis.aggregate([
      { $match: { member_id: s._id, status: 'SUBMITTED' } },
      { $group: { _id: null, total: { $sum: "$nilai" } } }
    ]);
    const totalScore = (resTugas[0]?.total || 0) + (resKuis[0]?.total || 0) + (s.poin_keaktifan || 0);

    return {
      _id: s._id.toString(),
      nama: s.nama_lengkap,
      kelas: s.kelas,
      totalScore,
      isMe: s._id.toString() === session.user.member_id
    };
  }));

  const leaderboard = studentStats
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 50); // Liat 50 besar aja

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

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {leaderboard.map((item, index) => {
          const rank = index + 1;
          const isRank1 = rank === 1;
          
          return (
            <div 
              key={item._id}
              className={`
                flex items-center justify-between p-5 border-b last:border-0 transition-colors
                ${item.isMe ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
              `}
            >
                <div className="flex items-center gap-5">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-black text-lg
                        ${rank === 1 ? 'bg-amber-400 text-white scale-110 shadow-md' : 
                          rank === 2 ? 'bg-gray-300 text-white' : 
                          rank === 3 ? 'bg-orange-400 text-white' : 'text-gray-400'}
                    `}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </div>

                    <div>
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                            {item.nama}
                            {item.isMe && <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full uppercase">Saya</span>}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">{item.kelas}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-center pr-4">
                        <div className={`text-xl font-black ${isRank1 ? 'text-amber-600' : 'text-gray-800'}`}>{item.totalScore}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Points</div>
                    </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
