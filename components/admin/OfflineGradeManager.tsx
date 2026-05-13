'use client';

import { useState } from 'react';
import { importOfflineGradesAction } from '@/actions/grade-actions';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function OfflineGradeManager({ tugasId }: { tugasId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDownload = () => {
    window.location.href = `/api/template/nilai/${tugasId}`;
  };

  const handleUpload = async (formData: FormData) => {
    setIsLoading(true);
    const res = await importOfflineGradesAction(tugasId, formData);
    setIsLoading(false);

    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-6 shadow-xl border border-gray-700/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🏫 Kelola Nilai Offline
          </h2>
          <p className="text-gray-400 text-xs md:text-sm">
            Gunakan fitur ini untuk input nilai secara massal via Excel.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* TOMBOL DOWNLOAD */}
          <button
            onClick={handleDownload}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border border-white/10 transition-all active:scale-95"
          >
            📥 Download Template
          </button>

          {/* FORM UPLOAD */}
          <form action={handleUpload} className="relative group">
            <input
              type="file"
              name="file"
              accept=".xlsx"
              required
              onChange={(e) => {
                if (e.target.files?.length) {
                  e.target.form?.requestSubmit();
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isLoading}
            />
            <button
              type="button"
              className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all active:scale-95
                ${isLoading 
                  ? 'bg-gray-600 border-gray-500 cursor-wait' 
                  : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 text-white shadow-lg shadow-emerald-900/20'}
              `}
            >
              {isLoading ? '⌛ Memproses...' : '📤 Upload Nilai (.xlsx)'}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Step 1</p>
          <p className="text-xs text-gray-300">Download template untuk mendapatkan daftar NIS dan Nama siswa yang sesuai.</p>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Step 2</p>
          <p className="text-xs text-gray-300">Isi kolom nilai (0-100), simpan, lalu upload kembali file tersebut ke sini.</p>
        </div>
      </div>
    </div>
  );
}
