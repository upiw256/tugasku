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
        <h1 className="text-2xl font-bold text-gray-800">
          Daftar Data Kelompok
        </h1>

        <div className="flex gap-2 flex-wrap justify-end">
          {/* Form Search Dropdown */}
          <form className="flex gap-2 items-center">
            <span className="text-sm font-bold text-gray-700">Filter Kelas:</span>
            <select
              name="q"
              defaultValue={query}
              className="border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none bg-white min-w-[150px]"
            >
              <option value="">-- Pilih Kelas --</option>
              {sortedClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm"
            >
              Pilih
            </button>
          </form>

          <Link
            href="/admin/tugas-kelompok/tambah"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 whitespace-nowrap flex items-center gap-2"
          >
            <span>👥</span> Generate Kelompok
          </Link>
        </div>
      </div>

      {/* Grid Card Kelompok */}
      {query ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kelompokList.map((k: any) => (
            <div key={k._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{k.nama_kelompok}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">Kelas: {k.kelas}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">{k.anggota.length} Anak</span>
              </div>
              
              <div className="mt-4 border-t pt-3">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Anggota:</p>
                <ul className="space-y-1.5">
                  {k.anggota.map((siswa: any, idx: number) => {
                    const isKetua = k.ketua && k.ketua.toString() === siswa._id.toString();
                    return (
                      <li key={siswa._id || idx} className={`text-sm flex gap-2 ${isKetua ? 'font-bold text-gray-900 border-l-2 border-yellow-400 pl-2' : 'text-gray-700'}`}>
                        <span className="text-gray-400 font-mono flex-shrink-0 w-4">{idx + 1}.</span> 
                        <span className="truncate">{siswa.nama_lengkap} {isKetua && <span className="text-yellow-600 ml-1" title="Ketua Kelompok">👑 (Ketua)</span>}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              
            </div>
          ))}

          {kelompokList.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 border border-dashed rounded-xl">
              <p className="text-gray-500 font-medium">Belum ada kelompok yang dibentuk untuk kelas ini.</p>
              <p className="text-gray-400 text-sm mt-1">Klik tombol Generate Kelompok untuk memulai pembentukan.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-blue-800 font-medium">↑ Pilih kelas dari menu dropdown di atas untuk melihat data kelompok.</p>
        </div>
      )}

    </div>
  );
}
