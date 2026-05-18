import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Absensi, Member, Guru } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function GuruRekapAbsensiPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ start?: string, end?: string, kelas?: string, mapel?: string }> 
}) {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  
  const guru_id = (session.user as any).guru_id;

  await connectDB();
  const params = await searchParams;

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = now.toISOString().split('T')[0];

  const startDate = params.start || defaultStart;
  const endDate = params.end || defaultEnd;
  const selectedKelas = params.kelas || '';
  const selectedMapel = params.mapel || '';

  // 1. Ambil Info Guru untuk filter kelas & mapel
  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) redirect('/login');

  const availableClasses = (guruInfo as any).pengajaran.reduce((acc: string[], curr: any) => {
    curr.kelas.forEach((c: string) => {
      if (!acc.includes(c)) acc.push(c);
    });
    return acc;
  }, []).sort();

  let rekapData: any[] = [];
  
  if (selectedKelas && selectedMapel) {
    const students = await Member.find({ kelas: selectedKelas }).sort({ nama_lengkap: 1 }).lean();

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);

    const logs = await Absensi.find({
      member_id: { $in: students.map(s => s._id) },
      mapel: selectedMapel,
      tanggal: { $gte: startObj, $lte: endObj }
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

  const downloadUrl = `/api/rekap/download?kelas=${selectedKelas}&mapel=${selectedMapel}&start=${startDate}&end=${endDate}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface p-8 rounded-3xl border border-border-custom shadow-sm">
        <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
             <Link href="/guru/absensi" className="text-foreground/40 hover:text-foreground text-xs font-black uppercase tracking-widest transition">← Input Absensi</Link>
           </div>
           <h1 className="text-3xl font-black text-foreground uppercase tracking-tight leading-none">Rekapitulasi Absensi</h1>
           <p className="text-foreground/40 mt-3 font-medium">Laporan kehadiran siswa per mata pelajaran dalam rentang waktu tertentu.</p>
        </div>
      </div>

      {/* Filter Area */}
      <div className="bg-surface p-8 rounded-3xl shadow-sm border border-border-custom">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          
          <input type="hidden" name="mapel" value={selectedMapel} />

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Kelas</label>
            <select 
              name="kelas" 
              defaultValue={selectedKelas} 
              className="w-full bg-foreground/5 border border-border-custom px-4 py-3 rounded-2xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="">-- Pilih Kelas --</option>
              {availableClasses.map((cls: string) => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Dari Tanggal</label>
            <input type="date" name="start" defaultValue={startDate} className="w-full bg-foreground/5 border border-border-custom px-4 py-3 rounded-2xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary-500 transition-all"/>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Sampai Tanggal</label>
            <input type="date" name="end" defaultValue={endDate} className="w-full bg-foreground/5 border border-border-custom px-4 py-3 rounded-2xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary-500 transition-all"/>
          </div>

          <button type="submit" className="bg-primary-500 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-400 transition-all shadow-lg shadow-primary-500/20 active:scale-95">
            Proses
          </button>
        </form>
      </div>

      {/* Tabel Laporan */}
      {!selectedMapel ? (
          <div className="bg-primary-500/5 p-20 text-center rounded-[2.5rem] border-2 border-dashed border-primary-500/20">
              <p className="text-primary-600 font-black uppercase tracking-widest text-sm">Pilih Mata Pelajaran Terlebih Dahulu di Header!</p>
          </div>
      ) : !selectedKelas ? (
          <div className="bg-foreground/[0.02] p-20 text-center rounded-[2.5rem] border-2 border-dashed border-border-custom">
              <p className="text-foreground/30 font-black uppercase tracking-widest text-sm">Silakan pilih kelas untuk menampilkan laporan.</p>
          </div>
      ) : (
        <div className="bg-surface rounded-3xl shadow-sm border border-border-custom overflow-hidden relative group">
          <div className="p-6 bg-foreground/[0.02] border-b border-border-custom flex justify-between items-center flex-wrap gap-4">
             <h2 className="font-black text-foreground uppercase tracking-widest text-xs flex items-center gap-2">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                 Hasil Rekap: {selectedMapel} - {selectedKelas}
             </h2>
             <a 
                href={downloadUrl} 
                target="_blank"
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                📥 Download Excel
              </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-foreground/[0.01] text-foreground/40 uppercase font-black border-b border-border-custom text-[10px] tracking-widest">
                <tr>
                  <th className="px-8 py-5">NIS</th>
                  <th className="px-8 py-5">Nama Lengkap</th>
                  <th className="px-6 py-5 text-center bg-green-500/5 text-green-500">Hadir</th>
                  <th className="px-6 py-5 text-center bg-yellow-500/5 text-yellow-500">Sakit</th>
                  <th className="px-6 py-5 text-center bg-blue-500/5 text-blue-500">Izin</th>
                  <th className="px-6 py-5 text-center bg-red-500/5 text-red-500">Alpha</th>
                  <th className="px-8 py-5 text-center">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {rekapData.map((data: any) => (
                    <tr key={data._id} className="hover:bg-foreground/[0.01] transition-colors group">
                      <td className="px-8 py-5 font-mono text-foreground/40 text-xs">{data.nis}</td>
                      <td className="px-8 py-5 font-bold text-foreground text-sm">{data.nama_lengkap}</td>
                      <td className="px-6 py-5 text-center font-black text-green-500 bg-green-500/[0.02]">{data.hadir}</td>
                      <td className="px-6 py-5 text-center font-black text-yellow-500 bg-yellow-500/[0.02]">{data.sakit}</td>
                      <td className="px-6 py-5 text-center font-black text-blue-500 bg-blue-500/[0.02]">{data.izin}</td>
                      <td className="px-6 py-5 text-center font-black text-red-500 bg-red-500/[0.02]">{data.alpha}</td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center">
                          <span className={`w-14 text-center py-1.5 rounded-xl text-[10px] font-black border group-hover:scale-110 transition-transform 
                            ${data.persentase >= 80 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                               data.persentase >= 60 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}
                          `}>
                            {data.persentase}%
                          </span>
                        </div>
                      </td>
                    </tr>
                ))}
                {rekapData.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-8 py-20 text-center text-foreground/20 italic font-medium">Data absensi tidak ditemukan untuk periode ini.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
