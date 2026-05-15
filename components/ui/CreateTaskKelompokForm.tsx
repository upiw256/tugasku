'use client'

import { createTaskKelompokAction } from '@/actions/task-actions';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTaskKelompokForm({ availableClasses }: { availableClasses: string[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State data form
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const toggleClass = (cls: string) => {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter(c => c !== cls));
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  };

  const removeTag = (cls: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClasses(selectedClasses.filter(c => c !== cls));
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');

    if (selectedClasses.length === 0) {
      setError('Harap pilih minimal satu kelas!');
      setIsLoading(false);
      return;
    }

    const res = await createTaskKelompokAction(formData);

    if (res.success) {
      router.push('/admin/tugas');
      router.refresh();
    } else {
      setError(res.message);
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-5">
      
      <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 p-4 rounded-lg text-sm mb-4">
        <strong>Info:</strong> Tugas Kelompok ini akan otomatis didistribusikan kepada anggota-anggota di <strong>Data Kelompok</strong> yang telah eksis pada kelas yang Anda pilih.
      </div>

      <div>
        <label className="block text-sm font-bold text-foreground mb-1">Judul Tugas Kelompok <span className="text-danger-500">*</span></label>
        <input 
          name="judul" 
          type="text" 
          required 
          placeholder="Contoh: Laporan Observasi (Kelompok)"
          className="w-full px-4 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-foreground mb-1">Deskripsi</label>
        <textarea 
          name="deskripsi" 
          rows={4}
          placeholder="Detail tugas..."
          className="w-full px-4 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-foreground mb-1">Deadline <span className="text-danger-500">*</span></label>
          <input 
            name="deadline" 
            type="date" 
            required 
            className="w-full px-4 py-2 border border-border-custom bg-surface rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-foreground"
          />
        </div>

        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-bold text-foreground mb-1">Pilih Kelas <span className="text-danger-500">*</span></label>
          <input type="hidden" name="kelas" value={selectedClasses.join(', ')} />
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full min-h-[42px] px-3 py-2 border rounded-lg cursor-pointer bg-surface flex flex-wrap gap-2 items-center transition ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-border-custom hover:border-foreground/20'}`}
          >
            {selectedClasses.length === 0 && <span className="text-foreground/20 text-sm">-- Klik untuk pilih kelas --</span>}
            {selectedClasses.map((cls) => (
              <span key={cls} className="bg-primary-500/10 text-primary-500 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                {cls}
                <button type="button" onClick={(e) => removeTag(cls, e)} className="hover:text-primary-600 hover:bg-primary-500/20 rounded-full w-4 h-4 flex items-center justify-center">&times;</button>
              </span>
            ))}
            <div className="ml-auto text-gray-400">
              <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-border-custom rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {availableClasses.length === 0 ? (
                <div className="p-3 text-sm text-foreground/20 text-center">Data kelas kosong.</div>
              ) : (
                availableClasses.map((cls) => {
                  const isSelected = selectedClasses.includes(cls);
                  return (
                    <div key={cls} onClick={() => toggleClass(cls)} className={`px-4 py-2 text-sm cursor-pointer flex justify-between items-center transition ${isSelected ? 'bg-primary-500/10 text-primary-500 font-medium' : 'text-foreground/70 hover:bg-foreground/5'}`}>
                      <span>{cls}</span>
                      {isSelected && <span className="text-primary-500">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-bold text-foreground mb-2">Metode Pengumpulan</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer border border-border-custom bg-surface p-3 rounded-lg has-[:checked]:bg-primary-500/10 has-[:checked]:border-primary-500 transition-all">
            <input type="radio" name="tipe_pengumpulan" value="online" defaultChecked className="w-4 h-4 text-primary-600 focus:ring-primary-500" />
            <div>
              <span className="block text-sm font-bold">☁️ Upload File</span>
              <span className="block text-xs text-foreground/40">Perwakilan kelompok upload bukti file</span>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-danger-500/10 text-danger-600 text-sm rounded-lg font-bold border border-danger-500/20 text-center animate-pulse">
          {error}
        </div>
      )}

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-3 rounded-lg text-white font-bold transition shadow-md ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
        >
          {isLoading ? 'Menyimpan Tugas...' : 'Distribusikan Tugas Kelompok'}
        </button>
      </div>

    </form>
  );
}
