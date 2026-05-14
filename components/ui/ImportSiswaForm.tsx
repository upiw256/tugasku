'use client'

import { importStudentsAction } from '@/actions/admin-actions';
import { useState } from 'react';

export default function ImportSiswaForm() {
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
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-foreground text-lg">Import Data Siswa (Excel)</h3>
        <button 
          onClick={downloadTemplate}
          type="button"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          ⬇️ Download Template
        </button>
      </div>

      <form action={handleSubmit} className="flex flex-col md:flex-row gap-3 items-start">
        <input 
          type="file" 
          name="file" 
          accept=".xlsx" 
          required 
          className="block w-full text-sm text-foreground/40
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-foreground/5 file:text-foreground
            hover:file:bg-foreground/10
            cursor-pointer border border-border-custom rounded-lg p-1 bg-foreground/5 outline-none"
        />
        
        <button 
          type="submit" 
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg text-white font-bold transition shadow whitespace-nowrap h-[42px]
            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
          `}
        >
          {isLoading ? '...' : 'Upload'}
        </button>
      </form>

      {/* Pesan Feedback */}
      {message && (
        <div className={`mt-3 text-sm font-bold ${message.includes('Gagal') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </div>
      )}
    </div>
  );
}