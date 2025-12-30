'use client'

import { createAnnouncementAction, deleteAnnouncementAction } from '@/actions/announcement-actions';
import { sendBrowserNotification } from '@/lib/notificationHelper';
import { pusherClient } from '@/lib/pusher'; // Pastikan path ini sesuai dengan file lib/pusher.ts Anda
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
  const [announcements, setAnnouncements] = useState(initialData);
  
  // Ref untuk form agar bisa di-reset setelah posting
  const formRef = useRef<HTMLFormElement>(null);

  // --- 1. SETUP DATA & IZIN ---
  useEffect(() => {
    // Sinkronisasi data awal jika props berubah
    setAnnouncements(initialData);

    // Cek status izin notifikasi saat komponen dimuat
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, [initialData]);

  // --- 2. LOGIKA REALTIME (PUSHER) ---
  useEffect(() => {
    // Subscribe ke channel 'sekolah-channel'
    const channel = pusherClient.subscribe('sekolah-channel');

    // Dengarkan event 'info-baru'
    channel.bind('info-baru', (data: any) => {
      // a. Masukkan data baru ke posisi paling atas (index 0)
      setAnnouncements((prev) => {
        // Cek duplikasi agar aman (opsional)
        if (prev.find(item => item._id === data._id)) return prev;
        return [data, ...prev];
      });

      // b. Munculkan Notifikasi Browser (Khusus Siswa & Jika Diizinkan)
      if (role === 'siswa' && Notification.permission === "granted") {
        sendBrowserNotification("📢 Info Baru Tiba!", data.judul);
      }

      // c. Feedback Visual (Toast) untuk user yang sedang aktif melihat layar
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
        text: data.judul
      });
    });

    // Cleanup: Unsubscribe saat komponen di-unmount agar tidak membebani memori
    return () => {
      pusherClient.unsubscribe('sekolah-channel');
    };
  }, [role]);

  // --- 3. HANDLER: Request Izin Notifikasi ---
  const requestPermission = () => {
    if (!("Notification" in window)) {
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

  // --- 4. HANDLER ADMIN: Posting ---
  const handlePost = async (formData: FormData) => {
    setLoading(true);
    const res = await createAnnouncementAction(formData);
    setLoading(false);

    if (res.success) {
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
      
      // KITA TIDAK PERLU RELOAD WINDOW DI SINI
      // Karena Pusher akan otomatis mengupdate UI (Realtime)
    } else {
      Swal.fire('Gagal', res.message, 'error');
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
    setAnnouncements(prev => prev.filter(item => item._id !== id));

    const res = await deleteAnnouncementAction(id);
    
    if (!res.success) {
        // Jika gagal di server, kembalikan UI seperti semula (Rollback)
        setAnnouncements(prevData);
        Swal.fire('Gagal', 'Gagal menghapus data', 'error');
    } else {
        // Jika delete realtime belum diimplementasi, kita refresh data server background
        // atau biarkan saja karena sudah dihapus di UI lokal
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* HEADER */}
      <div className="bg-blue-600 p-4 flex justify-between items-center text-white shadow-md z-10">
        <h2 className="font-bold flex items-center gap-2 text-sm md:text-base">
          📢 Papan Pengumuman
        </h2>
        
        {/* TOMBOL IZIN NOTIFIKASI (Khusus Siswa & Belum Allow) */}
        {role === 'siswa' && permission === 'default' && (
            <button 
                onClick={requestPermission}
                className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-50 transition animate-pulse shadow-sm flex items-center gap-1"
            >
                🔔 Aktifkan Notif
            </button>
        )}
        
        {/* BADGE JUMLAH INFO (Jika tidak butuh tombol izin) */}
        {(role !== 'siswa' || permission === 'granted' || permission === 'denied') && (
             <span className="text-xs bg-blue-500/50 backdrop-blur-sm border border-blue-400 px-2 py-1 rounded-full">
                {announcements.length} Info
            </span>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        
        {/* FORM ADMIN (Hanya muncul jika Role = Admin) */}
        {role === 'admin' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
            <h3 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-3">Buat Pengumuman Baru</h3>
            <form ref={formRef} action={handlePost} className="space-y-3">
              <input 
                name="judul" 
                required 
                placeholder="Judul Pengumuman Singkat..." 
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
              />
              <textarea 
                name="konten" 
                required 
                placeholder="Isi pesan lengkap..." 
                rows={2} 
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
              ></textarea>
              
              <div className="flex justify-between items-center pt-1">
                 <select name="prioritas" className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
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
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                <span className="text-2xl mb-2">📭</span>
                <p className="text-sm">Belum ada pengumuman.</p>
            </div>
          ) : (
            announcements.map((item) => (
              <div key={item._id} className={`group relative p-4 rounded-lg border-l-[6px] shadow-sm bg-white border-y border-r border-gray-100 transition hover:shadow-md
                ${item.prioritas === 'Penting' ? 'border-l-red-500 bg-red-50/10' : 
                  item.prioritas === 'Libur' ? 'border-l-green-500 bg-green-50/10' : 'border-l-blue-400 bg-blue-50/10'}`
              }>
                {/* Header Item */}
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800 text-sm leading-tight pr-4">{item.judul}</h4>
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 whitespace-nowrap">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* Konten Item */}
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed mb-3">
                    {item.konten}
                </p>
                
                {/* Footer Item (Badge & Delete) */}
                <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-2">
                   <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider
                     ${item.prioritas === 'Penting' ? 'bg-red-100 text-red-600' : 
                       item.prioritas === 'Libur' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500'}`
                   }>
                     {item.prioritas}
                   </span>
                   
                   {/* Tombol Hapus (Hanya Admin) */}
                   {role === 'admin' && (
                     <button 
                        onClick={() => handleDelete(item._id)} 
                        title="Hapus Pengumuman"
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                     </button>
                   )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}