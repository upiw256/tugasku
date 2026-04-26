import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { PengerjaanKuis, Member, User } from '@/models';
import { redirect } from 'next/navigation';

export default async function SiswaNilaiPage() {
  const session = await auth();
  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  await connectDB();
  const currentUser = await User.findById(session.user.id).lean();
  const student = await Member.findById(currentUser?.member_id).lean();

  if (!student) {
    return <div className="p-10 text-center">Data siswa tidak ditemukan.</div>;
  }

  // Ambil semua pengerjaan kuis yang sudah disubmit
  const history = await PengerjaanKuis.find({ 
    member_id: student._id, 
    status: 'SUBMITTED' 
  }).populate('kuis_id', 'judul').sort({ updatedAt: -1 }).lean();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 rounded-2xl text-white shadow-lg">
        <h1 className="text-3xl font-bold">Rekap Nilai Kuis</h1>
        <p className="opacity-90 mt-2 text-emerald-50">Pantau progres belajarmu dari hasil kuis yang telah dikerjakan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
           <p className="text-sm text-gray-500 font-medium">Total Kuis</p>
           <p className="text-3xl font-bold text-gray-800">{history.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
           <p className="text-sm text-gray-500 font-medium">Rata-rata Nilai</p>
           <p className="text-3xl font-bold text-emerald-600">
             {history.length > 0 
               ? Math.round(history.reduce((a, b) => a + (b.nilai || 0), 0) / history.length) 
               : 0}
           </p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
           <p className="text-sm text-gray-500 font-medium">Kuis Terakhir</p>
           <p className="text-sm font-bold text-gray-800 line-clamp-1">{history[0]?.kuis_id?.judul || '-'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Kuis</th>
                <th className="px-6 py-3 text-center">Benar</th>
                <th className="px-6 py-3 text-center">Salah</th>
                <th className="px-6 py-3 text-center">Skor</th>
                <th className="px-6 py-3 text-right">Tanggal Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Belum ada data nilai kuis.</td>
                </tr>
              ) : (
                history.map((h: any) => (
                  <tr key={h._id.toString()} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {h.kuis_id?.judul || 'Kuis Terhapus'}
                    </td>
                    <td className="px-6 py-4 text-center text-emerald-600 font-bold">{h.benar ?? '-'}</td>
                    <td className="px-6 py-4 text-center text-red-500 font-bold">{h.salah ?? '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full font-black text-lg ${
                        (h.nilai || 0) >= 75 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                      }`}>
                        {h.nilai || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400 text-xs">
                      {new Date(h.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
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
