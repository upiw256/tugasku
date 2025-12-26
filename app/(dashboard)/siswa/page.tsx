import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Absensi, Member, Nilai, Tugas, User } from '@/models';
import { redirect } from 'next/navigation';
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
  
  // Hitung Rata-rata
  const totalNilai = allGrades.reduce((acc: number, curr: any) => acc + curr.nilai, 0);
  const rataRataNilai = allGrades.length > 0 ? Math.round(totalNilai / allGrades.length) : 0;

  // 6. Hitung Tugas Pending (REVISI: Semua yang belum dinilai, mau telat atau tidak)
  const pendingTasksCount = tasks.filter((t: any) => {
    // Cek apakah tugas ini sudah ada nilainya?
    const isGraded = allGrades.some((g: any) => g.tugas_id.toString() === t._id.toString());
    return !isGraded; // Kembalikan true jika BELUM dinilai
  }).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Halo, {student.nama_lengkap} 👋</h1>
          <p className="opacity-90 text-lg">Kelas: <span className="font-bold bg-white/20 px-2 py-1 rounded">{student.kelas}</span></p>
          <p className="opacity-80 text-sm mt-1">NIS: {student.nis}</p>
        </div>
        {/* <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
             <AttendanceButton sudahAbsen={!!absenToday} waktu={absenToday?.waktu} />
        </div> */}
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full text-2xl">📅</div>
            <div>
                <p className="text-gray-500 text-sm">Kehadiran</p>
                <h3 className="text-2xl font-bold text-gray-800">{persentaseKehadiran}%</h3>
                <p className="text-xs text-gray-400">{totalHadir} kali Hadir</p>
            </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full text-2xl">🎓</div>
            <div>
                <p className="text-gray-500 text-sm">Rata-rata Nilai</p>
                <h3 className="text-2xl font-bold text-gray-800">{rataRataNilai}</h3>
                <p className="text-xs text-gray-400">Dari {allGrades.length} tugas</p>
            </div>
        </div>
        
        {/* CARD TUGAS PENDING (YANG ANDA MINTA) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full text-2xl">📝</div>
            <div>
                <p className="text-gray-500 text-sm">Tugas Pending</p>
                {/* Angka ini sekarang menghitung semua tugas yg belum dinilai */}
                <h3 className="text-2xl font-bold text-gray-800">{pendingTasksCount}</h3>
                <p className="text-xs text-gray-400">Belum dinilai</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LIST TUGAS */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
                <h2 className="font-bold text-lg text-gray-800">📋 Daftar Semua Tugas</h2>
            </div>
            
            <div className="divide-y divide-gray-100">
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

        {/* INFO CARD */}
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
                    <li className="pt-2 border-t mt-2 flex justify-between items-center font-bold text-gray-800">
                        <span>Total Tugas</span>
                        <span>{tasks.length}</span>
                    </li>
                </ul>
            </div>
        </div>

      </div>
    </div>
  );
}