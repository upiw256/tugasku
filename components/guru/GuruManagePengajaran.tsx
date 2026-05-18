'use client'

import { useState } from 'react';
import { updateGuruFullPengajaranAction } from '@/actions/admin-guru-actions';
import Swal from 'sweetalert2';
import Link from 'next/link';

interface Pengajaran {
  mapel: string;
  kelas: string[];
}

interface Props {
  guruId: string;
  currentPengajaran: Pengajaran[];
  availableClasses: string[];
}

export default function GuruManagePengajaran({ guruId, currentPengajaran, availableClasses }: Props) {
  const [pengajaran, setPengajaran] = useState<Pengajaran[]>(
      currentPengajaran.length > 0 ? currentPengajaran : [{ mapel: '', kelas: [] }]
  );
  const [loading, setLoading] = useState(false);

  const addMapel = () => {
    setPengajaran([...pengajaran, { mapel: '', kelas: [] }]);
  };

  const removeMapel = (index: number) => {
    if (pengajaran.length === 1) return;
    const newPengajaran = [...pengajaran];
    newPengajaran.splice(index, 1);
    setPengajaran(newPengajaran);
  };

  const updateMapelName = (index: number, val: string) => {
    const newPengajaran = [...pengajaran].map((p, i) => i === index ? { ...p, mapel: val } : p);
    setPengajaran(newPengajaran);
  };

  const toggleClass = (index: number, cls: string) => {
    const newPengajaran = [...pengajaran].map((p, i) => {
        if (i === index) {
            const currentKelas = p.kelas;
            if (currentKelas.includes(cls)) {
                return { ...p, kelas: currentKelas.filter(c => c !== cls) };
            } else {
                return { ...p, kelas: [...currentKelas, cls] };
            }
        }
        return p;
    });
    setPengajaran(newPengajaran);
  };

  const handleSave = async () => {
    // Validasi
    for (const p of pengajaran) {
        if (!p.mapel || p.kelas.length === 0) {
            Swal.fire('Oops', `Silakan lengkapi data untuk Mapel "${p.mapel || 'Baru'}"`, 'warning');
            return;
        }
    }

    setLoading(true);
    const res = await updateGuruFullPengajaranAction(guruId, pengajaran);
    setLoading(false);

    if (res.success) {
      Swal.fire('Berhasil', res.message, 'success').then(() => {
        window.location.href = '/guru';
      });
    } else {
      Swal.fire('Gagal', res.message, 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
         <div>
            <h1 className="text-4xl font-black text-foreground uppercase tracking-tight">Kelola Pengajaran</h1>
            <p className="text-foreground/40 mt-1 font-medium italic">Atur mata pelajaran dan kelas yang Anda ampu</p>
         </div>
         <Link href="/guru" className="px-6 py-3 bg-foreground/5 text-foreground/60 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground/10 transition-all border border-border-custom">
            ← Kembali
         </Link>
      </div>

      <div className="space-y-6">
        {pengajaran.map((item, index) => (
          <div key={index} className="bg-surface p-6 md:p-8 rounded-[2.5rem] border border-border-custom shadow-sm relative group">
              {pengajaran.length > 1 && (
                  <button 
                    onClick={() => removeMapel(index)}
                    className="absolute -top-3 -right-3 w-10 h-10 bg-danger-500 text-white rounded-full flex items-center justify-center shadow-lg md:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90 z-20"
                  >
                    ×
                  </button>
              )}
              
              <div className="space-y-6">
                  {/* Mapel Input */}
                  <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-foreground/40 tracking-[0.2em] ml-1">Nama Mata Pelajaran</label>
                      <input 
                        type="text" 
                        value={item.mapel}
                        onChange={(e) => updateMapelName(index, e.target.value)}
                        placeholder="Contoh: Informatika"
                        className="w-full bg-foreground/5 border border-border-custom px-6 py-4 rounded-2xl text-foreground font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      />
                  </div>

                  {/* Kelas Grid */}
                  <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-foreground/40 tracking-[0.2em] ml-1">Pilih Kelas yang Diampu</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                          {availableClasses.map(cls => (
                              <button
                                  key={cls}
                                  onClick={() => toggleClass(index, cls)}
                                  className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${item.kelas.includes(cls) ? 'bg-primary-500 text-white border-primary-500 shadow-sm' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-foreground/10'}`}
                              >
                                  {cls}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
        ))}

        <button 
            onClick={addMapel}
            className="w-full py-8 border-2 border-dashed border-border-custom bg-foreground/[0.01] rounded-[2.5rem] text-foreground/20 font-black uppercase tracking-widest hover:border-primary-500 hover:text-primary-500 hover:bg-primary-500/5 transition-all"
        >
            + Tambah Mata Pelajaran
        </button>

        <div className="pt-10 flex gap-4">
            <button 
                disabled={loading}
                onClick={handleSave}
                className="flex-1 py-5 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl"
            >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
        </div>
      </div>
    </div>
  );
}
