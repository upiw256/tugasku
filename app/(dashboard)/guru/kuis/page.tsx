import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru, SoalPG, PengerjaanKuis, Member } from '@/models';
import { redirect } from 'next/navigation';
import KuisManager from '@/components/admin/KuisManager';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function GuruKuisPage({
    searchParams
}: {
    searchParams: Promise<{ mapel?: string }>
}) {
  noStore();
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  
  const guru_id = (session.user as any).guru_id;
  const params = await searchParams;
  const selectedMapel = params.mapel || '';

  await connectDB();
  
  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) redirect('/login');

  // Filter kuis berdasarkan guru dan mapel
  const query: any = { guru_id };
  if (selectedMapel) {
      query.mapel = selectedMapel;
  }

  const dataKuis = await SoalPG.find(query).sort({ tanggal_dibuat: -1 }).lean();
  
  const existingKuis = await Promise.all(dataKuis.map(async (k: any) => {
    const sudahAdaJawaban = await PengerjaanKuis.exists({ kuis_id: k._id });
    return {
      _id: k._id.toString(),
      judul: k.judul || "Tanpa Judul",
      deskripsi: k.deskripsi || "",
      kelas: k.kelas || [],
      mapel: k.mapel || "Umum",
      daftar_soal: k.daftar_soal || [],
      waktu_mulai: k.waktu_mulai ? k.waktu_mulai.toISOString() : new Date().toISOString(),
      waktu_selesai: k.waktu_selesai ? k.waktu_selesai.toISOString() : new Date().toISOString(),
      status_manual: k.status_manual || 'AUTO',
      sudahAdaJawaban: !!sudahAdaJawaban
    };
  }));

  const serializedKuis = JSON.parse(JSON.stringify(existingKuis));

  // Ambil list kelas diampu
  let availableClasses: string[] = [];
  if (selectedMapel) {
      const p = (guruInfo as any).pengajaran.find((item: any) => item.mapel === selectedMapel);
      if (p) availableClasses = p.kelas;
  } else {
      const allCls = new Set<string>();
      (guruInfo as any).pengajaran.forEach((p: any) => p.kelas.forEach((c: string) => allCls.add(c)));
      availableClasses = Array.from(allCls);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl shadow-sm border border-border-custom">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Kelola Kuis PG</h1>
          <p className="text-foreground/60 text-sm">Buat dan monitor kuis untuk {selectedMapel || 'seluruh mata pelajaran'}.</p>
        </div>
      </div>

      {!selectedMapel ? (
        <div className="bg-primary-500/10 border border-primary-500/20 p-6 rounded-2xl text-center">
            <p className="text-primary-600 font-bold mb-2">💡 Pilih Mata Pelajaran</p>
            <p className="text-foreground/50 text-xs">Silakan pilih mata pelajaran di bagian atas untuk mulai mengelola kuis spesifik.</p>
        </div>
      ) : (
        <KuisManager 
            availableClasses={availableClasses} 
            initialKuis={serializedKuis} 
            fixedMapel={selectedMapel}
            fixedGuruId={guru_id}
        />
      )}
    </div>
  );
}
