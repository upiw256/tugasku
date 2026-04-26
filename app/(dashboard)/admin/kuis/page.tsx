import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Member, SoalPG, PengerjaanKuis } from '@/models';
import { redirect } from 'next/navigation';
import KuisManager from '@/components/admin/KuisManager';

export default async function AdminKuisPage() {
  const session = await auth();
  
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
    redirect('/login');
  }

  await connectDB();
  
  try {
    // Ambil daftar kelas yang tersedia
    const availableClasses = await Member.distinct('kelas');
    
    // Ambil kuis yang sudah ada
    const dataKuis = await SoalPG.find({}).sort({ tanggal_dibuat: -1 }).lean();

    // Cek apakah setiap kuis sudah ada pengerjaan
    const existingKuis = await Promise.all(dataKuis.map(async (k: any) => {
      const sudahAdaJawaban = await PengerjaanKuis.exists({ kuis_id: k._id });
      return {
        _id: k._id.toString(),
        judul: k.judul || "Tanpa Judul",
        deskripsi: k.deskripsi || "",
        kelas: k.kelas || [],
        daftar_soal: k.daftar_soal || [],
        waktu_mulai: k.waktu_mulai ? k.waktu_mulai.toISOString() : new Date().toISOString(),
        waktu_selesai: k.waktu_selesai ? k.waktu_selesai.toISOString() : new Date().toISOString(),
        sudahAdaJawaban: !!sudahAdaJawaban
      };
    }));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Kuis PG</h1>
          <p className="text-gray-500">Buat, edit, dan analisis kuis pilihan ganda</p>
        </div>
      </div>

      <KuisManager availableClasses={availableClasses} initialKuis={existingKuis} />
    </div>
  );
  } catch (error: any) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-red-500 font-bold text-xl">Terjadi Kesalahan Server</h1>
        <p className="text-gray-500 mt-2">{error.message}</p>
      </div>
    );
  }
}
