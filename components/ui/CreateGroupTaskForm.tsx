'use client'

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTugasKelompokAction } from '@/actions/tugas-kelompok-actions';

interface Student {
  _id: string;
  nis: string;
  nama_lengkap: string;
  kelas: string;
}

interface Group {
  nama: string;
  anggota: Student[];
}

export default function CreateGroupTaskForm({ availableClasses }: { availableClasses: string[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State step & class
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Group config
  const [groupMode, setGroupMode] = useState<'generate' | 'manual'>('generate');
  const [groupSize, setGroupSize] = useState<number>(4);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Saat kelas terpilih, fetch data siswa
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setGroups([]);
      return;
    }

    const fetchSiswa = async () => {
      setIsLoadingStudents(true);
      setError('');
      try {
        const res = await fetch('/api/siswa/' + encodeURIComponent(selectedClass));
        const data = await res.json();
        if (data.success) {
          setStudents(data.data);
          setGroups([]); // Reset jika kelas ganti
        } else {
          setError(data.message || 'Gagal mengambil data siswa');
        }
      } catch (err: any) {
        setError('Error jaringan: ' + err.message);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchSiswa();
  }, [selectedClass]);

  const handleGenerate = () => {
    if (students.length === 0) return;
    if (groupSize < 1) {
      setError('Ukuran kelompok tidak valid');
      return;
    }
    setError('');

    // Suffle array (simple method)
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const newGroups: Group[] = [];
    
    for (let i = 0; i < shuffled.length; i += groupSize) {
      newGroups.push({
        nama: `Kelompok ${(i / groupSize) + 1}`,
        anggota: shuffled.slice(i, i + groupSize)
      });
    }
    setGroups(newGroups);
  };

  const handleCreateEmptyGroup = () => {
    setGroups([...groups, { nama: `Kelompok ${groups.length + 1}`, anggota: [] }]);
  };

  const addStudentToGroup = (studentIndex: number, groupIndex: number) => {
    // Implementasi manual bisa dikembangkan dengan Drag & Drop
    setError('Fitur klik/drag manual lengkap bisa dikembangkan. Gunakan Generate untuk saat ini demi kemudahan.');
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');

    if (!selectedClass) {
      setError('Harap pilih kelas!');
      setIsLoading(false); return;
    }
    if (groups.length === 0) {
      setError('Harap bentuk kelompok terlebih dahulu!');
      setIsLoading(false); return;
    }

    // Format kelompok untuk backend
    const kelompokData = groups.map(g => ({
      nama: g.nama,
      anggota: g.anggota.map(s => s._id)
    }));

    formData.append('kelas', selectedClass);
    formData.append('kelompok_data', JSON.stringify(kelompokData));

    const res = await createTugasKelompokAction(formData);

    if (res.success) {
      router.push('/admin/tugas');
      router.refresh();
    } else {
      setError(res.message);
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 border rounded-xl bg-gray-50">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kelas Topik <span className="text-red-500">*</span></label>
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Pilih Kelas --</option>
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Status Data Siswa</label>
          <div className="w-full px-4 py-2 bg-foreground/5 border border-border-custom rounded-lg text-sm text-foreground/60">
            {isLoadingStudents ? 'Memuat...' : (selectedClass ? `${students.length} Siswa ditemukan di kelas ${selectedClass}` : 'Pilih kelas terlebih dahulu')}
          </div>
        </div>
      </div>

      {/* Bagian Pembuatan Kelompok */}
      {selectedClass && students.length > 0 && (
        <div className="p-4 border rounded-xl border-blue-500/30 bg-surface">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 pb-3 border-b">
            <h3 className="font-bold text-lg text-blue-800">Pembentukan Kelompok</h3>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setGroupMode('generate')}
                className={`text-sm px-3 py-1 rounded-md transition ${groupMode === 'generate' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-100'}`}
              >Generate Otomatis</button>
              <button 
                type="button"
                onClick={() => setGroupMode('manual')} 
                className={`text-sm px-3 py-1 rounded-md transition ${groupMode === 'manual' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-100'}`}
              >Manual</button>
            </div>
          </div>

          {groupMode === 'generate' && (
            <div className="flex items-end gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Masukan Anggota / Kelompok</label>
                <input 
                  type="number" 
                  min="1" 
                  value={groupSize} 
                  onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-1.5 border rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <button 
                type="button"
                onClick={handleGenerate}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-4 py-1.5 rounded-md shadow"
              >
                Acak & Buat Kelompok
              </button>
            </div>
          )}

          {groupMode === 'manual' && (
            <div className="mb-4 text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">
              {/* Optional UI manual */}
              Untuk fitur saat ini disarankan menggunakan mode 'Generate Otomatis'. Klik tombol di atas.
            </div>
          )}

          {/* Render Preview Kelompok */}
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
              {groups.map((group, idx) => (
                <div key={idx} className="bg-gray-50 border rounded-lg p-3">
                  <h4 className="font-bold text-sm border-b pb-1 mb-2 text-gray-700">{group.nama} <span className="text-xs font-normal bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded ml-2">{group.anggota.length} orang</span></h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {group.anggota.map(s => (
                      <li key={s._id}>• {s.nama_lengkap}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 bg-gray-50 border border-dashed rounded font-medium">Bentuk kelompok untuk melihat hasil.</div>
          )}

        </div>
      )}

      {/* Detail Tugas Induk */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Judul Tugas Kelompok <span className="text-red-500">*</span></label>
          <input 
            name="judul" 
            type="text" 
            required 
            placeholder="Contoh: Proyek Sains Kelompok"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi & Instruksi</label>
          <textarea 
            name="deskripsi" 
            rows={4}
            placeholder="Detail tugas yang harus dikerjakan bersama..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Deadline Upload <span className="text-red-500">*</span></label>
            <input 
              name="deadline" 
              type="date" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Metode Pengumpulan</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
                <input type="radio" name="tipe_pengumpulan" value="online" defaultChecked className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Upload File (Perwakilan kelompok 1 org)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-bold border border-red-100 text-center">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isLoading || groups.length === 0}
          className={`w-full py-3 rounded-lg text-white font-bold transition shadow-md
            ${(isLoading || groups.length === 0) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Tugas Kelompok'}
        </button>
      </div>

    </form>
  );
}
