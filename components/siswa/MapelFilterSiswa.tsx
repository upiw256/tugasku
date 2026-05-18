'use client'

import { useRouter, useSearchParams } from 'next/navigation';

export default function MapelFilterSiswa({ listMapel, currentMapel }: { listMapel: string[], currentMapel: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMapelChange = (mapel: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mapel) {
      params.set('mapel', mapel);
    } else {
      params.delete('mapel');
    }
    params.set('page', '1');
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
      <button
        onClick={() => handleMapelChange('')}
        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
          ${!currentMapel 
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-105' 
            : 'bg-surface text-foreground/40 border border-border-custom hover:bg-foreground/5'}
        `}
      >
        🌟 Semua Mapel
      </button>
      {listMapel.map((m) => (
        <button
          key={m}
          onClick={() => handleMapelChange(m)}
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
            ${currentMapel === m 
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-105' 
              : 'bg-surface text-foreground/40 border border-border-custom hover:bg-foreground/5'}
          `}
        >
          📚 {m}
        </button>
      ))}
    </div>
  );
}
