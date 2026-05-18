import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member } from '@/models';
import { redirect } from 'next/navigation';
import TambahGuruForm from '@/components/admin/TambahGuruForm';

export default async function PageTambahGuru() {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();

  // Ambil List Kelas dari Member
  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  return (
    <TambahGuruForm allClasses={sortedClasses} />
  );
}
