import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ResetPasswordButton from '@/components/ui/ResetPasswordButton';
import DeleteStudentButton from '@/components/ui/DeleteStudentButton';
import Pagination from '@/components/ui/Pagination';
// Import komponen baru
import DownloadAkunSiswa from '@/components/admin/DownloadButton';

export default async function DataSiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string, kelas?: string }>;
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
    ? { nama_lengkap: { $regex: query, $options: 'i' } }
    : {};

  const students = await Member.find(filter)
    .sort({ kelas: 1, nama_lengkap: 1 })
    .skip(skip)
    .limit(LIMIT);
    
  const selectedKelas = params.kelas || '';
  const totalStudents = await Member.countDocuments(filter);
  const totalPages = Math.ceil(totalStudents / LIMIT);
  
  // Ambil List Kelas dari Member (Karena Member yang punya data kelas lengkap)
  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Data Siswa ({totalStudents})
        </h1>
        <div className="flex flex-wrap gap-2 items-end justify-end w-full md:w-auto">
          
          {/* TOMBOL DOWNLOAD (FITUR BARU) */}
          <DownloadAkunSiswa listKelas={sortedClasses} />
          
          <div className="hidden md:block w-[1px] h-[30px] bg-gray-300 mx-1"></div>

          {/* Filter Tampilan Tabel */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-600 mb-1">Filter Tabel</label>
            <select 
              name="kelas" 
              defaultValue={selectedKelas}
              className="border p-2 rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
            >
              <option value="">-- Semua --</option>
              {sortedClasses.map((cls: string) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>      
          
          {/* Form Search */}
          <form className="flex gap-2 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-600 mb-1">Cari Nama</label>
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Nama..."
                className="border border-gray-300 px-3 py-2 rounded text-sm h-[38px]"
              />
            </div>
            <input type="hidden" name="page" value="1" />
            <button
              type="submit"
              className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold h-[38px]"
            >
              Cari
            </button>
          </form>

          <Link 
              href="/admin/siswa/tambah" 
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 whitespace-nowrap h-[38px] flex items-center"
            >
              + Siswa
          </Link>
        </div>
      </div>

      {/* Tabel Data Siswa */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b">
            <tr>
              <th className="px-6 py-3">NIS</th>
              <th className="px-6 py-3">Nama</th>
              <th className="px-6 py-3">Kelas</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s: any) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-mono text-gray-600">{s.nis}</td>
                <td className="px-6 py-3 font-medium text-gray-900">
                  {s.nama_lengkap}
                </td>
                <td className="px-6 py-3">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">
                    {s.kelas}
                  </span>
                </td>
                <td className="px-6 py-3 flex justify-center gap-4 items-center">
                  <Link 
                    href={`/admin/siswa/${s._id}/nilai`} 
                    className="bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 text-xs px-3 py-1 rounded font-bold transition"
                  >
                    ★ Input Nilai
                  </Link>
                  <Link
                    href={`/admin/siswa/${s._id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </Link>

                  <DeleteStudentButton
                    id={s._id.toString()}
                    nama={s.nama_lengkap}
                  />

                  <ResetPasswordButton
                    memberId={s._id.toString()}
                    nama={s.nama_lengkap}
                  />
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Tidak ada data siswa ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && <Pagination totalPages={totalPages} />}
    </div>
  );
}