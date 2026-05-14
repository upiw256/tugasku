'use client'

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDbInfo } from '@/actions/getDbInfo'; 
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 transition-colors duration-300">
        {/* === INDIKATOR & TOGGLE POJOK KANAN ATAS === */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-3 z-50">
          
          {/* Theme Toggle */}
          <div className="w-40">
            <ThemeToggle />
          </div>

          <div className="flex flex-row items-center gap-2">
            {/* 1. Status Internet */}
            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border-custom shadow-sm backdrop-blur-sm">
              <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* 2. Status Database */}
              <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 shadow-sm backdrop-blur-sm">
                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  v{process.env.NEXT_PUBLIC_VERSION}
                </span>
              </div>
          </div>
        </div>

        {/* ================================== */}
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-2xl p-10 border border-border-custom relative overflow-hidden group">
        {/* Dekorasi Gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/30 rotate-3 group-hover:rotate-0 transition-transform duration-300">
            <span className="text-3xl font-black text-white">TK</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter">TugasKu</h1>
          <p className="text-foreground/40 mt-2 text-sm font-medium italic">Empowering Classroom Productivity</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs text-center font-bold uppercase tracking-wide animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-foreground/40 uppercase tracking-widest ml-1">Username / Email</label>
            <input 
              name="username" 
              type="text" 
              required 
              placeholder="Contoh: admin" 
              className="w-full px-5 py-3 bg-foreground/5 border border-border-custom rounded-xl focus:ring-2 focus:ring-blue-500 text-foreground outline-none transition-all placeholder:text-foreground/10 font-medium" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-foreground/40 uppercase tracking-widest ml-1">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full px-5 py-3 bg-foreground/5 border border-border-custom rounded-xl focus:ring-2 focus:ring-blue-500 text-foreground outline-none transition-all placeholder:text-foreground/10 font-medium" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !isOnline}
            className={`w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95
              ${loading || !isOnline 
                ? 'bg-foreground/10 text-foreground/20 cursor-not-allowed border border-border-custom' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 hover:shadow-blue-500/40'}
            `}
          >
            {loading ? 'Processing...' : (isOnline ? 'Login Now' : 'Offline Mode')}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-border-custom text-center">
            <p className="text-[10px] text-foreground/20 font-bold uppercase tracking-[0.2em]">
                &copy; 2026 TugasKu System &bull; All Rights Reserved
            </p>
        </div>
      </div>
    </div>
  );
}