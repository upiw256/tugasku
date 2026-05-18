'use client'

import { syncGuruFromApiAction } from '@/actions/admin-guru-actions';
import { useState } from 'react';

export default function SyncGuruButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!confirm('Apakah Anda yakin ingin menarik data guru dari sistem pusat? Data yang sudah ada tidak akan terhapus, hanya akan diperbarui.')) return;
    
    setIsSyncing(true);
    try {
      const res = await syncGuruFromApiAction();
      alert(res.message);
    } catch (error) {
      alert('Maaf, terjadi kesalahan saat sinkronisasi.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className={`px-4 py-2 rounded text-sm font-bold h-[38px] flex items-center gap-2 transition-all border
        ${isSyncing 
          ? 'bg-foreground/5 text-foreground/40 cursor-not-allowed border-border-custom' 
          : 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20 hover:bg-emerald-600/20'
        }
      `}
    >
      <svg 
        className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      {isSyncing ? 'Sinkronisasi...' : 'Tarik Data API'}
    </button>
  );
}
