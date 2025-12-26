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
    <tr className="hover:bg-gray-50 border-b group">
      <td className="px-6 py-4 font-mono text-gray-600">{student.nis}</td>
      <td className="px-6 py-4 font-medium text-gray-900">{student.nama_lengkap}</td>
      
      <td className="px-6 py-4">
        <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition">
          <button disabled={loading} onClick={() => handleStatusChange('Hadir')} 
            className={`${btnBase} ${status === 'Hadir' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50'}`}>H</button>

          <button disabled={loading} onClick={() => handleStatusChange('Sakit')}
            className={`${btnBase} ${status === 'Sakit' ? 'bg-yellow-500 text-white border-yellow-500 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-yellow-50'}`}>S</button>

          <button disabled={loading} onClick={() => handleStatusChange('Izin')}
            className={`${btnBase} ${status === 'Izin' ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-blue-50'}`}>I</button>

          <button disabled={loading} onClick={() => handleStatusChange('Alpha')}
            className={`${btnBase} ${status === 'Alpha' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50'}`}>A</button>
        </div>
      </td>

      <td className="px-6 py-4 font-bold text-sm">
         {status === 'Hadir' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded">Hadir</span>}
         {status === 'Sakit' && <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Sakit</span>}
         {status === 'Izin' && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">Izin</span>}
         {status === 'Alpha' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded">Alpha</span>}
         {!status && <span className="text-gray-300 italic">-</span>}
      </td>
    </tr>
  );
}