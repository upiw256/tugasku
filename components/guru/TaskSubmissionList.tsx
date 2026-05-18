'use client'

import React, { useState } from 'react';
import { giveGradeAction } from '@/actions/guru-actions';
import Swal from 'sweetalert2';
import LinkPreview from '@/components/ui/LinkPreview';

interface Submission {
    _id?: string;
    member_id: string;
    nama_lengkap: string;
    nis: string;
    kelas: string;
    submitted_at?: string;
    file_url?: string;
    catatan?: string;
    nilai?: number;
    tanggal_dinilai?: string;
}

interface Props {
    taskId: string;
    submissions: Submission[];
}

function StudentNote({ note }: { note: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = note.length > 100;
    const displayNote = isExpanded ? note : note.substring(0, 100) + (isLong ? '...' : '');

    return (
        <div className="bg-foreground/5 p-3 rounded-xl text-[11px] text-foreground/60 italic border border-border-custom w-full max-w-full break-all">
            "{displayNote}"
            {isLong && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-2 text-[9px] font-black uppercase text-primary-500 hover:underline"
                >
                    {isExpanded ? 'Sembunyikan' : 'Baca Selengkapnya'}
                </button>
            )}
        </div>
    );
}

export default function TaskSubmissionList({ taskId, submissions }: Props) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [grades, setGrades] = useState<Record<string, string>>(
        Object.fromEntries(submissions.map(s => [s.member_id, (s.nilai || '').toString()]))
    );

    const handleSaveGrade = async (memberId: string) => {
        const gradeStr = grades[memberId];
        const gradeNum = parseInt(gradeStr);

        if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
            Swal.fire('Error', 'Nilai harus antara 0 - 100', 'error');
            return;
        }

        setLoadingId(memberId);
        const res = await giveGradeAction(taskId, memberId, gradeNum);
        setLoadingId(null);

        if (res.success) {
            Swal.fire({
                title: 'Tersimpan',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
        } else {
            Swal.fire('Gagal', res.message, 'error');
        }
    };

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-surface rounded-[2.5rem] border border-border-custom overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-foreground/[0.03] text-[10px] font-black uppercase text-foreground/40 tracking-widest border-b border-border-custom">
                            <tr>
                                <th className="px-8 py-6">Siswa</th>
                                <th className="px-8 py-6">Status & Lampiran</th>
                                <th className="px-8 py-6 text-center">Nilai (0-100)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-custom">
                            {submissions.map((s) => (
                                <tr key={s.member_id} className="hover:bg-foreground/[0.01] transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 font-bold text-sm">
                                                {s.nama_lengkap.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground group-hover:text-primary-600 transition-colors">{s.nama_lengkap}</div>
                                                <div className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{s.nis} &bull; {s.kelas}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {s.submitted_at ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                                        Sudah Mengumpulkan
                                                    </span>
                                                </div>
                                                <div className="text-xs text-foreground/40 font-medium">
                                                    {new Date(s.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </div>
                                                {s.file_url && <LinkPreview url={s.file_url} />}
                                                {s.catatan && <StudentNote note={s.catatan} />}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 bg-foreground/10 rounded-full"></span>
                                                <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">
                                                    Belum Mengumpulkan
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <input 
                                                type="number"
                                                value={grades[s.member_id] || ''}
                                                onChange={(e) => setGrades({...grades, [s.member_id]: e.target.value})}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveGrade(s.member_id)}
                                                placeholder="--"
                                                className="w-16 h-12 bg-foreground/5 border border-border-custom rounded-xl text-center font-black text-lg text-foreground focus:ring-2 focus:ring-primary-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <button 
                                                onClick={() => handleSaveGrade(s.member_id)}
                                                disabled={loadingId === s.member_id}
                                                className="w-12 h-12 bg-foreground text-background rounded-xl flex items-center justify-center hover:opacity-90 active:scale-90 transition-all disabled:opacity-50 shadow-lg shadow-foreground/10"
                                            >
                                                {loadingId === s.member_id ? (
                                                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 px-1">
                {submissions.map((s) => (
                    <div key={s.member_id} className="bg-surface p-6 rounded-[2rem] border border-border-custom shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 font-black text-sm">
                                {s.nama_lengkap.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-foreground">{s.nama_lengkap}</div>
                                <div className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{s.nis} &bull; {s.kelas}</div>
                            </div>
                        </div>

                        <div className="bg-foreground/[0.02] p-4 rounded-2xl border border-border-custom">
                            {s.submitted_at ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Selesai Dikumpulkan</span>
                                    </div>
                                    {s.file_url && <LinkPreview url={s.file_url} />}
                                    {s.catatan && <StudentNote note={s.catatan} />}
                                    <div className="text-[9px] text-foreground/30 font-medium italic">
                                        Diterima: {new Date(s.submitted_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-foreground/10 rounded-full"></span>
                                    <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest text-center">Belum Mengumpulkan</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-1.5 text-center">
                                <label className="text-[9px] font-black uppercase text-foreground/40 tracking-[0.2em]">Input Nilai</label>
                                <input 
                                    type="number"
                                    value={grades[s.member_id] || ''}
                                    onChange={(e) => setGrades({...grades, [s.member_id]: e.target.value})}
                                    placeholder="--"
                                    className="w-full h-14 bg-foreground/5 border border-border-custom rounded-2xl text-center font-black text-xl text-foreground focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner"
                                />
                            </div>
                            <button 
                                onClick={() => handleSaveGrade(s.member_id)}
                                disabled={loadingId === s.member_id}
                                className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center hover:opacity-90 active:scale-90 transition-all disabled:opacity-50 shadow-xl self-end"
                            >
                                {loadingId === s.member_id ? (
                                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {submissions.length === 0 && (
                <div className="p-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                    <p className="text-foreground/40 italic font-medium">Tidak ada siswa yang terdaftar di kelas ini.</p>
                </div>
            )}
        </div>
    );
}
