'use client'

import { resetAllGuruAuthAction } from '@/actions/admin-guru-actions';
import { useState } from 'react';

export default function ResetAllGuruAuthButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm('PERINGATAN: Ini akan mereset SEMUA username dan password guru menjadi format default (NIP@guru.com dan password 654321). Apakah Anda yakin?')) return;
    
    setIsLoading(true);
    try {
      const res = await resetAllGuruAuthAction();
      alert(res.message);
    } catch (error) {
      alert('Terjadi kesalahan saat mereset data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={isLoading}
      className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all border
        ${isLoading 
          ? 'bg-foreground/5 text-foreground/40 cursor-not-allowed border-border-custom' 
          : 'bg-danger-500/10 text-danger-500 border-danger-500/20 hover:bg-danger-500/20'
        }
      `}
    >
      {isLoading ? 'Mereset...' : '🔥 Reset Semua Akun'}
    </button>
  );
}
