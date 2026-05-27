import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Materi, Member, User } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DiskusiMateriAdmin from '@/components/materi/DiskusiMateriAdmin';
import LogUnduhanMateri from '@/components/materi/LogUnduhanMateri';

export default async function DetilMateriAdminPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
    redirect('/login');
  }

  await connectDB();
  
  // Karena `downloads` di sini adalah array of userId, kita perlu lookup
  const materi = await Materi.findById(params.id).populate('downloads', 'user member_id').lean();
  
  if (!materi) {
    return (
      <div className="p-10 text-center">
        Materi tidak ditemukan. <Link href="/admin/materi" className="text-primary-500 hover:underline">Kembali</Link>
      </div>
    );
  }

  // Populate data siswa dari member_id yang berelasi dengan user
  let downloadedStudents: any[] = [];
  if (materi.downloads && materi.downloads.length > 0) {
    const memberIds = materi.downloads.map((u: any) => u.member_id).filter(Boolean);
    const members = await Member.find({ _id: { $in: memberIds } }).lean();
    
    // Map back to our structure
    downloadedStudents = members.map((m: any) => ({
      id: m._id.toString(),
      nama: m.nama_lengkap,
      kelas: m.kelas,
    }));
  }

  const availableClasses = Array.isArray(materi.kelas) ? materi.kelas : [materi.kelas];
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/materi" className="text-foreground/40 hover:text-primary-500 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detail Materi: {materi.judul}</h1>
          <p className="text-sm text-foreground/50">Kelola diskusi dan pantau tingkat unduhan materi.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Detil dan List Download */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom">
            <h3 className="font-bold text-foreground border-b border-border-custom pb-3 mb-4">Informasi File</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-foreground/40">Dibuat Oleh</p>
                <p className="font-bold text-foreground">{materi.diunggah_oleh}</p>
              </div>
              <div>
                <p className="text-foreground/40">Ditugaskan ke Kelas</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {availableClasses.map((c: string) => (
                    <span key={c} className="bg-primary-500/10 text-primary-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-foreground/40">Deskripsi</p>
                <p className="text-foreground">{materi.deskripsi || '-'}</p>
              </div>
              <div className="pt-3 border-t border-border-custom">
                <a 
                  href={materi.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-foreground/5 text-foreground font-bold px-4 py-2 rounded-lg hover:bg-foreground/10 transition flex items-center justify-center gap-2"
                >
                  Buka File
                </a>
              </div>
            </div>
          </div>

          <LogUnduhanMateri materiId={materi._id.toString()} initialData={downloadedStudents} />
        </div>

        {/* Kolom Kanan: Area Diskusi */}
        <div className="lg:col-span-2">
          <DiskusiMateriAdmin 
            materiId={materi._id.toString()} 
            availableClasses={availableClasses} 
          />
        </div>

      </div>
    </div>
  );
}
