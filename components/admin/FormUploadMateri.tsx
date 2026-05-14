'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function FormUploadMateri({ availableClasses }: { availableClasses: string[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const toggleClass = (cls: string) => {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter(c => c !== cls));
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul || !fileUrl || selectedClasses.length === 0) {
      toast.error('Harap isi semua field yang wajib!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/materi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul,
          deskripsi,
          file_url: fileUrl,
          kelas: selectedClasses
        }),
      });

      if (res.ok) {
        toast.success('Materi berhasil diunggah!');
        router.push('/admin/materi');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal mengunggah materi');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-surface p-6 rounded-xl shadow-sm border border-border-custom">
      <div>
        <label className="block text-sm font-bold text-foreground mb-1">Judul Materi <span className="text-red-500">*</span></label>
        <input 
          type="text" 
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          required 
          placeholder="Contoh: Modul Matematika Aljabar"
          className="w-full px-4 py-2 bg-foreground/5 border border-border-custom rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-foreground placeholder:text-foreground/30"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-foreground mb-1">Deskripsi</label>
        <textarea 
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          rows={3}
          placeholder="Detail materi..."
          className="w-full px-4 py-2 bg-foreground/5 border border-border-custom rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-foreground placeholder:text-foreground/30"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="relative">
          <label className="block text-sm font-bold text-foreground mb-1">Pilih Kelas <span className="text-red-500">*</span></label>
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="w-full min-h-[42px] px-3 py-2 border border-border-custom bg-foreground/5 rounded-lg cursor-pointer flex flex-wrap gap-2 items-center transition hover:border-foreground/20"
          >
            {selectedClasses.length === 0 && <span className="text-foreground/30 text-sm">-- Klik untuk pilih kelas --</span>}
            {selectedClasses.map((cls) => (
              <span key={cls} className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-blue-500/20">
                {cls}
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleClass(cls); }} className="hover:text-blue-400">&times;</button>
              </span>
            ))}
          </div>
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-border-custom rounded-lg shadow-2xl max-h-48 overflow-y-auto">
              {availableClasses.map((cls) => (
                <div 
                  key={cls}
                  onClick={() => toggleClass(cls)}
                  className={`px-4 py-2 text-sm cursor-pointer flex justify-between items-center transition-colors ${selectedClasses.includes(cls) ? 'bg-blue-500/10 text-blue-500 font-bold' : 'text-foreground/70 hover:bg-foreground/5'}`}
                >
                  {cls} {selectedClasses.includes(cls) && <span className="text-blue-500">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-1">File Materi (PDF/Doc) <span className="text-red-500">*</span></label>
          {fileUrl ? (
            <div className="flex items-center gap-2 border p-2 rounded-lg bg-green-500/10 border-green-500/20">
               <span className="text-xs font-bold text-green-500 truncate flex-1">{fileUrl}</span>
               <button type="button" onClick={() => setFileUrl('')} className="text-red-500 font-bold px-2 hover:bg-red-500/10 rounded">&times;</button>
            </div>
          ) : (
            <div className="relative">
              <input 
                type="file" 
                className="hidden" 
                id="local-upload" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  const loadingToast = toast.loading('Mengunggah file...');
                  try {
                    const res = await fetch('/api/upload-lokal', {
                      method: 'POST',
                      body: formData
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setFileUrl(data.url);
                      toast.success('File berhasil diunggah!');
                    } else {
                      toast.error(data.error || 'Gagal mengunggah file');
                    }
                  } catch (err) {
                    toast.error('Gagal koneksi ke server');
                  } finally {
                    toast.dismiss(loadingToast);
                  }
                }}
              />
              <label 
                htmlFor="local-upload"
                className="w-full py-2 px-4 border-2 border-dashed border-border-custom bg-foreground/5 rounded-lg text-foreground/40 hover:border-blue-500/50 hover:text-blue-500 transition font-bold cursor-pointer flex items-center justify-center gap-2"
              >
                📁 Pilih & Upload File ke Server
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-3 rounded-lg text-white font-bold transition shadow-lg ${isLoading ? 'bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]'}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span>Menyimpan...</span>
            </div>
          ) : 'Unggah Materi'}
        </button>
      </div>
    </form>
  );
}
