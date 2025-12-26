'use client'

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      // Panggil NextAuth untuk login
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false, // Kita handle redirect sendiri agar lebih mulus
      });

      if (res?.error) {
        setError('Username atau Password salah. Silakan coba lagi.');
        setLoading(false);
      } else {
        // Jika sukses, refresh halaman agar Middleware mengarahkan ke dashboard yang benar
        router.refresh(); 
        router.push('/'); 
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">TugasKu</h1>
          <p className="text-gray-500 mt-2">Masuk untuk melihat tugas & nilai</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username / Email</label>
            <input 
              name="username" 
              type="text" 
              required 
              placeholder="Contoh: 1001 atau admin@admin.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-semibold transition shadow-md 
              ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}
            `}
          >
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}