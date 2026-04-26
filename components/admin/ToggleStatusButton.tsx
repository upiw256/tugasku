'use client'

import { useState, useTransition } from 'react'
import { toggleTugasStatus } from '@/actions/submission-actions' // Sesuaikan path action Bapak

export default function ToggleStatusButton({ 
  id, 
  initialStatus 
}: { 
  id: string, 
  initialStatus: boolean 
}) {
  const [isActive, setIsActive] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleTugasStatus(id, isActive)
      if (result.success) {
        setIsActive(!isActive)
      } else {
        alert("Gagal mengubah status tugas")
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={isActive ? "Tutup Pengumpulan" : "Buka Pengumpulan"}
      className={`p-2 rounded-lg transition-all border ${
        isActive 
          ? 'bg-green-50 text-green-600 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
          : 'bg-red-50 text-red-600 border-red-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isPending ? (
        <span className="text-[10px] font-bold">...</span>
      ) : isActive ? (
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase">
          🔓 <span className="hidden lg:inline">Buka</span>
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase">
          🔒 <span className="hidden lg:inline">Tutup</span>
        </span>
      )}
    </button>
  )
}