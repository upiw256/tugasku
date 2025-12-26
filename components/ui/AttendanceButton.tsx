'use client'

import { doAttendanceAction } from '@/actions/attendance-actions';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function AttendanceButton({ sudahAbsen, waktu }: { sudahAbsen: boolean, waktu?: Date }) {
  const [loading, setLoading] = useState(false);

  const handleAbsen = async () => {
    setLoading(true);
    const res = await doAttendanceAction();
    setLoading(false);
    
    if (res.success) {
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil Absen!',
        text: 'Data kehadiran Anda telah tercatat.',
        showConfirmButton: false,
        timer: 2000
      });
      window.location.reload(); 
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Absen',
        text: res.message
      });
    }
  };

  if (sudahAbsen) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center shadow-inner">
        <div className="text-4xl mb-2 animate-bounce">✅</div>
        <h3 className="text-green-800 font-bold text-lg">Sudah Absen Hari Ini</h3>
        <p className="text-green-600 font-mono">
          {new Date(waktu!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={handleAbsen}
        disabled={loading}
        className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition transform hover:-translate-y-1 active:scale-95
          ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'}
        `}
      >
        {loading ? 'Sedang Mencatat...' : '📍 KLIK UNTUK ABSEN HADIR'}
      </button>
    </div>
  );
}