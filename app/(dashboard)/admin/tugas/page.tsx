import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Tugas } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import TugasTable from '@/components/admin/TugasTable';
import Pagination from '@/components/ui/Pagination';

export default async function KelolaTugasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();

  const params = await searchParams;
  const query = params.q || '';
  const page = Number(params.page) || 1;
  const LIMIT = 10;
  const skip = (page - 1) * LIMIT;

  const filter = query
    ? { judul: { $regex: query, $options: 'i' } }
    : {};

  const tasks = await Tugas.find(filter)
    .sort({ deadline: 1 })
    .skip(skip)
    .limit(LIMIT)
    .lean();

  const totalTasks = await Tugas.countDocuments(filter);
  const totalPages = Math.ceil(totalTasks / LIMIT);

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border-custom">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Kelola Tugas</h1>
            <p className="text-foreground/40 text-sm font-medium">Total {totalTasks} tugas tersedia dalam sistem</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
             {/* Form Search */}
            <form className="flex-1 flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Cari judul tugas..."
                className="flex-1 min-w-[150px] border border-border-custom bg-foreground/5 text-foreground px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder:text-foreground/20"
              />
              <input type="hidden" name="page" value="1" />
              <button
                type="submit"
                className="bg-foreground text-background px-6 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition-all active:scale-95"
              >
                Cari
              </button>
            </form>

            <Link
              href="/admin/tugas/tambah"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <span className="text-lg">+</span> Tugas Baru
            </Link>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border-custom">
           <Link
             href="/admin/tugas/tambah-kelompok"
             className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-4 py-2 rounded-lg text-xs font-black hover:bg-indigo-500/20 transition-all"
           >
             👥 Tugas Kelompok
           </Link>
           <Link
             href="/admin/nilai/rekap"
             className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-2 rounded-lg text-xs font-black hover:bg-orange-500/20 transition-all"
           >
             📊 Rekap Nilai
           </Link>
        </div>
      </div>

      {/* Tabel Tugas (Client Component) */}
      <TugasTable tasks={tasks.map((t: any) => ({
         _id: t._id.toString(),
         judul: t.judul,
         deskripsi: t.deskripsi,
         kelas: t.kelas,
         tipe_pengumpulan: t.tipe_pengumpulan,
         tipe_tugas: t.tipe_tugas,
         deadline: t.deadline?.toISOString() || '',
         is_active: t.is_active ?? true
      }))} />

      {totalPages > 1 && <Pagination totalPages={totalPages} />}
    </div>
  );
}