import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Materi, Member } from '@/models';
import { redirect } from 'next/navigation';

export default async function SiswaMateriPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  await connectDB();
  
  // Ambil data siswa untuk tahu kelasnya
  const student = await Member.findOne({ nis: session.user.email }).lean();
  if (!student) {
    return <div className="p-10 text-center">Data siswa tidak ditemukan.</div>;
  }

  // Ambil materi yang sesuai dengan kelas siswa
  const materi = await Materi.find({ 
    $or: [
      { kelas: student.kelas },
      { kelas: { $in: [student.kelas] } }
    ]
  }).sort({ tanggal_upload: -1 }).lean();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-lg">
        <h1 className="text-3xl font-bold">Materi Belajar</h1>
        <p className="opacity-90 mt-2 text-blue-100">Ayo perluas wawasanmu dengan membaca materi dari Bapak/Ibu Guru!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {materi.length === 0 ? (
          <div className="md:col-span-2 bg-surface p-12 rounded-xl text-center border border-dashed border-border-custom">
            <span className="text-5xl border border-border-custom p-4 rounded-full inline-block mb-4">📚</span>
            <p className="text-foreground/40 font-medium">Belum ada materi untuk kelas {student.kelas}.</p>
          </div>
        ) : (
          materi.map((m: any) => (
            <div key={m._id.toString()} className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom flex flex-col hover:shadow-md transition group">
              <div className="flex-1">
                <span className="text-[10px] font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{student.kelas}</span>
                <h3 className="text-lg font-bold text-foreground mt-2 line-clamp-1">{m.judul}</h3>
                <p className="text-sm text-foreground/40 mt-2 line-clamp-2">{m.deskripsi || 'Tidak ada deskripsi.'}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border-custom flex justify-between items-center">
                <span className="text-xs text-foreground/30">📅 {new Date(m.tanggal_upload).toLocaleDateString('id-ID')}</span>
                <a 
                  href={m.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-primary-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Buka Materi
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
