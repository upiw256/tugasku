import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
// Tambahkan 'Pengumuman' di sini
import { Absensi, Member, Nilai, Tugas, User, Pengumuman, PengerjaanKuis, SoalPG } from '@/models';
import { redirect } from 'next/navigation';
// Import komponen Papan Pengumuman
import AnnouncementBoard from '@/components/ui/AnnouncementBoard';
import AttendanceButton from '@/components/ui/AttendanceButton';

export default async function SiswaDashboard() {
  const session = await auth();
  if (!session || session.user.role !== 'siswa') redirect('/login');

  await connectDB();

  // 1. Ambil Data Akun User
  const user = await User.findOne({ user: session.user.email });
  
  if (!user) {
    return <div className="p-8 text-red-600">❌ Akun tidak ditemukan. Hubungi Admin.</div>;
  }

  // 2. Ambil Data Siswa (Member)
  const student = await Member.findById(user.member_id);
  if (!student) {
    return <div className="p-8 text-yellow-600">⚠️ Profil siswa tidak terhubung.</div>;
  }

  // 3. Absensi Hari Ini & Statistik
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const absenToday = await Absensi.findOne({ member_id: student._id, tanggal: today });

  const totalHadir = await Absensi.countDocuments({ member_id: student._id, status: 'Hadir' });
  const totalSakit = await Absensi.countDocuments({ member_id: student._id, status: 'Sakit' });
  const totalIzin = await Absensi.countDocuments({ member_id: student._id, status: 'Izin' });
  const totalAlpha = await Absensi.countDocuments({ member_id: student._id, status: 'Alpha' });
  const totalPertemuan = totalHadir + totalSakit + totalIzin + totalAlpha;
  const persentaseKehadiran = totalPertemuan > 0 ? Math.round((totalHadir / totalPertemuan) * 100) : 0;

  // 4. AMBIL SEMUA TUGAS (Tanpa Limit agar statistik akurat)
  const tasks = await Tugas.find({
    $or: [
        { kelas: student.kelas },          
        { kelas: { $in: [student.kelas] } }
    ]
  })
  .sort({ deadline: -1 }) // Urut dari yang paling baru
  .lean();

  // 5. Ambil Semua Nilai
  const allGrades = await Nilai.find({ member_id: student._id }).lean();
  

  // 6. Hitung Tugas Pending
  const pendingTasksCount = tasks.filter((t: any) => {
    // Cek apakah tugas ini sudah ada nilainya?
    const isGraded = allGrades.some((g: any) => g.tugas_id.toString() === t._id.toString());
    return !isGraded; // Kembalikan true jika BELUM dinilai
  }).length;

  // 7. Ambil Hasil Kuis
  const quizResults = await PengerjaanKuis.find({ 
    member_id: student._id,
    status: 'SUBMITTED' 
  })
  .populate({
    path: 'kuis_id',
    model: SoalPG,
    select: 'judul'
  })
  .sort({ selesai_mengerjakan: -1 })
  .lean();

  // Update Rata-rata Nilai (Gabungan Tugas + Kuis)
  const totalNilaiTugas = allGrades.reduce((acc: number, curr: any) => acc + curr.nilai, 0);
  const totalNilaiKuis = quizResults.reduce((acc: number, curr: any) => acc + (curr.nilai || 0), 0);
  const totalItem = allGrades.length + quizResults.length;
  const rataRataNilai = totalItem > 0 ? Math.round((totalNilaiTugas + totalNilaiKuis) / totalItem) : 0;

  // --- 8. AMBIL PENGUMUMAN (BARU) ---
  const dataPengumuman = await Pengumuman.find({})
    .sort({ tanggal: -1 })
    .limit(5)
    .lean();

  const announcements = dataPengumuman.map((item: any) => ({
    ...item,
    _id: item._id.toString(),
    tanggal: item.tanggal.toISOString(),
  }));

  // --- 9. LOGIKA PERINGKAT (GLOBAL & KELAS) PAKE AGREGASI EFISIEN ---
  const leaderboardData = await Member.aggregate([
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
        kelas: 1,
        score: {
          $add: [
            { $ifNull: ["$totalTugas", 0] },
            { $ifNull: ["$totalKuis", 0] },
            { $ifNull: ["$poin_keaktifan", 0] }
          ]
        }
      }
    },
    { $sort: { score: -1 } }
  ]);

  // Hitung Rank Global
  const globalRank = leaderboardData.findIndex(s => s._id.toString() === student._id.toString()) + 1;

  // Hitung Rank Kelas
  const sortedKelas = leaderboardData.filter(s => s.kelas === student.kelas);
  const kelasRank = sortedKelas.findIndex(s => s._id.toString() === student._id.toString()) + 1;

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-6">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Halo, {student.nama_lengkap}</h1>
            {globalRank <= 3 && (
                <span className="text-3xl animate-bounce" title={`Top ${globalRank} Global!`}>
                    {globalRank === 1 ? '🥇' : globalRank === 2 ? '🥈' : '🥉'}
                </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <p className="opacity-90 font-medium">Kelas: <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{student.kelas}</span></p>
            <span className="w-1 h-1 bg-white/40 rounded-full"></span>
            
            {/* BADGE RANKING */}
            <div className="flex gap-2">
                <span className="bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    🏆 Rank #{kelasRank} Kelas
                </span>
                <span className="bg-blue-400/20 border border-blue-400/40 text-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    🌍 Rank #{globalRank} Sekolah
                </span>
            </div>
          </div>
          <p className="opacity-60 text-xs mt-3 uppercase tracking-widest font-bold">NIS: {student.nis}</p>
        </div>
        {/* Tombol Absen (Jika ingin diaktifkan, uncomment baris bawah) */}
        {/* <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
             <AttendanceButton sudahAbsen={!!absenToday} waktu={absenToday?.waktu} />
        </div> */}
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full text-2xl">📅</div>
            <div>
                <p className="text-gray-500 text-sm">Kehadiran</p>
                <h3 className="text-2xl font-bold text-gray-800">{persentaseKehadiran}%</h3>
                <p className="text-xs text-gray-400">{totalHadir} kali Hadir</p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full text-2xl">⭐</div>
            <div>
                <p className="text-gray-500 text-sm">Poin Aktif</p>
                <h3 className="text-2xl font-bold text-amber-600">{student.poin_keaktifan || 0}</h3>
                <p className="text-[10px] text-gray-400">Bonus dari Guru</p>
            </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full text-2xl">🎓</div>
            <div>
                <p className="text-gray-500 text-sm">Rata-rata Nilai</p>
                <h3 className="text-2xl font-bold text-gray-800">{rataRataNilai}</h3>
                <p className="text-xs text-gray-400">{allGrades.length} tugas & {quizResults.length} kuis</p>
            </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full text-2xl">📝</div>
            <div>
                <p className="text-gray-500 text-sm">Tugas Pending</p>
                <h3 className="text-2xl font-bold text-gray-800">{pendingTasksCount}</h3>
                <p className="text-xs text-gray-400">Belum dinilai</p>
            </div>
        </div>
      </div>

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI (2/3): LIST TUGAS */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div className="p-5 border-b bg-gray-50">
                <h2 className="font-bold text-lg text-gray-800">📋 Daftar Semua Tugas</h2>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {tasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Belum ada tugas.
                    </div>
                ) : (
                    tasks.map((task: any) => {
                        const gradeData = allGrades.find((g: any) => g.tugas_id.toString() === task._id.toString());
                        const isDone = !!gradeData;
                        const deadline = new Date(task.deadline);
                        const isLate = !isDone && deadline < new Date();

                        return (
                            <div key={task._id} className="p-5 hover:bg-gray-50 transition flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800 text-lg">
                                            {task.judul}
                                        </h3>
                                        {isDone ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">
                                                ✅ Selesai
                                            </span>
                                        ) : isLate ? (
                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-200">
                                                ⚠️ Terlewat
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold border border-yellow-200">
                                                ⏳ Pending
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                                        {task.deskripsi || 'Tidak ada deskripsi.'}
                                    </p>
                                    <div className="text-xs text-gray-400">
                                        📅 Batas: {deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>

                                {isDone ? (
                                    <div className="text-right min-w-[80px]">
                                        <p className="text-xs text-gray-500 mb-1">Nilai</p>
                                        <span className={`text-2xl font-bold ${gradeData.nilai < 75 ? 'text-red-500' : 'text-blue-600'}`}>
                                            {gradeData.nilai}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-right min-w-[80px]">
                                        <p className="text-xs text-gray-400 italic">Belum dinilai</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* SECTION HASIL KUIS */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div className="p-5 border-b bg-gray-50">
                <h2 className="font-bold text-lg text-gray-800">📊 Hasil Kuis & Latihan</h2>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {quizResults.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Belum ada kuis yang dikerjakan.
                    </div>
                ) : (
                    quizResults.map((result: any) => {
                        const kuis = result.kuis_id as any;
                        const date = result.selesai_mengerjakan ? new Date(result.selesai_mengerjakan) : null;

                        return (
                            <div key={result._id} className="p-5 hover:bg-gray-50 transition flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                                        {kuis?.judul || 'Kuis Tidak Ditemukan'}
                                    </h3>
                                    <div className="text-xs text-gray-400">
                                        📅 Selesai: {date ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </div>
                                </div>

                                <div className="text-right min-w-[80px]">
                                    <p className="text-xs text-gray-500 mb-1">Skor Kuis</p>
                                    <span className={`text-2xl font-bold ${result.nilai < 75 ? 'text-red-500' : 'text-green-600'}`}>
                                        {result.nilai}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* KOLOM KANAN (1/3): PENGUMUMAN & INFO */}
        <div className="space-y-6">
            
            {/* 1. PAPAN PENGUMUMAN (BARU) */}
            <div className="h-[400px]">
                <AnnouncementBoard 
                  role="siswa" 
                  initialData={announcements} 
                />
            </div>

            {/* 2. INFO CARD */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                <div className="p-5 border-b bg-gray-50">
                    <h2 className="font-bold text-gray-800">🔔 Status Pengerjaan</h2>
                </div>
                <div className="p-5">
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex justify-between items-center">
                            <span>Sudah Dinilai</span>
                            <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{allGrades.length}</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span>Belum Dinilai</span>
                            <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">{pendingTasksCount}</span>
                        </li>
                        <li className="flex justify-between items-center pt-1">
                            <span>Kuis Disubmit</span>
                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{quizResults.length}</span>
                        </li>
                        <li className="pt-2 border-t mt-2 flex justify-between items-center font-bold text-gray-800">
                            <span>Total Tugas</span>
                            <span>{tasks.length}</span>
                        </li>
                    </ul>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}