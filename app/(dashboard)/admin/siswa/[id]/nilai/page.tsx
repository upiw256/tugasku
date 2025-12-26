import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Tugas, Nilai } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { submitGradeAction } from '@/actions/grade-actions';
import GradeHistoryRow from '@/components/ui/GradeHistoryRow'; // Import Komponen Baru

export default async function InputNilaiPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();
  const { id } = await params; 

  // 1. Ambil Data Siswa
  const student = await Member.findById(id);
  if (!student) return <div>Siswa tidak ditemukan</div>;

  // 2. Ambil Nilai yang SUDAH ada (untuk Riwayat & Validasi)
  const existingGrades = await Nilai.find({ member_id: id })
    .populate('tugas_id', 'judul')
    .sort({ tanggal_dinilai: -1 })
    .lean();

  // Buat list ID tugas yang sudah dinilai
  const gradedTaskIds = existingGrades.map((g: any) => g.tugas_id?._id?.toString());

  // 3. Ambil Tugas:
  //    - Filter A: Hanya tugas sesuai kelas siswa (Logic OR: string persis atau ada di array)
  //    - Filter B: Exclude tugas yang ID-nya sudah ada di gradedTaskIds
  const tasksToGrade = await Tugas.find({
    $and: [
      {
        $or: [
          { kelas: student.kelas },          // Cocok string persis ("X 1")
          { kelas: { $in: [student.kelas] } }// Cocok di dalam array (["X 1", "X 2"])
        ]
      },
      { _id: { $nin: gradedTaskIds } }       // Exclude yang sudah dinilai
    ]
  }).sort({ deadline: -1 });


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Input Nilai Siswa</h1>
          <p className="text-gray-500">
            Siswa: <span className="font-bold text-blue-600">{student.nama_lengkap}</span> | 
            Kelas: <span className="font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">{student.kelas}</span>
          </p>
        </div>
        <Link href="/admin/siswa" className="text-sm text-gray-500 hover:text-gray-800 underline">
          ← Kembali ke Data Siswa
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: FORM INPUT BARU */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Input Nilai Baru</h2>
          
          {tasksToGrade.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded border border-dashed text-gray-500 text-sm">
              🎉 Semua tugas di kelas <b>{student.kelas}</b> sudah dinilai!
              <br/>
              <span className="text-xs text-gray-400">Gunakan tabel di samping untuk mengedit nilai.</span>
            </div>
          ) : (
            <form action={async (formData) => {
                'use server'
                await submitGradeAction(formData);
              }} className="space-y-4">
              
              <input type="hidden" name="member_id" value={id} />

              {/* Pilih Tugas (Hanya yang belum dinilai) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Tugas</label>
                <select 
                  name="tugas_id" 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nilai (0-100)</label>
                <input 
                  name="nilai" 
                  type="number" 
                  min="0" max="100" 
                  required 
                  placeholder="Masukkan nilai..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm mt-2"
              >
                Simpan Nilai
              </button>
            </form>
          )}
        </div>

        {/* KOLOM KANAN: RIWAYAT & EDIT */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Riwayat Nilai</h2>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{existingGrades.length} Item</span>
          </div>
          
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 border-b">
              <tr>
                <th className="px-4 py-2 w-2/3">Judul Tugas</th>
                <th className="px-4 py-2">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {existingGrades.length === 0 ? (
                 <tr>
                   <td colSpan={2} className="p-4 text-center text-gray-400 italic">
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