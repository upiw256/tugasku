'use client'

import { useState } from 'react';
import { setupGuruPengajaranAction } from '@/actions/admin-guru-actions';
import Swal from 'sweetalert2';

interface Props {
  guruId: string;
  availableClasses: string[];
}

export default function GuruSetup({ guruId, availableClasses }: Props) {
  const [mapel, setMapel] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleClass = (cls: string) => {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter(c => c !== cls));
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  };

  const handleSave = async () => {
    if (!mapel || selectedClasses.length === 0) {
      Swal.fire('Oops', 'Silakan pilih mata pelajaran dan minimal 1 kelas.', 'warning');
      return;
    }

    setLoading(true);
    const res = await setupGuruPengajaranAction(guruId, mapel, selectedClasses);
    setLoading(false);

    if (res.success) {
      Swal.fire('Berhasil', res.message, 'success').then(() => {
        window.location.reload();
      });
    } else {
      Swal.fire('Gagal', res.message, 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-surface p-8 md:p-12 rounded-[2.5rem] border border-border-custom shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="relative z-10">
            <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Setup Profil Pengajaran</h2>
            <p className="text-foreground/40 mt-2 font-medium">Lengkapi data mata pelajaran dan kelas yang Anda ampu untuk memulai.</p>
            
            <div className="mt-10 space-y-8">
                {/* 1. MAPEL */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-foreground/40 tracking-[0.2em] ml-1">Mata Pelajaran</label>
                    <input 
                        type="text" 
                        value={mapel}
                        onChange={(e) => setMapel(e.target.value)}
                        placeholder="Contoh: Matematika, Bahasa Inggris, dll"
                        className="w-full bg-foreground/5 border border-border-custom px-6 py-4 rounded-2xl text-foreground font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                </div>

                {/* 2. KELAS */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-foreground/40 tracking-[0.2em] ml-1">Pilih Kelas</label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {availableClasses.map(cls => (
                            <button
                                key={cls}
                                onClick={() => toggleClass(cls)}
                                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${selectedClasses.includes(cls) ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-foreground/10'}`}
                            >
                                {cls}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. SUBMIT */}
                <button 
                    disabled={loading}
                    onClick={handleSave}
                    className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? 'Menyimpan...' : 'Simpan & Mulai Dashboard'}
                </button>
            </div>
        </div>
    </div>
  );
}
