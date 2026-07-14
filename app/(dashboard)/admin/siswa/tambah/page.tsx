'use client'

import { createStudentAction } from '@/actions/admin-actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImportSiswaForm from '@/components/ui/ImportSiswaForm';

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
        <Link href="/admin/siswa" className="text-foreground/40 hover:text-foreground transition">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Tambah Siswa Baru</h1>
      </div>

      <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom">
        <form action={handleSubmit} className="space-y-4">
          
          {/* Input NIS */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">NIS (Nomor Induk Siswa)</label>
            <input 
              name="nis" 
              type="number" 
              placeholder="Contoh: 10115001"
              required 
              className="w-full px-3 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {/* Input Nama */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nama Lengkap</label>
            <input 
              name="nama" 
              type="text" 
              placeholder="Nama lengkap siswa"
              required 
              className="w-full px-3 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {/* Input Kelas */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kelas</label>
            <input 
              name="kelas" 
              placeholder="Kelas siswa."
              required 
              className="w-full px-3 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {/* Input Jenis Kelamin */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Jenis Kelamin</label>
            <select
              name="jenis_kelamin"
              required
              className="w-full px-3 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Pilih Jenis Kelamin</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-danger-500/10 text-danger-600 text-sm rounded-lg font-medium border border-danger-500/20">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-2.5 rounded-lg text-white font-bold transition shadow-sm
                ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}
              `}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Siswa'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-primary-500/10 p-4 rounded-lg border border-primary-500/20 text-sm text-primary-500">
        <p>ℹ️ <strong>Info:</strong> Akun login akan dibuat otomatis.</p>
        <ul className="list-disc ml-5 mt-1 text-xs text-primary-500/60">
          <li>Username: <code>[NIS]@siswa.com</code></li>
          <li>Password Default: <code>123456</code></li>
        </ul>
      </div>

      <ImportSiswaForm />
    </div>
  );
}