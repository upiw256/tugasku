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
        <label className="block text-sm font-bold text-gray-700 mb-1">Judul Tugas <span className="text-red-500">*</span></label>
        <input 
          name="judul" 
          type="text" 
          defaultValue={initialData.judul} // Pakai defaultValue
          required 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Deskripsi */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi</label>
        <textarea 
          name="deskripsi" 
          rows={4}
          defaultValue={initialData.deskripsi} // Pakai defaultValue
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Deadline */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Deadline <span className="text-red-500">*</span></label>
          <input 
            name="deadline" 
            type="datetime-local" // Saya sarankan pakai ini biar jam-nya ikut tersimpan
            defaultValue={formattedDeadline} // Pakai format tanggal yang sudah disiapkan
            required 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
          />
        </div>

        {/* CUSTOM MULTI-SELECT DROPDOWN */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kelas <span className="text-red-500">*</span></label>
          
          {/* TRICK: Loop input hidden agar Action 'formData.getAll' bisa menangkap Array.
             Ini lebih aman daripada .join(',') untuk Server Action kita sebelumnya.
          */}
          {selectedClasses.map(cls => (
             <input key={cls} type="hidden" name="kelas" value={cls} />
          ))}

          {/* Trigger Area */}
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full min-h-[42px] px-3 py-2 border rounded-lg cursor-pointer bg-white flex flex-wrap gap-2 items-center transition
              ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            {selectedClasses.length === 0 && (
              <span className="text-gray-400 text-sm">-- Klik untuk pilih kelas --</span>
            )}

            {/* Tags */}
            {selectedClasses.map((cls) => (
              <span key={cls} className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                {cls}
                <button 
                  type="button"
                  onClick={(e) => removeTag(cls, e)}
                  className="hover:text-blue-900 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  &times;
                </button>
              </span>
            ))}
            
            {/* Panah */}
            <div className="ml-auto text-gray-400">
              <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {classOptions.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">Data kelas kosong.</div>
              ) : (
                classOptions.map((cls) => {
                  const isSelected = selectedClasses.includes(cls);
                  return (
                    <div 
                      key={cls}
                      onClick={() => toggleClass(cls)}
                      className={`px-4 py-2 text-sm cursor-pointer flex justify-between items-center transition
                        ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                      `}
                    >
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

      {/* Metode Pengumpulan */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">Metode Pengumpulan</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex-1 flex items-center gap-2 cursor-pointer border p-3 rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 transition">
            <input 
                type="radio" 
                name="tipe_pengumpulan" 
                value="online" 
                defaultChecked={initialData.tipe_pengumpulan === 'online'} // Cek Default
                className="w-4 h-4 text-blue-600" 
            />
            <div>
              <span className="block text-sm font-bold">☁️ Upload File</span>
              <span className="block text-xs text-gray-500">Siswa wajib upload bukti (Foto/PDF)</span>
            </div>
          </label>
          
          <label className="flex-1 flex items-center gap-2 cursor-pointer border p-3 rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 transition">
            <input 
                type="radio" 
                name="tipe_pengumpulan" 
                value="offline" 
                defaultChecked={initialData.tipe_pengumpulan === 'offline'} // Cek Default
                className="w-4 h-4 text-blue-600" 
            />
            <div>
              <span className="block text-sm font-bold">🏫 Offline / Langsung</span>
              <span className="block text-xs text-gray-500">Dikumpulkan fisik di kelas</span>
            </div>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-bold border border-red-100 text-center animate-pulse">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4 flex gap-3">
        <button 
            type="button" 
            onClick={() => router.back()} 
            className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
        >
            Batal
        </button>

        <button 
          type="submit" 
          disabled={isLoading}
          className={`flex-1 py-3 rounded-lg text-white font-bold transition shadow-md
            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}
          `}
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

    </form>
  );
}