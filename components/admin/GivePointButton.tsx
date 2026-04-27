'use client'

import { useState } from 'react';
import { addActivityPoint } from '@/actions/admin-actions';
import { toast } from 'react-hot-toast';

export default function GivePointButton({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(false);

  const handleGivePoint = async (points: number) => {
    setLoading(true);
    try {
      const res = await addActivityPoint(memberId, points);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-1">
      <button
        onClick={() => handleGivePoint(5)}
        disabled={loading}
        className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-2 py-1 rounded text-[10px] font-bold border border-amber-200 transition-colors"
        title="Beri +5 Poin Aktif"
      >
        +5 ⭐
      </button>
      <button
        onClick={() => handleGivePoint(10)}
        disabled={loading}
        className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-2 py-1 rounded text-[10px] font-bold border border-orange-200 transition-colors"
        title="Beri +10 Poin Aktif"
      >
        +10 ⭐
      </button>

      {/* NEW: MINUS POINTS */}
      <button
        onClick={() => handleGivePoint(-5)}
        disabled={loading}
        className="bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded text-[10px] font-bold border border-red-200 transition-colors"
        title="Sanksi -5 Poin"
      >
        -5 😡
      </button>
      <button
        onClick={() => handleGivePoint(-10)}
        disabled={loading}
        className="bg-red-200 text-red-800 hover:bg-red-300 px-2 py-1 rounded text-[10px] font-bold border border-red-300 transition-colors"
        title="Sanksi -10 Poin"
      >
        -10 😡
      </button>
    </div>
  );
}
