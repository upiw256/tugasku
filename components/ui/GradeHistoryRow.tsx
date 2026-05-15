'use client'

import { useState } from 'react';
import { submitGradeAction, deleteGradeAction } from '@/actions/grade-actions'; // Import action delete

export default function GradeHistoryRow({ grade, memberId }: { grade: any, memberId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi Simpan Edit
  const handleSave = async (formData: FormData) => {
    setIsLoading(true);
    await submitGradeAction(formData);
    setIsLoading(false);
    setIsEditing(false);
  };

  // Fungsi Hapus (Baru)
  const handleDelete = async () => {
    const confirm = window.confirm(`Yakin ingin menghapus nilai tugas "${grade.tugas_id?.judul}"?`);
    if (!confirm) return;

    setIsLoading(true);
    await deleteGradeAction(grade._id, memberId);
    setIsLoading(false);
  };

  // Tampilan saat Mode Edit
  if (isEditing) {
    return (
      <tr className="bg-primary-500/5 border-b border-border-custom">
        <td className="px-4 py-3 text-foreground/60 text-sm">
          {grade.tugas_id?.judul || 'Tugas Terhapus'}
        </td>
        <td className="px-4 py-3">
          <form action={handleSave} className="flex items-center gap-2">
            <input type="hidden" name="member_id" value={memberId} />
            <input type="hidden" name="tugas_id" value={grade.tugas_id?._id} />
            
            <input 
              name="nilai" 
              type="number" 
              defaultValue={grade.nilai} 
              min="0" max="100" 
              className="w-16 px-2 py-1 text-sm border border-border-custom bg-surface text-foreground rounded focus:ring-2 focus:ring-primary-500 outline-none"
              autoFocus
            />
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-green-700"
              title="Simpan"
            >
              ✓
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="bg-danger-500/20 text-danger-600 px-2 py-1 rounded text-xs font-bold hover:bg-danger-500/30"
              title="Batal"
            >
              ✕
            </button>
          </form>
        </td>
      </tr>
    );
  }

  // Tampilan Normal
  return (
    <tr className="hover:bg-foreground/5 border-b border-border-custom last:border-0 group transition-colors">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-bold text-foreground leading-tight">
            {grade.tugas_id?.judul || 'Tugas Terhapus'}
          </span>
          {grade.file_url ? (
            <a 
              href={grade.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-primary-500 hover:underline flex items-center gap-1 mt-1 font-medium bg-primary-500/10 w-fit px-1.5 py-0.5 rounded"
            >
              📂 Lihat File Hasil
            </a>
          ) : (
            <span className="text-[10px] text-foreground/20 italic mt-1">
              Tidak ada lampiran file
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 flex justify-between items-center gap-4">
        <span className={`font-bold text-lg ${grade.nilai < 75 ? 'text-danger-500' : 'text-emerald-500'}`}>
          {grade.nilai}
        </span>
        
        {/* Container Tombol Aksi (Muncul saat hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          {/* Tombol Edit */}
          <button 
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
            className="text-[10px] text-primary-500 font-bold bg-primary-500/10 px-2 py-1 rounded border border-primary-500/20 hover:bg-primary-500/20 transition"
          >
            Edit ✎
          </button>

          {/* Tombol Hapus (Baru) */}
          <button 
            onClick={handleDelete}
            disabled={isLoading}
            className="text-[10px] text-danger-500 font-bold bg-danger-500/10 px-2 py-1 rounded border border-danger-500/20 hover:bg-danger-500/20 transition"
            title="Hapus Nilai"
          >
            Hapus 🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}