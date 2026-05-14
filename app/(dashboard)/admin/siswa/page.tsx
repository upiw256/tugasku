import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ResetPasswordButton from '@/components/ui/ResetPasswordButton';
import DeleteStudentButton from '@/components/ui/DeleteStudentButton';
import Pagination from '@/components/ui/Pagination';
import GivePointButton from '@/components/admin/GivePointButton';
import KelasFilter from '@/components/admin/KelasFilter';
// Import komponen baru
import DownloadAkunSiswa from '@/components/admin/DownloadButton';
import SiswaTable from '@/components/admin/SiswaTable';

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
  const selectedKelas = params.kelas || '';
  const page = Number(params.page) || 1;
  const LIMIT = 10;
  const skip = (page - 1) * LIMIT;

  // Bangun Filter Query secara dinamis
  const filter: any = {};
  if (query) {
    filter.nama_lengkap = { $regex: query, $options: 'i' };
  }
  if (selectedKelas) {
    filter.kelas = selectedKelas;
  }

  const students = await Member.find(filter)
    .sort({ kelas: 1, nama_lengkap: 1 })
    .skip(skip)
    .limit(LIMIT);
    
  const totalStudents = await Member.countDocuments(filter);
  const totalPages = Math.ceil(totalStudents / LIMIT);
  
  // Ambil List Kelas dari Member (Karena Member yang punya data kelas lengkap)
  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Data Siswa ({totalStudents})
        </h1>
        <div className="flex flex-wrap gap-2 items-end justify-end w-full md:w-auto">
          
          {/* TOMBOL DOWNLOAD (FITUR BARU) */}
          <DownloadAkunSiswa listKelas={sortedClasses} />
          
          <div className="hidden md:block w-[1px] h-[30px] bg-border-custom mx-1"></div>

          {/* Filter Tampilan Tabel */}
          <KelasFilter sortedClasses={sortedClasses} defaultValue={selectedKelas} />      
          
          {/* Form Search */}
          <form className="flex gap-2 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-foreground/60 mb-1">Cari Nama</label>
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Nama..."
                className="border border-border-custom px-3 py-2 rounded text-sm h-[38px] bg-surface text-foreground outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Tabel Data Siswa (Client Component untuk Interaktivitas Mobile) */}
      <SiswaTable 
        students={students.map((s: any) => ({
          _id: s._id.toString(),
          nis: s.nis,
          nama_lengkap: s.nama_lengkap,
          kelas: s.kelas,
          poin_keaktifan: s.poin_keaktifan || 0
        }))} 
      />

      {totalPages > 1 && <Pagination totalPages={totalPages} />}
    </div>
  );
}