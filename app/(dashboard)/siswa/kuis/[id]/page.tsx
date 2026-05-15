import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { SoalPG, Member, PengerjaanKuis, User } from '@/models';
import { redirect } from 'next/navigation';
import QuizPengerjaan from '@/components/siswa/QuizPengerjaan';

export default async function QuizDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth();
  
  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  const id = (await params).id;
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

  const kuis = await SoalPG.findById(id).lean();
  if (!kuis) {
    return <div className="p-10 text-center">Kuis tidak ditemukan.</div>;
  }

  // Cek apakah kuis ini untuk kelas siswa
  const isForClass = Array.isArray(kuis.kelas) 
    ? kuis.kelas.includes(student.kelas) 
    : kuis.kelas === student.kelas;

  if (!isForClass) {
    return <div className="p-10 text-center text-red-500 font-bold">Maaf, kuis ini tidak diperuntukkan bagi kelas Anda.</div>;
  }

  // Cek Waktu & Status Manual
  const now = new Date();
  const startTime = new Date(kuis.waktu_mulai);
  const endTime = new Date(kuis.waktu_selesai);
  
  let isAvailable = false;
  if (kuis.status_manual === 'OPEN') isAvailable = true;
  else if (kuis.status_manual === 'CLOSED') isAvailable = false;
  else {
    isAvailable = now >= startTime && now <= endTime;
  }

  if (!isAvailable) {
    return (
      <div className="p-10 text-center space-y-4">
        <div className="text-4xl">🔒</div>
        <h2 className="text-2xl font-bold text-foreground">Kuis Sedang Ditutup</h2>
        <p className="text-foreground/40 font-medium">Kuis ini belum dimulai atau sudah berakhir.</p>
        <a href="/siswa/kuis" className="inline-block text-primary-500 font-bold hover:underline">Kembali ke Daftar Kuis</a>
      </div>
    );
  }

  // Ambil atau buat status pengerjaan
  let pengerjaan = await PengerjaanKuis.findOne({ 
    kuis_id: kuis._id, 
    member_id: student._id 
  }).lean();

  if (pengerjaan?.status === 'SUBMITTED') {
    return (
      <div className="p-10 text-center space-y-6 bg-surface rounded-2xl shadow-sm border border-border-custom mt-10">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-foreground">Kuis Sudah Dikerjakan</h2>
        <div className="bg-emerald-500/10 p-6 rounded-xl inline-block border border-emerald-500/20">
           <p className="text-sm text-emerald-500 font-medium">Skor Anda:</p>
           <p className="text-4xl font-black text-emerald-500">{pengerjaan.nilai}</p>
        </div>
        <br />
        <a href="/siswa/kuis" className="inline-block px-6 py-2 bg-foreground/5 text-foreground/40 rounded-lg font-bold hover:bg-foreground/10 transition">Kembali</a>
      </div>
    );
  }

  // Jika belum ada pengerjaan, buat track record baru agar waktu mulai tercatat
  if (!pengerjaan) {
    pengerjaan = await PengerjaanKuis.create({
      kuis_id: kuis._id,
      member_id: student._id,
      status: 'DRAFT',
      mulai_mengerjakan: new Date(),
      jawaban: {}
    });
  }

  // HITUNG SISA WAKTU (Agar waktu terus berjalan meski pindah page)
  const durasiKuisDetik = (kuis.durasi || 60) * 60;
  const mulaiAt = pengerjaan.mulai_mengerjakan ? new Date(pengerjaan.mulai_mengerjakan) : new Date();
  const detikBerlalu = Math.floor((new Date().getTime() - mulaiAt.getTime()) / 1000);
  
  // Batas 1: Durasi pengerjaan sejak klik mulai
  let sisaDetik = Math.max(0, durasiKuisDetik - detikBerlalu);

  // Batas 2: Waktu selesai global kuis (hanya berlaku jika status adalah AUTO)
  // Jika OPEN manual, kita abaikan jadwal global agar siswa tetap bisa mengerjakan sampai durasinya habis
  let initialTimeLeft = sisaDetik;
  
  if (kuis.status_manual !== 'OPEN') {
    const sisaDetikGlobal = Math.max(0, Math.floor((endTime.getTime() - new Date().getTime()) / 1000));
    initialTimeLeft = Math.min(sisaDetik, sisaDetikGlobal);
  }

  // Serialisasi data untuk Client Component
  const serializedKuis = JSON.parse(JSON.stringify(kuis));
  const initialJawaban = pengerjaan?.jawaban || {};

  return (
    <QuizPengerjaan 
      kuis={serializedKuis} 
      initialJawaban={initialJawaban} 
      memberId={student._id.toString()} 
      initialTimeLeft={initialTimeLeft}
    />
  );
}
