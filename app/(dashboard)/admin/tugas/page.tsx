import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Tugas } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import DeleteTaskButton from '@/components/ui/DeleteTaskButton';
import ToggleStatusButton from '@/components/admin/ToggleStatusButton';

export default async function KelolaTugasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();

  // 1. Ambil Params (Next.js 15)
  const params = await searchParams;
  const query = params.q || '';
  const page = Number(params.page) || 1;
  const LIMIT = 10;
  const skip = (page - 1) * LIMIT;

  // 2. Filter Pencarian (Berdasarkan Judul Tugas)
  const filter = query
    ? { judul: { $regex: query, $options: 'i' } }
    : {};

  // 3. Query Database
  const tasks = await Tugas.find(filter)
    .sort({ deadline: 1 }) // Urutkan deadline terdekat dulu
    .skip(skip)
    .limit(LIMIT)
    .lean(); // .lean() agar lebih ringan (plain object)

  // 4. Hitung Pagination
  const totalTasks = await Tugas.countDocuments(filter);
  const totalPages = Math.ceil(totalTasks / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Daftar Tugas ({totalTasks})
        </h1>

        <div className="flex gap-2 flex-wrap justify-end">
          {/* Form Search */}
          <form className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Cari judul..."
              className="border border-border-custom bg-surface text-foreground px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input type="hidden" name="page" value="1" />
            <button
              type="submit"
              className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Cari
            </button>
          </form>

          {/* Tombol Tambah Manual */}
          <Link
            href="/admin/tugas/tambah"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 whitespace-nowrap"
          >
            + Buat Tugas
          </Link>
          <Link
            href="/admin/tugas/tambah-kelompok"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 whitespace-nowrap"
          >
            👥 Buat Tugas Kelompok
          </Link>
          <Link
            href="/admin/nilai/rekap"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 whitespace-nowrap"
          >
            📊 Rekap Nilai
          </Link>
        </div>
      </div>

      {/* Tabel Tugas */}
      <div className="bg-surface rounded-xl shadow border border-border-custom overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-foreground/5 text-foreground/70 uppercase font-bold border-b border-border-custom">
              <tr>
                <th className="px-6 py-3">Judul Tugas</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">Metode</th>
                <th className="px-6 py-3">Deadline</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {tasks.map((t: any) => {
                const isOnline = (t.tipe_pengumpulan || 'online') === 'online';

                return (
                  <tr key={t._id} className="hover:bg-foreground/5 transition-colors">
                    {/* 1. JUDUL */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground flex items-center gap-2">
                        {t.judul}
                        {t.tipe_tugas === 'kelompok' && (
                          <span className="bg-indigo-500/10 text-indigo-500 text-[10px] uppercase px-1.5 py-0.5 rounded font-bold">Kelompok</span>
                        )}
                      </div>
                      <div className="text-xs text-foreground/40 line-clamp-1">
                        {t.deskripsi || '-'}
                      </div>
                    </td>

                    {/* 2. KELAS */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(t.kelas)
                          ? t.kelas.map((k: string) => (
                              <span key={k} className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded border border-blue-500/20">
                                {k}
                              </span>
                            ))
                          : (
                              <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded border border-blue-500/20">
                                {t.kelas}
                              </span>
                            )
                        }
                      </div>
                    </td>

                    {/* 3. METODE */}
                    <td className="px-6 py-4">
                      {isOnline ? (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-1 rounded border border-blue-500/20">
                          ☁️ Upload
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-foreground/5 text-foreground/40 text-xs font-bold px-2 py-1 rounded border border-border-custom">
                          🏫 Offline
                        </span>
                      )}
                    </td>

                    {/* 4. DEADLINE */}
                    <td className="px-6 py-4">
                      {t.deadline ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded border
                          ${new Date(t.deadline) < new Date() ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}
                        `}>
                          {new Date(t.deadline).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-foreground/20">-</span>
                      )}
                    </td>

                    {/* 5. AKSI */}
                    <td className="px-6 py-4 flex justify-center gap-4 items-center">
                      <Link
                        href={`/admin/tugas/${t._id}/pengumpulan`}
                        className="bg-teal-500/10 text-teal-500 border border-teal-500/20 px-3 py-1 rounded text-xs font-bold hover:bg-teal-500/20 transition flex items-center gap-1"
                      >
                        👁️ Cek Pengumpulan
                      </Link>                
                      <Link
                        href={`/admin/tugas/${t._id}`}
                        className="text-blue-500 hover:text-blue-700 font-bold text-xs"
                      >
                        Edit
                      </Link>
                      <ToggleStatusButton 
                        id={t._id.toString()} 
                        initialStatus={t.is_active ?? true} 
                      />
                      <DeleteTaskButton 
                        id={t._id.toString()} 
                        judul={t.judul} 
                      />
                    </td>
                  </tr>
                );
              })}
              
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-foreground/40">
                    Belum ada tugas dibuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && <Pagination totalPages={totalPages} />}
    </div>
  );
}