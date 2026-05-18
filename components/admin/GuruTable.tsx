'use client'

import { useState } from 'react';
import Link from 'next/link';
import React from 'react';

interface Pengajaran {
  mapel: string;
  kelas: string[];
}

interface Guru {
  _id: string;
  nip: string;
  nama_lengkap: string;
  pengajaran: Pengajaran[];
}

export default function GuruTable({ gurus }: { gurus: Guru[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-surface rounded-xl shadow border border-border-custom overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-foreground/5 text-foreground/70 uppercase font-bold border-b border-border-custom">
          <tr>
            <th className="px-6 py-4 hidden md:table-cell">NIP</th>
            <th className="px-6 py-4">Nama Guru</th>
            <th className="px-6 py-4 hidden md:table-cell">Mengajar</th>
            <th className="px-6 py-4 text-center hidden md:table-cell">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-custom">
          {gurus.map((g) => (
            <React.Fragment key={g._id}>
              {/* Main Row */}
              <tr 
                className={`transition-colors cursor-pointer md:cursor-default ${expandedId === g._id ? 'bg-blue-500/5' : 'hover:bg-foreground/5'}`}
                onClick={() => toggleExpand(g._id)}
              >
                <td className="px-6 py-4 font-mono text-foreground/40 hidden md:table-cell">
                  {g.nip}
                </td>
                <td className="px-6 py-4 font-medium text-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm md:text-base">{g.nama_lengkap}</span>
                      
                      {/* Mobile Only Info */}
                      <div className="flex gap-2 mt-1 md:hidden flex-wrap">
                         <span className="text-[10px] text-foreground/30 font-mono">
                            {g.nip}
                         </span>
                      </div>
                    </div>
                    {/* Mobile Expand Indicator */}
                    <div className="md:hidden text-foreground/20">
                        {expandedId === g._id ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="flex flex-col gap-1">
                    {g.pengajaran.length > 0 ? g.pengajaran.map((pengajaran, index) => (
                        <div key={index} className="flex gap-2 items-center flex-wrap">
                            <span className="bg-blue-500/10 text-blue-500 text-xs px-2.5 py-1 rounded font-bold border border-blue-500/20 uppercase">
                                {pengajaran.mapel}
                            </span>
                            <span className="text-xs text-foreground/60">{pengajaran.kelas.join(', ')}</span>
                        </div>
                    )) : <span className="text-xs text-foreground/40 italic">Belum diset</span>}
                  </div>
                </td>
                {/* Desktop Actions */}
                <td className="px-6 py-4 hidden md:table-cell text-center">
                   <div className="flex justify-center gap-3 items-center">
                      <Link
                        href={`/admin/guru/${g._id}`}
                        className="text-blue-500 hover:text-blue-400 font-bold text-xs uppercase"
                      >
                        Edit
                      </Link>
                   </div>
                </td>
              </tr>

              {/* Mobile Expanded Menu */}
              {expandedId === g._id && (
                <tr className="md:hidden bg-foreground/[0.02] animate-in fade-in slide-in-from-top-2 duration-200">
                  <td colSpan={2} className="px-6 py-6 border-b border-border-custom">
                     <div className="space-y-6">
                        
                        <div>
                           <p className="text-[10px] font-black uppercase text-foreground/30 mb-2 tracking-widest">Pengajaran</p>
                           <div className="flex flex-col gap-2">
                               {g.pengajaran.length > 0 ? g.pengajaran.map((pengajaran, index) => (
                                   <div key={index} className="flex flex-col gap-1 bg-surface border border-border-custom p-2 rounded">
                                       <span className="text-xs font-bold text-blue-500">{pengajaran.mapel}</span>
                                       <span className="text-xs text-foreground/60">{pengajaran.kelas.join(', ')}</span>
                                   </div>
                               )) : <span className="text-xs text-foreground/40 italic">Belum ada pengajaran</span>}
                           </div>
                        </div>

                        {/* Action Buttons Grid */}
                        <div className="grid grid-cols-1 gap-3">
                           <Link
                              href={`/admin/guru/${g._id}`}
                              className="flex items-center justify-center gap-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 p-3 rounded-xl font-bold text-xs"
                           >
                              ✏️ Edit Profil & Pengajaran
                           </Link>
                        </div>
                     </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {gurus.length === 0 && (
            <tr>
              <td colSpan={4} className="p-12 text-center text-foreground/20 font-medium italic">
                Tidak ada data guru ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
