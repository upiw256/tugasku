import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Materi, Member } from '@/models';
import { redirect } from 'next/navigation';
import MapelFilterSiswa from '@/components/siswa/MapelFilterSiswa';

export default async function SiswaMateriPage({
  searchParams
}: {
  searchParams: Promise<{ mapel?: string }>
}) {
  const session = await auth();
  
  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  await connectDB();
  const params = await searchParams;
  const selectedMapel = params.mapel || '';
  
  // Ambil data siswa untuk tahu kelasnya
  const student = await Member.findOne({ nis: session.user.email }).lean();
  if (!student) {
    return <div className="p-10 text-center">Data siswa tidak ditemukan.</div>;
  }

  // Ambil semua mapel unik yang tersedia untuk kelas ini
  const allMateriForClass = await Materi.find({ 
    $or: [
      { kelas: student.kelas },
      { kelas: { $in: [student.kelas] } }
    ]
  }).select('mapel').lean();
  
  const listMapel = Array.from(new Set(allMateriForClass.map((m: any) => m.mapel).filter(Boolean))) as string[];

  // Ambil materi yang sesuai dengan kelas dan mapel (jika ada)
  const filterQuery: any = {
    $or: [
      { kelas: student.kelas },
      { kelas: { $in: [student.kelas] } }
    ]
  };
  if (selectedMapel) {
    filterQuery.mapel = selectedMapel;
  }

  const materi = await Materi.find(filterQuery).sort({ tanggal_upload: -1 }).lean();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/20">
        <div className="relative z-10">
          <h1 className="text-4xl font-black uppercase tracking-tight">Materi Belajar</h1>
          <p className="opacity-90 mt-2 text-blue-100 font-medium max-w-md">Eksplorasi ribuan wawasan baru yang telah disiapkan khusus untuk kelas {student.kelas}!</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-primary-400/20 rounded-full blur-2xl"></div>
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 px-2">Filter Mata Pelajaran</h2>
        <MapelFilterSiswa listMapel={listMapel.sort()} currentMapel={selectedMapel} />
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
                <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{student.kelas}</span>
                    {m.mapel && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{m.mapel}</span>
                    )}
                </div>
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
