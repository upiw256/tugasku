'use client'

import { importStudentsAction } from '@/actions/admin-actions';
import { useState } from 'react';

export default function ImportSiswaPage() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const downloadTemplate = () => {
    window.location.href = '/api/template';
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setMessage('');
    
    const res = await importStudentsAction(formData);
    
    setMessage(res.message);
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Import Data Siswa</h1>
      
      {/* Langkah 1: Download */}
      <div className="p-6 bg-primary-500/10 border border-primary-500/20 rounded-xl">
        <h3 className="font-bold text-primary-500 mb-2">1. Download Template</h3>
        <p className="text-sm text-primary-500/60 mb-4">
          Unduh format excel terlebih dahulu, lalu isi data siswa.
        </p>
        <button 
          type="button"
          onClick={downloadTemplate} 
          className="bg-surface text-primary-500 border border-primary-500/20 px-4 py-2 rounded shadow-sm hover:bg-primary-500/10 font-medium transition"
        >
          ⬇️ Download Template Excel
        </button>
      </div>

      {/* Langkah 2: Upload */}
      <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom">
        <h3 className="font-bold text-foreground mb-4">2. Upload File Excel</h3>
        <form action={handleSubmit} className="space-y-4">
          <input 
            type="file" 
            name="file" 
            accept=".xlsx" 
            required 
            className="block w-full text-sm text-foreground/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer" 
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3 rounded-lg text-white font-bold transition shadow-sm
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}
            `}
          >
            {isLoading ? 'Sedang Memproses...' : 'Mulai Import'}
          </button>
        </form>
      </div>

      {/* Pesan Feedback */}
      {message && (
        <div className={`p-4 rounded-lg text-center font-bold border ${message.includes('Gagal') ? 'bg-danger-500/10 text-danger-600 border-danger-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
          {message}
        </div>
      )}
    </div>
  );
}