'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickGrade({ 
  submissionId, 
  currentNilai,
  memberId,
  tugasId
}: { 
  submissionId: string, 
  currentNilai: number,
  memberId?: string,
  tugasId?: string
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nilai, setNilai] = useState(currentNilai || '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nilai/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nilai: Number(Number(nilai).toFixed(2)),
          memberId, // Dikirim jika ada (untuk record baru)
          tugasId   // Dikirim jika ada (untuk record baru)
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh(); // Segarkan data di tabel
      }
    } catch (error) {
      console.error("Gagal update nilai", error);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 justify-center">
        <input
          autoFocus
          type="number"
          className="w-12 border rounded px-1 text-center font-bold text-sm"
          value={nilai}
          onChange={(e) => setNilai(e.target.value)}
          onBlur={() => !nilai && setIsEditing(false)}
        />
        <button 
          onClick={handleUpdate}
          disabled={loading}
          className="bg-green-500 text-white text-[10px] px-1.5 py-1 rounded"
        >
          {loading ? '...' : 'OK'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`px-2 py-1 rounded border transition-all ${
        currentNilai > 0 
        ? 'text-green-700 font-black bg-green-100 border-green-200 hover:bg-green-200' 
        : 'text-orange-400 text-[10px] bg-orange-50 border-orange-100 hover:bg-orange-100'
      }`}
    >
      {currentNilai > 0 ? Number(currentNilai.toFixed(2)) : 'PENDING'}
    </button>
  );
}