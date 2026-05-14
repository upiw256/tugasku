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
    <div className="flex gap-1.5">
      <button
        onClick={() => handleGivePoint(5)}
        disabled={loading}
        className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-2 py-1 rounded text-[10px] font-black border border-amber-500/20 transition-all active:scale-95"
        title="Beri +5 Poin Aktif"
      >
        +5 ⭐
      </button>
      <button
        onClick={() => handleGivePoint(10)}
        disabled={loading}
        className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 px-2 py-1 rounded text-[10px] font-black border border-orange-500/20 transition-all active:scale-95"
        title="Beri +10 Poin Aktif"
      >
        +10 ⭐
      </button>

      {/* NEW: MINUS POINTS */}
      <button
        onClick={() => handleGivePoint(-5)}
        disabled={loading}
        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-1 rounded text-[10px] font-black border border-red-500/20 transition-all active:scale-95"
        title="Sanksi -5 Poin"
      >
        -5 😡
      </button>
      <button
        onClick={() => handleGivePoint(-10)}
        disabled={loading}
        className="bg-red-600/20 text-red-400 hover:bg-red-600/30 px-2 py-1 rounded text-[10px] font-black border border-red-600/30 transition-all active:scale-95"
        title="Sanksi -10 Poin"
      >
        -10 😡
      </button>
    </div>
  );
}
