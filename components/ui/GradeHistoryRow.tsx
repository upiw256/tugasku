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
      <tr className="bg-yellow-50 border-b">
        <td className="px-4 py-3 text-gray-600 text-sm">
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
              className="w-16 px-2 py-1 text-sm border border-orange-300 rounded focus:ring-2 focus:ring-orange-200 outline-none"
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
              className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold hover:bg-gray-500"
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
    <tr className="hover:bg-gray-50 border-b last:border-0 group">
      <td className="px-4 py-3 font-medium text-gray-700">
        {grade.tugas_id?.judul || 'Tugas Terhapus'}
      </td>
      <td className="px-4 py-3 flex justify-between items-center gap-4">
        <span className={`font-bold ${grade.nilai < 75 ? 'text-red-500' : 'text-green-600'}`}>
          {grade.nilai}
        </span>
        
        {/* Container Tombol Aksi (Muncul saat hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          {/* Tombol Edit */}
          <button 
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-1 rounded border border-blue-100"
          >
            Edit ✎
          </button>

          {/* Tombol Hapus (Baru) */}
          <button 
            onClick={handleDelete}
            disabled={isLoading}
            className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 px-2 py-1 rounded border border-red-100"
            title="Hapus Nilai"
          >
            Hapus 🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}