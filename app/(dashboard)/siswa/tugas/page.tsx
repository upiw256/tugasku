import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Tugas, Nilai, Member, User } from '@/models';
import TaskSubmissionForm from '@/components/ui/TaskSubmissionForm';
import { redirect } from 'next/navigation';

export default async function HalamanTugasSiswa() {
  // 1. Cek Sesi Login
  const session = await auth();
  if (!session || session.user.role !== 'siswa') {
    redirect('/login');
  }

  await connectDB();

  // 2. Ambil Data Member (Siswa)
  const user = await User.findOne({ user: session.user.email });
  if (!user || !user.member_id) {
    return <div className="p-8 text-red-500 font-bold">Data siswa tidak ditemukan. Hubungi Admin.</div>;
  }
  
  const member = await Member.findById(user.member_id);
  if (!member) {
    return <div className="p-8 text-red-500 font-bold">Profil siswa belum terhubung.</div>;
  }

  // 3. QUERY TUGAS (Support String & Array)
  // Mencari tugas yang ditujukan untuk kelas siswa ini
  const tasks = await Tugas.find({
    $or: [
      { kelas: member.kelas },             // Jika data di DB masih String ("X 1")
      { kelas: { $in: [member.kelas] } }   // Jika data di DB Array (["X 1", "X 2"])
    ]
  })
  .sort({ deadline: -1 }) // Urutkan deadline terbaru diatas
  .lean();

  // 4. Ambil Data Pengumpulan (Nilai) Siswa Ini
  const mySubmissions = await Nilai.find({ member_id: member._id }).lean();

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-end border-b pb-4 gap-2">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">📚 Tugas Saya</h1>
           <p className="text-gray-500 text-sm mt-1">
             Kelas: <span className="font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">{member.kelas}</span>
           </p>
        </div>
      </header>

      {/* GRID TUGAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <span className="text-4xl block mb-2">🎉</span>
                <p className="text-lg font-medium">Hore! Tidak ada tugas aktif saat ini.</p>
            </div>
        ) : (
            tasks.map((task: any) => {
            // --- LOGIKA UTAMA ---
            
            // 1. Cari Pengumpulan
            const submission = mySubmissions.find((s: any) => s.tugas_id.toString() === task._id.toString());
            
            // 2. Tentukan Tipe (Fix Bug Offline: Default ke 'online' jika null)
            const taskType = task.tipe_pengumpulan || 'online';
            const isOnline = taskType === 'online';

            // 3. Tentukan Status "Selesai"
            // - Online: Harus ada file_url
            // - Offline: Dianggap selesai jika Guru sudah memberi input (submission ada)
            const isDone = isOnline 
                ? !!submission?.file_url 
                : !!submission; 
                
            const deadline = new Date(task.deadline);
            const isLate = !isDone && new Date() > deadline;
            
            return (
                <div key={task._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full transition hover:shadow-md group">
                
                {/* Indikator Warna Header */}
                <div className={`h-1.5 w-full ${isDone ? 'bg-green-500' : isLate ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                
                <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3 gap-2">
                        <h3 className="font-bold text-gray-800 leading-snug group-hover:text-blue-600 transition">{task.judul}</h3>
                        
                        {/* Badge Tipe */}
                        {!isOnline ? (
                            <span className="shrink-0 text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 uppercase tracking-wide">
                            🏫 Offline
                            </span>
                        ) : (
                            <span className="shrink-0 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 uppercase tracking-wide">
                            ☁️ Upload
                            </span>
                        )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {task.deskripsi || <span className="italic text-gray-400">Tidak ada deskripsi.</span>}
                    </p>
                    
                    <div className="text-xs text-gray-500 mb-4 flex items-center gap-1.5 bg-gray-50 p-2 rounded">
                        <span>📅 Deadline:</span>
                        <span className={`font-bold ${isLate ? 'text-red-500' : 'text-gray-700'}`}>
                            {deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* AREA AKSI (Bawah) */}
                    <div className="mt-auto pt-4 border-t border-gray-50">
                        
                        {/* JIKA TIPE ONLINE (Upload File) */}
                        {isOnline ? (
                            <TaskSubmissionForm 
                                tugasId={task._id.toString()} 
                                initialData={submission ? { ...submission, _id: submission._id.toString() } : null}
                            />
                        ) : (
                        
                        /* JIKA TIPE OFFLINE (Info Only) */
                        <div className={`p-4 rounded-lg text-center border border-dashed transition-colors
                            ${isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}
                        `}>
                            {isDone ? (
                                <div>
                                    <div className="text-2xl mb-1">✅</div>
                                    <p className="text-sm font-bold text-green-700">Sudah Dinilai Guru</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Nilai: <span className="font-bold text-gray-800 text-lg">{submission?.nilai}</span>
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-2xl mb-1">🏫</div>
                                    <p className="text-sm font-bold text-gray-600">Kumpulkan di Kelas</p>
                                    <p className="text-[11px] text-gray-400 mt-1">Tugas ini tidak perlu upload file.</p>
                                </div>
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