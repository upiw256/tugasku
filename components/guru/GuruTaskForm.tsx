'use client'

import { createGuruTaskAction } from '@/actions/guru-actions';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Pengajaran {
    mapel: string;
    kelas: string[];
}

export default function GuruTaskForm({ 
    pengajaran, 
    initialMapel = '' 
}: { 
    pengajaran: Pengajaran[], 
    initialMapel?: string 
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // State Form
    const [selectedMapel, setSelectedMapel] = useState(initialMapel || (pengajaran[0]?.mapel || ''));
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [isKelasOpen, setIsKelasOpen] = useState(false);

    // Update kelas yang tersedia saat mapel berubah
    useEffect(() => {
        const found = pengajaran.find(p => p.mapel === selectedMapel);
        if (found) {
            setAvailableClasses(found.kelas);
            // Auto select all classes for this mapel by default or keep empty?
            // User request usually wants to broadcast to all classes of that mapel.
            setSelectedClasses(found.kelas); 
        } else {
            setAvailableClasses([]);
            setSelectedClasses([]);
        }
    }, [selectedMapel, pengajaran]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        // Append multiple kelas manually because default FormData might not handle arrays well for some actions
        formData.delete('kelas');
        selectedClasses.forEach(c => formData.append('kelas', c));

        const res = await createGuruTaskAction(formData);

        if (res.success) {
            router.push('/guru/tugas?mapel=' + selectedMapel);
            router.refresh();
        } else {
            setError(res.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/guru/tugas" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-border-custom text-foreground/40 hover:text-foreground transition hover:border-foreground/20">
                        ←
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Buat Tugas Baru</h1>
                        <p className="text-xs text-foreground/40 font-medium tracking-widest uppercase">Latihan & Tugas Mandiri</p>
                    </div>
                </div>
            </div>

            <div className="bg-surface p-8 rounded-[2.5rem] shadow-xl shadow-foreground/5 border border-border-custom relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -z-0"></div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mapel Dropdown */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-foreground/30 tracking-[0.2em] ml-1 text-primary-500">Mata Pelajaran</label>
                            <select 
                                name="mapel"
                                value={selectedMapel}
                                onChange={(e) => setSelectedMapel(e.target.value)}
                                required
                                className="w-full px-5 py-4 rounded-2xl bg-foreground/[0.03] border border-border-custom text-foreground focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition font-bold appearance-none cursor-pointer"
                            >
                                <option value="" disabled>-- Pilih Mapel --</option>
                                {pengajaran.map((p) => (
                                    <option key={p.mapel} value={p.mapel}>{p.mapel}</option>
                                ))}
                            </select>
                        </div>

                        {/* Multi-select Kelas */}
                        <div className="space-y-2 relative">
                            <label className="block text-[10px] font-black uppercase text-foreground/30 tracking-[0.2em] ml-1">Target Kelas</label>
                            <div 
                                onClick={() => setIsKelasOpen(!isKelasOpen)}
                                className="w-full min-h-[58px] px-5 py-3 rounded-2xl bg-foreground/[0.03] border border-border-custom flex flex-wrap gap-2 items-center cursor-pointer hover:border-foreground/20 transition"
                            >
                                {selectedClasses.length === 0 && <span className="text-foreground/30 text-sm italic">Pilih satu atau lebih...</span>}
                                {selectedClasses.map(cls => (
                                    <span key={cls} className="bg-primary-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-md shadow-primary-500/20">
                                        {cls} 
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedClasses(selectedClasses.filter(c => c !== cls)); }} className="hover:scale-125 transition">×</button>
                                    </span>
                                ))}
                            </div>

                            {isKelasOpen && availableClasses.length > 0 && (
                                <div className="absolute z-20 w-full mt-2 bg-surface border border-border-custom rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 ring-4 ring-foreground/5">
                                    <div className="p-2 border-b border-border-custom mb-1 flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase text-foreground/30 tracking-widest">Pilih Kelas</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedClasses(availableClasses)} 
                                            className="text-[9px] bg-primary-500/10 text-primary-500 px-2 py-1 rounded-md font-bold"
                                        >
                                            Pilih Semua
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        {availableClasses.map(cls => (
                                            <div 
                                                key={cls} 
                                                onClick={() => { 
                                                    if(selectedClasses.includes(cls)) setSelectedClasses(selectedClasses.filter(c=>c!==cls)); 
                                                    else setSelectedClasses([...selectedClasses, cls]); 
                                                }} 
                                                className={`px-4 py-3 text-xs font-bold cursor-pointer rounded-xl transition ${selectedClasses.includes(cls) ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/10' : 'hover:bg-foreground/5 text-foreground/60'}`}
                                            >
                                                {cls}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Judul */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-foreground/30 tracking-[0.2em] ml-1">Judul Tugas</label>
                        <input 
                            name="judul"
                            type="text"
                            placeholder="Contoh: Praktikum Pemrograman Web"
                            required
                            className="w-full px-6 py-4 rounded-2xl bg-foreground/[0.03] border border-border-custom text-foreground focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition font-black text-lg placeholder:text-foreground/10"
                        />
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-foreground/30 tracking-[0.2em] ml-1">Instruksi Lengkap</label>
                        <textarea 
                            name="deskripsi"
                            placeholder="Jelaskan langkah-langkah yang harus dikerjakan siswa..."
                            rows={5}
                            className="w-full px-6 py-4 rounded-2xl bg-foreground/[0.03] border border-border-custom text-foreground focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition resize-none leading-relaxed"
                        ></textarea>
                    </div>

                    {/* Deadline */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-foreground/30 tracking-[0.2em] ml-1">Batas Waktu Pengumpulan</label>
                        <input 
                            name="deadline"
                            type="datetime-local"
                            required
                            className="w-full px-6 py-4 rounded-2xl bg-foreground/[0.03] border border-border-custom text-foreground focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition font-bold"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-danger-500/10 text-danger-500 text-xs font-bold rounded-2xl border border-danger-500/20 animate-bounce">
                            ⚠️ {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-5 rounded-2xl text-white font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-2xl
                            ${isLoading ? 'bg-foreground/20 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/40 hover:shadow-primary-500/60'}
                        `}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Sedang Memproses...
                            </span>
                        ) : '🚀 Terbitkan Tugas Sekarang'}
                    </button>

                </form>
            </div>
            
            <div className="p-8 bg-surface border border-border-custom rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                <div className="flex gap-4 items-start relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">✨</div>
                    <p className="text-xs text-foreground/40 leading-relaxed font-medium">
                        Tugas yang Anda terbitkan akan <span className="text-emerald-500 font-bold">langsung muncul</span> di dashboard siswa pada kelas-kelas terpilih. Pastikan instruksi sudah jelas dan link materi sudah disertakan jika ada.
                    </p>
                </div>
            </div>
        </div>
    );
}
