'use client'

import { CldUploadButton } from 'next-cloudinary';
import { useState } from 'react';
import { submitTaskAction } from '@/actions/submission-actions';
import Swal from 'sweetalert2';

interface Props {
  tugasId: string;
  initialData?: any; // Data pengumpulan sebelumnya (jika ada)
}

export default function TaskSubmissionForm({ tugasId, initialData }: Props) {
  const [fileUrl, setFileUrl] = useState(initialData?.file_url || '');
  const [loading, setLoading] = useState(false);

  // Handler saat Cloudinary selesai upload
  const handleUploadSuccess = (result: any) => {
    // Ambil URL aman (https) dari hasil upload
    setFileUrl(result.info.secure_url);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'File Terupload! Jangan lupa klik Kirim.', timer: 3000 });
  };

  const handleSubmit = async (formData: FormData) => {
    if (!fileUrl) {
      Swal.fire('Error', 'Silakan upload file bukti pengerjaan dulu.', 'warning');
      return;
    }

    setLoading(true);
    // Tambahkan URL file ke FormData secara manual
    formData.append('fileUrl', fileUrl);
    formData.append('tugasId', tugasId);

    const res = await submitTaskAction(formData);
    setLoading(false);

    if (res.success) {
      Swal.fire('Berhasil', res.message, 'success');
    } else {
      Swal.fire('Gagal', res.message, 'error');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mt-4">
      <h3 className="font-bold text-gray-700 mb-3 text-sm">📤 Pengumpulan Tugas</h3>
      
      {/* 1. AREA PREVIEW FILE */}
      {fileUrl ? (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
             <span className="text-2xl">📄</span>
             <a href={fileUrl} target="_blank" className="text-sm text-blue-600 underline truncate block max-w-[200px]">
                Lihat File Upload
             </a>
          </div>
          <button onClick={() => setFileUrl('')} className="text-xs text-red-500 hover:text-red-700 font-bold">
            Ganti
          </button>
        </div>
      ) : (
        // 2. TOMBOL UPLOAD CLOUDINARY
        <div className="mb-4">
             <CldUploadButton 
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET}
                onSuccess={handleUploadSuccess}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-primary-400 transition cursor-pointer"
             >
                <span className="text-3xl mb-2">☁️</span>
                <span className="text-sm font-medium">Klik untuk Upload File / Foto</span>
                <span className="text-xs text-gray-400 mt-1">(Gambar, PDF, Word didukung)</span>
             </CldUploadButton>
        </div>
      )}

      {/* 3. FORM FINALISASI */}
      <form action={handleSubmit} className="space-y-3">
        <textarea 
            name="catatan" 
            placeholder="Catatan untuk guru (opsional)..." 
            defaultValue={initialData?.catatan_siswa || ''}
            className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-primary-500 outline-none"
            rows={2}
        ></textarea>

        <button 
            type="submit" 
            disabled={loading || !fileUrl}
            className={`w-full py-2 rounded font-bold text-white text-sm transition
                ${loading || !fileUrl ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}
            `}
        >
            {loading ? 'Mengirim...' : initialData?.file_url ? 'Update Pengumpulan' : 'Kirim Tugas'}
        </button>
      </form>
      
      {initialData?.tanggal_mengumpulkan && (
          <p className="text-xs text-center text-gray-400 mt-2">
            Terakhir dikumpul: {new Date(initialData.tanggal_mengumpulkan).toLocaleString('id-ID')}
          </p>
      )}
    </div>
  );
}