'use client'

import { resetPasswordAction } from "@/actions/admin-actions";
import { useState } from "react";

export default function ResetPasswordButton({ memberId, nama }: { memberId: string, nama: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    // Konfirmasi dulu biar admin gak salah klik
    const confirm = window.confirm(`Yakin ingin mereset password siswa "${nama}" menjadi "123456"?`);
    if (!confirm) return;

    setIsLoading(true);
    const res = await resetPasswordAction(memberId);
    
    alert(res.message); // Tampilkan pesan sukses/gagal
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleReset}
      disabled={isLoading}
      className={`text-xs px-3 py-1 rounded border transition font-medium
        ${isLoading 
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait' 
          : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'
        }
      `}
    >
      {isLoading ? 'Mereset...' : 'Reset Pass'}
    </button>
  );
}