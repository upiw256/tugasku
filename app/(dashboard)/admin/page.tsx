import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Tugas, Nilai, Absensi, Pengumuman } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AttendanceChart from '@/components/ui/AttendanceChart';
import GradesChart from '@/components/ui/GradesChart';
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

  // --- DATA PENGUMUMAN ---
  const dataPengumuman = await Pengumuman.find({})
    .sort({ tanggal: -1 })
    .limit(5)
    .lean();

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

  // --- LOGIKA DATA GRAFIK KEHADIRAN (SEMUA DATA) ---
  const allLogs = await Absensi.find({}).sort({ tanggal: 1 }).lean();
  
  let startDate = new Date();
  let endDate = new Date();
  
  if (allLogs.length > 0) {
    startDate = new Date(allLogs[0].tanggal);
    endDate = new Date(allLogs[allLogs.length - 1].tanggal);
  } else {
    startDate.setDate(startDate.getDate() - 6);
  }
  
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const allStudents = await Member.find({}).lean();
  const studentClassMap: Record<string, string> = {}; 
  const distinctClasses: Record<string, boolean> = {};

  allStudents.forEach((s: any) => {
    studentClassMap[s._id.toString()] = s.kelas;
    distinctClasses[s.kelas] = true;
  });
  
  const sortedClasses = Object.keys(distinctClasses).sort();

  const attendanceLogs = allLogs;

  const chartDataByClass: Record<string, any[]> = {};
  const classesWithAttendanceData = new Set<string>();
  
  // Ambil hanya tanggal yang memang ada datanya di LOGS (untuk menghilangkan tanggal kosong)
  const uniqueDatesSet = new Set<string>();
  attendanceLogs.forEach((log: any) => {
    uniqueDatesSet.add(new Date(log.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }));
  });

  // Urutkan tanggal yang unik (asumsi allLogs sudah urut tanggal dari DB)
  // Kalau belum yakin urut, kita bisa biarkan log urutan default dari allLogs yang sudah di-sort di awal
  const dateRange: string[] = [];
  allLogs.forEach((log: any) => {
    const dStr = new Date(log.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    if (!dateRange.includes(dStr)) {
      dateRange.push(dStr);
    }
  });

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
      classesWithAttendanceData.add(cls); // Tandai kelas ini punya data
      const logDateStr = new Date(log.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
      const dataIndex = chartDataByClass[cls].findIndex(d => d.date === logDateStr);
      
      if (dataIndex !== -1 && log.status) {
        if (chartDataByClass[cls][dataIndex][log.status] !== undefined) {
          chartDataByClass[cls][dataIndex][log.status] += 1;
        }
      }
    }
  });

  // Filter kelas yang ditampilkan di absen hanya yang punya data
  const attendanceClassesFiltered = sortedClasses.filter(cls => classesWithAttendanceData.has(cls));

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
      <div className="flex justify-between items-center bg-surface p-6 rounded-xl shadow-sm border border-border-custom">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Admin</h1>
          <p className="text-foreground/60">Ringkasan aktivitas sistem</p>
        </div>
        <p className="text-sm font-medium text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl shadow-sm border-l-4 border-blue-500 border border-border-custom">
          <p className="text-sm text-foreground/40 mb-1 font-bold uppercase tracking-wider">Total Siswa</p>
          <h2 className="text-4xl font-bold text-foreground">{totalSiswa}</h2>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-sm border-l-4 border-orange-500 border border-border-custom">
          <p className="text-sm text-foreground/40 mb-1 font-bold uppercase tracking-wider">Total Tugas</p>
          <h2 className="text-4xl font-bold text-foreground">{totalTugas}</h2>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-sm border-l-4 border-green-500 border border-border-custom">
          <p className="text-sm text-foreground/40 mb-1 font-bold uppercase tracking-wider">Tugas Dikumpulkan</p>
          <h2 className="text-4xl font-bold text-foreground">{totalPengumpulan}</h2>
        </div>
      </div>

      {/* --- GRID BARIS 1: ABSENSI & PENGUMUMAN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <AttendanceChart 
              dataByClass={chartDataByClass} 
              allClasses={attendanceClassesFiltered} 
           />
        </div>

        <div className="lg:col-span-1">
          <div className="h-full">
            <AnnouncementBoard 
              role="admin" 
              initialData={announcements} 
            />
          </div>
        </div>
      </div>

      {/* --- GRID BARIS 2: AKTIVITAS TERBARU & RATA-RATA NILAI (DIPISAH) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabel Aktivitas Terbaru (2/3) */}
        <div className="lg:col-span-2 bg-surface rounded-xl shadow-sm border border-border-custom overflow-hidden h-fit">
          <div className="p-6 border-b border-border-custom flex justify-between items-center bg-foreground/5">
            <h3 className="font-bold text-foreground text-lg">Aktivitas Pengumpulan Terbaru</h3>
            <span className="text-xs font-bold bg-foreground/10 text-foreground/60 px-2 py-1 rounded border border-border-custom">5 Terakhir</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-foreground/40 uppercase bg-foreground/5 border-b border-border-custom font-bold">
                <tr>
                  <th className="px-6 py-3 font-bold">Nama Siswa</th>
                  <th className="px-6 py-3 font-bold">Kelas</th>
                  <th className="px-6 py-3 font-bold">Nilai</th>
                  <th className="px-6 py-3 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-foreground/20">
                      Belum ada data pengumpulan tugas.
                    </td>
                  </tr>
                ) : (
                  recentSubmissions.map((item: any) => (
                    <tr key={item._id} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground text-sm">{item.member_id?.nama_lengkap || 'Siswa Dihapus'}</p>
                        <p className="text-[10px] text-foreground/40 font-medium truncate max-w-[150px]">{item.tugas_id?.judul || 'Tugas Dihapus'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">
                          {item.member_id?.kelas || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.nilai >= 75 ? (
                          <span className="text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            {Number(item.nilai).toFixed(2).replace(/\.00$/, '')}
                          </span>
                        ) : (
                          <span className="text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                            {Number(item.nilai).toFixed(2).replace(/\.00$/, '')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-foreground/40 text-[10px] text-right whitespace-nowrap">
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

        {/* Grafik Nilai (1/3) */}
        <div className="lg:col-span-1">
          <GradesChart data={gradesChartData} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link href="/admin/siswa" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex-1 text-center">
          Kelola Siswa
        </Link>
        <Link href="/admin/tugas" className="bg-foreground text-background px-6 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg flex-1 text-center">
          Kelola Tugas
        </Link>
      </div>
    </div>
  );
}
