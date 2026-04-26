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
      
      <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-lg text-sm mb-4">
        <strong>Info:</strong> Tugas Kelompok ini akan otomatis didistribusikan kepada anggota-anggota di <strong>Data Kelompok</strong> yang telah eksis pada kelas yang Anda pilih.
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Judul Tugas Kelompok <span className="text-red-500">*</span></label>
        <input 
          name="judul" 
          type="text" 
          required 
          placeholder="Contoh: Laporan Observasi (Kelompok)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi</label>
        <textarea 
          name="deskripsi" 
          rows={4}
          placeholder="Detail tugas..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Deadline <span className="text-red-500">*</span></label>
          <input 
            name="deadline" 
            type="date" 
            required 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
          />
        </div>

        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kelas <span className="text-red-500">*</span></label>
          <input type="hidden" name="kelas" value={selectedClasses.join(', ')} />
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full min-h-[42px] px-3 py-2 border rounded-lg cursor-pointer bg-white flex flex-wrap gap-2 items-center transition ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'}`}
          >
            {selectedClasses.length === 0 && <span className="text-gray-400 text-sm">-- Klik untuk pilih kelas --</span>}
            {selectedClasses.map((cls) => (
              <span key={cls} className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                {cls}
                <button type="button" onClick={(e) => removeTag(cls, e)} className="hover:text-blue-900 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center">&times;</button>
              </span>
            ))}
            <div className="ml-auto text-gray-400">
              <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {availableClasses.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">Data kelas kosong.</div>
              ) : (
                availableClasses.map((cls) => {
                  const isSelected = selectedClasses.includes(cls);
                  return (
                    <div key={cls} onClick={() => toggleClass(cls)} className={`px-4 py-2 text-sm cursor-pointer flex justify-between items-center transition ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <span>{cls}</span>
                      {isSelected && <span className="text-blue-600">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">Metode Pengumpulan</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
            <input type="radio" name="tipe_pengumpulan" value="online" defaultChecked className="w-4 h-4 text-blue-600" />
            <div>
              <span className="block text-sm font-bold">☁️ Upload File</span>
              <span className="block text-xs text-gray-500">Perwakilan kelompok upload bukti file</span>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-bold border border-red-100 text-center animate-pulse">
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
