'use client'

import { useState } from 'react'

interface ImagePreviewProps {
  src: string
  alt?: string
  className?: string
}

export default function ImagePreview({ src, alt = "Preview", className = "" }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Thumbnail yang bisa diklik */}
      <div 
        className={`cursor-zoom-in overflow-hidden group relative ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
             <span className="opacity-0 group-hover:opacity-100 bg-black/50 text-white text-[10px] px-2 py-1 rounded">Klik Perbesar</span>
        </div>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center">
            {/* Tombol Close */}
            <button 
              className="absolute -top-12 right-0 text-white flex items-center gap-2 hover:text-gray-300 transition"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-sm font-bold uppercase tracking-widest">Tutup</span>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Gambar Ukuran Besar */}
            <img 
              src={src} 
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </>
  )
}