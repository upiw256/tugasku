'use client'

import { resetPasswordAction } from "@/actions/admin-actions";
import { useState } from "react";

export default function ResetPasswordButton({ 
  memberId, 
  nama,
  className
}: { 
  memberId: string, 
  nama: string,
  className?: string 
}) {
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

  const defaultClass = `text-xs px-3 py-1 rounded border transition font-medium ${
    isLoading 
      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait' 
      : 'bg-surface text-orange-600 border border-orange-500/30 hover:bg-orange-500/10'
  }`;

  return (
    <button
      onClick={handleReset}
      disabled={isLoading}
      className={className || defaultClass}
    >
      {isLoading ? 'Mereset...' : (className?.includes('p-3') ? '🔑 Reset Pass' : 'Reset Pass')}
    </button>
  );
}