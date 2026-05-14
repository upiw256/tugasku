'use client'

import { deleteStudentAction } from '@/actions/admin-actions';
import { useState } from 'react';

export default function DeleteStudentButton({ 
  id, 
  nama, 
  className = "text-red-600 hover:text-red-800 text-sm font-medium" 
}: { 
  id: string, 
  nama: string,
  className?: string 
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Yakin ingin menghapus siswa ${nama}? Data nilai juga akan terhapus.`)) return;

    setLoading(true);
    await deleteStudentAction(id);
    setLoading(false);
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading}
      className={`${className} disabled:opacity-50`}
    >
      {loading ? '...' : (className.includes('p-3') ? '🗑️ Hapus' : 'Hapus')}
    </button>
  );
}