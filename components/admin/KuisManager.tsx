'use client'

import { useState } from 'react';
import FormBuatSoal from './FormBuatSoal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function KuisManager({ 
  availableClasses, 
  initialKuis 
}: { 
  availableClasses: string[];
  initialKuis: any[];
}) {
  const router = useRouter();
  const [editingKuis, setEditingKuis] = useState<any | null>(null);

  const startEdit = (kuis: any) => {
    if (kuis.sudahAdaJawaban) {
      toast.error("Kuis ini sudah ada yang mengerjakan dan tidak bisa diedit.");
      return;
    }
    setEditingKuis(kuis);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingKuis(null);
  };

  const handleToggleStatus = async (id: string, nextStatus: string, judul: string) => {
    const confirmMessage = nextStatus === 'OPEN' 
      ? `Yakin ingin MEMBUKA kuis "${judul}" sekarang (Abaikan jadwal)?` 
      : nextStatus === 'CLOSED' 
      ? `Yakin ingin MENUTUP kuis "${judul}" sekarang (Abaikan jadwal)?` 
      : `Kembalikan kuis "${judul}" ke JADWAL OTOMATIS?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/soal-pg/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        toast.success(`Berhasil! Status kuis diubah ke ${nextStatus}`);
        router.refresh();
      }
    } catch (err) {
      toast.error("Gagal mengubah status kuis");
    }
  };

  const handleDeleteKuis = async (id: string, judul: string, sudahAdaJawaban: boolean) => {
    let confirmMsg = `Yakin ingin menghapus kuis "${judul}"?`;
    let force = false;

    if (sudahAdaJawaban) {
      confirmMsg = `PERINGATAN: Kuis "${judul}" sudah memiliki data pengerjaan siswa. Menghapus kuis ini juga akan MENGHAPUS SEMUA NILAI SISWA terkait kuis ini secara permanen. Apakah Anda benar-benar yakin ingin hapus paksa?`;
      force = true;
    }

    if (!window.confirm(confirmMsg)) return;
    if (force && !window.confirm("KALI KEDUA: Data nilai akan hilang selamanya. Lanjutkan?")) return;

    try {
      const res = await fetch(`/api/soal-pg/${id}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success("Kuis berhasil dihapus");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus kuis");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Form Section */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">
          {editingKuis ? '🛠️ Edit Kuis' : '📝 Buat Kuis Baru'}
        </h2>
        <FormBuatSoal 
          availableClasses={availableClasses} 
          editData={editingKuis} 
          onCancel={cancelEdit}
        />
        {editingKuis && (
          <button 
            onClick={cancelEdit}
            className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 font-medium transition"
          >
            Batal Edit (Kembali ke Buat Kuis Baru)
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
                <th className="px-6 py-3">Kontrol Akses</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {initialKuis.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-medium">Belum ada kuis yang dibuat.</td>
                </tr>
              ) : (
                initialKuis.map((kuis: any) => (
                  <tr key={kuis._id.toString()} className="border-b hover:bg-gray-50 transition group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{kuis.judul}</p>
                      <p className="text-[10px] text-gray-400 italic">Jadwal: {new Date(kuis.waktu_mulai).toLocaleDateString()} s/d {new Date(kuis.waktu_selesai).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(kuis.kelas) ? kuis.kelas : [kuis.kelas]).map((c: string) => (
                          <span key={c} className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{kuis.daftar_soal?.length || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex bg-gray-200 p-1 rounded-full border border-gray-300 w-fit shadow-inner">
                        {[
                          { 
                            id: 'AUTO', 
                            label: '🕒 Auto', 
                            color: 'bg-white text-gray-800 shadow-md ring-1 ring-black/5' 
                          },
                          { 
                            id: 'OPEN', 
                            label: '🟢 Buka', 
                            color: 'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.8)] ring-2 ring-green-300 animate-pulse' 
                          },
                          { 
                            id: 'CLOSED', 
                            label: '🔴 Tutup', 
                            color: 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.8)] ring-2 ring-red-300' 
                          }
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => handleToggleStatus(kuis._id, btn.id, kuis.judul)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${
                              (kuis.status_manual || 'AUTO') === btn.id 
                                ? btn.color 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <a 
                          href={`/api/kuis/export-soal/${kuis._id}`} 
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Download Soal"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </a>
                        <a 
                          href={`/api/kuis/export/${kuis._id}`} 
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Download Hasil"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </a>
                        <button 
                          onClick={() => startEdit(kuis)}
                          disabled={kuis.sudahAdaJawaban}
                          className={`p-2 rounded-lg transition ${kuis.sudahAdaJawaban ? 'text-gray-300 cursor-not-allowed opacity-50' : 'text-orange-500 hover:bg-orange-50'}`}
                          title="Edit Kuis"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteKuis(kuis._id, kuis.judul, kuis.sudahAdaJawaban)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Hapus Kuis"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
