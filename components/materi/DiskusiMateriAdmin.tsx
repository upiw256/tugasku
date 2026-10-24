'use client';

import { useState, useEffect, useRef } from 'react';
import { getDiskusiMateri, postKomentarDiskusi, deleteKomentarDiskusi, clearDiskusiMateri } from '@/actions/materi-discussion';

export default function DiskusiMateriAdmin({ materiId, availableClasses }: { materiId: string, availableClasses: string[] }) {
  const [selectedClass, setSelectedClass] = useState(availableClasses[0] || '');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    if (!selectedClass) return;
    const res = await getDiskusiMateri(materiId, selectedClass);
    if (res.success && res.data) {
      setComments(res.data);
    }
  };

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 3000);
    return () => clearInterval(interval);
  }, [materiId, selectedClass]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isPosting || !selectedClass) return;

    setIsPosting(true);
    const tempKomentar = newComment;
    setNewComment('');

    // Pastikan komentar bisa dilihat oleh kelas yang dipilih
    // Di server action, kalau role yang post admin, kelas tidak dipakai untuk query untuk admin
    // Tetapi kita simpan kelasnya agar ketika kita ambil untuk siswa 'kelas' ini, nyambung. Wait,
    // di server action, admin post ke db akan memakai `kelas_siswa: ""` saat ini (karena logic `kelas_siswa` cuma di-set saat role 'siswa').
    // Ah, supaya siswa bisa baca pesan admin khusus kelasnya, kita harus kirim kelas dari sini. 
    // Tapi karena tadi di actions kita tidak accept kelas sebagai parameter `postKomentarDiskusi`,
    // wait. Let's look at `postKomentarDiskusi(materiId, komentar)`. Kita update itu jika butuh, 
    // atau biarkan semua siswa bisa lihat pesan admin (karena server action postKomentarDiskusi admin kelas_siswa nya empty string. Dan ketika murid nge-fetch: $or: [ role_pengirim: 'admin', kelas_siswa: student.kelas ] berarti MURID SELALU BISA BACA PESAN ADMIN).
    // It's actually fine if admin broadcasts message to all classes in that Materi, but if admin wants to talk to a specific class...? 
    // Let's assume Admin's message is seen by ALL classes for this materi (which is easier).
    // If they want to reply directly in that 'room', wait, our fetcher in admin filters by `kelasSiswa` -> `getDiskusiMateri(..., selectedClass)` only gets comments where class is selectedClass or admin.
    
    const res = await postKomentarDiskusi(materiId, tempKomentar);
    if (res.success && res.data) {
      setComments((prev) => [...prev, res.data]);
    } else {
      setNewComment(tempKomentar);
      alert(res.message || 'Gagal mengirim komentar');
    }
    setIsPosting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Yakin ingin menghapus pesan ini?')) return;
    const res = await deleteKomentarDiskusi(commentId);
    if (res.success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else {
      alert(res.message || 'Gagal menghapus');
    }
  };

  const handleClearChat = async () => {
    if (!confirm(`Yakin ingin membersihkan diskusi di kelas ${selectedClass}?`)) return;
    const res = await clearDiskusiMateri(materiId, selectedClass);
    if (res.success) {
      // Re-fetch comments to sync state instead of just emptying
      fetchComments();
    } else {
      alert(res.message || 'Gagal clear chat');
    }
  };

  return (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom flex flex-col h-[600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border-custom">
        <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          Live Discussion
        </h3>
        
        <div className="flex items-center gap-3">
          {availableClasses.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-foreground/70">Ruang:</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-foreground/5 border-none rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-bold"
              >
                {availableClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          
          <button 
            type="button" 
            onClick={handleClearChat}
            className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1"
            title="Bersihkan Disuksi Kelas Ini"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            Clear
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-foreground/40 text-sm">
            Belum ada diskusi di kelas {selectedClass}.
          </div>
        ) : (
          comments.map((c: any) => (
            <div key={c.id} className={`flex flex-col max-w-[85%] ${c.role === 'admin' || c.role === 'guru' ? 'ml-auto items-end hover:bg-foreground/5' : 'ml-0'}`}>
              <div className="flex items-end gap-2 group">
                {c.role !== 'admin' && c.role !== 'guru' && (
                  <button 
                    onClick={() => handleDeleteComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all flex-shrink-0"
                    title="Hapus pesan"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                )}
                
                <div className={`p-3 rounded-2xl ${
                  c.role === 'admin' || c.role === 'guru'
                    ? 'bg-primary-600 text-white rounded-br-none' 
                    : 'bg-foreground/10 text-foreground rounded-bl-none'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-bold ${c.role === 'admin' || c.role === 'guru' ? 'text-blue-200' : 'text-primary-500'}`}>
                      {c.nama} {c.role === 'admin' ? '(Admin)' : c.role === 'guru' ? '(Guru)' : c.kelas ? `(${c.kelas})` : ''}
                    </span>
                    {(c.role === 'admin' || c.role === 'guru') && (
                      <button 
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-white/60 hover:text-white transition-colors"
                        title="Hapus pesan ini"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.komentar}</p>
                </div>
              </div>
              <span suppressHydrationWarning className="text-[10px] text-foreground/40 mt-1 px-1">
                {new Date(c.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      <form onSubmit={handlePost} className="mt-4 pt-4 border-t border-border-custom flex items-center gap-3">
        <input 
          type="text" 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={`Balas pesan di kelas ${selectedClass}...`} 
          className="flex-1 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-foreground"
          autoComplete="off"
        />
        <button 
          type="submit" 
          disabled={!newComment.trim() || isPosting}
          className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      </form>
    </div>
  );
}
