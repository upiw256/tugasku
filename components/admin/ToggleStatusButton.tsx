'use client'

import { useState, useTransition } from 'react'
import { toggleTugasStatus } from '@/actions/submission-actions' // Sesuaikan path action Bapak

export default function ToggleStatusButton({ 
  id, 
  initialStatus,
  className
}: { 
  id: string, 
  initialStatus: boolean,
  className?: string
}) {
  const [isActive, setIsActive] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Biar ga ganggu event parent
    
    startTransition(async () => {
      const result = await toggleTugasStatus(id, isActive)
      if (result.success) {
        setIsActive(!isActive)
      } else {
        alert("Gagal mengubah status tugas")
      }
    })
  }

  const defaultClass = `p-2 rounded-lg transition-all border ${
    isActive 
      ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-emerald-600/20' 
      : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-rose-600/20'
  } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={isActive ? "Tutup Pengumpulan" : "Buka Pengumpulan"}
      className={className || defaultClass}
    >
      {isPending ? (
        <span className="text-[10px] font-bold animate-pulse">...</span>
      ) : isActive ? (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase whitespace-nowrap">
          🟢 <span className={className?.includes('p-3') ? '' : 'hidden lg:inline'}>TUTUP</span>
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase whitespace-nowrap">
          🔴 <span className={className?.includes('p-3') ? '' : 'hidden lg:inline'}>BUKA</span>
        </span>
      )}
    </button>
  )
}