import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Tugas, Nilai, Member, User, Kelompok } from '@/models';
import TaskSubmissionForm from '@/components/ui/TaskSubmissionForm';
import { redirect } from 'next/navigation';
import ImagePreview from '@/components/ui/ImagePreview';

export default async function HalamanTugasSiswa() {
  // 1. Cek Sesi Login
  const session = await auth();
  if (!session || session.user.role !== 'siswa') redirect('/login');

  await connectDB();

  // 2. Ambil Data Member (Siswa)
  const user = await User.findOne({ user: session.user.email });
  if (!user || !user.member_id) {
    return <div className="p-8 text-red-500 font-bold">Data siswa tidak ditemukan. Hubungi Admin.</div>;
  }
  
  const member = await Member.findById(user.member_id);
  if (!member) return <div className="p-8 text-red-500 font-bold">Profil siswa belum terhubung.</div>;

  // 3. Ambil Semua Tugas yang sesuai kelas siswa
  const rawTasks = await Tugas.find({
    $or: [
      { kelas: member.kelas },             
      { kelas: { $in: [member.kelas] } }   
    ]
  })
  .sort({ deadline: -1 })
  .lean();

  const myGroups = await Kelompok.find({ anggota: member._id }).lean();

  // Filter tugas: Jika tipe_tugas 'kelompok', sembunyikan untuk member yang BUKAN ketua
  const tasks = rawTasks.filter((task: any) => {
    if (task.tipe_tugas === 'kelompok') {
        const group = myGroups.find((g: any) => g.kelas === task.kelas || (Array.isArray(task.kelas) && task.kelas.includes(g.kelas)));
        // Jika tidak ada kelompok atau dia bukan ketua, jangan tampilkan tugas ini
        if (!group || group.ketua?.toString() !== member._id.toString()) {
            return false;
        }
    }
    return true;
  });

  // 4. Ambil Data Pengumpulan (Nilai) punya siswa ini
  const mySubmissions = await Nilai.find({ member_id: member._id }).lean();

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-end border-b pb-4 gap-2 px-2">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">📚 Tugas Saya</h1>
           <p className="text-gray-500 text-sm mt-1">
             Kelas: <span className="font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">{member.kelas}</span>
           </p>
        </div>
      </header>

      {/* GRID TUGAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        {tasks.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <span className="text-4xl block mb-2">🎉</span>
                <p className="text-lg font-medium">Hore! Tidak ada tugas saat ini.</p>
            </div>
        ) : (
            tasks.map((task: any) => {
            
            // --- CARI DATA PENGUMPULAN ---
            const rawSubmission = mySubmissions.find((s: any) => s.tugas_id.toString() === task._id.toString());
            
            let cleanSubmission: any = null;
            if (rawSubmission) {
                cleanSubmission = { 
                  ...rawSubmission, 
                  _id: rawSubmission._id.toString(),
                  file_url: rawSubmission.file_url // Pastikan file_url terbaca
                };
            }

            // --- LOGIKA STATUS ---
            const isOnline = (task.tipe_pengumpulan || 'online') === 'online';
            const isDone = isOnline ? !!cleanSubmission?.file_url : !!cleanSubmission?.nilai;
            const deadline = new Date(task.deadline);
            const isLate = !isDone && new Date() > deadline;
            
            // --- KUNCI UTAMA: APAKAH TUGAS DITUTUP ADMIN? ---
            const isClosed = task.is_active === false;

            return (
                <div key={task._id.toString()} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full transition hover:shadow-md group relative">
                
                {/* Indikator Warna Atas */}
                <div className={`h-1.5 w-full ${isClosed && !isDone ? 'bg-gray-400' : isDone ? 'bg-green-500' : isLate ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                
                <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3 gap-2">
                        <h3 className={`font-bold leading-snug ${isClosed && !isDone ? 'text-gray-400' : 'text-gray-800'}`}>{task.judul}</h3>
                        
                        {/* Badge Status Gembok atau Tipe Tugas */}
                        {isClosed ? (
                          <span className="shrink-0 text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 uppercase">
                            🔒 Ditutup
                          </span>
                        ) : (
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded border uppercase ${isOnline ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {isOnline ? '☁️ Upload' : '🏫 Offline'}
                          </span>
                        )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {task.deskripsi || <span className="italic text-gray-400">Tidak ada deskripsi.</span>}
                    </p>

                    {/* Preview Foto (Hanya muncul jika sudah upload) */}
                    {isOnline && (
                        <div className="mb-4">
                            {isDone && cleanSubmission?.file_url ? (
                                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-100 shadow-inner">
                                    <ImagePreview src={cleanSubmission.file_url} className="w-full h-32" />
                                </div>
                            ) : (
                                <div className="w-full h-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                                    <span className="text-[10px] text-gray-400 italic">
                                      {isClosed ? 'Waktu habis' : 'Belum ada file'}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Info Deadline */}
                    <div className="text-[11px] text-gray-500 mb-4 flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg">
                        <span>📅 Deadline:</span>
                        <span className={`font-bold ${isLate ? 'text-red-500' : 'text-gray-700'}`}>
                            {deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* AREA FORM: DI SINI LOGIKA PENGHILANG FORM-NYA */}
                    <div className="mt-auto pt-4 border-t border-gray-50">
                        {isOnline ? (
                            // JIKA DITUTUP DAN BELUM ADA FILE: Tampilkan Pesan Terkunci
                            isClosed ? (
                              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">🚫 Akses Ditutup</p>
                                <p className="text-[10px] text-gray-400">Pengumpulan tidak lagi diizinkan.</p>
                              </div>
                            ) : (
                              // JIKA MASIH BUKA ATAU SUDAH KIRIM: Tampilkan Form
                              <TaskSubmissionForm 
                                  tugasId={task._id.toString()} 
                              />
                            )
                        ) : (
                            // Bagian Tugas Offline (Sekolah)
                            <div className={`p-4 rounded-xl text-center border border-dashed ${isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                {isDone ? (
                                    <div>
                                        <p className="text-xs font-bold text-green-700">✅ Sudah Dinilai</p>
                                        <p className="text-[10px] text-gray-500 mt-1">Nilai: <span className="font-bold text-gray-800 text-sm">{cleanSubmission?.nilai}</span></p>
                                    </div>
                                ) : (
                                    <p className="text-xs font-bold text-gray-600 uppercase italic">🏫 Kumpulkan di Kelas</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                </div>
            );
            })
        )}
      </div>
    </div>
  );
}