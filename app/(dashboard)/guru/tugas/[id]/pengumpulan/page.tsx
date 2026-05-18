import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Tugas, Member, Nilai } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TaskSubmissionList from '@/components/guru/TaskSubmissionList';

export default async function TaskSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (session?.user?.role !== 'guru') redirect('/login');
    
    const { id } = await params;
    await connectDB();

    const task = await Tugas.findById(id).lean();
    if (!task) redirect('/guru/tugas');

    const assignedClasses = Array.isArray(task.kelas) ? task.kelas : [task.kelas];
    const students = await Member.find({ kelas: { $in: assignedClasses } }).sort({ nama_lengkap: 1 }).lean();

    const submissionRecords = await Nilai.find({ tugas_id: id }).lean();
    const submissionMap = new Map(submissionRecords.map(s => [s.member_id.toString(), s]));

    const submissions = students.map((s: any) => {
        const sub = submissionMap.get(s._id.toString());
        return {
            member_id: s._id.toString(),
            nama_lengkap: s.nama_lengkap,
            nis: s.nis,
            kelas: s.kelas,
            submitted_at: sub?.tanggal_mengumpulkan?.toISOString(),
            file_url: (sub as any)?.file_url,
            catatan: (sub as any)?.catatan_siswa,
            nilai: sub?.nilai,
            tanggal_dinilai: sub?.tanggal_dinilai?.toISOString()
        };
    });

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                       <Link href="/guru/tugas" className="p-2 bg-foreground/5 text-foreground/40 rounded-xl hover:bg-foreground/10 transition-colors">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                       </Link>
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500">{task.mapel}</span>
                   </div>
                   <h1 className="text-4xl font-black text-foreground uppercase tracking-tight">{task.judul}</h1>
                   <p className="text-foreground/40 mt-1 font-medium italic">Daftar pengumpulan tugas siswa kelas {assignedClasses.join(', ')}</p>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-surface px-6 py-4 rounded-[1.5rem] border border-border-custom shadow-sm text-center">
                        <div className="text-2xl font-black text-foreground">{submissionRecords.length} / {students.length}</div>
                        <div className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-1">Siswa Mengumpulkan</div>
                    </div>
                </div>
            </div>

            <TaskSubmissionList taskId={id} submissions={submissions} />
        </div>
    );
}
