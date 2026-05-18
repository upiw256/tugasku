import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { PengerjaanKuis, Member, User, SoalPG } from '@/models';
import { redirect } from 'next/navigation';
import QuizHistoryTable from '@/components/ui/QuizHistoryTable';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import MapelFilterSiswa from '@/components/siswa/MapelFilterSiswa';

export default async function SiswaNilaiPage({
  searchParams
}: {
  searchParams: Promise<{ mapel?: string }>
}) {
  const session = await auth();
  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  await connectDB();
  const params = await searchParams;
  const selectedMapel = params.mapel || '';

  const currentUser = await User.findById(session.user.id).lean();
  const student = await Member.findById(currentUser?.member_id).lean();

  if (!student) {
    return <div className="p-10 text-center">Data siswa tidak ditemukan.</div>;
  }

  // Cari Mapel yang tersedia di kuis untuk siswa ini
  const allClassQuizzes = await SoalPG.find({
    $or: [{ kelas: student.kelas }, { kelas: { $in: [student.kelas] } }]
  }).select('mapel').lean();
  const listMapel = Array.from(new Set(allClassQuizzes.map((k: any) => k.mapel).filter(Boolean))) as string[];

  // Ambil semua pengerjaan kuis yang sudah disubmit
  // Filter by Mapel if selected
  const historyRaw = await PengerjaanKuis.find({ 
    member_id: student._id, 
    status: 'SUBMITTED' 
  })
    .populate({
        path: 'kuis_id',
        match: selectedMapel ? { mapel: selectedMapel } : {}
    })
    .sort({ updatedAt: -1 })
    .lean() as any[];

  // Filter out the ones where kuis_id is null (due to match filter)
  const filteredHistoryRaw = historyRaw.filter(h => h.kuis_id !== null);

  // Serialisasi data agar aman dikirim ke Client Component
  const history = filteredHistoryRaw.map(h => {
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
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-700 to-teal-500 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-500/20 mx-2">
        <div className="relative z-10">
          <h1 className="text-4xl font-black uppercase tracking-tight">Rekap Nilai Kuis</h1>
          <p className="opacity-90 mt-2 text-emerald-50 font-medium">Pantau progres belajarmu dari hasil kuis yang telah dikerjakan.</p>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </header>

      <div className="space-y-4 px-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 px-2">Filter Mata Pelajaran</h2>
        <MapelFilterSiswa listMapel={listMapel.sort()} currentMapel={selectedMapel} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        <div className="bg-surface p-6 rounded-xl border border-border-custom shadow-sm">
           <p className="text-sm text-foreground/40 font-medium">Total Kuis</p>
           <p className="text-3xl font-bold text-foreground">
             <AnimatedNumber value={history.length} />
           </p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border-custom shadow-sm">
           <p className="text-sm text-foreground/40 font-medium">Rata-rata Nilai</p>
           <p className="text-3xl font-bold text-emerald-500">
             <AnimatedNumber 
               value={history.length > 0 
                 ? Math.round(history.reduce((a, b) => a + (b.nilai || 0), 0) / history.length) 
                 : 0} 
             />
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
