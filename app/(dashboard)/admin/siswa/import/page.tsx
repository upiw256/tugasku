import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, Nilai, Tugas } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') redirect('/login');

  await connectDB();

  // 1. Ambil Data Statistik Utama
  const totalSiswa = await Member.countDocuments();
  const totalTugas = await Tugas.countDocuments();
  const totalPengumpulan = await Nilai.countDocuments();
  
  // 2. Ambil 5 Pengumpulan Terakhir (Recent Activity)
  // Menggunakan .populate() agar kita dapat Nama Siswa & Judul Tugas, bukan cuma ID-nya
  const recentSubmissions = await Nilai.find()
    .sort({ tanggal_mengumpulkan: -1 })
    .limit(5)
    .populate('member_id', 'nama_lengkap kelas') // Ambil field nama_lengkap & kelas dari Member
    .populate('tugas_id', 'judul') // Ambil field judul dari Tugas
    .lean();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
          <p className="text-gray-500 text-sm">Ringkasan aktivitas sistem TugasKu</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Link 
            href="/admin/tugas/import" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            + Import Siswa
          </Link>
          <Link 
            href="/admin/tugas" 
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            Kelola Tugas
          </Link>
        </div>
      </div>

      {/* Kartu Statistik (Stats Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Siswa */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Siswa</p>
              <h2 className="text-3xl font-bold text-gray-800">{totalSiswa}</h2>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600 text-2xl">
              👥
            </div>
          </div>
        </div>

        {/* Card 2: Total Tugas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Tugas Aktif</p>
              <h2 className="text-3xl font-bold text-gray-800">{totalTugas}</h2>
            </div>
            <div className="p-3 bg-orange-50 rounded-full text-orange-600 text-2xl">
              📝
            </div>
          </div>
        </div>

        {/* Card 3: Total Submission */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Tugas Dikumpulkan</p>
              <h2 className="text-3xl font-bold text-gray-800">{totalPengumpulan}</h2>
            </div>
            <div className="p-3 bg-green-50 rounded-full text-green-600 text-2xl">
              ✅
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Aktivitas Terbaru */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">Aktivitas Pengumpulan Terbaru</h3>
          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">5 Terakhir</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Nama Siswa</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">Judul Tugas</th>
                <th className="px-6 py-3">Nilai</th>
                <th className="px-6 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Belum ada data pengumpulan tugas.
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((item: any) => (
                  <tr key={item._id} className="bg-white border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.member_id?.nama_lengkap || 'Siswa Dihapus'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {item.member_id?.kelas || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.tugas_id?.judul || 'Tugas Dihapus'}
                    </td>
                    <td className="px-6 py-4">
                      {item.nilai >= 75 ? (
                        <span className="text-green-600 font-bold">{item.nilai}</span>
                      ) : (
                        <span className="text-red-500 font-bold">{item.nilai}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(item.tanggal_mengumpulkan).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}