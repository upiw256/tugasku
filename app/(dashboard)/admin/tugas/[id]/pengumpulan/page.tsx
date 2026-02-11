import { connectDB } from '@/lib/db';
import { Nilai, Tugas } from '@/models';
import Link from 'next/link';
import ImagePreview from '@/components/ui/ImagePreview';
import SmartNote from '@/components/ui/LinkPreview';

// --- HELPER 1: Format Tanggal ---
const formatDate = (date: Date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// --- HELPER 2: Cek apakah file PDF ---
const isPdf = (url: string) => {
  return url?.toLowerCase().endsWith('.pdf');
};

export default async function HalamanPengumpulan({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await connectDB();
  const { id: tugasId } = await params;

  // 1. Validasi ID
  if (!tugasId.match(/^[0-9a-fA-F]{24}$/)) {
    return <div className="p-8 text-red-500 font-bold">⚠️ ID Tugas tidak valid.</div>;
  }

  // 2. Cari Data Tugas
  const tugas = await Tugas.findById(tugasId);
  if (!tugas) return <div className="p-8 text-gray-500">Tugas Tidak Ditemukan</div>;

  // 3. Cari Pengumpulan
  const submissions = await Nilai.find({ tugas_id: tugasId })
    .populate('member_id')
    .sort({ tanggal_mengumpulkan: -1 });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/admin/tugas" className="text-sm text-gray-500 hover:text-blue-600 mb-2 inline-flex items-center gap-1">
            ← Kembali ke Daftar Tugas
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Pengumpulan: {tugas.judul}</h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
              Total: <b>{submissions.length}</b> Siswa
            </span>
            <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">
              Kelas: {Array.isArray(tugas.kelas) ? tugas.kelas.join(', ') : tugas.kelas}
            </span>
          </div>
        </div>
      </div>

      {/* TABEL */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
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

              const fileUrl = item.file_url; 
              const fileIsPdf = isPdf(fileUrl);

              return (
                <tr key={item._id.toString()} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-400">{index + 1}</td>
                  
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{siswa.nama_lengkap}</div>
                    <div className="text-[11px] text-gray-500 uppercase">{siswa.nis} • {siswa.kelas}</div>
                  </td>

                  {/* KOLOM PRATINJAU DENGAN IMAGE PREVIEW GLOBAL */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {fileUrl ? (
                        fileIsPdf ? (
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center w-14 h-14 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition shadow-sm group"
                          >
                            <span className="text-xl group-hover:scale-110 transition-transform">📄</span>
                            <span className="text-[9px] text-red-600 font-bold">PDF</span>
                          </a>
                        ) : (
                          <div className="w-14 h-14 shadow-sm border border-gray-200 rounded overflow-hidden">
                            <ImagePreview 
                              src={fileUrl} 
                              alt={`Tugas ${siswa.nama_lengkap}`} 
                              className="w-full h-full"
                            />
                          </div>
                        )
                      ) : (
                        <span className="text-[10px] text-gray-300 italic px-2 py-1 border border-dashed border-gray-200 rounded">
                          Kosong
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600 text-xs leading-relaxed">
                    {formatDate(item.tanggal_mengumpulkan)}
                  </td>
                  
                  <td className="px-6 py-4 align-top min-w-[250px]">
                    <div className="max-w-[320px]">
                      {item.catatan_siswa ? (
                        <SmartNote text={item.catatan_siswa} limit={20} />
                      ) : (
                        <span className="text-gray-300 italic text-[11px]">Tanpa catatan</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {item.nilai > 0 ? (
                      <span className="inline-block min-w-8 text-center text-green-700 font-black bg-green-100 px-2 py-1 rounded shadow-sm border border-green-200">
                        {item.nilai}
                      </span>
                    ) : (
                      <span className="text-orange-400 font-medium text-[11px] bg-orange-50 px-2 py-1 rounded border border-orange-100">
                        Belum Dinilai
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/admin/siswa/${siswa._id}/nilai`}
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-[11px] font-bold shadow-sm transition-all active:scale-95"
                    >
                      Beri Nilai ↗
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}