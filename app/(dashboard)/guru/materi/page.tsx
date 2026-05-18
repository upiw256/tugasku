import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru, Materi } from '@/models';
import { redirect } from 'next/navigation';
import FormUploadMateri from '@/components/admin/FormUploadMateri';

export default async function GuruMateriPage({
    searchParams
}: {
    searchParams: Promise<{ mapel?: string }>
}) {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  
  const guru_id = (session.user as any).guru_id;
  const params = await searchParams;
  const selectedMapel = params.mapel || '';

  await connectDB();
  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) redirect('/login');

  // Filter materi berdasarkan guru dan mapel (jika ada)
  const query: any = { guru_id };
  if (selectedMapel) {
      query.mapel = selectedMapel;
  }

  const dataMateri = await Materi.find(query).sort({ tanggal_upload: -1 }).lean();
  
  const existingMateri = dataMateri.map((m: any) => ({
    _id: m._id.toString(),
    judul: m.judul || "Tanpa Judul",
    deskripsi: m.deskripsi || "",
    file_url: m.file_url || "",
    kelas: m.kelas || [],
    mapel: m.mapel || "Umum",
    tanggal_upload: m.tanggal_upload ? m.tanggal_upload.toISOString() : new Date().toISOString()
  }));

  // Cari list kelas yang diampu guru ini untuk mapel yang dipilih
  let availableClasses: string[] = [];
  if (selectedMapel) {
      const p = (guruInfo as any).pengajaran.find((item: any) => item.mapel === selectedMapel);
      if (p) availableClasses = p.kelas;
  } else {
      // Jika "Semua", ambil gabungan semua kelas
      const allCls = new Set<string>();
      (guruInfo as any).pengajaran.forEach((p: any) => p.kelas.forEach((c: string) => allCls.add(c)));
      availableClasses = Array.from(allCls);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl shadow-sm border border-border-custom">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-black uppercase tracking-tight">Kelola Materi Belajar</h1>
          <p className="text-foreground/60 text-sm">Unggah materi untuk mata pelajaran {selectedMapel || 'yang Anda ampu'}.</p>
        </div>
      </div>

      {!selectedMapel ? (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-600 font-bold text-center text-sm">
              💡 Pilih mata pelajaran di atas untuk mulai mengunggah materi spesifik.
          </div>
      ) : (
        <section>
            <h2 className="text-lg font-black text-foreground mb-4 uppercase tracking-widest text-primary-500">Unggah Materi Baru: {selectedMapel}</h2>
            <FormUploadMateri 
                availableClasses={availableClasses} 
                fixedMapel={selectedMapel}
                fixedGuruId={guru_id}
            />
        </section>
      )}

      {/* Daftar Materi */}
      <section className="bg-surface rounded-2xl shadow-sm border border-border-custom overflow-hidden">
        <div className="p-6 border-b border-border-custom bg-foreground/[0.02]">
          <h3 className="font-bold text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Riwayat Unggahan {selectedMapel && `- ${selectedMapel}`}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-foreground/40 bg-foreground/[0.02] border-b border-border-custom">
                <th className="px-6 py-4 font-black">Judul Materi</th>
                <th className="px-6 py-4 font-black text-center">Mapel</th>
                <th className="px-6 py-4 font-black">Kelas</th>
                <th className="px-6 py-4 font-black text-center">File</th>
                <th className="px-6 py-4 font-black text-right">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {existingMateri.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-foreground/20 italic">Belum ada materi.</td>
                </tr>
              ) : (
                existingMateri.map((m: any) => (
                  <tr key={m._id} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{m.judul}</div>
                        <div className="text-[10px] text-foreground/40 truncate max-w-xs">{m.deskripsi}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                         <span className="bg-primary-500/10 text-primary-500 text-[10px] font-black px-2 py-1 rounded-lg border border-primary-500/20">{m.mapel}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(m.kelas) ? m.kelas : [m.kelas]).map((c: string) => (
                          <span key={c} className="bg-foreground/5 text-foreground/50 text-[10px] font-bold px-2 py-0.5 rounded border border-border-custom">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 text-white hover:bg-blue-400 transition shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                      </a>
                    </td>
                    <td className="px-6 py-4 text-right text-[10px] text-foreground/40 font-bold">
                        {new Date(m.tanggal_upload).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
