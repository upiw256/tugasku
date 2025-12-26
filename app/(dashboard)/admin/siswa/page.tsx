import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ResetPasswordButton from '@/components/ui/ResetPasswordButton';
import DeleteStudentButton from '@/components/ui/DeleteStudentButton';
import Pagination from '@/components/ui/Pagination';

// PERUBAHAN 1: Definisikan searchParams sebagai Promise
export default async function DataSiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();

  // PERUBAHAN 2: Await searchParams sebelum mengakses isinya
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

  const totalStudents = await Member.countDocuments(filter);
  const totalPages = Math.ceil(totalStudents / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Data Siswa ({totalStudents})
        </h1>

        <div className="flex gap-2">
          {/* Form Search */}
          <form className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Cari nama siswa..."
              className="border border-gray-300 px-3 py-2 rounded-lg text-sm"
            />
            {/* Reset page ke 1 saat pencarian baru */}
            <input type="hidden" name="page" value="1" />
            <button
              type="submit"
              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm"
            >
              Cari
            </button>
          </form>

          <Link 
              href="/admin/siswa/tambah" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 whitespace-nowrap"
            >
              + Tambah Siswa
          </Link>
        </div>
      </div>

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