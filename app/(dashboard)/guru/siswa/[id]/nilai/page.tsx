import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Tugas, Nilai } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { submitGradeAction } from '@/actions/grade-actions';
import GradeHistoryRow from '@/components/ui/GradeHistoryRow';

export default async function GuruInputNilaiSiswaPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  const guru_id = (session.user as any).guru_id;

  await connectDB();
  const { id } = await params; 

  // 1. Ambil Data Siswa
  const student = await Member.findById(id).lean();
  if (!student) return <div>Siswa tidak ditemukan</div>;

  // 2. Ambil Nilai yang sudah diberikan oleh Guru ini
  // Kita perlu memfilter Nilai berdasarkan Tugas yang dimiliki oleh Guru ini
  const myTasks = await Tugas.find({ guru_id }).select('_id judul mapel').lean();
  const myTaskIds = myTasks.map(t => t._id);

  const existingGrades = await Nilai.find({ 
    member_id: id,
    tugas_id: { $in: myTaskIds }
  })
    .populate('tugas_id', 'judul mapel')
    .sort({ tanggal_dinilai: -1 })
    .lean();

  const gradedTaskIds = existingGrades.map((g: any) => g.tugas_id?._id?.toString());

  // 3. Ambil Tugas yang belum dinilai (yang sesuai kelas siswa dan milik Guru ini)
  const tasksToGrade = myTasks.filter(t => 
    !gradedTaskIds.includes(t._id.toString())
  );

  return (
    <div className="max-w-full px-4 lg:px-8 mx-auto space-y-8 pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Input Nilai Siswa</h1>
          <p className="text-foreground/40 text-xs font-medium uppercase tracking-widest mt-1">
            Siswa: <span className="text-primary-500">{student.nama_lengkap}</span> &bull; 
            Kelas: <span className="text-foreground">{student.kelas}</span>
          </p>
        </div>
        <Link href="/guru/siswa" className="px-5 py-2.5 bg-foreground/5 text-foreground/40 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-foreground/10 transition-all">
          ← Kembali ke Daftar Siswa
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: FORM INPUT BARU */}
        <div className="bg-surface p-8 rounded-3xl shadow-sm border border-border-custom h-fit">
          <h2 className="font-black text-xl text-foreground uppercase tracking-tight mb-6">Input Nilai Baru</h2>
          
          {tasksToGrade.length === 0 ? (
            <div className="text-center py-12 bg-foreground/[0.02] rounded-3xl border border-dashed border-border-custom">
              <div className="text-4xl mb-4 text-emerald-500">✨</div>
              <p className="text-sm font-black text-foreground/40 uppercase tracking-widest">Semua tugas Anda untuk siswa ini sudah dinilai!</p>
            </div>
          ) : (
            <form action={async (formData) => {
                'use server'
                await submitGradeAction(formData);
              }} className="space-y-6">
              
              <input type="hidden" name="member_id" value={id} />

              <div>
                <label className="block text-[10px] font-black uppercase text-foreground/40 tracking-widest mb-2">Pilih Tugas</label>
                <select 
                  name="tugas_id" 
                  required 
                  className="w-full px-4 py-3.5 bg-foreground/5 border border-border-custom rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-foreground font-bold"
                >
                  <option value="">-- Pilih Judul Tugas --</option>
                  {tasksToGrade.map((t: any) => (
                    <option key={t._id} value={t._id.toString()}>
                      {t.judul} ({t.mapel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-foreground/40 tracking-widest mb-2">Nilai (0-100)</label>
                <input 
                  name="nilai" 
                  type="number" 
                  min="0" max="100" 
                  required 
                  placeholder="Masukkan nilai..."
                  className="w-full px-4 py-3.5 bg-foreground/5 border border-border-custom text-foreground rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-lg"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-primary-700 transition shadow-xl shadow-primary-500/20 active:scale-95"
              >
                Simpan Nilai
              </button>
            </form>
          )}
        </div>

        {/* KOLOM KANAN: RIWAYAT & EDIT */}
        <div className="bg-surface rounded-3xl shadow-sm border border-border-custom overflow-hidden h-fit">
          <div className="p-6 border-b border-border-custom bg-foreground/[0.01] flex justify-between items-center">
            <h2 className="font-black text-foreground uppercase tracking-tight">Riwayat Nilai Mapel Anda</h2>
            <span className="text-[10px] font-black bg-foreground/10 text-foreground/60 px-3 py-1 rounded-full uppercase tracking-tighter">{existingGrades.length} Tugas</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-foreground/[0.03] text-foreground/40 border-b border-border-custom uppercase text-[10px] font-black tracking-widest">
                <tr>
                    <th className="px-6 py-4 w-4/5">Judul Tugas</th>
                    <th className="px-6 py-4 text-center">Nilai</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                {existingGrades.length === 0 ? (
                    <tr>
                    <td colSpan={2} className="p-12 text-center text-foreground/20 italic font-bold">
                        Belum ada tugas yang dinilai oleh Anda.
                    </td>
                    </tr>
                ) : (
                    existingGrades.map((g: any) => (
                    <GradeHistoryRow 
                        key={g._id.toString()} 
                        grade={JSON.parse(JSON.stringify(g))} 
                        memberId={id} 
                    />
                    ))
                )}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
