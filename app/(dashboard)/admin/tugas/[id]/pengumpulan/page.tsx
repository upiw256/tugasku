import { connectDB } from '@/lib/db';
import { Nilai, Tugas } from '@/models';
import Link from 'next/link';
import ImagePreview from '@/components/ui/ImagePreview';
import SmartNote from '@/components/ui/LinkPreview';

// --- HELPER 1: Format Tanggal ---
const formatDate = (date: Date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'short', // Disingkat agar hemat ruang di mobile
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isPdf = (url: string) => url?.toLowerCase().endsWith('.pdf');

export default async function HalamanPengumpulan({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id: tugasId } = await params;

  if (!tugasId.match(/^[0-9a-fA-F]{24}$/)) {
    return <div className="p-8 text-red-500 font-bold">⚠️ ID Tugas tidak valid.</div>;
  }

  const tugas = await Tugas.findById(tugasId);
  if (!tugas) return <div className="p-8 text-gray-500">Tugas Tidak Ditemukan</div>;

  const submissions = await Nilai.find({ tugas_id: tugasId })
    .populate('member_id')
    .sort({ tanggal_mengumpulkan: -1 });

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* HEADER */}
      <div className="flex justify-between items-start px-2 md:px-0">
        <div>
          <Link href="/admin/tugas" className="text-xs text-gray-500 hover:text-blue-600 mb-2 inline-flex items-center gap-1">
            ← Kembali
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">{tugas.judul}</h1>
          <div className="flex flex-wrap gap-2 mt-2 text-[10px] md:text-sm text-gray-600">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-medium">
              Total: {submissions.length} Siswa
            </span>
            <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100 font-medium">
              Kelas: {Array.isArray(tugas.kelas) ? tugas.kelas.join(', ') : tugas.kelas}
            </span>
          </div>
        </div>
      </div>

      {/* TAMPILAN DESKTOP (Tabel Muncul di Layar MD ke atas) */}
      <div className="hidden md:block bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4 w-10">No</th>
              <th className="px-6 py-4">Nama Siswa</th>
              <th className="px-6 py-4 text-center">Bukti / File</th>
              <th className="px-6 py-4">Waktu Kirim</th>
              <th className="px-6 py-4">Catatan</th>
              <th className="px-6 py-4">Nilai</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map((item: any, index: number) => {
              const siswa = item.member_id;
              if (!siswa) return null;
              return (
                <tr key={item._id.toString()} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{siswa.nama_lengkap}</div>
                    <div className="text-[11px] text-gray-500 uppercase">{siswa.nis} • {siswa.kelas}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {/* Render File Preview Desktop */}
                    <div className="flex justify-center">
                      {item.file_url ? (
                        isPdf(item.file_url) ? (
                          <a href={item.file_url} target="_blank" className="w-12 h-12 bg-red-50 border border-red-200 rounded flex flex-col items-center justify-center">
                            <span className="text-lg">📄</span>
                            <span className="text-[8px] text-red-600 font-bold tracking-tighter">PDF</span>
                          </a>
                        ) : (
                          <div className="w-12 h-12 shadow-sm border border-gray-200 rounded overflow-hidden">
                            <ImagePreview src={item.file_url} className="w-full h-full" />
                          </div>
                        )
                      ) : <span className="text-[10px] text-gray-300 italic">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{formatDate(item.tanggal_mengumpulkan)}</td>
                  <td className="px-6 py-4 min-w-[200px]"><SmartNote text={item.catatan_siswa} limit={20} /></td>
                  <td className="px-6 py-4 text-center">
                    {item.nilai > 0 ? (
                      <span className="text-green-700 font-black bg-green-100 px-2 py-1 rounded border border-green-200">{item.nilai}</span>
                    ) : <span className="text-orange-400 text-[10px] bg-orange-50 px-2 py-1 rounded border border-orange-100">PENDING</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/admin/siswa/${siswa._id}/nilai`} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-[11px] font-bold">Nilai ↗</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TAMPILAN MOBILE (Muncul di Layar Kecil) */}
      <div className="grid grid-cols-1 gap-4 md:hidden px-2">
        {submissions.map((item: any, index: number) => {
          const siswa = item.member_id;
          if (!siswa) return null;
          return (
            <div key={item._id.toString()} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="p-3 bg-gray-50/50 flex justify-between items-center border-b">
                <span className="text-[10px] font-bold text-gray-400">#{index + 1} — {siswa.kelas}</span>
                {item.nilai > 0 ? (
                  <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-black border border-green-200">
                    NILAI: {item.nilai}
                  </div>
                ) : (
                  <span className="text-[9px] font-bold bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full border border-orange-100 animate-pulse">PENDING</span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex gap-4">
                <div className="shrink-0">
                  {item.file_url ? (
                    isPdf(item.file_url) ? (
                      <a href={item.file_url} target="_blank" className="w-16 h-16 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-xl">📄</span>
                        <span className="text-[9px] text-red-600 font-bold">PDF</span>
                      </a>
                    ) : (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <ImagePreview src={item.file_url} className="w-full h-full" />
                      </div>
                    )
                  ) : <div className="w-16 h-16 bg-gray-50 rounded-xl border border-dashed flex items-center justify-center text-[10px] text-gray-300">N/A</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{siswa.nama_lengkap}</h3>
                  <p className="text-[10px] text-gray-500">{siswa.nis}</p>
                  <p className="text-[9px] text-blue-500 font-medium mt-1">{formatDate(item.tanggal_mengumpulkan)}</p>
                </div>
              </div>

              {/* Catatan Section */}
              <div className="px-4 pb-4">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                   <SmartNote text={item.catatan_siswa} limit={40} />
                </div>
                <Link
                  href={`/admin/siswa/${siswa._id}/nilai`}
                  className="mt-3 flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-100"
                >
                  Beri Nilai Siswa ↗
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}