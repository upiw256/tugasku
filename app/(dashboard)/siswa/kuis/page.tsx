import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { SoalPG, Member, PengerjaanKuis, User } from '@/models';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function SiswaKuisPage() {
  noStore();
  const session = await auth();
  
  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  await connectDB();
  
  // Ambil data User untuk mendapatkan member_id
  const currentUser = await User.findById(session.user.id).lean();
  if (!currentUser || !currentUser.member_id) {
    return <div className="p-10 text-center">Profil siswa tidak terhubung. Silakan hubungi admin.</div>;
  }

  const student = await Member.findById(currentUser.member_id).lean();
  if (!student) {
    return <div className="p-10 text-center">Data siswa tidak ditemukan.</div>;
  }

  // Ambil kuis yang sesuai dengan kelas siswa
  const rawQuizzes = await SoalPG.find({ 
    $or: [{ kelas: student.kelas }, { kelas: { $in: [student.kelas] } }]
  }).sort({ waktu_mulai: 1 }).lean();

  // Deep cleaning untuk menghindari isu serialisasi Mongoose
  const quizzes = JSON.parse(JSON.stringify(rawQuizzes));

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

      <div className="bg-surface rounded-xl shadow-sm border border-border-custom overflow-hidden">
        <div className="p-6 border-b border-border-custom bg-foreground/5">
          <h2 className="font-bold text-foreground text-lg">Daftar Kuis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/40 uppercase bg-foreground/5 border-b border-border-custom">
              <tr>
                <th className="px-6 py-3">Nama Kuis</th>
                <th className="px-6 py-3">Waktu</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-foreground/20 font-medium italic">Belum ada kuis untuk kelas {student.kelas}.</td>
                </tr>
              ) : (
                quizzes.map((kuis: any) => {
                  const statusPengerjaan = pengerjaanMap[kuis._id.toString()];
                  const idKuis = kuis._id.toString();
                  const startTime = new Date(kuis.waktu_mulai);
                  const endTime = new Date(kuis.waktu_selesai);
                  
                  let canTake = false;
                  let colorClass = "text-gray-400";
                  let statusText = "Belum Terbuka";
 
                  // 1. Cek Status Manual Admin
                  if (kuis.status_manual === 'OPEN') {
                    canTake = true;
                    statusText = "Tersedia (Dibuka Manual)";
                    colorClass = "text-blue-600 font-bold";
                  } else if (kuis.status_manual === 'CLOSED') {
                    canTake = false;
                    statusText = "Ditutup (Manual)";
                    colorClass = "text-red-500";
                  } else {
                    // 2. Status AUTO (Berdasarkan Waktu)
                    if (now > endTime) {
                      statusText = "Sudah Terlewat";
                      colorClass = "text-red-500";
                      canTake = false;
                    } else if (now >= startTime) {
                      statusText = "Tersedia";
                      colorClass = "text-blue-600 font-bold";
                      canTake = true;
                    }
                  }

                  // 3. Cek Status Pengerjaan (Override)
                  if (statusPengerjaan?.status === 'SUBMITTED') {
                    statusText = `Selesai (Skor: ${statusPengerjaan.nilai})`;
                    colorClass = "text-green-600 font-bold";
                    canTake = false;
                  } else if (statusPengerjaan?.status === 'DRAFT' && kuis.status_manual !== 'CLOSED' && (kuis.status_manual === 'OPEN' || (now >= startTime && now <= endTime))) {
                    statusText = "Sedang Dikerjakan";
                    colorClass = "text-orange-500 font-bold";
                    canTake = true;
                  }

                  return (
                    <tr key={idKuis} className="hover:bg-foreground/5 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground">{kuis.judul}</p>
                        <p className="text-xs text-foreground/40 line-clamp-1">{kuis.deskripsi || 'Kuis online'}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-foreground/30 font-medium">
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
                            className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-lg shadow-purple-600/20"
                          >
                            {statusPengerjaan?.status === 'DRAFT' ? 'Lanjutkan' : 'Mulai Kuis'}
                          </Link>
                        ) : (
                          <button disabled className="bg-foreground/5 text-foreground/20 text-xs font-bold px-4 py-2 rounded-lg cursor-not-allowed">
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
