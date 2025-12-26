'use client'

import { deleteStudentAction } from '@/actions/admin-actions';
import { useState } from 'react';

export default function DeleteStudentButton({ id, nama }: { id: string, nama: string }) {
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
      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
    >
      {loading ? '...' : 'Hapus'}
    </button>
  );
}