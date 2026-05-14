import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Kelompok, Member } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DataKelompokPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();

  // 1. Ambil Params
  const params = await searchParams;
  const query = params.q || '';

  // 2. Filter Pencarian (Berdasarkan Kelas yang dipilih)
  const filter = query ? { kelas: query } : {};

  // Ambil daftar kelas yang memiliki kelompok atau dari semua member
  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  // 3. Query Database (Hanya fetch jika query eksis)
  let kelompokList: any[] = [];
  if (query) {
    kelompokList = await Kelompok.find(filter)
      .populate('anggota')
      .sort({ kelas: 1, nama_kelompok: 1 })
      .lean();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Daftar Data Kelompok
        </h1>

        <div className="flex gap-2 flex-wrap justify-end">
          {/* Form Search Dropdown */}
          <form className="flex gap-2 items-center">
            <span className="text-sm font-bold text-foreground/60">Filter Kelas:</span>
            <select
              name="q"
              defaultValue={query}
              className="border border-border-custom px-3 py-2 rounded-lg text-sm outline-none bg-surface text-foreground min-w-[150px] focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Kelas --</option>
              {sortedClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Pilih
            </button>
          </form>

          <Link
            href="/admin/tugas-kelompok/tambah"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 whitespace-nowrap flex items-center gap-2 shadow-lg"
          >
            <span>👥</span> Generate Kelompok
          </Link>
        </div>
      </div>

      {/* Grid Card Kelompok */}
      {query ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kelompokList.map((k: any) => (
            <div key={k._id} className="bg-surface rounded-xl shadow-sm border border-border-custom p-5 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{k.nama_kelompok}</h3>
                  <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold border border-blue-500/20 uppercase tracking-tighter">Kelas: {k.kelas}</span>
                </div>
                <span className="text-[10px] text-foreground/60 font-bold bg-foreground/5 px-2 py-0.5 rounded border border-border-custom">{k.anggota.length} Anak</span>
              </div>
              
              <div className="mt-4 border-t border-border-custom pt-3">
                <p className="text-[10px] font-bold text-foreground/40 mb-2 uppercase tracking-widest">Anggota:</p>
                <ul className="space-y-1.5">
                  {k.anggota.map((siswa: any, idx: number) => {
                    const isKetua = k.ketua && k.ketua.toString() === siswa._id.toString();
                    return (
                      <li key={siswa._id || idx} className={`text-sm flex gap-2 ${isKetua ? 'font-bold text-foreground border-l-2 border-yellow-500 pl-2' : 'text-foreground/70'}`}>
                        <span className="text-foreground/20 font-mono flex-shrink-0 w-4">{idx + 1}.</span> 
                        <span className="truncate">{siswa.nama_lengkap} {isKetua && <span className="text-yellow-500 ml-1" title="Ketua Kelompok">👑 (Ketua)</span>}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              
            </div>
          ))}

          {kelompokList.length === 0 && (
            <div className="col-span-full py-12 text-center bg-foreground/5 border border-dashed border-border-custom rounded-xl">
              <p className="text-foreground/60 font-medium">Belum ada kelompok yang dibentuk untuk kelas ini.</p>
              <p className="text-foreground/40 text-sm mt-1">Klik tombol Generate Kelompok untuk memulai pembentukan.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <p className="text-blue-500 font-medium">↑ Pilih kelas dari menu dropdown di atas untuk melihat data kelompok.</p>
        </div>
      )}

    </div>
  );
}
