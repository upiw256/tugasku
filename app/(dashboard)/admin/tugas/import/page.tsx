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
      <h1 className="text-2xl font-bold text-gray-800">Import Data Siswa</h1>
      
      {/* Langkah 1: Download */}
      <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
        <h3 className="font-bold text-blue-800 mb-2">1. Download Template</h3>
        <p className="text-sm text-blue-600 mb-4">
          Unduh format excel terlebih dahulu, lalu isi data siswa.
        </p>
        <button 
          type="button"
          onClick={downloadTemplate} 
          className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded shadow-sm hover:bg-blue-100 font-medium"
        >
          ⬇️ Download Template Excel
        </button>
      </div>

      {/* Langkah 2: Upload */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-4">2. Upload File Excel</h3>
        <form action={handleSubmit} className="space-y-4">
          <input 
            type="file" 
            name="file" 
            accept=".xlsx" 
            required 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" 
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3 rounded-lg text-white font-bold transition shadow
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
            `}
          >
            {isLoading ? 'Sedang Memproses...' : 'Mulai Import'}
          </button>
        </form>
      </div>

      {/* Pesan Feedback */}
      {message && (
        <div className={`p-4 rounded-lg text-center font-bold border ${message.includes('Gagal') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}