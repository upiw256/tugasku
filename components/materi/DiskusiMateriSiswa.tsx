'use client';

import { useState, useEffect, useRef } from 'react';
import { trackMateriDownload, getDiskusiMateri, postKomentarDiskusi } from '@/actions/materi-discussion';

export default function DiskusiMateriSiswa({ materiId, fileUrl, kelas }: { materiId: string, fileUrl: string, kelas: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    const res = await getDiskusiMateri(materiId, kelas);
    if (res.success && res.data) {
      setComments(res.data);
    }
  };

  useEffect(() => {
    fetchComments();
    // Simple polling for a realtime-like feel
    const interval = setInterval(fetchComments, 3000);
    return () => clearInterval(interval);
  }, [materiId, kelas]);

  useEffect(() => {
    // Scroll to bottom whenever comments change
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleDownload = async () => {
    setIsDownloading(true);
    await trackMateriDownload(materiId);
    setIsDownloading(false);
    // Buka file di tab baru / trigger download
    window.open(fileUrl, '_blank');
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isPosting) return;

    setIsPosting(true);
    const tempKomentar = newComment;
    setNewComment('');

    const res = await postKomentarDiskusi(materiId, tempKomentar);
    if (res.success && res.data) {
      // Optimistic update
      setComments((prev) => [...prev, res.data]);
    } else {
      setNewComment(tempKomentar); // Kembalikan teks jika gagal
      alert(res.message || 'Gagal mengirim komentar');
    }
    setIsPosting(false);
  };

  return (
    <div className="space-y-6">
      {/* Tombol Unduh / Buka Materi */}
      <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground">File Materi</h3>
          <p className="text-sm text-foreground/50">Unduh PDF/Modul untuk dipelajari.</p>
        </div>
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="bg-primary-600 w-full sm:w-auto justify-center text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-700 transition flex items-center gap-2"
        >
          {isDownloading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          )}
          Unduh Materi
        </button>
      </div>

      {/* Area Diskusi */}
      <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom flex flex-col h-[500px]">
        <h3 className="font-bold text-foreground text-lg mb-4 pb-4 border-b border-border-custom flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          Live Discussion
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {comments.length === 0 ? (
            <div className="h-full flex items-center justify-center text-foreground/40 text-sm">
              Belum ada diskusi untuk materi ini di kelas {kelas}. Jadilah yang pertama berkomentar!
            </div>
          ) : (
            comments.map((c: any) => (
              <div key={c.id} className={`flex flex-col max-w-[85%] ${c.role === 'siswa' ? 'ml-0' : 'ml-auto items-end hover:bg-foreground/5'}`}>
                <div className="flex items-end gap-2">
                  <div className={`p-3 rounded-2xl ${
                    c.role === 'admin' || c.role === 'guru'
                      ? 'bg-primary-600 text-white rounded-br-none' 
                      : 'bg-foreground/10 text-foreground rounded-bl-none'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold ${c.role === 'admin' || c.role === 'guru' ? 'text-blue-200' : 'text-primary-500'}`}>
                        {c.nama} {c.role === 'admin' ? '(Admin)' : c.role === 'guru' ? '(Guru)' : ''}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{c.komentar}</p>
                  </div>
                </div>
                <span className="text-[10px] text-foreground/40 mt-1 px-1">
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
            placeholder="Ketik pesan disini..." 
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
    </div>
  );
}
