import { auth } from '@/lib/auth';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Absensi, Member } from '@/models';
import { redirect } from 'next/navigation';
import AdminAttendanceRow from '@/components/ui/AdminAttendanceRow'; 

export default async function RekapAbsensiPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ date?: string, kelas?: string }> 
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();
  const params = await searchParams;

  // 1. Setup Filter
  const dateStr = params.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const selectedKelas = params.kelas || '';

  // 2. Ambil List Kelas untuk Dropdown
  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  // 3. Logic Fetch Data
  let students: any[] = [];
  let attendanceMap = new Map(); // Untuk mapping ID Siswa -> Status Absen

  if (selectedKelas) {
    // A. Ambil SEMUA siswa di kelas tersebut
    students = await Member.find({ kelas: selectedKelas }).sort({ nama_lengkap: 1 }).lean();

    // B. Ambil Absensi pada tanggal tersebut
    const startDate = new Date(dateStr);
    const endDate = new Date(dateStr);
    endDate.setDate(endDate.getDate() + 1); // +1 Hari untuk range query

    const logs = await Absensi.find({
      waktu: { $gte: startDate, $lt: endDate },
    }).lean();

    // C. Masukkan logs ke Map biar gampang dicari
    logs.forEach((log: any) => {
      attendanceMap.set(log.member_id.toString(), log.status);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Absensi</h1>
          <p className="text-foreground/60">Isi dan pantau kehadiran siswa</p>
          <div className="flex items-center gap-2 mt-2">
            <Link href="/admin/absensi/rekap" className="text-blue-500 font-bold text-sm hover:underline flex items-center gap-1">
              📊 Lihat Laporan Rekap
            </Link>
          </div>
        </div>
        
        {/* Filter Area */}
        <form className="flex flex-col md:flex-row gap-3 bg-surface p-3 rounded-xl border border-border-custom shadow-sm">
          
          {/* Pilih Tanggal */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">Tanggal</label>
            <input 
              type="date" 
              name="date" 
              defaultValue={dateStr}
              className="border border-border-custom bg-surface text-foreground p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Pilih Kelas */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">Kelas</label>
            <select 
              name="kelas" 
              defaultValue={selectedKelas}
              className="border border-border-custom p-2 rounded-lg text-sm bg-surface text-foreground outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="">-- Pilih Kelas --</option>
              {sortedClasses.map((cls: string) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold h-[38px] self-end hover:bg-blue-700 transition">
            Tampilkan
          </button>
        </form>
      </div>

      {/* Konten Tabel */}
      <div className="bg-surface rounded-xl shadow border border-border-custom overflow-hidden">
        
        {!selectedKelas ? (
           <div className="p-16 text-center text-foreground/40">
             <p className="text-lg font-bold text-foreground/60">👈 Silakan pilih Kelas terlebih dahulu.</p>
             <p className="text-sm mt-1">Data siswa akan muncul setelah kelas dipilih.</p>
           </div>
        ) : students.length === 0 ? (
           <div className="p-16 text-center text-foreground/40">
             Tidak ada siswa di kelas <b className="text-foreground">{selectedKelas}</b>.
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-foreground/5 text-foreground/60 uppercase font-bold border-b border-border-custom text-[10px]">
                <tr>
                  <th className="px-6 py-3 w-1/6">NIS</th>
                  <th className="px-6 py-3 w-1/3">Nama Siswa</th>
                  <th className="px-6 py-3 text-center">Set Kehadiran</th>
                  <th className="px-6 py-3">Status Saat Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                  {students.map((student: any) => {
                      const serializedStudent = {
                      ...student,
                      _id: student._id.toString(),
                      };

                      const currentStatus = attendanceMap.get(student._id.toString()) || null;

                      return (
                      <AdminAttendanceRow 
                          key={serializedStudent._id}
                          student={serializedStudent}
                          date={dateStr}
                          initialStatus={currentStatus}
                      />
                      );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Legend / Keterangan */}
      {selectedKelas && (
        <div className="flex flex-wrap gap-4 text-[10px] text-foreground/40 mt-4 font-bold uppercase tracking-widest px-2">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-600 rounded-sm"></span> H = Hadir</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-yellow-500 rounded-sm"></span> S = Sakit</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> I = Izin</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-600 rounded-sm"></span> A = Alpha</span>
        </div>
      )}
    </div>
  );
}