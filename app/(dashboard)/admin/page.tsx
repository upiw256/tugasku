import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
// Tambahkan Pengumuman di sini
import { Member, Tugas, Nilai, Absensi, Pengumuman } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AttendanceChart from '@/components/ui/AttendanceChart';
import GradesChart from '@/components/ui/GradesChart';
// Import component AnnouncementBoard
import AnnouncementBoard from '@/components/ui/AnnouncementBoard';

export default async function AdminDashboardPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  await connectDB();

  // --- DATA STATISTIK UTAMA ---
  const totalSiswa = await Member.countDocuments();
  const totalTugas = await Tugas.countDocuments();
  const totalPengumpulan = await Nilai.countDocuments();

  // --- DATA PENGUMUMAN (BARU) ---
  const dataPengumuman = await Pengumuman.find({})
    .sort({ tanggal: -1 })
    .limit(5)
    .lean();

  // Serialisasi data pengumuman agar bisa dikirim ke Client Component
  const announcements = dataPengumuman.map((item: any) => ({
    ...item,
    _id: item._id.toString(),
    tanggal: item.tanggal.toISOString(),
  }));

  const recentSubmissions = await Nilai.find()
    .sort({ tanggal_mengumpulkan: -1 })
    .limit(5)
    .populate('member_id', 'nama_lengkap kelas') 
    .populate('tugas_id', 'judul') 
    .lean();

  // --- LOGIKA DATA GRAFIK KEHADIRAN HARI INI ---
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6); 
  startDate.setHours(0, 0, 0, 0);

  const allStudents = await Member.find({}).lean();
  const studentClassMap: Record<string, string> = {}; 
  const distinctClasses: Record<string, boolean> = {};

  allStudents.forEach((s: any) => {
    studentClassMap[s._id.toString()] = s.kelas;
    distinctClasses[s.kelas] = true;
  });
  
  const sortedClasses = Object.keys(distinctClasses).sort();

  const attendanceLogs = await Absensi.find({
    tanggal: { $gte: startDate, $lte: endDate }
  }).lean();

  const chartDataByClass: Record<string, any[]> = {};
  const dateRange: string[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateRange.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }));
  }

  sortedClasses.forEach(cls => {
    chartDataByClass[cls] = dateRange.map(dateStr => ({
      date: dateStr,
      Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0
    }));
  });

  attendanceLogs.forEach((log: any) => {
    const studentId = log.member_id.toString();
    const cls = studentClassMap[studentId];
    
    if (cls && chartDataByClass[cls]) {
      const logDateStr = new Date(log.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
      const dataIndex = chartDataByClass[cls].findIndex(d => d.date === logDateStr);
      
      if (dataIndex !== -1 && log.status) {
        if (chartDataByClass[cls][dataIndex][log.status] !== undefined) {
          chartDataByClass[cls][dataIndex][log.status] += 1;
        }
      }
    }
  });

  // --- LOGIKA GRAFIK NILAI ---
  const allGrades = await Nilai.find({}).lean();
  const gradeStatsByClass: Record<string, { total: number, count: number }> = {};
  
  sortedClasses.forEach(cls => {
    gradeStatsByClass[cls] = { total: 0, count: 0 };
  });

  allGrades.forEach((g: any) => {
    const studentId = g.member_id.toString();
    const cls = studentClassMap[studentId];

    if (cls && gradeStatsByClass[cls]) {
      gradeStatsByClass[cls].total += g.nilai;
      gradeStatsByClass[cls].count += 1;
    }
  });

  const gradesChartData = sortedClasses.map(cls => {
    const stats = gradeStatsByClass[cls];
    const avg = stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
    
    return {
      kelas: cls,
      rataRata: avg,
      jumlahTugas: stats.count
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
          <p className="text-gray-500">Ringkasan aktivitas sistem</p>
        </div>
        <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Siswa</p>
          <h2 className="text-3xl font-bold">{totalSiswa}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">Total Tugas</p>
          <h2 className="text-3xl font-bold">{totalTugas}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Tugas Dikumpulkan</p>
          <h2 className="text-3xl font-bold">{totalPengumpulan}</h2>
        </div>
      </div>

      {/* --- GRID UTAMA: GRAFIK & PENGUMUMAN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI (2/3): Grafik-grafik */}
        <div className="lg:col-span-2 space-y-6">
           {/* Grafik Absensi */}
           <AttendanceChart 
              dataByClass={chartDataByClass} 
              allClasses={sortedClasses} 
           />
           {/* Grafik Nilai */}
           <GradesChart data={gradesChartData} />
        </div>

        {/* KOLOM KANAN (1/3): Papan Pengumuman */}
        <div className="lg:col-span-1">
          {/* Container dengan tinggi fix agar scroll berfungsi */}
          <div className="h-[600px]">
            <AnnouncementBoard 
              role="admin" 
              initialData={announcements} 
            />
          </div>
        </div>
      </div>

      {/* Tabel Aktivitas Terbaru */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">Aktivitas Pengumpulan Terbaru</h3>
          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">5 Terakhir</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Nama Siswa</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">Judul Tugas</th>
                <th className="px-6 py-3">Nilai</th>
                <th className="px-6 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Belum ada data pengumpulan tugas.
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((item: any) => (
                  <tr key={item._id} className="bg-white border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.member_id?.nama_lengkap || 'Siswa Dihapus'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {item.member_id?.kelas || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.tugas_id?.judul || 'Tugas Dihapus'}
                    </td>
                    <td className="px-6 py-4">
                      {item.nilai >= 75 ? (
                        <span className="text-green-600 font-bold">{item.nilai}</span>
                      ) : (
                        <span className="text-red-500 font-bold">{item.nilai}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(item.tanggal_mengumpulkan).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link href="/admin/siswa/import" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow">
          + Import Siswa
        </Link>
        <Link href="/admin/tugas" className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-900 transition shadow">
          Kelola Tugas
        </Link>
      </div>
    </div>
  );
}