import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Tugas, Member } from '@/models'; // Pastikan import Member
import { notFound, redirect } from 'next/navigation';
import EditTaskForm from '@/components/forms/EditTaskForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTugasPage({ params }: PageProps) {
  const session = await auth();
  if (session?.user?.role !== 'admin') return redirect('/login');

  const { id } = await params;

  await connectDB();

  // 1. Ambil Data Tugas
  let task = null;
  try {
      const taskRaw = await Tugas.findById(id).lean();
      if (!taskRaw) return notFound();
      task = JSON.parse(JSON.stringify(taskRaw));
  } catch (error) {
      return notFound();
  }

  // 2. AMBIL LIST KELAS DARI DATA SISWA (MEMBER)
  // .distinct('kelas') akan mengambil semua nilai unik di kolom kelas
  const rawClasses = await Member.distinct('kelas');
  
  // Kita sort agar urut (X, XI, XII)
  const classList = rawClasses.sort();

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h1 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">
        ✏️ Edit Tugas
      </h1>
      
      {/* Kirim classList ke component form */}
      <EditTaskForm initialData={task} classOptions={classList} />
    </div>
  );
}