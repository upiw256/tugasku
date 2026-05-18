import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru, Member } from '@/models';
import { redirect } from 'next/navigation';
import GuruManagePengajaran from '@/components/guru/GuruManagePengajaran';

export default async function GuruPengajaranPage() {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  
  const guru_id = (session.user as any).guru_id;
  await connectDB();
  
  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) {
      return <div className="p-10 text-center">Data Guru tidak ditemukan.</div>
  }

  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  return (
    <div className="py-10">
        <GuruManagePengajaran 
            guruId={guru_id.toString()}
            currentPengajaran={(guruInfo.pengajaran as any) || []}
            availableClasses={sortedClasses}
        />
    </div>
  );
}
