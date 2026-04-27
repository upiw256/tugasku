import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Nilai, PengerjaanKuis } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
        totalTugas: { $sum: "$tugas_data.nilai" },
        // Filter kuis yang sudah SUBMITTED
        totalKuis: {
          $sum: {
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
            "$totalTugas",
            "$totalKuis",
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
      totalScore: item.totalScore,
      detail: { tugas: item.totalTugas, kuis: item.totalKuis, aktif: item.poinAktif }
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">🏆 Hall of Fame</h1>
          <p className="text-gray-500">Peringkat siswa terbaik berdasarkan akumulasi seluruh aktivitas.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-200 p-1 rounded-xl">
          <Link 
            href={`/admin/leaderboard?type=global`}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewType === 'global' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🌍 Global
          </Link>
          <Link 
            href={`/admin/leaderboard?type=kelas&kelas=${selectedKelas || distinctClasses[0]}`}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewType === 'kelas' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🏫 Per Kelas
          </Link>
        </div>
      </div>

      {/* Filter Kelas (Hanya muncul jika mode Sekelas) */}
      {viewType === 'kelas' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border flex gap-2 items-center">
             <span className="text-sm font-bold text-gray-600">Pilih Kelas:</span>
             <div className="flex flex-wrap gap-2">
                {distinctClasses.sort().map(cls => (
                    <Link 
                        key={cls}
                        href={`/admin/leaderboard?type=kelas&kelas=${cls}`}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${selectedKelas === cls ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        {cls}
                    </Link>
                ))}
             </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="grid gap-4">
        {leaderboard.map((item, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          
          return (
            <div 
              key={item._id.toString()}
              className={`
                relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                ${rank === 1 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-md scale-[1.02] z-10' : 'bg-white border-gray-100 hover:border-blue-200'}
              `}
            >
              {/* Rank Label */}
              <div className="flex items-center gap-4">
                <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl font-black
                    ${rank === 1 ? 'bg-amber-400 text-white shadow-lg' : 
                      rank === 2 ? 'bg-gray-300 text-white' : 
                      rank === 3 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-400'}
                `}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                </div>
                
                <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        {item.nama}
                        {viewType === 'global' && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">{item.kelas}</span>
                        )}
                    </h3>
                    <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-gray-400 font-medium">📚 Tugas: {item.detail.tugas}</span>
                        <span className="text-[10px] text-gray-400 font-medium">📝 Kuis: {item.detail.kuis}</span>
                        <span className="text-[10px] text-amber-500 font-bold">⭐ Aktif: {item.detail.aktif}</span>
                    </div>
                </div>
              </div>

              {/* Score Display */}
              <div className="text-right">
                <div className="text-2xl font-black text-gray-800">{item.totalScore}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Poin</div>
              </div>
              
              {/* Special Badge for Rank 1 */}
              {rank === 1 && (
                <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg animate-bounce">
                    THE KING 👑
                </div>
              )}
            </div>
          );
        })}

        {leaderboard.length === 0 && (
            <div className="bg-white p-20 text-center rounded-2xl border border-dashed border-gray-300 text-gray-400 italic">
                Belum ada data skor untuk ditampilkan.
            </div>
        )}
      </div>
    </div>
  );
}
