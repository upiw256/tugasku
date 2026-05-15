'use client'

import { updateTugasAction } from '@/actions/academic-actions'; // Gunakan Action Update
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface Props {
  initialData: any;       // Data tugas dari DB
  classOptions: string[]; // List semua kelas yang tersedia
}

export default function EditTaskForm({ initialData, classOptions }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- 1. INISIALISASI STATE DARI DATA DB ---
  
  // Normalisasi Kelas: Pastikan jadi Array meskipun data lama String
  const initialClasses = Array.isArray(initialData.kelas) 
    ? initialData.kelas 
    : [initialData.kelas];

  const [selectedClasses, setSelectedClasses] = useState<string[]>(initialClasses);

  // Format Tanggal: ISO String -> "YYYY-MM-DDTHH:mm" untuk input datetime-local
  const formattedDeadline = initialData.deadline 
    ? new Date(initialData.deadline).toISOString().slice(0, 16) 
    : '';

  // --- 2. LOGIKA DROPDOWN (SAMA SEPERTI SNIPPET ANDA) ---
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Toggle Kelas
  const toggleClass = (cls: string) => {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter(c => c !== cls));
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  };

  // Hapus Tag
  const removeTag = (cls: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClasses(selectedClasses.filter(c => c !== cls));
  };

  // --- 3. HANDLE SUBMIT ---
  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');

    if (selectedClasses.length === 0) {
      setError('Harap pilih minimal satu kelas!');
      setIsLoading(false);
      return;
    }

    const res = await updateTugasAction(formData);

    if (res.success) {
      // Gunakan SweetAlert biar lebih terlihat suksesnya
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Tugas berhasil diperbarui!',
        timer: 1500,
        showConfirmButton: false
      });
      router.push('/admin/tugas');
      router.refresh();
    } else {
      setError(res.message);
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-5">
      
      {/* INPUT HIDDEN ID (PENTING UNTUK UPDATE) */}
      <input type="hidden" name="id" value={initialData._id} />

      {/* Judul */}
      <div>
        <label className="block text-sm font-bold text-foreground mb-1">Judul Tugas <span className="text-danger-500">*</span></label>
        <input 
          name="judul" 
          type="text" 
          defaultValue={initialData.judul} // Pakai defaultValue
          required 
          className="w-full px-4 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Deskripsi */}
      <div>
        <label className="block text-sm font-bold text-foreground mb-1">Deskripsi</label>
        <textarea 
          name="deskripsi" 
          rows={4}
          defaultValue={initialData.deskripsi} // Pakai defaultValue
          className="w-full px-4 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Deadline */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-1">Deadline <span className="text-danger-500">*</span></label>
          <input 
            name="deadline" 
            type="datetime-local" // Saya sarankan pakai ini biar jam-nya ikut tersimpan
            defaultValue={formattedDeadline} // Pakai format tanggal yang sudah disiapkan
            required 
            className="w-full px-4 py-2 border border-border-custom bg-surface rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-foreground"
          />
        </div>

        {/* CUSTOM MULTI-SELECT DROPDOWN */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-bold text-foreground mb-1">Pilih Kelas <span className="text-danger-500">*</span></label>
          
          {/* TRICK: Loop input hidden agar Action 'formData.getAll' bisa menangkap Array.
             Ini lebih aman daripada .join(',') untuk Server Action kita sebelumnya.
          */}
          {selectedClasses.map(cls => (
             <input key={cls} type="hidden" name="kelas" value={cls} />
          ))}

          {/* Trigger Area */}
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full min-h-[42px] px-3 py-2 border rounded-lg cursor-pointer bg-surface flex flex-wrap gap-2 items-center transition
              ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-border-custom hover:border-primary-400'}
            `}
          >
            {selectedClasses.length === 0 && (
              <span className="text-foreground/40 text-sm">-- Klik untuk pilih kelas --</span>
            )}

            {/* Tags */}
            {selectedClasses.map((cls) => (
              <span key={cls} className="bg-primary-500/10 text-primary-600 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                {cls}
                <button 
                  type="button"
                  onClick={(e) => removeTag(cls, e)}
                  className="hover:text-primary-700 hover:bg-primary-500/20 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  &times;
                </button>
              </span>
            ))}
            
            {/* Panah */}
            <div className="ml-auto text-foreground/40">
              <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-border-custom rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {classOptions.length === 0 ? (
                <div className="p-3 text-sm text-foreground/50 text-center">Data kelas kosong.</div>
              ) : (
                classOptions.map((cls) => {
                  const isSelected = selectedClasses.includes(cls);
                  return (
                    <div 
                      key={cls}
                      onClick={() => toggleClass(cls)}
                      className={`px-4 py-2 text-sm cursor-pointer flex justify-between items-center transition
                        ${isSelected ? 'bg-primary-500/10 text-primary-600 font-medium' : 'text-foreground hover:bg-background'}
                      `}
                    >
                      <span>{cls}</span>
                      {isSelected && <span className="text-primary-600">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metode Pengumpulan */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-foreground mb-2">Metode Pengumpulan</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex-1 flex items-center gap-2 cursor-pointer border border-border-custom p-3 rounded-lg has-[:checked]:bg-primary-500/10 has-[:checked]:border-primary-500 transition">
            <input 
                type="radio" 
                name="tipe_pengumpulan" 
                value="online" 
                defaultChecked={initialData.tipe_pengumpulan === 'online'} // Cek Default
                className="w-4 h-4 text-primary-600" 
            />
            <div>
              <span className="block text-sm font-bold text-foreground">☁️ Upload File</span>
              <span className="block text-xs text-foreground/50">Siswa wajib upload bukti (Foto/PDF)</span>
            </div>
          </label>
          
          <label className="flex-1 flex items-center gap-2 cursor-pointer border border-border-custom p-3 rounded-lg has-[:checked]:bg-primary-500/10 has-[:checked]:border-primary-500 transition">
            <input 
                type="radio" 
                name="tipe_pengumpulan" 
                value="offline" 
                defaultChecked={initialData.tipe_pengumpulan === 'offline'} // Cek Default
                className="w-4 h-4 text-primary-600" 
            />
            <div>
              <span className="block text-sm font-bold text-foreground">🏫 Offline / Langsung</span>
              <span className="block text-xs text-foreground/50">Dikumpulkan fisik di kelas</span>
            </div>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-danger-500/10 text-danger-600 text-sm rounded-lg font-bold border border-danger-500/20 text-center animate-pulse">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4 flex gap-3">
        <button 
            type="button" 
            onClick={() => router.back()} 
            className="flex-1 py-3 border border-border-custom rounded-lg text-foreground font-bold hover:bg-background"
        >
            Batal
        </button>

        <button 
          type="submit" 
          disabled={isLoading}
          className={`flex-1 py-3 rounded-lg text-white font-bold transition shadow-md
            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg'}
          `}
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

    </form>
  );
}