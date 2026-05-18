import { connectDB } from '@/lib/db';
import { Member, Tugas, Nilai } from '@/models';
import md5 from 'md5';

export default async function NilaiRekapTable({ mapel, kelas, guru_id }: { mapel: string, kelas: string, guru_id: string }) {
  await connectDB();

  // 1. Ambil semua tugas untuk mapel ini
  const tasks = await Tugas.find({ mapel, guru_id }).sort({ deadline: 1 }).lean();

  // 2. Ambil semua siswa di kelas ini
  // Kita urutkan berdasarkan nama
  const students = await Member.find({ kelas }).sort({ nama_lengkap: 1 }).lean();

  // 3. Ambil semua nilai untuk tugas-tugas tersebut
  const taskIds = tasks.map(t => t._id);
  const grades = await Nilai.find({ 
    tugas_id: { $in: taskIds },
    member_id: { $in: students.map(s => s._id) }
  }).lean();

  // Mapping nilai ke map: memberId_tugasId -> nilai
  const gradeMap: Record<string, number> = {};
  grades.forEach(g => {
    gradeMap[`${g.member_id}_${g.tugas_id}`] = g.nilai || 0;
  });

  return (
    <div className="bg-surface rounded-2xl border border-border-custom overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-foreground/[0.02]">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-foreground/40 border-b border-border-custom sticky left-0 bg-surface z-10">Nama Siswa</th>
              {tasks.map((t: any) => (
                <th key={t._id.toString()} className="px-4 py-4 text-[10px] font-black uppercase text-foreground/40 border-b border-border-custom min-w-[120px] text-center">
                  <div className="truncate w-24 mx-auto" title={t.judul}>{t.judul}</div>
                </th>
              ))}
              <th className="px-6 py-4 text-[10px] font-black uppercase text-primary-500 border-b border-border-custom text-center bg-primary-500/5">Rata-rata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-custom">
            {students.map((s: any) => {
              let totalScore = 0;
              let gradedTasks = 0;
              
              return (
                <tr key={s._id.toString()} className="hover:bg-foreground/[0.01] transition-colors">
                  <td className="px-6 py-4 border-b border-border-custom sticky left-0 bg-surface z-10">
                    <div className="text-sm font-bold text-foreground truncate max-w-[180px]">{s.nama_lengkap}</div>
                    <div className="text-[10px] text-foreground/40">{s.nis}</div>
                  </td>
                  {tasks.map((t: any) => {
                    const grade = gradeMap[`${s._id}_${t._id}`];
                    if (grade !== undefined) {
                        totalScore += grade;
                        gradedTasks++;
                    }
                    return (
                        <td key={t._id.toString()} className="px-4 py-4 border-b border-border-custom text-center">
                            <span className={`text-xs font-black ${grade >= 75 ? 'text-emerald-500' : grade > 0 ? 'text-amber-500' : 'text-foreground/20'}`}>
                                {grade !== undefined ? grade : '-'}
                            </span>
                        </td>
                    );
                  })}
                  <td className="px-6 py-4 border-b border-border-custom text-center bg-primary-500/5">
                    <span className="text-sm font-black text-primary-600">
                        {gradedTasks > 0 ? (totalScore / tasks.length).toFixed(1) : '0'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {students.length === 0 && (
          <div className="p-20 text-center text-foreground/40 italic">
              Tidak ada siswa ditemukan di kelas ini.
          </div>
      )}

      {tasks.length === 0 && students.length > 0 && (
          <div className="p-20 text-center text-foreground/40 italic">
              Belum ada tugas yang dibuat untuk mapel ini.
          </div>
      )}
    </div>
  );
}
