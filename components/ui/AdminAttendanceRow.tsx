'use client'

import { useState } from 'react';
import { upsertAttendanceAction } from '@/actions/attendance-actions';
import Swal from 'sweetalert2';

interface Props {
  student: any;
  date: string;
  initialStatus: string | null;
}

export default function AdminAttendanceRow({ student, date, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    const oldStatus = status;
    setStatus(newStatus);
    setLoading(true);

    const res = await upsertAttendanceAction(student._id, date, newStatus);
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
      <td className="px-6 py-4 font-mono text-foreground/40">{student.nis}</td>
      <td className="px-6 py-4 font-medium text-foreground">{student.nama_lengkap}</td>
      
      <td className="px-6 py-4">
        <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition">
          <button disabled={loading} onClick={() => handleStatusChange('Hadir')} 
            className={`${btnBase} ${status === 'Hadir' ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-green-500/10 hover:text-green-500'}`}>H</button>

          <button disabled={loading} onClick={() => handleStatusChange('Sakit')}
            className={`${btnBase} ${status === 'Sakit' ? 'bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-yellow-500/10 hover:text-yellow-500'}`}>S</button>

          <button disabled={loading} onClick={() => handleStatusChange('Izin')}
            className={`${btnBase} ${status === 'Izin' ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-blue-500/10 hover:text-blue-500'}`}>I</button>

          <button disabled={loading} onClick={() => handleStatusChange('Alpha')}
            className={`${btnBase} ${status === 'Alpha' ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/20' : 'bg-foreground/5 text-foreground/40 border-border-custom hover:bg-red-500/10 hover:text-red-500'}`}>A</button>
        </div>
      </td>

      <td className="px-6 py-4 font-bold text-xs">
         {status === 'Hadir' && <span className="text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded uppercase tracking-wider">Hadir</span>}
         {status === 'Sakit' && <span className="text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded uppercase tracking-wider">Sakit</span>}
         {status === 'Izin' && <span className="text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded uppercase tracking-wider">Izin</span>}
         {status === 'Alpha' && <span className="text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded uppercase tracking-wider">Alpha</span>}
         {!status && <span className="text-foreground/10 italic text-[10px] uppercase tracking-widest font-black">Belum Absen</span>}
      </td>
    </tr>
  );
}