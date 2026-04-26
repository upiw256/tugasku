import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { SoalPG, Member, PengerjaanKuis, User } from '@/models';
import { redirect } from 'next/navigation';
import QuizPengerjaan from '@/components/siswa/QuizPengerjaan';

export default async function QuizDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  const { id } = await params;
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
        <h2 className="text-2xl font-bold text-gray-800">Kuis Sedang Ditutup</h2>
        <p className="text-gray-500">Kuis ini belum dimulai atau sudah berakhir.</p>
        <a href="/siswa/kuis" className="inline-block text-purple-600 font-bold hover:underline">Kembali ke Daftar Kuis</a>
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
      <div className="p-10 text-center space-y-6 bg-white rounded-2xl shadow-sm border mt-10">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-800">Kuis Sudah Dikerjakan</h2>
        <div className="bg-green-50 p-6 rounded-xl inline-block border border-green-200">
           <p className="text-sm text-green-600 font-medium">Skor Anda:</p>
           <p className="text-4xl font-black text-green-700">{pengerjaan.nilai}</p>
        </div>
        <br />
        <a href="/siswa/kuis" className="inline-block px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition">Kembali</a>
      </div>
    );
  }

  // Jika belum ada, buat draft pengerjaan
  if (!pengerjaan) {
    // Note: Creating in Page component is usually bad practice, 
    // but for simple logic we can do it via a separate API call later or here if we use .create
    // Better: the QuizPengerjaan component will handle initial save if needed.
    // For now, pass empty object for answers.
  }

  // Serialisasi data untuk Client Component
  const serializedKuis = JSON.parse(JSON.stringify(kuis));
  const initialJawaban = pengerjaan?.jawaban || {};

  return (
    <QuizPengerjaan 
      kuis={serializedKuis} 
      initialJawaban={initialJawaban} 
      memberId={student._id.toString()} 
    />
  );
}
