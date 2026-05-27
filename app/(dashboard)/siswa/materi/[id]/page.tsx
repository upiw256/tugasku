import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Materi, Member, User } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DiskusiMateriSiswa from '@/components/materi/DiskusiMateriSiswa';

export default async function DetilMateriSiswa(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  
  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  await connectDB();
  
  const user = await User.findOne({ user: session.user.email });
  if (!user || !user.member_id) {
    return <div className="p-10 text-center">Data siswa tidak ditemukan. Hubungi Admin.</div>;
  }
  
  const student = await Member.findById(user.member_id).lean();
  if (!student) {
    return <div className="p-10 text-center">Data siswa tidak ditemukan.</div>;
  }

  const materi = await Materi.findById(params.id).lean();
  if (!materi) {
    return (
      <div className="p-10 text-center">
        Materi tidak ditemukan. <Link href="/siswa/materi" className="text-primary-500 hover:underline">Kembali</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/siswa/materi" className="inline-block text-primary-500 font-bold hover:underline mb-4">
        &larr; Kembali ke Daftar Materi
      </Link>
      
      <div className="bg-surface p-8 rounded-xl shadow-sm border border-border-custom">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
              MATERI {student.kelas}
            </span>
            <h1 className="text-2xl font-bold text-foreground mt-4">{materi.judul}</h1>
            <p className="text-sm text-foreground/40 mt-1">
              Diunggah oleh <span className="font-bold">{materi.diunggah_oleh}</span> pada {new Date(materi.tanggal_upload).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-foreground/5 rounded-lg text-foreground/80">
          <p>{materi.deskripsi || 'Tidak ada deskripsi materi.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <DiskusiMateriSiswa 
          materiId={materi._id.toString()} 
          fileUrl={materi.file_url} 
          kelas={student.kelas} 
        />
      </div>
    </div>
  );
}
