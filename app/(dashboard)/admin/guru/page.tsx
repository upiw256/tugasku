import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru } from '@/models';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import GuruTable from '@/components/admin/GuruTable';
import SyncGuruButton from '@/components/admin/SyncGuruButton';
import ResetAllGuruAuthButton from '@/components/admin/ResetAllGuruAuthButton';

export default async function DataGuruPage({
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

  const filter: any = {};
  if (query) {
    filter.nama_lengkap = { $regex: query, $options: 'i' };
  }

  const gurus = await Guru.find(filter)
    .sort({ nama_lengkap: 1 })
    .skip(skip)
    .limit(LIMIT)
    .lean(); // PENTING: Gunakan .lean() agar data berupa POJO (Plain Old JavaScript Object)
    
  const totalGurus = await Guru.countDocuments(filter);
  const totalPages = Math.ceil(totalGurus / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Kelola Guru ({totalGurus})
        </h1>
        <div className="flex flex-wrap gap-2 items-end justify-end w-full md:w-auto">
          
          <ResetAllGuruAuthButton />
          <SyncGuruButton />

          <div className="hidden md:block w-[1px] h-[30px] bg-border-custom mx-1"></div>
          
          <form className="flex gap-2 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-foreground/60 mb-1">Cari Nama</label>
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Nama Guru..."
                className="border border-border-custom px-3 py-2 rounded text-sm h-[38px] bg-surface text-foreground outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <input type="hidden" name="page" value="1" />
            <button
              type="submit"
              className="bg-foreground text-background px-4 py-2 rounded text-sm font-bold h-[38px] hover:opacity-90 transition-all"
            >
              Cari
            </button>
          </form>

          <Link 
              href="/admin/guru/tambah" 
              className="bg-primary-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 whitespace-nowrap h-[38px] flex items-center"
            >
              + Guru
          </Link>
        </div>
      </div>

      <GuruTable 
        gurus={gurus.map((g: any) => ({
          _id: g._id.toString(),
          nip: g.nip,
          nama_lengkap: g.nama_lengkap,
          pengajaran: g.pengajaran?.map((p: any) => ({
            mapel: p.mapel,
            kelas: Array.isArray(p.kelas) ? [...p.kelas] : []
          })) || []
        }))} 
      />

      {totalPages > 1 && <Pagination totalPages={totalPages} />}
    </div>
  );
}
