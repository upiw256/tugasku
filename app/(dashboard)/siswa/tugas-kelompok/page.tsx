import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Tugas, Nilai, Member, User, Kelompok } from '@/models';
import { redirect } from 'next/navigation';
import TaskSubmissionForm from '@/components/ui/TaskSubmissionForm';
import ImagePreview from '@/components/ui/ImagePreview';

const getSafeFileUrl = (url: string) => {
  if (!url) return '';
  return url.startsWith('/api') ? url : `/api${url.startsWith('/') ? '' : '/'}${url}`;
};

export default async function HalamanTugasKelompok() {
  const session = await auth();
  if (!session || session.user.role !== 'siswa') redirect('/login');

  await connectDB();

  const userDoc = await User.findOne({ user: session.user.email });
  if (!userDoc?.member_id) {
    return <div className="p-8 text-red-500 font-bold">Data siswa tidak ditemukan. Hubungi Admin.</div>;
  }

  const member = await Member.findById(userDoc.member_id);
  if (!member) return <div className="p-8 text-red-500 font-bold">Profil siswa belum terhubung.</div>;

  // Ambil semua tugas tipe kelompok di kelas ini
  const tugasKelompokList = await Tugas.find({
    tipe_tugas: 'kelompok',
    $or: [
      { kelas: member.kelas },
      { kelas: { $in: [member.kelas] } }
    ]
  }).sort({ deadline: -1 }).lean();

  // Untuk setiap tugas, cari kelompok yang mengandung member ini
  // Pendekatan: query langsung ke DB per tugas agar lebih akurat
  const tugasWithKelompok: any[] = [];

  for (const tugas of tugasKelompokList) {
    // Cari kelompok yang terhubung ke tugas ini DAN mengandung member (anggota atau ketua)
    let kelompok = await Kelompok.findOne({
      tugas_id: (tugas as any)._id,
      $or: [
        { anggota: member._id },
        { ketua: member._id }
      ]
    }).lean();

    // Fallback: kelompok umum tanpa tugas_id di kelas yang sama
    if (!kelompok) {
      const kelasStr = Array.isArray((tugas as any).kelas) ? (tugas as any).kelas[0] : (tugas as any).kelas;
      kelompok = await Kelompok.findOne({
        $and: [
          {
            $or: [
              { tugas_id: { $exists: false } },
              { tugas_id: null }
            ]
          },
          {
            $or: [
              { anggota: member._id },
              { ketua: member._id }
            ]
          }
        ],
        kelas: kelasStr
      } as any).lean();
    }

    if (kelompok) {
      tugasWithKelompok.push({ tugas, kelompok });
    }
  }

  // Cek apakah member adalah ketua dari kelompok manapun (untuk header)
  const anyKetuaGroup = await Kelompok.findOne({ ketua: member._id });
  const isKetuaGlobal = !!anyKetuaGroup;

  // Ambil submissions untuk semua tugas kelompok ini
  const allTaskIds = tugasKelompokList.map((t: any) => t._id);
  const mySubmissions = await Nilai.find({
    member_id: member._id,
    tugas_id: { $in: allTaskIds }
  }).lean();

  const submissionMap = new Map(mySubmissions.map((s: any) => [s.tugas_id.toString(), s]));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-end border-b border-border-custom pb-4 gap-2 px-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isKetuaGlobal ? '👑 Tugas Kelompok' : '👥 Tugas Kelompok'}
          </h1>
          <p className="text-foreground/60 text-sm mt-1">
            {isKetuaGlobal
              ? <span>Anda adalah <span className="font-bold text-amber-400">Ketua Kelompok</span> — anda bisa mengumpulkan tugas untuk seluruh anggota.</span>
              : <span>Kelas: <span className="font-bold text-primary-500 px-2 py-0.5 bg-primary-500/10 rounded">{member.kelas}</span> — Hanya ketua yang bisa mengumpulkan.</span>
            }
          </p>
        </div>
      </header>

      {tugasWithKelompok.length === 0 ? (
        <div className="py-16 text-center text-foreground/20 bg-foreground/5 rounded-xl border-2 border-dashed border-border-custom">
          <span className="text-4xl block mb-2">👥</span>
          <p className="text-lg font-medium text-foreground/40">Tidak ada tugas kelompok saat ini.</p>
          <p className="text-sm text-foreground/20 mt-1">
            {tugasKelompokList.length === 0
              ? 'Belum ada tugas kelompok yang dibuat untuk kelas kamu.'
              : `Ada ${tugasKelompokList.length} tugas kelompok namun kamu belum terdaftar di kelompok manapun. Hubungi Admin.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
          {tugasWithKelompok.map(({ tugas, kelompok }: any) => {
            const submission = submissionMap.get(tugas._id.toString());
            const isDone = !!submission?.file_url || ((submission?.nilai ?? 0) > 0);
            const deadline = new Date(tugas.deadline);
            const isLate = !isDone && new Date() > deadline;
            const isClosed = tugas.is_active === false;
            const isKetua = kelompok?.ketua?.toString() === member._id.toString();

            return (
              <div key={tugas._id.toString()} className="bg-surface rounded-2xl shadow-sm border border-border-custom overflow-hidden flex flex-col h-full transition hover:shadow-md">
                {/* Top colored bar */}
                <div className={`h-1.5 w-full ${isClosed && !isDone ? 'bg-foreground/20' : isDone ? 'bg-emerald-500' : isLate ? 'bg-danger-500' : 'bg-primary-500'}`} />

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div>
                      <h3 className="font-bold leading-snug text-foreground">{tugas.judul}</h3>
                      <p className="text-[11px] text-primary-500 font-bold bg-primary-500/10 px-2 py-0.5 rounded inline-block mt-1">
                        👥 {kelompok?.nama_kelompok}
                        {isKetua && <span className="ml-1 text-amber-400">👑 Ketua</span>}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded border uppercase ${isDone ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : isClosed ? 'bg-danger-500/10 text-danger-500 border-danger-500/20' : isLate ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-primary-500/10 text-primary-500 border-primary-500/20'}`}>
                      {isDone ? '✅ Selesai' : isClosed ? '🔒 Ditutup' : isLate ? '⚠️ Terlambat' : '📤 Belum'}
                    </span>
                  </div>

                  <p className="text-sm text-foreground/60 mb-4 line-clamp-2 leading-relaxed">
                    {tugas.deskripsi || <span className="italic text-foreground/20">Tidak ada deskripsi.</span>}
                  </p>

                  {/* Preview file jika sudah upload */}
                  {isDone && submission?.file_url && (
                    <div className="mb-4">
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border-custom shadow-inner">
                        {submission.file_url.endsWith('.pdf') ? (
                          <a href={getSafeFileUrl(submission.file_url)} target="_blank" className="flex h-full items-center justify-center bg-danger-500/5 text-danger-500 gap-2 text-sm font-bold">
                            📄 Lihat PDF
                          </a>
                        ) : (
                          <ImagePreview src={getSafeFileUrl(submission.file_url)} className="w-full h-28" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Nilai jika sudah dinilai */}
                  {(submission?.nilai ?? 0) > 0 && (
                    <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                      <span className="text-xs font-bold text-emerald-500">🏆 Nilai:</span>
                      <span className="font-black text-lg text-emerald-500">{submission!.nilai}</span>
                    </div>
                  )}

                  {/* Deadline Info */}
                  <div className="text-[11px] text-foreground/40 mb-4 flex items-center gap-1.5 bg-foreground/5 p-2 rounded-lg">
                    <span>📅 Deadline:</span>
                    <span className={`font-bold ${isLate ? 'text-danger-500' : 'text-foreground/70'}`}>
                      {deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Action Area */}
                  <div className="mt-auto pt-4 border-t border-border-custom">
                    {isKetua ? (
                      isClosed ? (
                        <div className="p-4 bg-foreground/5 border border-border-custom rounded-xl text-center space-y-1">
                          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">🚫 Akses Ditutup</p>
                          <p className="text-[10px] text-foreground/20">Pengumpulan tidak lagi diizinkan.</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] text-foreground/40 mb-2 font-bold uppercase tracking-wider">Upload mewakili kelompok:</p>
                          <TaskSubmissionForm tugasId={tugas._id.toString()} />
                        </div>
                      )
                    ) : (
                      <div className={`p-4 rounded-xl text-center border border-dashed ${isDone ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-foreground/5 border-border-custom'}`}>
                        {isDone ? (
                          <div>
                            <p className="text-xs font-bold text-emerald-500">✅ Ketua sudah mengumpulkan</p>
                            <p className="text-[10px] text-foreground/40 mt-1">Tugas telah dikirimkan oleh ketua kelompok Anda.</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-bold text-foreground/40 uppercase">⏳ Menunggu Ketua</p>
                            <p className="text-[10px] text-foreground/30 mt-1">Hanya ketua yang bisa mengumpulkan tugas ini.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
