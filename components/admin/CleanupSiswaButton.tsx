'use client'

import { cleanupDuplicateStudentsAction } from '@/actions/admin-cleanup-actions';
import { useState } from 'react';

export default function CleanupSiswaButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCleanup = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ganda yang tidak memiliki nilai? Aksi ini akan membersihkan data redundan di database.')) return;
    
    setIsLoading(true);
    try {
      const res = await cleanupDuplicateStudentsAction();
      alert(res.message);
    } catch (error) {
      alert('Terjadi kesalahan saat pembersihan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCleanup}
      disabled={isLoading}
      className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all border
        ${isLoading 
          ? 'bg-foreground/5 text-foreground/40 cursor-not-allowed border-border-custom' 
          : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
        }
      `}
    >
      {isLoading ? 'Membersihkan...' : '🧹 Bersihkan Ganda'}
    </button>
  );
}
