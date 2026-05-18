'use client'

import { useState } from 'react';
import { upsertAttendanceAction } from '@/actions/attendance-actions';
import Swal from 'sweetalert2';

interface Props {
  student: any;
  date: string;
  initialStatus: string | null;
  mapel?: string;
  guruId?: string;
}

export default function AdminAttendanceRow({ student, date, initialStatus, mapel, guruId }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    const oldStatus = status;
    setStatus(newStatus);
    setLoading(true);

    const res = await upsertAttendanceAction(student._id, date, newStatus, mapel, guruId);
    setLoading(false);
    
    if (res.success) {
      // Toast kecil di pojok kanan bawah, hilang dalam 1 detik
      // Agar admin tidak terganggu saat input banyak data
      const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: false,
      });
      Toast.fire({
        icon: 'success',
        title: `${student.nama_lengkap}: ${newStatus}`
      });
    } else {
      // Revert jika gagal
      setStatus(oldStatus);
      Swal.fire('Gagal', 'Gagal menyimpan status absensi', 'error');
    }
  };

  const btnBase = "px-3 py-1 rounded text-xs font-bold border transition-all disabled:opacity-50 active:scale-95";
  
  return (
    <tr className="hover:bg-foreground/5 border-b border-border-custom group transition-colors">
      {/* 1. NIS (Hidden on Mobile, consolidated into Name column) */}
      <td className="px-6 py-4 font-mono text-foreground/40 hidden md:table-cell">{student.nis}</td>
      
      {/* 2. NAMA + MOBILE INFO */}
      <td className="px-6 py-4 font-medium text-foreground">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
             <span className="text-sm md:text-base truncate">{student.nama_lengkap}</span>
             
             {/* Mobile Only Info Stack */}
             <div className="flex flex-col gap-1 mt-1 md:hidden">
                <span className="text-[10px] font-mono text-foreground/30">{student.nis}</span>
                <div className="flex items-center gap-1.5 min-h-[20px]">
                   <span className="text-[10px] font-black uppercase text-foreground/20 tracking-tighter">Status:</span>
                   {status === 'Hadir' && <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Hadir</span>}
                   {status === 'Sakit' && <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Sakit</span>}
                   {status === 'Izin' && <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Izin</span>}
                   {status === 'Alpha' && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Alpha</span>}
                   {!status && <span className="text-[10px] font-black text-foreground/10 uppercase tracking-widest italic">Belum Absen</span>}
                </div>
             </div>
          </div>

          {/* Attendance Buttons (Visible everywhere but styled differently) */}
          <div className="flex gap-1.5 md:gap-2 shrink-0">
             <button disabled={loading} onClick={() => handleStatusChange('Hadir')} 
               className={`${btnBase} ${status === 'Hadir' ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-green-500/10 hover:text-green-500'} px-2.5 md:px-3`}>H</button>

             <button disabled={loading} onClick={() => handleStatusChange('Sakit')}
               className={`${btnBase} ${status === 'Sakit' ? 'bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-yellow-500/10 hover:text-yellow-500'} px-2.5 md:px-3`}>S</button>

             <button disabled={loading} onClick={() => handleStatusChange('Izin')}
               className={`${btnBase} ${status === 'Izin' ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-blue-500/10 hover:text-blue-500'} px-2.5 md:px-3`}>I</button>

             <button disabled={loading} onClick={() => handleStatusChange('Alpha')}
               className={`${btnBase} ${status === 'Alpha' ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-red-500/10 hover:text-red-500'} px-2.5 md:px-3`}>A</button>
          </div>
        </div>
      </td>
      
      {/* 3. SET KEHADIRAN (Hanya Desktop - karena sudah ada di kolom Name untuk mobile) */}
      {/* Kita kosongkan atau hilangkan kolom ini di mobile via table-cell */}
      <td className="px-6 py-4 hidden md:table-cell text-center">
        {/* Placeholder - Buttons are now in column 2 logic for better layout control */}
      </td>

      {/* 4. STATUS SAAT INI (Desktop Only) */}
      <td className="px-6 py-4 font-bold text-xs hidden md:table-cell">
         {status === 'Hadir' && <span className="text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded uppercase tracking-wider whitespace-nowrap">Hadir</span>}
         {status === 'Sakit' && <span className="text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded uppercase tracking-wider whitespace-nowrap">Sakit</span>}
         {status === 'Izin' && <span className="text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded uppercase tracking-wider whitespace-nowrap">Izin</span>}
         {status === 'Alpha' && <span className="text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded uppercase tracking-wider whitespace-nowrap">Alpha</span>}
         {!status && <span className="text-foreground/10 italic text-[10px] uppercase tracking-widest font-black">Belum Absen</span>}
      </td>
    </tr>
  );
}