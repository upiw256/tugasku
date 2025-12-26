import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Tugas, Nilai } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function RekapNilaiPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ kelas?: string }> 
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  await connectDB();
  const params = await searchParams;
  const selectedKelas = params.kelas || '';

  // 1. Ambil List Kelas
  const distinctClasses = await Member.distinct('kelas');
  const sortedClasses = distinctClasses.sort();

  // 2. Logic Data Table
  let students: any[] = [];
  let tasks: any[] = [];
  let gradeMap: Record<string, number> = {}; // Key: "studentID_taskID" -> Value: Nilai

  if (selectedKelas) {
    // A. Ambil Siswa
    students = await Member.find({ kelas: selectedKelas }).sort({ nama_lengkap: 1 }).lean();

    // B. Ambil Tugas Kelas Ini
    tasks = await Tugas.find({
        $or: [
          { kelas: selectedKelas },
          { kelas: { $in: [selectedKelas] } }
        ]
    }).sort({ createdAt: 1 }).lean();

    // C. Ambil Semua Nilai Siswa Tersebut
    const studentIds = students.map((s: any) => s._id);
    const grades = await Nilai.find({ member_id: { $in: studentIds } }).lean();

    // D. Mapping Nilai biar gampang akses di Table
    grades.forEach((g: any) => {
      const key = `${g.member_id}_${g.tugas_id}`;
      gradeMap[key] = g.nilai;
    });
  }

  // URL Download
  const downloadUrl = `/api/nilai/download?kelas=${selectedKelas}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/tugas" className="text-gray-500 hover:text-gray-800 transition">← Daftar Tugas</Link>
            <span className="text-gray-300">/</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Rekapitulasi Nilai</h1>
          <p className="text-gray-500">Laporan nilai siswa per mata pelajaran/tugas</p>
        </div>
      </div>

      {/* Filter Area */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <form className="flex flex-col md:flex-row gap-4 items-end">
          
          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-gray-600 mb-1">Pilih Kelas</label>
            <select 
              name="kelas" 
              defaultValue={selectedKelas} 
              className="w-full md:w-60 border p-2 rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Kelas --</option>
              {sortedClasses.map((cls: string) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-blue-700 h-[38px]">
            Tampilkan Data
          </button>

          {/* Tombol Download */}
          {selectedKelas && students.length > 0 && (
            <a 
              href={downloadUrl}
              target="_blank"
              className="bg-green-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-green-700 h-[38px] flex items-center gap-2"
            >
              <span>📥</span> Download Excel
            </a>
          )}
        </form>
      </div>

      {/* Tabel Preview */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden overflow-x-auto">
        {!selectedKelas ? (
            <div className="p-10 text-center text-gray-500">Silakan pilih kelas terlebih dahulu.</div>
        ) : students.length === 0 ? (
            <div className="p-10 text-center text-gray-500">Tidak ada siswa di kelas ini.</div>
        ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b">
                    <tr>
                        <th className="px-6 py-3 border-r">NIS</th>
                        <th className="px-6 py-3 border-r min-w-[200px]">Nama Siswa</th>
                        {/* Header Judul Tugas */}
                        {tasks.map((t: any) => (
                            <th key={t._id} className="px-4 py-3 text-center border-r min-w-[100px]">
                                <div className="truncate max-w-[150px]" title={t.judul}>{t.judul}</div>
                            </th>
                        ))}
                        <th className="px-6 py-3 text-center bg-gray-100">Rata-rata</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {students.map((student: any) => {
                        let total = 0;
                        
                        return (
                            <tr key={student._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 border-r font-mono text-gray-600">{student.nis}</td>
                                <td className="px-6 py-4 border-r font-medium text-gray-900">{student.nama_lengkap}</td>
                                
                                {/* Loop Kolom Nilai */}
                                {tasks.map((t: any) => {
                                    const key = `${student._id}_${t._id}`;
                                    const nilai = gradeMap[key];
                                    if(nilai !== undefined) total += nilai;

                                    return (
                                        <td key={t._id} className="px-4 py-4 text-center border-r">
                                            {nilai !== undefined ? (
                                                <span className={`font-bold ${nilai < 75 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {nilai}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                    )
                                })}

                                {/* Kolom Rata-rata */}
                                <td className="px-6 py-4 text-center font-bold bg-gray-50">
                                    {(tasks.length > 0 ? (total / tasks.length).toFixed(1) : 0)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
}