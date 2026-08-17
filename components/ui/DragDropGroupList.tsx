'use client';

import { useState } from 'react';
import { moveMemberAction, setKetuaAction } from '@/actions/kelompok-actions';

interface Student {
  _id: string;
  nama_lengkap: string;
}

interface Group {
  _id: string;
  nama_kelompok: string;
  kelas: string;
  ketua?: string;
  anggota: Student[];
}

export default function DragDropGroupList({ initialList }: { initialList: Group[] }) {
  const [kelompokList, setKelompokList] = useState<Group[]>(initialList);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragStart = (e: React.DragEvent, studentId: string, fromGroupId: string) => {
    e.dataTransfer.setData('studentId', studentId);
    e.dataTransfer.setData('fromGroupId', fromGroupId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, toGroupId: string) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('studentId');
    const fromGroupId = e.dataTransfer.getData('fromGroupId');

    if (!studentId || !fromGroupId || fromGroupId === toGroupId) return;

    // Optimistic UI Update
    const newList = [...kelompokList];
    const fromGroupIndex = newList.findIndex(g => g._id === fromGroupId);
    const toGroupIndex = newList.findIndex(g => g._id === toGroupId);

    if (fromGroupIndex === -1 || toGroupIndex === -1) return;

    const studentIndex = newList[fromGroupIndex].anggota.findIndex(s => s._id === studentId);
    if (studentIndex === -1) return;

    const student = newList[fromGroupIndex].anggota.splice(studentIndex, 1)[0];

    // Handle ketua if the moved student was ketua
    if (newList[fromGroupIndex].ketua === studentId) {
      newList[fromGroupIndex].ketua = newList[fromGroupIndex].anggota[0]?._id;
    }

    // Add to new group
    newList[toGroupIndex].anggota.push(student);
    if (!newList[toGroupIndex].ketua) {
      newList[toGroupIndex].ketua = studentId;
    }

    setKelompokList(newList);
    setIsLoading(true);

    try {
      const res = await moveMemberAction(studentId, fromGroupId, toGroupId);
      if (!res.success) {
        // Revert on error
        alert('Gagal memindahkan: ' + res.message);
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetKetua = async (groupId: string, studentId: string) => {
    if (!studentId) return;

    // Optimistic Update
    const newList = [...kelompokList];
    const groupIndex = newList.findIndex(g => g._id === groupId);
    if (groupIndex !== -1) {
       newList[groupIndex].ketua = studentId;
       setKelompokList(newList);
    }
    
    setIsLoading(true);
    try {
      const res = await setKetuaAction(groupId, studentId);
      if (!res.success) {
        alert('Gagal mengubah ketua: ' + res.message);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };


  if (kelompokList.length === 0) {
    return (
      <div className="col-span-full py-12 text-center bg-foreground/5 border border-dashed border-border-custom rounded-xl">
        <p className="text-foreground/60 font-medium">Belum ada kelompok yang dibentuk untuk kelas ini.</p>
        <p className="text-foreground/40 text-sm mt-1">Klik tombol Generate Kelompok untuk memulai pembentukan.</p>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="fixed top-4 right-4 bg-indigo-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 text-sm font-bold flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Menyimpan perubahan...
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {kelompokList.map((k) => (
          <div 
            key={k._id} 
            className="bg-surface rounded-xl shadow-sm border border-border-custom p-5 hover:shadow-md transition-all group flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, k._id)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-foreground">{k.nama_kelompok}</h3>
                <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold border border-blue-500/20 uppercase tracking-tighter">Kelas: {k.kelas}</span>
              </div>
              <span className="text-[10px] text-foreground/60 font-bold bg-foreground/5 px-2 py-0.5 rounded border border-border-custom">{k.anggota.length} Anak</span>
            </div>
            
            <div className="mt-4 border-t border-border-custom pt-3 flex-1 flex flex-col">
              {k.anggota.length > 0 && (
                <div className="mb-3 bg-yellow-500/10 px-2 py-1.5 rounded border border-yellow-500/20 flex items-center justify-between">
                  <label className="text-[11px] font-bold text-yellow-600 uppercase tracking-wide flex-shrink-0 mr-2">👑 Ketua:</label>
                  <select 
                     className="px-2 py-1 text-xs border border-border-custom rounded bg-surface text-foreground outline-none flex-1 w-full"
                     value={k.ketua || ''}
                     onChange={(e) => handleSetKetua(k._id, e.target.value)}
                  >
                     {k.anggota.map(a => <option key={a._id} value={a._id}>{a.nama_lengkap}</option>)}
                  </select>
                </div>
              )}

              <p className="text-[10px] font-bold text-foreground/40 mb-2 uppercase tracking-widest">Anggota:</p>
              {k.anggota.length === 0 && (
                <div className="text-xs text-foreground/30 italic py-2">Tidak ada anggota. Seret siswa ke sini.</div>
              )}
              <ul className="space-y-1.5 flex-1 min-h-[40px]">
                {k.anggota.map((siswa: any, idx: number) => {
                  const isKetua = k.ketua && k.ketua.toString() === siswa._id.toString();
                  return (
                    <li 
                      key={siswa._id || idx} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, siswa._id, k._id)}
                      className={`text-sm flex items-center justify-between gap-2 p-1.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-foreground/5 transition-colors ${
                        isKetua ? 'font-bold text-foreground border-l-2 border-yellow-500 bg-yellow-500/5' : 'text-foreground/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-foreground/40 text-xs mt-0.5 flex-shrink-0 cursor-move">⣿</span>
                        <span className="truncate">{siswa.nama_lengkap} {isKetua && <span className="text-yellow-500 ml-1" title="Ketua Kelompok">👑 (Ketua)</span>}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            
          </div>
        ))}
      </div>
    </>
  );
}
