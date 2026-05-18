'use client'

import React from 'react';
import Link from 'next/link';

interface Task {
    _id: string;
    judul: string;
    mapel: string;
    deadline: string;
    kelas: string | string[];
    is_active: boolean;
}

export default function GuruTaskTable({ tasks }: { tasks: Task[] }) {
    return (
        <div className="bg-surface rounded-2xl border border-border-custom overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead className="bg-foreground/[0.03] text-[10px] font-black uppercase text-foreground/40 tracking-widest border-b border-border-custom">
                    <tr>
                        <th className="px-6 py-4">Tugas & Mapel</th>
                        <th className="px-6 py-4 hidden md:table-cell">Target Kelas</th>
                        <th className="px-6 py-4 hidden md:table-cell">Deadline</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                    {tasks.map((t) => (
                        <tr key={t._id} className="hover:bg-foreground/[0.01] transition group">
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-primary-500 uppercase mb-0.5">{t.mapel}</span>
                                    <span className="font-bold text-foreground group-hover:text-primary-600 transition-colors">{t.judul}</span>
                                    {/* Mobile Only Info */}
                                    <div className="md:hidden flex gap-2 mt-2">
                                        <span className="text-[10px] text-foreground/40">📅 {new Date(t.deadline).toLocaleDateString()}</span>
                                        <span className="text-[10px] bg-foreground/5 px-1.5 py-0.5 rounded text-foreground/60">{Array.isArray(t.kelas) ? t.kelas.join(', ') : t.kelas}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                                <div className="flex flex-wrap gap-1">
                                    {(Array.isArray(t.kelas) ? t.kelas : [t.kelas]).map((k, i) => (
                                        <span key={i} className="bg-foreground/5 text-foreground/60 text-[10px] font-bold px-2 py-0.5 rounded border border-border-custom">
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                                <div className="text-xs text-foreground/60">
                                    {new Date(t.deadline).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex justify-center gap-2">
                                    <Link 
                                        href={`/guru/tugas/${t._id}/pengumpulan`}
                                        className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase flex items-center gap-1 shadow-sm"
                                    >
                                        📥 Pengumpulan
                                    </Link>
                                    <Link 
                                        href={`/guru/tugas/${t._id}`}
                                        className="bg-foreground/5 text-foreground/60 border border-border-custom hover:bg-foreground/10 text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {tasks.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-foreground/20 italic text-sm font-medium">
                                Belum ada tugas yang dibuat.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
