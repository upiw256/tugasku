import { auth } from '@/lib/auth';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Absensi, Member } from '@/models';
import { redirect } from 'next/navigation';
import AdminAttendanceRow from '@/components/ui/AdminAttendanceRow'; // Import komponen baru

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
      // Kita perlu filter absensi member yang relevan saja, tapi query all date is okay for simplicity
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
          <h1 className="text-2xl font-bold text-gray-800">Kelola Absensi</h1>
          <p className="text-gray-500">Isi dan pantau kehadiran siswa</p>
          <span className="text-gray-300">|</span>
            <Link href="/admin/absensi/rekap" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
        📊      Lihat Laporan Rekap
            </Link>
        </div>
        
        {/* Filter Area */}
        <form className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          
          {/* Pilih Tanggal */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-600 mb-1">Tanggal</label>
            <input 
              type="date" 
              name="date" 
              defaultValue={dateStr}
              className="border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Pilih Kelas */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-600 mb-1">Kelas</label>
            <select 
              name="kelas" 
              defaultValue={selectedKelas}
              className="border p-2 rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="">-- Pilih Kelas --</option>
              {sortedClasses.map((cls: string) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold h-[38px] self-end hover:bg-blue-700">
            Tampilkan
          </button>
        </form>
      </div>

      {/* Konten Tabel */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        
        {!selectedKelas ? (
           <div className="p-10 text-center text-gray-500">
             <p className="text-lg font-medium">👈 Silakan pilih Kelas terlebih dahulu.</p>
             <p className="text-sm">Data siswa akan muncul setelah kelas dipilih.</p>
           </div>
        ) : students.length === 0 ? (
           <div className="p-10 text-center text-gray-500">
             Tidak ada siswa di kelas <b>{selectedKelas}</b>.
           </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b">
              <tr>
                <th className="px-6 py-3 w-1/6">NIS</th>
                <th className="px-6 py-3 w-1/3">Nama Siswa</th>
                <th className="px-6 py-3 text-center">Set Kehadiran</th>
                <th className="px-6 py-3">Status Saat Ini</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {students.map((student: any) => {
                    // 1. KONVERSI DATA AGAR "PLAIN OBJECT"
                    // Kita buat object baru dan paksa _id jadi string
                    const serializedStudent = {
                    ...student,
                    _id: student._id.toString(), // PENTING: Ubah ObjectId ke String
                    };

                    // Cek status siswa ini di map absensi
                    const currentStatus = attendanceMap.get(student._id.toString()) || null;

                    return (
                    <AdminAttendanceRow 
                        key={serializedStudent._id} // Gunakan ID string
                        student={serializedStudent} // Kirim object yang sudah bersih
                        date={dateStr}
                        initialStatus={currentStatus}
                    />
                    );
                })}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Legend / Keterangan */}
      {selectedKelas && (
        <div className="flex gap-4 text-xs text-gray-500 mt-2">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-600 rounded-sm"></span> H = Hadir</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded-sm"></span> S = Sakit</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> I = Izin</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-600 rounded-sm"></span> A = Alpha</span>
        </div>
      )}
    </div>
  );
}