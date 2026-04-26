'use client'

import { useEffect, useState } from 'react';

export default function SmartNote({ text, limit = 80 }: { text: string; limit?: number }) {
  const [meta, setMeta] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Regex untuk mendeteksi URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  const firstUrl = urls?.[0];

  // 2. Fetch Meta hanya jika ada URL
  useEffect(() => {
    if (firstUrl) {
      fetch(`/api/get-meta?url=${encodeURIComponent(firstUrl)}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setMeta(data);
        })
        .catch(() => console.log("Gagal fetch meta"));
    }
  }, [firstUrl]);

  if (!text) return null;

  // 3. Logika Teks (Read More)
  const isLongText = text.length > limit;
  const displayDescription = isExpanded ? text : `${text.substring(0, limit)}${isLongText ? '...' : ''}`;

  return (
    <div className="space-y-3">
      {/* Bagian Teks Catatan */}
      <div className="text-gray-600 text-sm leading-relaxed break-words">
        {/* Render teks dengan link yang bisa diklik */}
        {displayDescription.split(urlRegex).map((part, i) => (
          urlRegex.test(part) ? (
            <a key={i} href={part} target="_blank" className="text-blue-600 underline break-all">{part}</a>
          ) : part
        ))}
        
        {isLongText && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-1 text-blue-600 font-bold text-[10px] uppercase hover:underline"
          >
            {isExpanded ? 'Tutup' : 'Selengkapnya'}
          </button>
        )}
      </div>

      {/* Bagian Preview ala WA (Hanya muncul jika ada URL) */}
      {meta && (
        <a 
          href={meta.url} 
          target="_blank" 
          className="flex border rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition-all max-w-sm shadow-sm"
        >
          {meta.image && (
            <div className="w-20 h-20 shrink-0 border-r bg-gray-200">
              <img src={meta.image} className="w-full h-full object-cover" alt="preview" />
            </div>
          )}
          <div className="p-2 overflow-hidden flex flex-col justify-center">
            <h4 className="text-[11px] font-bold truncate text-gray-800">{meta.title}</h4>
            <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{meta.description}</p>
            <span className="text-[9px] text-gray-400 mt-1 uppercase font-semibold">{new URL(meta.url).hostname}</span>
          </div>
        </a>
      )}
    </div>
  );
}