'use client'

import { deleteTaskAction } from '@/actions/task-actions';
import { useState } from 'react';

export default function DeleteTaskButton({ id, judul }: { id: string, judul: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    // Konfirmasi ganda karena menghapus tugas juga menghapus nilai siswa
    const confirm = window.confirm(`HAPUS TUGAS "${judul}"?\n\nPeringatan: Semua nilai siswa untuk tugas ini juga akan terhapus permanen!`);
    if (!confirm) return;

    setLoading(true);
    await deleteTaskAction(id);
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