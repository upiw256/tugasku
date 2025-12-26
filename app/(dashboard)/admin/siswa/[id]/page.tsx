import { connectDB } from '@/lib/db';
import { Member } from '@/models';
import { updateStudentAction } from '@/actions/admin-actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function EditSiswaPage({ params }: { params: { id: string } }) {
  await connectDB();
  
  // Ambil data siswa berdasarkan ID di URL
  const student = await Member.findById(params.id);
  
  if (!student) return <div>Siswa tidak ditemukan</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/siswa" className="text-gray-500 hover:underline">← Kembali</Link>
        <h1 className="text-2xl font-bold">Edit Siswa</h1>
      </div>

      <form action={async (formData) => {
        'use server'
        await updateStudentAction(params.id, formData);
        redirect('/admin/siswa');
      }} className="bg-white p-6 rounded-xl shadow border border-gray-200 space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NIS</label>
          <input name="nis" defaultValue={student.nis} className="w-full border p-2 rounded" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input name="nama" defaultValue={student.nama_lengkap} className="w-full border p-2 rounded" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
          <input name="kelas" defaultValue={student.kelas} className="w-full border p-2 rounded" required />
        </div>

        <div className="pt-4">
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold">
                Simpan Perubahan
            </button>
        </div>
      </form>
    </div>
  );
}