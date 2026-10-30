'use client'

import { createAnnouncementAction, deleteAnnouncementAction } from '@/actions/announcement-actions';
import { sendBrowserNotification } from '@/lib/notificationHelper';
import { pusherClient } from '@/lib/pusher';
import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

interface Props {
  role: string;     // 'admin' atau 'siswa'
  initialData: any[]; // Data awal dari Server Component
}

export default function AnnouncementBoard({ role, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState('default');
  
  // State lokal untuk menampung data (agar bisa diupdate realtime)
  const [announcements, setAnnouncements] = useState<any[]>(initialData || []);
  
  // Ref untuk form agar bisa di-reset setelah posting
  const formRef = useRef<HTMLFormElement>(null);

  // --- 1. SETUP DATA & IZIN ---
  useEffect(() => {
    // Sinkronisasi data awal jika props berubah
    if (Array.isArray(initialData)) {
      setAnnouncements(initialData);
    }

    // Cek status izin notifikasi saat komponen dimuat di browser
    if (typeof window !== 'undefined' && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, [initialData]);

  // --- 2. LOGIKA REALTIME (PUSHER) ---
  useEffect(() => {
    try {
      // Subscribe ke channel 'sekolah-channel'
      const channel = pusherClient.subscribe('sekolah-channel');

      // a. Dengarkan event 'info-baru' (Pengumuman baru dibuat)
      const handleNewAnnouncement = (data: any) => {
        try {
          if (!data) return;
          const itemId = data._id || data.id;

          setAnnouncements((prev) => {
            if (itemId && prev.find(item => (item._id || item.id) === itemId)) return prev;
            return [data, ...prev];
          });

          // Munculkan Notifikasi Browser (Khusus Siswa & Jika Diizinkan)
          if (role === 'siswa' && typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
            sendBrowserNotification("📢 Info Baru Tiba!", data.judul || 'Pengumuman Baru');
          }

          // Feedback Visual (Toast) untuk siswa
          if (role === 'siswa') {
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
            });
            Toast.fire({
              icon: 'info',
              title: 'Papan pengumuman diperbarui',
              text: data.judul || 'Pengumuman baru masuk'
            });
          }
        } catch (eventErr) {
          console.error('[Pusher Callback Error] info-baru:', eventErr);
        }
      };

      // b. Dengarkan event 'hapus-info' (Pengumuman dihapus)
      const handleDeleteAnnouncement = (data: { id: string }) => {
        try {
          if (!data?.id) return;
          setAnnouncements((prev) =>
            prev.filter(item => (item._id || item.id) !== data.id)
          );
        } catch (eventErr) {
          console.error('[Pusher Callback Error] hapus-info:', eventErr);
        }
      };

      // c. Dengarkan event 'update-info' (Pengumuman diperbarui)
      const handleUpdateAnnouncement = (data: any) => {
        try {
          if (!data) return;
          const targetId = data._id || data.id;
          if (!targetId) return;
          setAnnouncements((prev) =>
            prev.map(item => ((item._id || item.id) === targetId ? { ...item, ...data } : item))
          );
        } catch (eventErr) {
          console.error('[Pusher Callback Error] update-info:', eventErr);
        }
      };

      channel.bind('info-baru', handleNewAnnouncement);
      channel.bind('hapus-info', handleDeleteAnnouncement);
      channel.bind('update-info', handleUpdateAnnouncement);

      // Cleanup: Unbind dan unsubscribe saat komponen di-unmount agar tidak membebani memori
      return () => {
        try {
          channel.unbind('info-baru', handleNewAnnouncement);
          channel.unbind('hapus-info', handleDeleteAnnouncement);
          channel.unbind('update-info', handleUpdateAnnouncement);
          pusherClient.unsubscribe('sekolah-channel');
        } catch (cleanupErr) {
          console.error('[Pusher Cleanup Error]:', cleanupErr);
        }
      };
    } catch (pusherSubscribeErr) {
      console.warn('[Pusher Subscribe Warning]:', pusherSubscribeErr);
    }
  }, [role]);

  // --- 3. HANDLER: Request Izin Notifikasi ---
  const requestPermission = () => {
    if (typeof window === 'undefined' || !("Notification" in window)) {
      Swal.fire('Error', 'Browser ini tidak mendukung notifikasi desktop.', 'error');
      return;
    }

    Notification.requestPermission().then((result) => {
      setPermission(result);
      if (result === 'granted') {
        Swal.fire({
            icon: 'success', 
            title: 'Notifikasi Aktif', 
            text: 'Anda akan menerima info sekolah terbaru langsung di layar.',
            timer: 2000,
            showConfirmButton: false
        });
        // Tes kirim notifikasi percobaan
        new Notification("Sistem Sekolah", { body: "Notifikasi berhasil diaktifkan!", icon: '/favicon.ico' });
      } else {
        Swal.fire('Info', 'Notifikasi diblokir. Anda bisa mengaktifkannya manual di pengaturan browser.', 'info');
      }
    });
  };

  // --- 4. HANDLER ADMIN: Posting (Submit yang aman) ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);

    try {
      const res = await createAnnouncementAction(formData);

      if (res?.success) {
        // Reset form manual
        formRef.current?.reset();
        
        Swal.fire({ 
          toast: true, 
          position: 'top-end', 
          icon: 'success', 
          title: 'Terposting & Terkirim!', 
          timer: 1500, 
          showConfirmButton: false 
        });
      } else {
        Swal.fire('Gagal', res?.message || 'Gagal memposting pengumuman.', 'error');
      }
    } catch (err: any) {
      console.error('Error submitting announcement:', err);
      Swal.fire('Error', err?.message || 'Terjadi kesalahan sistem saat memposting.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- 5. HANDLER ADMIN: Hapus ---
  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({ 
        title: 'Hapus Pengumuman?', 
        text: "Tindakan ini tidak bisa dibatalkan.",
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#d33',
        confirmButtonText: 'Ya, Hapus' 
    });
    
    if (!confirm.isConfirmed) return;

    // Hapus Optimistik (Update UI dulu biar terasa cepat)
    const prevData = [...announcements];
    setAnnouncements(prev => prev.filter(item => (item._id || item.id) !== id));

    try {
      const res = await deleteAnnouncementAction(id);
      if (!res?.success) {
        setAnnouncements(prevData);
        Swal.fire('Gagal', res?.message || 'Gagal menghapus data', 'error');
      }
    } catch (err) {
      setAnnouncements(prevData);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus', 'error');
    }
  };

  // Helper aman format tanggal
  const formatDate = (dateVal: any) => {
    try {
      if (!dateVal) return '-';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '-';
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border-custom overflow-hidden flex flex-col h-full">
      {/* HEADER */}
      <div className="bg-blue-600 p-4 flex justify-between items-center text-white shadow-md z-10">
        <h2 className="font-bold flex items-center gap-2 text-sm md:text-base">
          📢 Papan Pengumuman
        </h2>
        
        {/* TOMBOL IZIN NOTIFIKASI (Khusus Siswa & Belum Allow) */}
        {role === 'siswa' && permission === 'default' && (
            <button 
                onClick={requestPermission}
                className="text-xs bg-surface text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-50 transition animate-pulse shadow-sm flex items-center gap-1"
            >
                🔔 Aktifkan Notif
            </button>
        )}
        
        {/* BADGE JUMLAH INFO */}
        {(role !== 'siswa' || permission === 'granted' || permission === 'denied') && (
             <span className="text-xs bg-blue-500/50 backdrop-blur-sm border border-blue-400 px-2 py-1 rounded-full">
                {announcements.length} Info
            </span>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
        
        {/* FORM ADMIN (Hanya muncul jika Role = Admin) */}
        {role === 'admin' && (
          <div className="mb-6 p-4 bg-foreground/5 rounded-lg border border-border-custom shadow-inner">
            <h3 className="text-xs uppercase tracking-wider font-bold text-foreground/40 mb-3">Buat Pengumuman Baru</h3>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
              <input 
                name="judul" 
                required 
                placeholder="Judul Pengumuman Singkat..." 
                className="w-full px-3 py-2 text-sm border border-border-custom bg-surface text-foreground rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-foreground/20" 
              />
              <textarea 
                name="konten" 
                required 
                placeholder="Isi pesan lengkap..." 
                rows={2} 
                className="w-full px-3 py-2 text-sm border border-border-custom bg-surface text-foreground rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none placeholder:text-foreground/20"
              ></textarea>
              
              <div className="flex justify-between items-center pt-1">
                 <select name="prioritas" defaultValue="Info" className="text-sm border border-border-custom rounded px-2 py-1.5 bg-surface text-foreground font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                    <option value="Info">ℹ️ Info Biasa</option>
                    <option value="Penting">⚠️ Penting</option>
                    <option value="Libur">🏖️ Libur</option>
                 </select>
                 <button 
                    disabled={loading} 
                    type="submit" 
                    className={`text-white text-sm px-5 py-1.5 rounded font-medium shadow-sm transition flex items-center gap-2
                        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
                    `}
                 >
                    {loading ? 'Posting...' : 'Kirim 🚀'}
                 </button>
              </div>
            </form>
          </div>
        )}

        {/* LIST PENGUMUMAN */}
        <div className="space-y-4 pb-4">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-foreground/20 border-2 border-dashed border-border-custom rounded-lg bg-foreground/5">
                <span className="text-2xl mb-2 grayscale opacity-50">📭</span>
                <p className="text-sm font-medium">Belum ada pengumuman.</p>
            </div>
          ) : (
            announcements.map((item, idx) => {
              const itemId = item._id || item.id || `announcement-${idx}`;
              return (
                <div key={itemId} className={`group relative p-4 rounded-lg border-l-[6px] shadow-sm bg-surface border-y border-r border-border-custom transition hover:shadow-md
                  ${item.prioritas === 'Penting' ? 'border-l-red-500 bg-red-500/5' : 
                    item.prioritas === 'Libur' ? 'border-l-green-500 bg-green-500/5' : 'border-l-blue-400 bg-blue-500/5'}`
                }>
                  {/* Header Item */}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-foreground text-sm leading-tight pr-4">{item.judul || 'Tanpa Judul'}</h4>
                    <span suppressHydrationWarning className="text-[10px] font-bold text-foreground/30 bg-foreground/5 px-1.5 py-0.5 rounded border border-border-custom whitespace-nowrap">
                      {formatDate(item.tanggal)}
                    </span>
                  </div>

                  {/* Konten Item */}
                  <p className="text-sm text-foreground/60 whitespace-pre-line leading-relaxed mb-3">
                      {item.konten || ''}
                  </p>
                  
                  {/* Footer Item (Badge & Delete) */}
                  <div className="flex justify-between items-center mt-2 border-t border-border-custom pt-2">
                     <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider
                       ${item.prioritas === 'Penting' ? 'bg-red-500/10 text-red-500' : 
                         item.prioritas === 'Libur' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`
                     }>
                       {item.prioritas || 'Info'}
                     </span>
                     
                     {/* Tombol Hapus (Hanya Admin) */}
                     {role === 'admin' && (
                       <button 
                          onClick={() => handleDelete(itemId)} 
                          title="Hapus Pengumuman"
                          className="text-foreground/20 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                       </button>
                     )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}