'use client'

import { resetDatabaseAction, restoreDatabaseAction } from '@/actions/system-actions';
import { useState } from 'react';
import Swal from 'sweetalert2'; 

export default function AdminSystemSettings() {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName('');
    }
  };

  // --- HANDLER RESET ---
  const handleReset = async () => {
    const result1 = await Swal.fire({
      title: '⚠️ BAHAYA: Reset Database?',
      text: "Seluruh data (Siswa, Guru, Materi, Kuis, Tugas, Nilai, & Absensi) akan DIHAPUS PERMANEN. Hanya akun Admin utama yang akan tersisa.",
      icon: 'warning',
      background: 'var(--surface)',
      color: 'var(--foreground)',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Saya Paham Risikonya',
      cancelButtonText: 'Batal'
    });

    if (!result1.isConfirmed) return;

    const result2 = await Swal.fire({
      title: 'Yakin 100%?',
      text: "Tindakan ini benar-benar TIDAK BISA DIBATALKAN!",
      icon: 'error',
      background: 'var(--surface)',
      color: 'var(--foreground)',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'YA, HAPUS SEMUANYA!',
      cancelButtonText: 'Jangan Lakukan'
    });

    if (!result2.isConfirmed) return;

    setLoading(true);
    const res = await resetDatabaseAction();
    setLoading(false);
    
    if (res.success) {
      Swal.fire({
        title: 'Berhasil!', 
        text: res.message, 
        icon: 'success',
        background: 'var(--surface)',
        color: 'var(--foreground)'
      }).then(() => {
        window.location.reload();
      });
    } else {
      Swal.fire({
        title: 'Gagal', 
        text: res.message, 
        icon: 'error',
        background: 'var(--surface)',
        color: 'var(--foreground)'
      });
    }
  };

  // --- HANDLER RESTORE ---
  const handleRestore = async (formData: FormData) => {
    const result = await Swal.fire({
      title: 'Restore Data?',
      html: `Anda akan me-restore data dari file: <br/><b>${fileName}</b>.<br/><br/>Data saat ini akan ditimpa/dihapus. Lanjutkan?`,
      icon: 'question',
      background: 'var(--surface)',
      color: 'var(--foreground)',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Restore Sekarang'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    
    Swal.fire({
      title: 'Memproses Restore...',
      text: 'Mohon tunggu sebentar',
      background: 'var(--surface)',
      color: 'var(--foreground)',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });
    
    const res = await restoreDatabaseAction(formData);
    
    setLoading(false);

    if (res.success) {
      Swal.fire({
        title: 'Sukses!',
        text: res.message,
        icon: 'success',
        background: 'var(--surface)',
        color: 'var(--foreground)'
      }).then(() => {
        window.location.reload();
      });
    } else {
      Swal.fire({
        title: 'Info',
        text: res.message,
        icon: res.message.includes('SAMA PERSIS') ? 'info' : 'error',
        background: 'var(--surface)',
        color: 'var(--foreground)'
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* KARTU BACKUP & RESTORE */}
      <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom">
        <h2 className="text-lg font-bold text-foreground mb-4 border-b border-border-custom pb-2 flex items-center gap-2">
          <span>📦</span> Backup & Restore
        </h2>
        
        {/* DOWNLOAD */}
        <div className="mb-8">
          <p className="text-sm text-foreground/60 mb-3 font-medium">1. Unduh data database saat ini.</p>
          <a 
            href="/api/system/backup" 
            target="_blank"
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-foreground/5 text-foreground px-4 py-3 rounded-lg font-bold text-sm hover:bg-foreground/10 border border-border-custom transition"
          >
            <span>📥</span> Download File Backup (.school)
          </a>
        </div>

        {/* UPLOAD */}
        <div>
          <p className="text-sm text-foreground/60 mb-3 font-medium">2. Upload file backup (.school).</p>
          <form action={handleRestore} className="flex flex-col gap-4">
            <div className="relative group">
              <label 
                htmlFor="file-upload" 
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition
                  ${fileName ? 'border-blue-500 bg-blue-500/5' : 'border-border-custom bg-foreground/5 hover:bg-foreground/10'}`
                }
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {fileName ? (
                    <>
                      <div className="text-blue-500 text-3xl mb-2">📄</div>
                      <p className="mb-1 text-sm font-bold text-blue-500 text-center px-4 break-all">{fileName}</p>
                      <p className="text-[10px] text-blue-500/60 font-bold uppercase tracking-wider">Klik untuk ganti file</p>
                    </>
                  ) : (
                    <>
                      <div className="text-foreground/20 text-3xl mb-2">☁️</div>
                      <p className="mb-2 text-sm text-foreground/40 font-medium">
                        <span className="font-bold text-foreground/60">Klik cari file</span> backup (.school)
                      </p>
                    </>
                  )}
                </div>
                <input 
                  id="file-upload" 
                  name="backupFile" 
                  type="file" 
                  accept=".school" 
                  className="hidden" 
                  onChange={handleFileChange}
                  required
                />
              </label>
            </div>

            {fileName && (
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition transform active:scale-95 flex justify-center items-center gap-2"
              >
                {loading ? 'Memproses...' : '🔄 Mulai Proses Restore'}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="bg-red-500/5 p-6 rounded-xl border border-red-500/20">
        <h2 className="text-lg font-bold text-red-500 mb-2 flex items-center gap-2">
          <span>⛔</span> Danger Zone
        </h2>
        <p className="text-sm text-red-500/60 mb-4 font-medium italic">
          Reset Pabrik: Menghapus seluruh data master (Siswa, Guru, Mapel) dan data transaksional (Tugas, Nilai, Kuis, Materi, Absensi) secara permanen.
        </p>
        <button 
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20"
        >
          {loading ? 'Menghapus...' : '🗑️ RESET DATABASE'}
        </button>
      </div>
    </div>
  );
}