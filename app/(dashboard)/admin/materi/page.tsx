import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Materi } from '@/models';
import { redirect } from 'next/navigation';
import FormUploadMateri from '@/components/admin/FormUploadMateri';
import Link from 'next/link';

export default async function AdminMateriPage() {
  const session = await auth();
  
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
    redirect('/login');
  }

  await connectDB();
  
  try {
    // Ambil daftar kelas yang tersedia
    const availableClasses = await Member.distinct('kelas');
    
    // Ambil materi yang sudah ada
    const dataMateri = await Materi.find({}).sort({ tanggal_upload: -1 }).lean();
    
    // Serialisasi data agar aman dikirim ke Client Component
    const existingMateri = dataMateri.map((m: any) => ({
      _id: m._id.toString(),
      judul: m.judul || "Tanpa Judul",
      deskripsi: m.deskripsi || "",
      file_url: m.file_url || "",
      kelas: m.kelas || [],
      downloadsCount: m.downloads ? m.downloads.length : 0,
      tanggal_upload: m.tanggal_upload ? m.tanggal_upload.toISOString() : new Date().toISOString()
    }));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-xl shadow-sm border border-border-custom">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Materi Belajar</h1>
          <p className="text-foreground/60">Unggah modul, PDF, atau materi pelajaran lainnya untuk siswa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Form Upload Materi */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 px-2">Unggah Materi Baru</h2>
          <FormUploadMateri availableClasses={availableClasses} />
        </section>

        {/* Daftar Materi yang Ada */}
        <section className="bg-surface rounded-xl shadow-sm border border-border-custom overflow-hidden mt-8">
          <div className="p-6 border-b border-border-custom">
            <h3 className="font-bold text-foreground text-lg">Materi Terbaru</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-foreground/40 uppercase bg-foreground/5 border-b border-border-custom font-bold">
                <tr>
                  <th className="px-6 py-3 font-bold">Judul Materi</th>
                  <th className="px-6 py-3 font-bold">Kelas</th>
                  <th className="px-6 py-3 font-bold">File</th>
                  <th className="px-6 py-3 font-bold text-center">Downloads</th>
                  <th className="px-6 py-3 font-bold">Diunggah Pada</th>
                  <th className="px-6 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {existingMateri.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-foreground/20">Belum ada materi yang diunggah.</td>
                  </tr>
                ) : (
                  existingMateri.map((m: any) => (
                    <tr key={m._id.toString()} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{m.judul}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(m.kelas) ? m.kelas : [m.kelas]).map((c: string) => (
                            <span key={c} className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 font-bold w-max">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          Lihat File
                        </a>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-green-500/10 text-green-600 font-bold px-3 py-1 rounded-full text-xs">
                          {m.downloadsCount} Kali
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-foreground/40">
                        {new Date(m.tanggal_upload).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/materi/${m._id}`} className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors inline-block w-max">
                          Kelola & Diskusi
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
  } catch (error: any) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-red-500 font-bold text-xl">Terjadi Kesalahan Server</h1>
        <p className="text-foreground/40 mt-2">{error.message}</p>
      </div>
    );
  }
}
