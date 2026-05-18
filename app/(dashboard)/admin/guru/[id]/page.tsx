import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru, Member } from '@/models';
import { redirect } from 'next/navigation';
import EditGuruForm from '@/components/admin/EditGuruForm';

export default async function PageEditGuru({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  const { id } = await params;
  await connectDB();

  const guru = await Guru.findById(id).lean();

  if (!guru) {
    return <div className="p-10 text-center">Data Guru tidak ditemukan.</div>;
  }

  // Ambil List Kelas dari Member
  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  return (
    <EditGuruForm 
        allClasses={sortedClasses}
        guru={{
            _id: (guru as any)._id.toString(),
            nip: (guru as any).nip,
            nama_lengkap: (guru as any).nama_lengkap,
            pengajaran: (guru as any).pengajaran?.map((p: any) => ({
                mapel: p.mapel,
                kelas: Array.isArray(p.kelas) ? [...p.kelas] : []
            })) || []
        }} 
    />
  );
}
