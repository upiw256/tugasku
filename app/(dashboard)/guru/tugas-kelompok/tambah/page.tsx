import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CreateGroupForm from '@/components/ui/CreateGroupForm';

export default async function GuruTambahTugasKelompokPage() {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  
  const guru_id = (session.user as any).guru_id;

  await connectDB();

  // Ambil Info Guru untuk filter kelas
  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) redirect('/login');

  const availableClasses = (guruInfo as any).pengajaran.reduce((acc: string[], curr: any) => {
    curr.kelas.forEach((c: string) => {
      if (!acc.includes(c)) acc.push(c);
    });
    return acc;
  }, []).sort();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/guru/tugas-kelompok" className="text-foreground/40 hover:text-foreground transition bg-surface p-2.5 rounded-xl border border-border-custom shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
            Generate Kelompok Otomatis
          </h1>
          <p className="text-foreground/40 text-xs font-medium uppercase tracking-widest mt-1">Pembagian anggota kelompok secara acak per kelas.</p>
        </div>
      </div>

      <div className="bg-surface p-8 rounded-3xl shadow-xl shadow-primary-500/5 border border-border-custom relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div className="relative z-10">
          <CreateGroupForm availableClasses={availableClasses} />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
      </div>
    </div>
  );
}
