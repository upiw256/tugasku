'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import GivePointButton from '@/components/admin/GivePointButton';

interface Student {
  _id: string;
  nis: string;
  nama_lengkap: string;
  kelas: string;
  poin_keaktifan: number;
}

export default function GuruSiswaTable({ students }: { students: Student[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-surface rounded-3xl shadow-sm border border-border-custom overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-foreground/[0.03] text-[10px] font-black uppercase text-foreground/40 tracking-widest border-b border-border-custom">
            <tr>
              <th className="px-6 py-5 hidden md:table-cell">NIS</th>
              <th className="px-6 py-5">Siswa</th>
              <th className="px-6 py-5 hidden md:table-cell">Kelas</th>
              <th className="px-6 py-5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-custom">
            {students.map((s) => (
              <React.Fragment key={s._id}>
                {/* Main Row */}
                <tr 
                  className={`transition-all ${expandedId === s._id ? 'bg-primary-500/5' : 'hover:bg-foreground/[0.01]'}`}
                  onClick={() => toggleExpand(s._id)}
                >
                  <td className="px-6 py-5 font-mono text-foreground/40 hidden md:table-cell">
                    {s.nis}
                  </td>
                  <td className="px-6 py-5 font-medium text-foreground">
                    <div className="flex flex-col">
                      <span className="font-bold">{s.nama_lengkap}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-500/20 font-black uppercase">
                          ⭐ {s.poin_keaktifan || 0} Poin
                        </span>
                        {/* Mobile Only Info */}
                        <span className="md:hidden bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5 rounded-lg border border-blue-500/20 font-black uppercase">
                           {s.kelas}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <span className="bg-foreground/5 text-foreground/60 text-[10px] font-black px-3 py-1 rounded-xl border border-border-custom uppercase tracking-wider">
                      {s.kelas}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex justify-center items-center gap-2">
                        {/* Desktop Poin */}
                        <div className="hidden md:block">
                           <GivePointButton memberId={s._id} />
                        </div>
                        
                        <Link 
                          href={`/guru/siswa/${s._id}/nilai`} 
                          className="px-4 py-2 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          Input Nilai
                        </Link>

                        {/* Mobile Expand Indicator */}
                        <div className="md:hidden ml-2 text-foreground/20">
                            <svg className={`w-5 h-5 transition-transform ${expandedId === s._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                  </td>
                </tr>

                {/* Mobile Expanded Menu */}
                {expandedId === s._id && (
                  <tr className="md:hidden bg-foreground/[0.02] border-b border-border-custom">
                    <td colSpan={2} className="px-6 py-6 transition-all animate-in slide-in-from-top-2">
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Manajemen Poin Aktif</p>
                          <GivePointButton memberId={s._id} />
                       </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-foreground/20 font-bold italic uppercase tracking-widest">
                  Siswa tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
