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
    <div className="flex items-center gap-2 bg-green-50 p-1.5 rounded-lg border border-green-200">
      {/* Dropdown Kelas */}
      <select 
        value={kelasDipilih} 
        onChange={(e) => setKelasDipilih(e.target.value)}
        className="px-2 py-1.5 border border-green-300 rounded text-sm outline-none bg-white min-w-[100px]"
      >
        <option value="">- Kls -</option>
        {listKelas.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>

      {/* Tombol Eksekusi */}
      <button
        onClick={handleDownload}
        disabled={!kelasDipilih || loading}
        className={`px-3 py-1.5 rounded text-sm font-bold text-white transition-all whitespace-nowrap flex items-center gap-1
          ${!kelasDipilih || loading 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-green-600 hover:bg-green-700 shadow-sm"
          }
        `}
      >
        {loading ? '...' : (
          <>
            {/* Ikon Download */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span className="hidden sm:inline">Excel</span>
          </>
        )}
      </button>
    </div>
  )
}