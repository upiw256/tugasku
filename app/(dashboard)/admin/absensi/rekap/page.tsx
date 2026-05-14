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

  const downloadUrl = `/api/rekap/download?kelas=${selectedKelas}&start=${startDate}&end=${endDate}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm font-medium">
            <Link href="/admin/absensi" className="text-foreground/40 hover:text-foreground transition">← Input Harian</Link>
            <span className="text-foreground/20">/</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Laporan Rekap Absensi</h1>
        </div>
      </div>

      {/* Filter Area */}
      <div className="bg-surface p-4 rounded-xl shadow-sm border border-border-custom">
        <form className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
          
          <div className="w-full md:w-auto">
            <label className="block text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">Kelas</label>
            <select 
              name="kelas" 
              defaultValue={selectedKelas} 
              className="w-full md:w-40 border border-border-custom p-2 rounded-lg text-sm bg-surface text-foreground outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih --</option>
              {sortedClasses.map((cls: string) => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">Dari</label>
            <input type="date" name="start" defaultValue={startDate} className="w-full border border-border-custom bg-surface text-foreground p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-[10px] font-bold text-foreground/40 mb-1 uppercase tracking-wider">Sampai</label>
            <input type="date" name="end" defaultValue={endDate} className="w-full border border-border-custom bg-surface text-foreground p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          <button type="submit" className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 h-[38px] transition-colors shadow">
            Tampilkan
          </button>

          {selectedKelas && (
            <a 
              href={downloadUrl} 
              target="_blank"
              className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-green-700 h-[38px] flex items-center justify-center gap-2 transition-colors shadow"
            >
              <span>📥</span> Download Excel
            </a>
          )}

        </form>
      </div>

      {/* Tabel Laporan */}
      <div className="bg-surface rounded-xl shadow border border-border-custom overflow-hidden overflow-x-auto">
        {!selectedKelas ? (
           <div className="p-16 text-center text-foreground/20 italic">Pilih Kelas untuk melihat laporan.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-foreground/5 text-foreground/40 uppercase font-bold border-b border-border-custom text-[10px]">
              <tr>
                <th className="px-6 py-3 border-r border-border-custom">NIS</th>
                <th className="px-6 py-3 border-r border-border-custom">Nama Siswa</th>
                <th className="px-6 py-3 text-center border-r border-border-custom bg-green-500/10 text-green-500">H</th>
                <th className="px-6 py-3 text-center border-r border-border-custom bg-yellow-500/10 text-yellow-500">S</th>
                <th className="px-6 py-3 text-center border-r border-border-custom bg-blue-500/10 text-blue-500">I</th>
                <th className="px-6 py-3 text-center border-r border-border-custom bg-red-500/10 text-red-500">A</th>
                <th className="px-6 py-3 text-center">Total % Hadir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {rekapData.map((data: any) => (
                  <tr key={data._id} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-foreground/40 border-r border-border-custom">{data.nis}</td>
                    <td className="px-6 py-4 font-bold text-foreground border-r border-border-custom">{data.nama_lengkap}</td>
                    <td className="px-6 py-4 text-center font-bold text-green-500 bg-green-500/5 border-r border-border-custom">{data.hadir}</td>
                    <td className="px-6 py-4 text-center font-bold text-yellow-500 bg-yellow-500/5 border-r border-border-custom">{data.sakit}</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-500 bg-blue-500/5 border-r border-border-custom">{data.izin}</td>
                    <td className="px-6 py-4 text-center font-bold text-red-500 bg-red-500/5 border-r border-border-custom">{data.alpha}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-black border 
                        ${data.persentase >= 75 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}
                      `}>
                        {data.persentase}%
                      </span>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}