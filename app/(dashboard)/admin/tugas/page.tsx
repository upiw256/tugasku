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
        <h1 className="text-2xl font-bold text-gray-800">
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
              className="border border-gray-300 px-3 py-2 rounded-lg text-sm"
            />
            <input type="hidden" name="page" value="1" />
            <button
              type="submit"
              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm"
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
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b">
        <tr>
          <th className="px-6 py-3">Judul Tugas</th>
          <th className="px-6 py-3">Kelas</th>
          <th className="px-6 py-3">Metode</th>
          <th className="px-6 py-3">Deadline</th>
          <th className="px-6 py-3 text-center">Aksi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {tasks.map((t: any) => {
          // LOGIKA PENENTU TIPE (Fallback ke 'online' jika null)
          const isOnline = (t.tipe_pengumpulan || 'online') === 'online';

          return (
            <tr key={t._id} className="hover:bg-gray-50">
              {/* 1. JUDUL */}
              <td className="px-6 py-4">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  {t.judul}
                  {t.tipe_tugas === 'kelompok' && (
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] uppercase px-1.5 py-0.5 rounded font-bold">Kelompok</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 line-clamp-1">
                  {t.deskripsi || '-'}
                </div>
              </td>

              {/* 2. KELAS */}
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(t.kelas)
                    ? t.kelas.map((k: string) => (
                        <span key={k} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {k}
                        </span>
                      ))
                    : (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {t.kelas}
                        </span>
                      )
                  }
                </div>
              </td>

              {/* 3. METODE (BARU) */}
              <td className="px-6 py-4">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-200">
                    ☁️ Upload
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded border border-gray-200">
                    🏫 Offline
                  </span>
                )}
              </td>

              {/* 4. DEADLINE */}
              <td className="px-6 py-4">
                {t.deadline ? (
                  <span className={`text-xs font-bold px-2 py-1 rounded 
                    ${new Date(t.deadline) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
                  `}>
                    {new Date(t.deadline).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>

              {/* 5. AKSI */}
              <td className="px-6 py-4 flex justify-center gap-4 items-center">
                  <Link
                    href={`/admin/tugas/${t._id}/pengumpulan`}
                    className="bg-teal-100 text-teal-700 border border-teal-200 px-3 py-1 rounded text-xs font-bold hover:bg-teal-200 transition flex items-center gap-1"
                  >
                    👁️ Cek Pengumpulan
                  </Link>                
                <Link
                  href={`/admin/tugas/${t._id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
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
            <td colSpan={5} className="p-8 text-center text-gray-500">
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