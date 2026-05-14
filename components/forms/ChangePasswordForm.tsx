'use client'

import { changePasswordAction } from '@/actions/user-actions';
import { useState, useRef } from 'react';
import Swal from 'sweetalert2';

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);

    const res = await changePasswordAction(formData);
    setLoading(false);

    if (res.success) {
      formRef.current?.reset();
      // Tampilkan Toast Sukses
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: res.message,
        background: 'var(--surface)',
        color: 'var(--foreground)',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } else {
      // Tampilkan Popup Error
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: res.message,
        background: 'var(--surface)',
        color: 'var(--foreground)',
        confirmButtonColor: '#d33'
      });
    }
  };

  return (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom max-w-lg">
      <h2 className="text-lg font-bold text-foreground mb-4 border-b border-border-custom pb-2 flex items-center gap-2">
        <span>🔐</span> Ganti Password
      </h2>
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Password Lama</label>
          <input 
            name="oldPass" 
            type="password" 
            required 
            className="w-full px-3 py-2 border border-border-custom bg-surface text-foreground rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Password Baru</label>
          <input 
            name="newPass" 
            type="password" 
            required 
            minLength={6} 
            className="w-full px-3 py-2 border border-border-custom bg-surface text-foreground rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Ulangi Password Baru</label>
          <input 
            name="confirmPass" 
            type="password" 
            required 
            className="w-full px-3 py-2 border border-border-custom bg-surface text-foreground rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2.5 rounded-lg text-white font-bold transition ${loading ? 'bg-foreground/20 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
        >
          {loading ? 'Memproses...' : 'Simpan Password Baru'}
        </button>
      </form>
    </div>
  );
}