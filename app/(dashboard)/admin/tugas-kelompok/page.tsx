import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Kelompok, Member } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DragDropGroupList from '@/components/ui/DragDropGroupList';

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
        <DragDropGroupList initialList={JSON.parse(JSON.stringify(kelompokList))} />
      ) : (
        <div className="py-12 text-center bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <p className="text-blue-500 font-medium">↑ Pilih kelas dari menu dropdown di atas untuk melihat data kelompok.</p>
        </div>
      )}

    </div>
  );
}
