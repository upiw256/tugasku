'use client'

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// 👇 Import Server Action yang baru dibuat
import { getDbInfo } from '@/actions/getDbInfo'; 

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // 👇 State untuk menyimpan nama database
  const [dbName, setDbName] = useState<string | null>(null);

  useEffect(() => {
    // 1. Cek Status Internet
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    // 2. Cek Nama Database (Panggil Server Action)
    getDbInfo().then((info) => {
      setDbName(info.name); // Simpan nama DB ke state
      console.log("Terhubung ke DB:", info); // Debug di console browser
    });

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isOnline) {
      setError('Koneksi internet terputus.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Username atau Password salah.');
        setLoading(false);
      } else {
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
        {/* === INDIKATOR POJOK KANAN ATAS === */}
        <div className="absolute top-4 right-4 flex flex-col items-start gap-2">
          
          {/* 1. Status Internet */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
            <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-xs font-medium ${isOnline ? 'text-green-700' : 'text-red-600'}`}>
              {isOnline ? 'Internet Online' : 'Offline'}
            </span>
          </div>

          {/* 2. Status Database (Baru) */}
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <span className="text-xs font-bold text-blue-700">
                Versi: {process.env.NEXT_PUBLIC_VERSION}
              </span>
            </div>

        </div>
        {/* ================================== */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200 relative">
        

        <div className="text-center mb-8 mt-4">
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
            <input name="username" type="text" required placeholder="Contoh: admin" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input name="password" type="password" required placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
          </div>

          <button 
            type="submit" 
            disabled={loading || !isOnline}
            className={`w-full py-2.5 rounded-lg text-white font-semibold transition shadow-md 
              ${loading || !isOnline ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}
            `}
          >
            {loading ? 'Memproses...' : (isOnline ? 'Masuk Sekarang' : 'Menunggu Koneksi...')}
          </button>
        </form>
      </div>
    </div>
  );
}