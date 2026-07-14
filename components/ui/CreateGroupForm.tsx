'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createKelompokAction } from '@/actions/kelompok-actions';

interface Student {
  _id: string;
  nis: string;
  nama_lengkap: string;
  kelas: string;
}

interface Group {
  nama: string;
  anggota: Student[];
  ketua_id?: string;
}

export default function CreateGroupForm({ availableClasses }: { availableClasses: string[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State step & class
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Group config
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
      const anggotaGroup = shuffled.slice(i, i + groupSize);
      newGroups.push({
        nama: `Kelompok ${(i / groupSize) + 1}`,
        anggota: anggotaGroup,
        ketua_id: anggotaGroup[0]?._id // Default jadikan elemen pertama sebagai ketua
      });
    }

    // Jika grup terakhir hanya berisi 1-2 orang (sisa), gabungkan merata ke kelompok lain (jika target ukuran > 2)
    if (newGroups.length > 1 && groupSize > 2) {
      const lastGroup = newGroups[newGroups.length - 1];
      if (lastGroup.anggota.length <= 2) {
        newGroups.pop();
        lastGroup.anggota.forEach((siswa, index) => {
          const targetIndex = index % newGroups.length;
          newGroups[targetIndex].anggota.push(siswa);
        });
      }
    }

    setGroups(newGroups);
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
      ketua: g.ketua_id,
      anggota: g.anggota.map(s => s._id)
    }));

    formData.append('kelas', selectedClass);
    formData.append('kelompok_data', JSON.stringify(kelompokData));

    const res = await createKelompokAction(formData);

    if (res.success) {
      router.push('/admin/tugas-kelompok');
      router.refresh();
    } else {
      setError(res.message);
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6 flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 border border-border-custom rounded-xl bg-background">
        <div>
          <label className="block text-sm font-bold text-foreground mb-1">Pilih Kelas <span className="text-danger-500">*</span></label>
          <select 
            className="w-full px-4 py-2 border border-border-custom bg-surface text-foreground rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Pilih Kelas --</option>
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-1">Status Data Siswa</label>
          <div className="w-full px-4 py-2 bg-foreground/5 border border-border-custom rounded-lg text-sm text-foreground/60">
            {isLoadingStudents ? 'Memuat...' : (selectedClass ? `${students.length} Siswa ditemukan di kelas ${selectedClass}` : 'Pilih kelas terlebih dahulu')}
          </div>
        </div>
      </div>

      {/* Bagian Pembuatan Kelompok */}
      {selectedClass && students.length > 0 && (
        <div className="p-4 border rounded-xl border-primary-500/30 bg-surface">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-custom">
            <h3 className="font-bold text-lg text-primary-500">Bentuk Kelompok</h3>
          </div>

          <div className="flex items-end gap-3 mb-4">
            <div>
              <label className="block text-xs font-bold text-foreground/60 mb-1">Masukan Anggota / Kelompok</label>
              <input 
                type="number" 
                min="1" 
                value={groupSize} 
                onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-1.5 border border-border-custom bg-background text-foreground rounded focus:outline-none focus:border-primary-500"
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

          {/* Render Preview Kelompok */}
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2">
              {groups.map((group, idx) => (
                <div key={idx} className="bg-background border border-border-custom rounded-lg p-3">
                  <div className="flex justify-between items-start border-b border-border-custom pb-2 mb-2">
                    <h4 className="font-bold text-sm text-foreground">{group.nama} <span className="text-xs font-normal bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded ml-1">{group.anggota.length} Anak</span></h4>
                  </div>
                  
                  <div className="mb-2 bg-primary-500/10 px-2 py-1.5 rounded border border-primary-500/20">
                    <label className="text-[11px] font-bold text-primary-600 uppercase tracking-wide mr-2">👑 Ketua:</label>
                    <select 
                       className="px-2 py-1 text-xs border border-border-custom rounded bg-surface text-foreground outline-none w-3/4 max-w-[200px]"
                       value={group.ketua_id}
                       onChange={(e) => {
                          const newGroups = [...groups];
                          newGroups[idx].ketua_id = e.target.value;
                          setGroups(newGroups);
                       }}
                    >
                       {group.anggota.map(a => <option key={a._id} value={a._id}>{a.nama_lengkap}</option>)}
                    </select>
                  </div>

                  <p className="text-[10px] font-bold text-foreground/30 mt-2">Daftar Anggota:</p>
                  <ul className="text-xs text-foreground/60 space-y-1 mt-1">
                    {group.anggota.map(s => (
                      <li key={s._id} className={s._id === group.ketua_id ? 'font-bold text-foreground/90' : ''}>
                        {s._id === group.ketua_id ? '👑 ' : '• '} {s.nama_lengkap}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-foreground/40 bg-background border border-border-custom border-dashed rounded font-medium">Klik Acak & Buat Kelompok untuk melihat hasil.</div>
          )}

        </div>
      )}

      {error && (
        <div className="p-3 bg-danger-500/10 text-danger-600 text-sm rounded-lg font-bold border border-danger-500/20 text-center">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isLoading || groups.length === 0}
          className={`w-full py-3 rounded-lg text-white font-bold transition shadow-md
            ${(isLoading || groups.length === 0) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
          `}
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Data Kelompok'}
        </button>
      </div>

    </form>
  );
}
