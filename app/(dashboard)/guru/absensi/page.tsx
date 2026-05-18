import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru, Member, Absensi } from '@/models';
import { redirect } from 'next/navigation';
import AdminAttendanceRow from '@/components/ui/AdminAttendanceRow';

export default async function GuruAbsensiPage({
    searchParams
}: {
    searchParams: Promise<{ mapel?: string, kelas?: string, date?: string }>
}) {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  
  const guru_id = (session.user as any).guru_id;
  const params = await searchParams;
  const selectedMapel = params.mapel || '';
  const selectedKelas = params.kelas || '';
  const dateStr = params.date || new Date().toISOString().split('T')[0];

  await connectDB();
  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) redirect('/login');

  // Ambil list kelas untuk mapel terpilih
  let listKelas: string[] = [];
  if (selectedMapel) {
      const p = (guruInfo as any).pengajaran.find((item: any) => item.mapel === selectedMapel);
      if (p) listKelas = p.kelas;
  }

  // Fetch data siswa jika kelas & mapel dipilih
  let students: any[] = [];
  let attendanceMap = new Map();

  if (selectedKelas && selectedMapel) {
      students = await Member.find({ kelas: selectedKelas }).sort({ nama_lengkap: 1 }).lean();

      const startDate = new Date(dateStr);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateStr);
      endDate.setHours(23, 59, 59, 999);

      const logs = await Absensi.find({
          mapel: selectedMapel,
          tanggal: { $gte: startDate, $lte: endDate }
      }).lean();

      logs.forEach((log: any) => {
          attendanceMap.set(log.member_id.toString(), log.status);
      });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-6 rounded-2xl shadow-sm border border-border-custom">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Absensi Siswa</h1>
          <p className="text-foreground/60 text-sm">Pencatatan kehadiran per mata pelajaran.</p>
        </div>
        
        <form className="flex gap-2">
            <input type="hidden" name="mapel" value={selectedMapel} />
            <input type="hidden" name="kelas" value={selectedKelas} />
            <input 
                type="date" 
                name="date" 
                defaultValue={dateStr}
                className="bg-foreground/5 border border-border-custom text-foreground px-3 py-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button type="submit" className="bg-primary-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-400 transition shadow-lg shadow-primary-500/20">Set Tanggal</button>
        </form>
      </div>

      {!selectedMapel ? (
          <div className="p-20 text-center bg-primary-500/5 rounded-2xl border border-dashed border-primary-500/20">
              <p className="text-primary-600 font-black uppercase tracking-widest text-sm">Pilih Mata Pelajaran Terlebih Dahulu</p>
          </div>
      ) : (
        <div className="space-y-6">
            {/* Filter Kelas */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {listKelas.map((k: string) => (
                    <a 
                      key={k}
                      href={`/guru/absensi?mapel=${selectedMapel}&kelas=${k}&date=${dateStr}`}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${selectedKelas === k ? 'bg-primary-500 text-white border-primary-500 shadow-md' : 'bg-surface text-foreground/40 border-border-custom hover:bg-foreground/5'}`}
                    >
                        Kelas {k}
                    </a>
                ))}
            </div>

            {selectedKelas ? (
                <div className="bg-surface rounded-2xl shadow-sm border border-border-custom overflow-hidden">
                    <div className="p-4 bg-foreground/[0.02] border-b border-border-custom flex justify-between items-center">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Daftar Siswa - Kelas {selectedKelas}
                        </h3>
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">{new Date(dateStr).toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-foreground/[0.01] text-[10px] font-black uppercase text-foreground/40 border-b border-border-custom">
                                <tr>
                                    <th className="px-6 py-4">NIS</th>
                                    <th className="px-6 py-4">Nama Siswa</th>
                                    <th className="px-6 py-4 text-center">Aksi Absen</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-custom">
                                {students.map((s: any) => (
                                    <AdminAttendanceRow 
                                        key={s._id.toString()}
                                        student={{...s, _id: s._id.toString()}}
                                        date={dateStr}
                                        initialStatus={attendanceMap.get(s._id.toString())}
                                        mapel={selectedMapel}
                                        guruId={guru_id}
                                    />
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-foreground/20 italic">Tidak ada siswa di kelas ini.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="p-20 text-center bg-foreground/[0.02] rounded-2xl border border-dashed border-border-custom text-foreground/40 italic">
                    Pilih kelas untuk memunculkan daftar siswa.
                </div>
            )}
        </div>
      )}
    </div>
  );
}
