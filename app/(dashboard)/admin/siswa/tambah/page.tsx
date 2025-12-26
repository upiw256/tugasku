'use client'

import { createStudentAction } from '@/actions/admin-actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TambahSiswaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');

    const res = await createStudentAction(formData);

    if (res.success) {
      // Jika sukses, kembali ke halaman list siswa
      router.push('/admin/siswa');
      router.refresh(); 
    } else {
      setError(res.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/siswa" className="text-gray-500 hover:text-gray-800 transition">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Tambah Siswa Baru</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <form action={handleSubmit} className="space-y-4">
          
          {/* Input NIS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIS (Nomor Induk Siswa)</label>
            <input 
              name="nis" 
              type="number" 
              placeholder="Contoh: 10115001"
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Input Nama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input 
              name="nama" 
              type="text" 
              placeholder="Nama lengkap siswa"
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Input Kelas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <input 
              name="kelas" 
              placeholder="Kelas siswa."
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-2.5 rounded-lg text-white font-bold transition shadow-sm
                ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Siswa'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-700">
        <p>ℹ️ <strong>Info:</strong> Akun login akan dibuat otomatis.</p>
        <ul className="list-disc ml-5 mt-1 text-xs text-blue-600">
          <li>Username: <code>[NIS]@siswa.com</code></li>
          <li>Password Default: <code>123456</code></li>
        </ul>
      </div>
    </div>
  );
}