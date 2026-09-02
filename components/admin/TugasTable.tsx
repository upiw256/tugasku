'use client'

import { useState } from 'react';
import Link from 'next/link';
import DeleteTaskButton from '@/components/ui/DeleteTaskButton';
import ToggleStatusButton from '@/components/admin/ToggleStatusButton';

interface Task {
  _id: string;
  judul: string;
  deskripsi: string;
  kelas: string | string[];
  tipe_pengumpulan: string;
  tipe_tugas: string;
  deadline: string;
  is_active: boolean;
}

export default function TugasTable({ tasks }: { tasks: Task[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-surface rounded-xl shadow border border-border-custom overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-foreground/5 text-foreground/70 uppercase font-bold border-b border-border-custom">
          <tr>
            <th className="px-6 py-4">Judul Tugas</th>
            <th className="px-6 py-4 hidden md:table-cell">Kelas</th>
            <th className="px-6 py-4 hidden md:table-cell">Metode</th>
            <th className="px-6 py-4 hidden md:table-cell">Deadline</th>
            <th className="px-6 py-4 text-center hidden md:table-cell">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-custom">
          {tasks.map((t) => {
            const isOnline = (t.tipe_pengumpulan || 'online') === 'online';
            const isActive = t.is_active ?? true;
            
            return (
              <React.Fragment key={t._id}>
                {/* Main Row */}
                <tr 
                  className={`transition-colors cursor-pointer md:cursor-default ${expandedId === t._id ? 'bg-blue-500/5' : 'hover:bg-foreground/5'}`}
                  onClick={() => toggleExpand(t._id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <div className="font-black text-foreground flex items-center gap-2 text-sm md:text-base">
                          <span className="truncate">{t.judul}</span>
                          {t.tipe_tugas === 'kelompok' && (
                            <span className="bg-indigo-500/10 text-indigo-500 text-[8px] uppercase px-1.5 py-0.5 rounded font-black border border-indigo-500/20 shrink-0">Kelompok</span>
                          )}
                        </div>
                        <div className="text-[10px] text-foreground/40 line-clamp-1 mt-0.5">
                          {t.deskripsi || '-'}
                        </div>
                        
                        {/* Mobile Only Badges */}
                        <div className="flex flex-wrap gap-2 mt-2 md:hidden">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${isOnline ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom'}`}>
                                {isOnline ? '☁️ Online' : '🏫 Offline'}
                            </span>
                            <div className="flex gap-1">
                                {Array.isArray(t.kelas) ? t.kelas.map(k => (
                                    <span key={k} className="bg-blue-500/5 text-blue-500/60 text-[9px] px-1.5 py-0.5 rounded font-bold border border-blue-500/10 uppercase italic">{k}</span>
                                )) : <span className="bg-blue-500/5 text-blue-500/60 text-[9px] px-1.5 py-0.5 rounded font-bold border border-blue-500/10 uppercase italic">{t.kelas}</span>}
                            </div>
                        </div>
                      </div>
                      
                      {/* Mobile Expand Indicator */}
                      <div className="md:hidden text-foreground/20 ml-2">
                          {expandedId === t._id ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                          ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          )}
                      </div>
                    </div>
                  </td>

                  {/* Desktop Only Columns */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(t.kelas)
                        ? t.kelas.map((k: string) => (
                            <span key={k} className="bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">
                              {k}
                            </span>
                          ))
                        : (
                            <span className="bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">
                              {t.kelas}
                            </span>
                          )
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded border uppercase tracking-wider ${isOnline ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom'}`}>
                      {isOnline ? '☁️ Upload' : '🏫 Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {t.deadline ? (
                      <span suppressHydrationWarning className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest
                        ${new Date(t.deadline) < new Date() ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}
                      `}>
                        {new Date(t.deadline).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short'
                        })}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex justify-center gap-3 items-center">
                       <Link
                          href={`/admin/tugas/${t._id}/pengumpulan`}
                          className="bg-teal-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-teal-600 transition shadow-lg shadow-teal-500/20 uppercase tracking-widest"
                       >
                          Cek Data
                       </Link>
                       <Link
                          href={`/admin/tugas/${t._id}`}
                          className="text-blue-500 hover:text-blue-400 font-black text-[10px] uppercase tracking-widest"
                       >
                          Edit
                       </Link>
                       <ToggleStatusButton id={t._id} initialStatus={isActive} />
                       <DeleteTaskButton id={t._id} judul={t.judul} />
                    </div>
                  </td>
                </tr>

                {/* Mobile Expanded Menu */}
                {expandedId === t._id && (
                  <tr className="md:hidden bg-foreground/[0.02] animate-in fade-in slide-in-from-top-2 duration-200">
                    <td className="px-6 py-6 border-b border-border-custom">
                       <div className="space-y-6">
                          {/* Info Section */}
                          <div className="grid grid-cols-2 gap-4 border-b border-border-custom pb-4 text-center">
                             <div>
                                <p className="text-[10px] font-black uppercase text-foreground/30 mb-1 tracking-widest">Deadline</p>
                                <p suppressHydrationWarning className={`text-xs font-black ${new Date(t.deadline) < new Date() ? 'text-red-500' : 'text-green-500'}`}>
                                   {t.deadline ? new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tidak ada'}
                                </p>
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-foreground/30 mb-1 tracking-widest">Status Tugas</p>
                                <p className="text-xs font-black text-foreground">{isActive ? '🟢 AKTIF' : '🔴 NON-AKTIF'}</p>
                             </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-3">
                             <Link
                                href={`/admin/tugas/${t._id}/pengumpulan`}
                                className="flex items-center justify-center gap-2 bg-teal-600 text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20"
                             >
                                👁️ Cek Data Pengumpulan
                             </Link>
                             
                             <div className="grid grid-cols-2 gap-3">
                                <Link
                                   href={`/admin/tugas/${t._id}`}
                                   className="flex items-center justify-center gap-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 p-3 rounded-xl font-black text-xs uppercase tracking-widest"
                                >
                                   ✏️ Edit
                                </Link>
                                <div className="flex">
                                   <ToggleStatusButton id={t._id} initialStatus={isActive} className="w-full h-full flex items-center justify-center gap-2 bg-foreground/5 text-foreground/60 p-3 rounded-xl font-black text-xs uppercase tracking-widest border border-border-custom" />
                                </div>
                                <div className="flex col-span-2">
                                   <DeleteTaskButton id={t._id} judul={t.judul} className="w-full h-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 p-4 rounded-xl font-black text-xs uppercase tracking-widest" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={5} className="p-12 text-center text-foreground/20 font-medium italic">
                Belum ada tugas dibuat.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import React from 'react';
