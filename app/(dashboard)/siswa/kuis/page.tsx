import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { SoalPG, Member, PengerjaanKuis } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function SiswaKuisPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  await connectDB();
  
  const student = await Member.findOne({ nis: session.user.email }).lean();
  if (!student) {
    return <div className="p-10 text-center">Data siswa tidak ditemukan.</div>;
  }

  // Ambil kuis yang sesuai dengan kelas siswa
  const quizzes = await SoalPG.find({ 
    $or: [{ kelas: student.kelas }, { kelas: { $in: [student.kelas] } }]
  }).sort({ waktu_mulai: 1 }).lean();

  // Ambil status pengerjaan siswa
  const pengerjaan = await PengerjaanKuis.find({ member_id: student._id }).lean();
  const pengerjaanMap = pengerjaan.reduce((acc: any, curr: any) => {
    acc[curr.kuis_id.toString()] = curr;
    return acc;
  }, {});

  const now = new Date();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 rounded-2xl text-white shadow-lg">
        <h1 className="text-3xl font-bold">Kuis & Latihan</h1>
        <p className="opacity-90 mt-2 text-purple-100">Uji pemahamanmu dengan mengerjakan kuis yang sudah disiapkan!</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">Daftar Kuis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Nama Kuis</th>
                <th className="px-6 py-3">Waktu</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">Belum ada kuis untuk kelas {student.kelas}.</td>
                </tr>
              ) : (
                quizzes.map((kuis: any) => {
                  const statusPengerjaan = pengerjaanMap[kuis._id.toString()];
                  const idKuis = kuis._id.toString();
                  const startTime = new Date(kuis.waktu_mulai);
                  const endTime = new Date(kuis.waktu_selesai);
                  
                  let canTake = now >= startTime && now <= endTime;
                  let colorClass = "text-gray-400";
                  let statusText = "Belum Terbuka";

                  if (statusPengerjaan?.status === 'SUBMITTED') {
                    statusText = `Selesai (Skor: ${statusPengerjaan.nilai})`;
                    colorClass = "text-green-600 font-bold";
                    canTake = false;
                  } else if (now > endTime) {
                    statusText = "Sudah Terlewat";
                    colorClass = "text-red-500";
                    canTake = false;
                  } else if (now >= startTime) {
                    statusText = statusPengerjaan?.status === 'DRAFT' ? "Sedang Dikerjakan" : "Tersedia";
                    colorClass = "text-blue-600 font-bold";
                  }

                  return (
                    <tr key={idKuis} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{kuis.judul}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{kuis.deskripsi || 'Kuis online'}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        <div>Mulai: {startTime.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</div>
                        <div>Selesai: {endTime.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={colorClass}>{statusText}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canTake ? (
                          <Link 
                            href={`/siswa/kuis/${idKuis}`} 
                            className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                          >
                            {statusPengerjaan?.status === 'DRAFT' ? 'Lanjutkan' : 'Mulai Kuis'}
                          </Link>
                        ) : (
                          <button disabled className="bg-gray-100 text-gray-400 text-xs font-bold px-4 py-2 rounded-lg cursor-not-allowed">
                            {now < startTime ? 'Belum Buka' : 'Tutup'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
