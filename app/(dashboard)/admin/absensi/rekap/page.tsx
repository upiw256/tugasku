import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Absensi, Member } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function RekapAbsensiRangePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ start?: string, end?: string, kelas?: string }> 
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();
  const params = await searchParams;

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = now.toISOString().split('T')[0];

  const startDate = params.start || defaultStart;
  const endDate = params.end || defaultEnd;
  const selectedKelas = params.kelas || '';

  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  let rekapData: any[] = [];
  
  if (selectedKelas) {
    const students = await Member.find({ kelas: selectedKelas }).sort({ nama_lengkap: 1 }).lean();

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);

    const logs = await Absensi.find({
      member_id: { $in: students.map(s => s._id) },
      waktu: { $gte: startObj, $lte: endObj }
    }).lean();

    rekapData = students.map((student: any) => {
      const studentLogs = logs.filter((l: any) => l.member_id.toString() === student._id.toString());
      
      const hadir = studentLogs.filter((l: any) => l.status === 'Hadir').length;
      const sakit = studentLogs.filter((l: any) => l.status === 'Sakit').length;
      const izin = studentLogs.filter((l: any) => l.status === 'Izin').length;
      const alpha = studentLogs.filter((l: any) => l.status === 'Alpha').length;
      
      const total = hadir + sakit + izin + alpha;
      const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

      return { ...student, hadir, sakit, izin, alpha, total, persentase };
    });
  }

  // URL untuk Download Excel
  const downloadUrl = `/api/rekap/download?kelas=${selectedKelas}&start=${startDate}&end=${endDate}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/absensi" className="text-gray-500 hover:text-gray-800 transition">← Input Harian</Link>
            <span className="text-gray-300">/</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Rekap Absensi</h1>
        </div>
      </div>

      {/* Filter Area */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <form className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
          
          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-gray-600 mb-1">Kelas</label>
            <select name="kelas" defaultValue={selectedKelas} className="w-full md:w-40 border p-2 rounded text-sm bg-white">
              <option value="">-- Pilih --</option>
              {sortedClasses.map((cls: string) => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-gray-600 mb-1">Dari</label>
            <input type="date" name="start" defaultValue={startDate} className="w-full border p-2 rounded text-sm"/>
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-gray-600 mb-1">Sampai</label>
            <input type="date" name="end" defaultValue={endDate} className="w-full border p-2 rounded text-sm"/>
          </div>

          <button type="submit" className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-blue-700 h-[38px]">
            Tampilkan
          </button>

          {/* TOMBOL DOWNLOAD EXCEL (Hanya Muncul Jika Kelas Dipilih) */}
          {selectedKelas && (
            <a 
              href={downloadUrl} 
              target="_blank"
              className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-green-700 h-[38px] flex items-center justify-center gap-2"
            >
              <span>📥</span> Download Excel
            </a>
          )}

        </form>
      </div>

      {/* Tabel Laporan (Tetap sama seperti sebelumnya) */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        {!selectedKelas ? (
           <div className="p-10 text-center text-gray-500">Pilih Kelas untuk melihat laporan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b">
                <tr>
                  <th className="px-6 py-3">NIS</th>
                  <th className="px-6 py-3">Nama Siswa</th>
                  <th className="px-6 py-3 text-center bg-green-50 text-green-700">H</th>
                  <th className="px-6 py-3 text-center bg-yellow-50 text-yellow-700">S</th>
                  <th className="px-6 py-3 text-center bg-blue-50 text-blue-700">I</th>
                  <th className="px-6 py-3 text-center bg-red-50 text-red-700">A</th>
                  <th className="px-6 py-3 text-center">% Hadir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rekapData.map((data: any) => (
                    <tr key={data._id} className="hover:bg-gray-50 border-b">
                      <td className="px-6 py-4 font-mono text-gray-600">{data.nis}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{data.nama_lengkap}</td>
                      <td className="px-6 py-4 text-center font-bold text-green-600 bg-green-50/30">{data.hadir}</td>
                      <td className="px-6 py-4 text-center font-bold text-yellow-600 bg-yellow-50/30">{data.sakit}</td>
                      <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/30">{data.izin}</td>
                      <td className="px-6 py-4 text-center font-bold text-red-600 bg-red-50/30">{data.alpha}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold border 
                          ${data.persentase >= 75 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}
                        `}>
                          {data.persentase}%
                        </span>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}