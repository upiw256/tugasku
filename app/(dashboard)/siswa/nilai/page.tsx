import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { PengerjaanKuis, Member, User } from '@/models';
import { redirect } from 'next/navigation';
import QuizHistoryTable from '@/components/ui/QuizHistoryTable';

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
  const historyRaw = await PengerjaanKuis.find({ 
    member_id: student._id, 
    status: 'SUBMITTED' 
  }).populate('kuis_id').sort({ updatedAt: -1 }).lean() as any[];

  // Serialisasi data agar aman dikirim ke Client Component
  const history = historyRaw.map(h => {
    const kuis = h.kuis_id;
    let benar = h.benar;
    let salah = h.salah;

    // Hitung ulang benar/salah jika tidak ada di DB (untuk data lama)
    if (benar === undefined || salah === undefined) {
      if (kuis && kuis.daftar_soal) {
        benar = 0;
        kuis.daftar_soal.forEach((soal: any) => {
          const jawabanSiswa = h.jawaban[soal.id] || h.jawaban[soal._id?.toString()];
          if (jawabanSiswa === soal.jawaban_benar) benar++;
        });
        salah = kuis.daftar_soal.length - benar;
      }
    }

    return JSON.parse(JSON.stringify({
      ...h,
      benar,
      salah
    }));
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 rounded-2xl text-white shadow-lg">
        <h1 className="text-3xl font-bold">Rekap Nilai Kuis</h1>
        <p className="opacity-90 mt-2 text-emerald-50">Pantau progres belajarmu dari hasil kuis yang telah dikerjakan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-6 rounded-xl border border-border-custom shadow-sm">
           <p className="text-sm text-foreground/40 font-medium">Total Kuis</p>
           <p className="text-3xl font-bold text-foreground">{history.length}</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border-custom shadow-sm">
           <p className="text-sm text-foreground/40 font-medium">Rata-rata Nilai</p>
           <p className="text-3xl font-bold text-emerald-500">
             {history.length > 0 
               ? Math.round(history.reduce((a, b) => a + (b.nilai || 0), 0) / history.length) 
               : 0}
           </p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border-custom shadow-sm">
           <p className="text-sm text-foreground/40 font-medium">Kuis Terakhir</p>
           <p className="text-sm font-bold text-foreground line-clamp-1">{history[0]?.kuis_id?.judul || '-'}</p>
        </div>
      </div>

      <QuizHistoryTable history={history} />
    </div>
  );
}
