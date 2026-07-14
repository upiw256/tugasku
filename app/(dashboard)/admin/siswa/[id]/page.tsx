import { connectDB } from '@/lib/db';
import { Member } from '@/models';
import { updateStudentAction } from '@/actions/admin-actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Page({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await connectDB();
  
  const { id } = await params;
  
  // Ambil data siswa berdasarkan ID di URL
  const student = await Member.findById(id);
  
  if (!student) return <div>Siswa tidak ditemukan</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/siswa" className="text-foreground/40 hover:text-foreground transition">← Kembali</Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Siswa</h1>
      </div>

      <form action={async (formData) => {
        'use server'
        await updateStudentAction(id, formData);
        redirect('/admin/siswa');
      }} className="bg-surface p-6 rounded-xl shadow border border-border-custom space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">NIS</label>
          <input name="nis" defaultValue={student.nis} className="w-full border border-border-custom bg-surface text-foreground p-2 rounded focus:ring-2 focus:ring-primary-500 outline-none" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Nama Lengkap</label>
          <input name="nama" defaultValue={student.nama_lengkap} className="w-full border border-border-custom bg-surface text-foreground p-2 rounded focus:ring-2 focus:ring-primary-500 outline-none" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Kelas</label>
          <input name="kelas" defaultValue={student.kelas} className="w-full border border-border-custom bg-surface text-foreground p-2 rounded focus:ring-2 focus:ring-primary-500 outline-none" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Jenis Kelamin</label>
          <select name="jenis_kelamin" defaultValue={student.jenis_kelamin || ''} className="w-full border border-border-custom bg-surface text-foreground p-2 rounded focus:ring-2 focus:ring-primary-500 outline-none" required>
            <option value="">Pilih Jenis Kelamin</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <div className="pt-4">
            <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 font-bold shadow-lg shadow-primary-500/20 transition-all">
                Simpan Perubahan
            </button>
        </div>
      </form>
    </div>
  );
}