'use client'

import { resetDatabaseAction, restoreDatabaseAction } from '@/actions/system-actions';
import { useState } from 'react';
import Swal from 'sweetalert2'; // Import SweetAlert2

export default function AdminSystemSettings() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
      setMsg('');
    } else {
      setFileName('');
    }
  };

  // --- HANDLER RESET (Konfirmasi Ganda yang Cantik) ---
  const handleReset = async () => {
    // Konfirmasi 1
    const result1 = await Swal.fire({
      title: '⚠️ BAHAYA: Reset Database?',
      text: "Semua data siswa, tugas, nilai, dan absensi akan DIHAPUS PERMANEN. Hanya akun Admin yang tersisa.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Saya Paham Risikonya',
      cancelButtonText: 'Batal'
    });

    if (!result1.isConfirmed) return;

    // Konfirmasi 2 (Final)
    const result2 = await Swal.fire({
      title: 'Yakin 100%?',
      text: "Tindakan ini benar-benar TIDAK BISA DIBATALKAN!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'YA, HAPUS SEMUANYA!',
      cancelButtonText: 'Jangan Lakukan'
    });

    if (!result2.isConfirmed) return;

    // Eksekusi
    setLoading(true);
    const res = await resetDatabaseAction();
    setLoading(false);
    
    if (res.success) {
      Swal.fire('Berhasil!', res.message, 'success').then(() => {
        window.location.reload();
      });
    } else {
      Swal.fire('Gagal', res.message, 'error');
    }
  };

  // --- HANDLER RESTORE ---
  const handleRestore = async (formData: FormData) => {
    // Konfirmasi Restore
    const result = await Swal.fire({
      title: 'Restore Data?',
      html: `Anda akan me-restore data dari file: <br/><b>${fileName}</b>.<br/><br/>Data saat ini akan ditimpa/dihapus. Lanjutkan?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Restore Sekarang'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    
    // Tampilkan Loading Swal (agar user menunggu)
    Swal.fire({
      title: 'Memproses Restore...',
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });
    
    const res = await restoreDatabaseAction(formData);
    
    setLoading(false);

    if (res.success) {
      Swal.fire({
        title: 'Sukses!',
        text: res.message,
        icon: 'success'
      }).then(() => {
        window.location.reload();
      });
    } else {
      // Jika gagal (misal file duplikat)
      Swal.fire({
        title: 'Info',
        text: res.message,
        icon: res.message.includes('SAMA PERSIS') ? 'info' : 'error'
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* KARTU BACKUP & RESTORE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">📦 Backup & Restore</h2>
        
        {/* DOWNLOAD */}
        <div className="mb-8">
          <p className="text-sm text-gray-600 mb-3">1. Unduh data database saat ini.</p>
          <a 
            href="/api/system/backup" 
            target="_blank"
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-bold text-sm hover:bg-gray-200 border border-gray-300 transition"
          >
            <span>📥</span> Download File Backup (.school)
          </a>
        </div>

        {/* UPLOAD */}
        <div>
          <p className="text-sm text-gray-600 mb-3">2. Upload file backup (.school).</p>
          <form action={handleRestore} className="flex flex-col gap-4">
            <div className="relative group">
              <label 
                htmlFor="file-upload" 
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition
                  ${fileName ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`
                }
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {fileName ? (
                    <>
                      <div className="text-blue-500 text-3xl mb-2">📄</div>
                      <p className="mb-1 text-sm font-bold text-blue-600 text-center px-4 break-all">{fileName}</p>
                      <p className="text-xs text-blue-400">Klik untuk ganti file</p>
                    </>
                  ) : (
                    <>
                      <div className="text-gray-400 text-3xl mb-2">☁️</div>
                      <p className="mb-2 text-sm text-gray-500"><span className="font-bold">Klik cari file</span> backup (.school)</p>
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
                className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition transform active:scale-95 flex justify-center items-center gap-2"
              >
                {loading ? 'Memproses...' : '🔄 Mulai Proses Restore'}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="bg-red-50 p-6 rounded-xl border border-red-200">
        <h2 className="text-lg font-bold text-red-800 mb-2">⛔ Danger Zone</h2>
        <p className="text-sm text-red-600 mb-4">Reset Pabrik: Menghapus seluruh data siswa dan nilai secara permanen.</p>
        <button 
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-white text-red-600 px-4 py-3 rounded-lg font-bold hover:bg-red-600 hover:text-white transition shadow-sm border border-red-200"
        >
          {loading ? 'Menghapus...' : '🗑️ RESET DATABASE'}
        </button>
      </div>
    </div>
  );
}