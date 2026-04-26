'use client'

import { useState } from 'react';
import FormBuatSoal from './FormBuatSoal';

export default function KuisManager({ 
  availableClasses, 
  initialKuis 
}: { 
  availableClasses: string[];
  initialKuis: any[];
}) {
  const [editingKuis, setEditingKuis] = useState<any | null>(null);

  const startEdit = (kuis: any) => {
    if (kuis.sudahAdaJawaban) {
      alert("Kuis ini sudah ada yang mengerjakan dan tidak bisa diedit.");
      return;
    }
    setEditingKuis(kuis);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingKuis(null);
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Form Section */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">
          {editingKuis ? 'Edit Kuis' : 'Buat Kuis Baru'}
        </h2>
        <FormBuatSoal 
          availableClasses={availableClasses} 
          editData={editingKuis} 
          onCancel={cancelEdit}
        />
        {editingKuis && (
          <button 
            onClick={cancelEdit}
            className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 font-medium"
          >
            Batal Edit (Buat Kuis Baru)
          </button>
        )}
      </section>

      {/* List Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">Daftar Kuis Terpublikasi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Judul Kuis</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">Soal</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {initialKuis.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Belum ada kuis yang dibuat.</td>
                </tr>
              ) : (
                initialKuis.map((kuis: any) => (
                  <tr key={kuis._id.toString()} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{kuis.judul}</p>
                      <p className="text-[10px] text-gray-400 italic">Dibuat: {new Date(kuis.waktu_mulai).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(kuis.kelas) ? kuis.kelas : [kuis.kelas]).map((c: string) => (
                          <span key={c} className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">{kuis.daftar_soal?.length || 0}</td>
                    <td className="px-6 py-4">
                      {kuis.sudahAdaJawaban ? (
                        <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-1 rounded-full font-bold">LOCKED (Sudah Ada Jawaban)</span>
                      ) : (
                        <span className="text-[10px] bg-green-50 text-green-600 border border-green-100 px-2 py-1 rounded-full font-bold">EDITABLE</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a 
                          href={`/api/kuis/export-soal/${kuis._id}`} 
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Download Naskah Soal"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </a>
                        <a 
                          href={`/api/kuis/export/${kuis._id}`} 
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Download Hasil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </a>
                        <button 
                          onClick={() => startEdit(kuis)}
                          disabled={kuis.sudahAdaJawaban}
                          className={`p-2 rounded-lg transition ${kuis.sudahAdaJawaban ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
