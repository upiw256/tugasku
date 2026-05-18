import { connectDB } from '@/lib/db';
import { Nilai, Tugas, Member } from '@/models';
import Link from 'next/link';
import ImagePreview from '@/components/ui/ImagePreview';
import SmartNote from '@/components/ui/LinkPreview';
import QuickGrade from '@/components/ui/QuickGrade';
import OfflineGradeManager from '@/components/admin/OfflineGradeManager';
import StaggerList from '@/components/ui/StaggerList';

const formatDate = (date: Date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isPdf = (url: string) => url?.toLowerCase()?.endsWith('.pdf') || false;

export default async function HalamanPengumpulan({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await connectDB();
  const { id: tugasId } = await params;

  if (!tugasId.match(/^[0-9a-fA-F]{24}$/)) {
    return <div className="p-8 text-red-500 font-bold">⚠️ ID Tugas tidak valid.</div>;
  }

  const tugas = await Tugas.findById(tugasId);
  if (!tugas) return <div className="p-8 text-gray-500">Tugas Tidak Ditemukan</div>;

  const isOffline = tugas.tipe_pengumpulan === 'offline';
  
  let displayData = [];

  if (isOffline) {
    // Ambil semua siswa di kelas yang ditentukan
    const classes = Array.isArray(tugas.kelas) ? tugas.kelas : [tugas.kelas];
    const allStudents = await Member.find({ kelas: { $in: classes } }).sort({ nama_lengkap: 1 }).lean();
    
    // Ambil nilai yang sudah ada
    const existingGrades = await Nilai.find({ tugas_id: tugasId }).lean();
    const gradesMap = new Map(existingGrades.map(g => [g.member_id.toString(), g]));

    // Gabungkan: Setiap siswa harus muncul
    displayData = allStudents.map(student => {
      const grade = gradesMap.get(student._id.toString());
      return {
        _id: grade?._id || `temp-${student._id}`,
        member_id: student,
        nilai: grade?.nilai || 0,
        tanggal_mengumpulkan: grade?.tanggal_mengumpulkan,
        file_url: grade?.file_url,
        catatan_siswa: grade?.catatan_siswa,
        // Properti tambahan untuk identifikasi di QuickGrade yang butuh member_id jika record Nilai belum ada
        isNew: !grade,
        tugas_id: tugasId
      };
    });
  } else {
    displayData = await Nilai.find({ tugas_id: tugasId })
      .populate('member_id')
      .sort({ tanggal_mengumpulkan: -1 })
      .lean();
  }

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      <div className="flex justify-between items-start px-2 md:px-0">
        <div>
          <Link href="/admin/tugas" className="text-xs text-foreground/40 hover:text-primary-500 mb-2 inline-flex items-center gap-1">
            ← Kembali
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{tugas.judul}</h1>
          <div className="flex flex-wrap gap-2 mt-2 text-[10px] md:text-sm text-foreground/60">
            <span className="bg-primary-500/10 text-primary-500 px-2 py-1 rounded border border-primary-500/20 font-medium">
              Total: {displayData.length} {isOffline ? 'Siswa' : 'Pengumpulan'}
            </span>
            <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20 font-medium">
              Kelas: {Array.isArray(tugas.kelas) ? tugas.kelas.join(', ') : tugas.kelas}
            </span>
          </div>
        </div>
      </div>

      {isOffline && (
        <OfflineGradeManager tugasId={tugasId} />
      )}

      {/* TAMPILAN DESKTOP - Perbaikan Struktur Tabel agar tidak Hydration Error */}
      <div className="hidden md:block bg-surface rounded-xl shadow border border-border-custom overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-foreground/5 text-foreground/70 uppercase font-bold border-b border-border-custom text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4 w-10 text-center">No</th>
              <th className="px-6 py-4">Nama Siswa</th>
              {!isOffline && <th className="px-6 py-4 text-center">Bukti / File</th>}
              {!isOffline && <th className="px-6 py-4">Waktu Kirim</th>}
              {!isOffline && <th className="px-6 py-4">Catatan</th>}
              <th className="px-6 py-4 text-center">Nilai</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <StaggerList as="tbody" selector=".tr-stagger" className="divide-y divide-border-custom">
            {displayData.map((item: any, index: number) => {
              const siswa = item.member_id;
              if (!siswa) return null;
              return (
                <tr key={item._id.toString()} className="tr-stagger opacity-0 hover:bg-foreground/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-foreground/20 text-center">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{siswa.nama_lengkap}</div>
                    <div className="text-[11px] text-foreground/40 uppercase">{siswa.nis} • {siswa.kelas}</div>
                  </td>
                  {!isOffline && (
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {item.file_url ? (
                          isPdf(item.file_url) ? (
                            <a href={item.file_url} target="_blank" className="w-12 h-12 bg-danger-500/10 border border-danger-500/20 rounded flex flex-col items-center justify-center">
                              <span className="text-lg">📄</span>
                              <span className="text-[8px] text-danger-600 font-bold tracking-tighter">PDF</span>
                            </a>
                          ) : (
                            <div className="w-12 h-12 shadow-sm border border-border-custom rounded overflow-hidden">
                              <ImagePreview src={`/api${item.file_url}`} className="w-full h-full object-cover" />
                            </div>
                          )
                        ) : <span className="text-[10px] text-foreground/20 italic">-</span>}
                      </div>
                    </td>
                  )}
                  {!isOffline && <td className="px-6 py-4 text-foreground/60 text-xs">{formatDate(item.tanggal_mengumpulkan)}</td>}
                  {!isOffline && <td className="px-6 py-4"><SmartNote text={item.catatan_siswa || ""} limit={20} /></td>}
                  <td className="px-6 py-4 text-center">
                    {/* KLIK NILAI LANGSUNG */}
                    <QuickGrade 
                      submissionId={item._id.toString()} 
                      currentNilai={item.nilai} 
                      memberId={item.isNew ? item.member_id._id.toString() : undefined}
                      tugasId={item.isNew ? item.tugas_id.toString() : undefined}
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/admin/siswa/${siswa._id}/nilai`} className="bg-primary-600 text-white px-3 py-1.5 rounded-md text-[11px] font-bold shadow-lg shadow-primary-500/20">Detail ↗</Link>
                  </td>
                </tr>
              );
            })}
          </StaggerList>
        </table>
      </div>

      {/* MOBILE (Grid) - Tidak terpengaruh Table Hydration Error */}
      <StaggerList className="grid grid-cols-1 gap-4 md:hidden px-2">
        {displayData.map((item: any, index: number) => {
          const siswa = item.member_id;
          if (!siswa) return null;
          return (
            <div key={item._id.toString()} className="stagger-item opacity-0 bg-surface rounded-2xl border border-border-custom shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 bg-foreground/5 flex justify-between items-center border-b border-border-custom">
                <span className="text-[10px] font-bold text-foreground/30">#{index + 1} — {siswa.kelas}</span>
                <QuickGrade 
                  submissionId={item._id.toString()} 
                  currentNilai={item.nilai} 
                  memberId={item.isNew ? item.member_id._id.toString() : undefined}
                  tugasId={item.isNew ? item.tugas_id.toString() : undefined}
                />
              </div>
              <div className="p-4 flex gap-4">
                {!isOffline && (
                  <div className="shrink-0">
                    {item.file_url ? (
                      isPdf(item.file_url) ? (
                        <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center">
                          <span className="text-xl">📄</span>
                          <span className="text-[9px] text-red-600 font-bold">PDF</span>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                          <ImagePreview src={`/api${item.file_url}`} className="w-full h-full object-cover" />
                        </div>
                      )
                    ) : <div className="w-16 h-16 bg-gray-50 rounded-xl border border-dashed flex items-center justify-center text-[10px] text-gray-300">N/A</div>}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground text-sm truncate">{siswa.nama_lengkap}</h3>
                  <p className="text-[10px] text-foreground/40">{siswa.nis}</p>
                  {!isOffline && <p className="text-[9px] text-primary-500 font-medium mt-1">{formatDate(item.tanggal_mengumpulkan)}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </StaggerList>
    </div>
  );
}