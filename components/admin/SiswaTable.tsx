'use client'

import { useState } from 'react';
import Link from 'next/link';
import GivePointButton from '@/components/admin/GivePointButton';
import DeleteStudentButton from '@/components/ui/DeleteStudentButton';
import ResetPasswordButton from '@/components/ui/ResetPasswordButton';

interface Student {
  _id: string;
  nis: string;
  nama_lengkap: string;
  kelas: string;
  poin_keaktifan: number;
}

export default function SiswaTable({ students }: { students: Student[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-surface rounded-xl shadow border border-border-custom overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-foreground/5 text-foreground/70 uppercase font-bold border-b border-border-custom">
          <tr>
            <th className="px-6 py-4 hidden md:table-cell">NIS</th>
            <th className="px-6 py-4">Nama Siswa</th>
            <th className="px-6 py-4 hidden md:table-cell">Kelas</th>
            <th className="px-6 py-4 text-center hidden md:table-cell">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-custom">
          {students.map((s) => (
            <React.Fragment key={s._id}>
              {/* Main Row */}
              <tr 
                className={`transition-colors cursor-pointer md:cursor-default ${expandedId === s._id ? 'bg-blue-500/5' : 'hover:bg-foreground/5'}`}
                onClick={() => toggleExpand(s._id)}
              >
                <td className="px-6 py-4 font-mono text-foreground/40 hidden md:table-cell">
                  {s.nis}
                </td>
                <td className="px-6 py-4 font-medium text-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm md:text-base">{s.nama_lengkap}</span>
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5 mt-0.5">
                        ⭐ {s.poin_keaktifan || 0} Poin Aktif
                      </span>
                      {/* Mobile Only Info */}
                      <div className="flex gap-2 mt-1 md:hidden">
                         <span className="bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            {s.kelas}
                         </span>
                         <span className="text-[10px] text-foreground/30 font-mono">
                            {s.nis}
                         </span>
                      </div>
                    </div>
                    {/* Mobile Expand Indicator */}
                    <div className="md:hidden text-foreground/20">
                        {expandedId === s._id ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="bg-blue-500/10 text-blue-500 text-xs px-2.5 py-1 rounded font-bold border border-blue-500/20 uppercase tracking-widest leading-none">
                    {s.kelas}
                  </span>
                </td>
                {/* Desktop Actions */}
                <td className="px-6 py-4 hidden md:table-cell">
                   <div className="flex justify-center gap-3 items-center">
                      <GivePointButton memberId={s._id} />
                      <div className="w-[1px] h-4 bg-border-custom mx-1"></div>
                      <Link 
                        href={`/admin/siswa/${s._id}/nilai`} 
                        className="bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20 text-[10px] px-2 py-1.5 rounded font-bold transition flex items-center gap-1 uppercase"
                      >
                        📊 Nilai
                      </Link>
                      <Link
                        href={`/admin/siswa/${s._id}`}
                        className="text-blue-500 hover:text-blue-400 font-bold text-xs uppercase"
                      >
                        Edit
                      </Link>

                      <DeleteStudentButton
                        id={s._id}
                        nama={s.nama_lengkap}
                      />

                      <ResetPasswordButton
                        memberId={s._id}
                        nama={s.nama_lengkap}
                      />
                   </div>
                </td>
              </tr>

              {/* Mobile Expanded Menu */}
              {expandedId === s._id && (
                <tr className="md:hidden bg-foreground/[0.02] animate-in fade-in slide-in-from-top-2 duration-200">
                  <td colSpan={2} className="px-6 py-6 border-b border-border-custom">
                     <div className="space-y-6">
                        {/* Poin Section */}
                        <div>
                           <p className="text-[10px] font-black uppercase text-foreground/30 mb-2 tracking-widest">Manajemen Poin</p>
                           <GivePointButton memberId={s._id} />
                        </div>

                        {/* Action Buttons Grid */}
                        <div className="grid grid-cols-2 gap-3">
                           <Link 
                              href={`/admin/siswa/${s._id}/nilai`} 
                              className="flex items-center justify-center gap-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 p-3 rounded-xl font-bold text-xs"
                           >
                              📊 Lihat Nilai
                           </Link>
                           <Link
                              href={`/admin/siswa/${s._id}`}
                              className="flex items-center justify-center gap-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 p-3 rounded-xl font-bold text-xs"
                           >
                              ✏️ Edit Profil
                           </Link>
                           <div className="flex">
                              <ResetPasswordButton
                                 memberId={s._id}
                                 nama={s.nama_lengkap}
                                 className="w-full h-full flex items-center justify-center gap-2 bg-slate-500/10 text-slate-500 border border-slate-500/20 p-3 rounded-xl font-bold text-xs"
                              />
                           </div>
                           <div className="flex">
                              <DeleteStudentButton
                                 id={s._id}
                                 nama={s.nama_lengkap}
                                 className="w-full h-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 p-3 rounded-xl font-bold text-xs"
                              />
                           </div>
                        </div>
                     </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="p-12 text-center text-foreground/20 font-medium italic">
                Tidak ada data siswa ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import React from 'react';
