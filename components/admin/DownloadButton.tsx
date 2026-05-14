'use client'

import { useState } from "react"

export default function DownloadAkunSiswa({ listKelas }: { listKelas: string[] }) {
  const [kelasDipilih, setKelasDipilih] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDownload = () => {
    if (!kelasDipilih) return alert("Pilih kelas dulu bos!")
    
    setLoading(true)
    // Panggil API yang baru kita buat
    window.location.href = `/api/siswa/export?kelas=${kelasDipilih}`
    
    // Matikan loading setelah 3 detik
    setTimeout(() => setLoading(false), 3000)
  }

  return (
    <div className="flex items-center gap-2 bg-foreground/5 p-1.5 rounded-lg border border-border-custom">
      {/* Dropdown Kelas */}
      <select 
        value={kelasDipilih} 
        onChange={(e) => setKelasDipilih(e.target.value)}
        className="px-2 py-1.5 border border-border-custom rounded-lg text-sm outline-none bg-surface text-foreground min-w-[100px] font-medium transition focus:ring-2 focus:ring-emerald-500/20"
      >
        <option value="" className="bg-surface text-foreground">- Kls -</option>
        {listKelas.map((k) => (
          <option key={k} value={k} className="bg-surface text-foreground">{k}</option>
        ))}
      </select>

      {/* Tombol Eksekusi */}
      <button
        onClick={handleDownload}
        disabled={!kelasDipilih || loading}
        className={`px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-all whitespace-nowrap flex items-center gap-2
          ${!kelasDipilih || loading 
            ? "bg-slate-700 text-slate-500 cursor-not-allowed" 
            : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/10 active:scale-95"
          }
        `}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span className="hidden sm:inline font-black">EXCEL</span>
          </>
        )}
      </button>
    </div>
  )
}