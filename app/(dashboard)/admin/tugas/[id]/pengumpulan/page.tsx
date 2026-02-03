import { connectDB } from '@/lib/db';
import { Nilai, Tugas } from '@/models';
import Link from 'next/link';

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
  const resolvedParams = await params;
  const tugasId = resolvedParams.id;

  // 1. Validasi ID
  if (!tugasId.match(/^[0-9a-fA-F]{24}$/)) {
    return <div className="p-8 text-red-500 font-bold">⚠️ ID Tugas tidak valid.</div>;
  }

  // 2. Cari Data Tugas
  const tugas = await Tugas.findById(tugasId);
  if (!tugas) return <div className="p-8">Tugas Tidak Ditemukan</div>;

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
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b">
            <tr>
              <th className="px-6 py-3 w-10">No</th>
              <th className="px-6 py-3">Nama Siswa</th>
              <th className="px-6 py-3 text-center">Bukti / File</th>
              <th className="px-6 py-3">Waktu Kirim</th>
              <th className="px-6 py-3">Nilai</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map((item: any, index: number) => {
              const siswa = item.member_id;
              if (!siswa) return null; 

              const fileUrl = item.file_url; 
              const fileIsPdf = isPdf(fileUrl);

              return (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-gray-500">{index + 1}</td>
                  
                  <td className="px-6 py-3">
                    <div className="font-bold text-gray-800">{siswa.nama_lengkap}</div>
                    <div className="text-xs text-gray-500">{siswa.nis} - {siswa.kelas}</div>
                  </td>

                  {/* KOLOM PRATINJAU LOKAL */}
                  <td className="px-6 py-3 text-center align-middle">
                    {fileUrl ? (
                      <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block relative group"
                        title="Klik untuk melihat ukuran penuh"
                      >
                        {fileIsPdf ? (
                          <div className="flex flex-col items-center justify-center w-16 h-16 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition">
                            <span className="text-2xl">📄</span>
                            <span className="text-[10px] text-red-600 font-bold">PDF</span>
                          </div>
                        ) : (
                          <div className="relative overflow-hidden rounded border border-gray-200 shadow-sm w-16 h-16 bg-gray-100">
                            <img 
                              src={fileUrl} // Langsung gunakan fileUrl lokal (/uploads/...)
                              alt="Bukti" 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              // HAPUS onError JIKA INI SERVER COMPONENT
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-[10px]">🔍 Zoom</span>
                            </div>
                          </div>
                        )}
                      </a>
                    ) : (
                      <span className="text-gray-300 italic text-xs border border-dashed border-gray-300 px-2 py-1 rounded">
                        Tanpa File
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-3 text-gray-600">
                    {formatDate(item.tanggal_mengumpulkan)}
                  </td>
                  
                  <td className="px-6 py-3">
                    {item.nilai > 0 ? (
                      <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-100">
                        {item.nilai}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Belum dinilai</span>
                    )}
                  </td>

                  <td className="px-6 py-3 text-center">
                    <Link
                      href={`/admin/siswa/${siswa._id}/nilai`}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline"
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