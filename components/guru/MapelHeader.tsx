'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MapelHeader({ listMapel, isMobileVariant = false }: { listMapel: string[], isMobileVariant?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentMapel = searchParams.get('mapel') || '';

  const setMapel = (mapel: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mapel) {
      params.set('mapel', mapel);
    } else {
      params.delete('mapel');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={`p-2 flex items-center gap-2 overflow-x-auto scrollbar-none transition-all
      ${isMobileVariant ? 'bg-transparent border-0' : 'bg-surface rounded-2xl border border-border-custom shadow-sm sticky top-[60px] md:top-0 z-10 backdrop-blur-md bg-surface/80'}
    `}>
      <div className="flex items-center gap-1 bg-foreground/5 px-3 py-2 rounded-xl border border-border-custom mr-2 shrink-0">
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
          <span className="text-[10px] font-black uppercase text-foreground/40 translate-y-[1px]">Mata Pelajaran</span>
      </div>

      <button
        onClick={() => setMapel('')}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border
          ${!currentMapel 
            ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20' 
            : 'bg-transparent text-foreground/50 border-transparent hover:bg-foreground/5'
          }
        `}
      >
        Semua
      </button>

      {listMapel.map((mapel) => (
        <button
          key={mapel}
          onClick={() => setMapel(mapel)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border
            ${currentMapel === mapel 
              ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20' 
              : 'bg-transparent text-foreground/50 border-transparent hover:bg-foreground/5'
            }
          `}
        >
          {mapel}
        </button>
      ))}

      <div className="flex-1"></div>

      <Link
        href="/guru/pengajaran"
        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground/30 hover:text-primary-500 hover:bg-primary-500/5 transition-all flex items-center gap-2 shrink-0 border border-transparent hover:border-primary-500/20"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        Kelola Mapel
      </Link>
    </div>
  );
}
