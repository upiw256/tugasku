'use client'

import { createGuruAction } from '@/actions/admin-guru-actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MultiSelectSearch from '@/components/ui/MultiSelectSearch';

interface Pengajaran {
  mapel: string;
  kelas: string[];
}

export default function TambahGuruForm({ allClasses }: { allClasses: string[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [pengajaran, setPengajaran] = useState<Pengajaran[]>([{ mapel: '', kelas: [] }]);

  const addMapel = () => {
    setPengajaran([...pengajaran, { mapel: '', kelas: [] }]);
  };

  const removeMapel = (index: number) => {
    const newPengajaran = [...pengajaran];
    newPengajaran.splice(index, 1);
    setPengajaran(newPengajaran);
  };

  const handlePengajaranChange = (index: number, field: keyof Pengajaran, value: any) => {
    const newPengajaran = [...pengajaran];
    if (field === 'mapel') {
      newPengajaran[index].mapel = value;
    } else if (field === 'kelas') {
        const kelas = value as string;
        const currentKelas = [...newPengajaran[index].kelas];
        if (currentKelas.includes(kelas)) {
            newPengajaran[index].kelas = currentKelas.filter(k => k !== kelas);
        } else {
            newPengajaran[index].kelas = [...currentKelas, kelas];
        }
    }
    setPengajaran(newPengajaran);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('nip', nip);
    formData.append('nama', nama);
    formData.append('pengajaran', JSON.stringify(pengajaran));

    const res = await createGuruAction(formData);

    if (res.success) {
      router.push('/admin/guru');
      router.refresh(); 
    } else {
      setError(res.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/guru" className="text-foreground/40 hover:text-foreground transition">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Tambah Guru Baru</h1>
      </div>

      <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input NIP */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-1">NIP (Nomor Induk Pegawai)</label>
                <input 
                name="nip" 
                type="text" 
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Contoh: 19800101..."
                required 
                className="w-full px-3 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
            </div>

            {/* Input Nama */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nama Lengkap</label>
                <input 
                name="nama" 
                type="text" 
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap guru & gelar"
                required 
                className="w-full px-3 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
            </div>
          </div>

          {/* Pengajaran Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-foreground uppercase tracking-widest text-foreground/50">Mata Pelajaran & Kelas</label>
                <button 
                    type="button"
                    onClick={addMapel}
                    className="text-xs font-bold bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition"
                >
                    + Mapel
                </button>
            </div>

            {pengajaran.map((item, index) => (
                <div key={index} className="p-4 bg-foreground/[0.02] border border-border-custom rounded-xl relative group">
                    {pengajaran.length > 1 && (
                        <button 
                            type="button"
                            onClick={() => removeMapel(index)}
                            className="absolute -top-2 -right-2 bg-danger-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            ×
                        </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-foreground/50 uppercase mb-1">Mata Pelajaran</label>
                            <input 
                                type="text"
                                value={item.mapel}
                                onChange={(e) => handlePengajaranChange(index, 'mapel', e.target.value)}
                                placeholder="Contoh: Matematika"
                                required
                                className="w-full px-3 py-1.5 text-sm border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                             <MultiSelectSearch 
                                label="Pilih Kelas"
                                options={allClasses}
                                selectedValues={item.kelas}
                                onChange={(val) => handlePengajaranChange(index, 'kelas', val)}
                                placeholder="Ketik nama kelas..."
                             />
                        </div>
                    </div>
                </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-danger-500/10 text-danger-600 text-sm rounded-lg font-medium border border-danger-500/20">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-2.5 rounded-lg text-white font-bold transition shadow-sm
                ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20 shadow-lg'}
              `}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Guru'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-primary-500/10 p-4 rounded-lg border border-primary-500/20 text-sm text-primary-500">
        <p>ℹ️ <strong>Info:</strong> Akun guru akan dibuat otomatis.</p>
        <ul className="list-disc ml-5 mt-1 text-xs text-primary-500/60">
          <li>Username Login: <code>[NIP]@guru.com</code></li>
          <li>Password Default: <code>654321</code></li>
        </ul>
      </div>
    </div>
  );
}
