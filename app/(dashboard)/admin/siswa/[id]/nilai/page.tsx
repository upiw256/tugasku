import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Tugas, Nilai } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { submitGradeAction } from '@/actions/grade-actions';
import GradeHistoryRow from '@/components/ui/GradeHistoryRow'; // Import Komponen Baru

export default async function InputNilaiPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();
  const { id } = await params; 

  // 1. Ambil Data Siswa
  const studentRaw = await Member.findById(id).lean();
  if (!studentRaw) return <div>Siswa tidak ditemukan</div>;
  const student = JSON.parse(JSON.stringify(studentRaw));

  // 2. Ambil Nilai yang SUDAH ada (untuk Riwayat & Validasi)
  const gradesRaw = await Nilai.find({ member_id: id })
    .populate('tugas_id', 'judul deskripsi')
    .sort({ tanggal_dinilai: -1 })
    .lean();

  // Serialisasi manual agar aman untuk Client Component
  const existingGrades = JSON.parse(JSON.stringify(gradesRaw));

  // Buat list ID tugas yang sudah dinilai
  const gradedTaskIds = existingGrades.map((g: any) => g.tugas_id?._id?.toString());

  // 3. Ambil Tugas:
  //    - Filter A: Hanya tugas sesuai kelas siswa (Logic OR: string persis atau ada di array)
  //    - Filter B: Exclude tugas yang ID-nya sudah ada di gradedTaskIds
  const tasksRaw = await Tugas.find({
    $and: [
      {
        $or: [
          { kelas: student.kelas },          // Cocok string persis ("X 1")
          { kelas: { $in: [student.kelas] } }// Cocok di dalam array (["X 1", "X 2"])
        ]
      },
      { _id: { $nin: gradedTaskIds } }       // Exclude yang sudah dinilai
    ]
  }).sort({ deadline: -1 }).lean();
  
  const tasksToGrade = JSON.parse(JSON.stringify(tasksRaw));


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Input Nilai Siswa</h1>
          <p className="text-foreground/60">
            Siswa: <span className="font-bold text-primary-500">{student.nama_lengkap}</span> | 
            Kelas: <span className="font-bold bg-foreground/5 px-2 py-0.5 rounded text-foreground/80">{student.kelas}</span>
          </p>
        </div>
        <Link href="/admin/siswa" className="text-sm text-foreground/40 hover:text-foreground underline">
          ← Kembali ke Data Siswa
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: FORM INPUT BARU */}
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom h-fit">
          <h2 className="font-bold text-lg text-foreground mb-4 border-b border-border-custom pb-2">Input Nilai Baru</h2>
          
          {tasksToGrade.length === 0 ? (
            <div className="text-center py-8 bg-foreground/5 rounded border border-dashed border-border-custom text-foreground/40 text-sm">
              <span className="opacity-100">🎉 Semua tugas di kelas <b className="text-foreground">{student.kelas}</b> sudah dinilai!</span>
              <br/>
              <span className="text-xs text-foreground/20">Gunakan tabel di samping untuk mengedit nilai.</span>
            </div>
          ) : (
            <form action={async (formData) => {
                'use server'
                await submitGradeAction(formData);
              }} className="space-y-4">
              
              <input type="hidden" name="member_id" value={id} />

              {/* Pilih Tugas (Hanya yang belum dinilai) */}
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">Pilih Tugas</label>
                <select 
                  name="tugas_id" 
                  required 
                  className="w-full px-3 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-surface text-foreground"
                >
                  <option value="">-- Pilih Judul Tugas --</option>
                  {tasksToGrade.map((t: any) => (
                    <option key={t._id} value={t._id.toString()}>
                      {t.judul}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Nilai */}
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">Nilai (0-100)</label>
                <input 
                  name="nilai" 
                  type="number" 
                  min="0" max="100" 
                  required 
                  placeholder="Masukkan nilai..."
                  className="w-full px-3 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary-600 text-white py-2 rounded-lg font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-500/20 mt-2"
              >
                Simpan Nilai
              </button>
            </form>
          )}
        </div>

        {/* KOLOM KANAN: RIWAYAT & EDIT */}
        <div className="bg-surface rounded-xl shadow-sm border border-border-custom overflow-hidden h-fit">
          <div className="p-4 border-b border-border-custom bg-foreground/5 flex justify-between items-center">
            <h2 className="font-bold text-foreground">Riwayat Nilai</h2>
            <span className="text-xs bg-foreground/10 text-foreground/60 px-2 py-1 rounded-full">{existingGrades.length} Item</span>
          </div>
          
          <table className="w-full text-sm text-left">
            <thead className="bg-foreground/5 text-foreground/40 border-b border-border-custom uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-2 w-2/3">Judul Tugas</th>
                <th className="px-4 py-2">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {existingGrades.length === 0 ? (
                 <tr>
                   <td colSpan={2} className="p-4 text-center text-foreground/20 italic">
                     Belum ada nilai yang dimasukkan.
                   </td>
                 </tr>
              ) : (
                existingGrades.map((g: any) => (
                  // Panggil Component Row yang bisa diedit
                  <GradeHistoryRow 
                    key={g._id} 
                    grade={g} 
                    memberId={id} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}