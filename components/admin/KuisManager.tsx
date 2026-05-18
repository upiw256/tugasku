'use client'

import { useState } from 'react';
import FormBuatSoal from './FormBuatSoal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function KuisManager({ 
  availableClasses, 
  initialKuis,
  fixedMapel,
  fixedGuruId
}: { 
  availableClasses: string[];
  initialKuis: any[];
  fixedMapel?: string;
  fixedGuruId?: string;
}) {
  const router = useRouter();
  const [editingKuis, setEditingKuis] = useState<any | null>(null);
  const [monitoringKuis, setMonitoringKuis] = useState<any | null>(null);
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

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

  const openMonitoring = async (kuis: any) => {
    setMonitoringKuis(kuis);
    setIsDataLoading(true);
    try {
      const res = await fetch(`/api/soal-pg/${kuis._id}/peserta`);
      const data = await res.json();
      setPesertaList(data);
    } catch (err) {
      toast.error("Gagal mengambil daftar peserta");
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleResetTimer = async (pengerjaanId: string, namaSiswa: string) => {
    const result = await Swal.fire({
      title: 'Reset Waktu?',
      text: `Yakin ingin mereset waktu pengerjaan untuk ${namaSiswa}? Siswa akan mendapatkan waktu penuh kembali.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9333ea',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Reset Waktu',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/kuis/reset-timer`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pengerjaan_id: pengerjaanId })
        });
        if (res.ok) {
          toast.success("Waktu berhasil direset");
          // Refresh list peserta
          openMonitoring(monitoringKuis);
        }
      } catch (err) {
        toast.error("Gagal mereset waktu");
      }
    }
  };

  const handleToggleStatus = async (id: string, nextStatus: string, judul: string) => {
    const confirmResult = await Swal.fire({
      title: 'Ubah Akses Kuis?',
      text: `Ubah status kuis "${judul}" menjadi ${nextStatus}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Ya, Ubah',
      cancelButtonText: 'Batal'
    });

    if (!confirmResult.isConfirmed) return;

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
    let confirmTitle = 'Hapus Kuis?';
    let confirmText = `Yakin ingin menghapus kuis "${judul}"?`;
    let force = false;

    if (sudahAdaJawaban) {
      confirmTitle = '🔥 HAPUS PAKSA?';
      confirmText = `PERINGATAN: Kuis "${judul}" sudah memiliki data pengerjaan. Menghapus kuis ini juga akan MENGHAPUS SEMUA NILAI SISWA secara permanen. Lanjutkan?`;
      force = true;
    }

    const result = await Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: force ? 'error' : 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

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

  // ... (kode render kuis tetap sama sampai bagian <td className="px-6 py-4 text-right">)
  
  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Modal Monitoring */}
      {monitoringKuis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-border-custom">
            <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">📊 Monitoring Kuis: {monitoringKuis.judul}</h3>
                <p className="text-purple-100 text-sm">Pilih siswa untuk mereset waktu pengerjaan</p>
              </div>
              <button onClick={() => setMonitoringKuis(null)} className="p-2 hover:bg-white/20 rounded-full transition text-2xl font-bold leading-none">&times;</button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {isDataLoading ? (
                <div className="flex justify-center py-20">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : pesertaList.length === 0 ? (
                <div className="text-center py-20 text-foreground/20 italic font-medium">Belum ada siswa yang mulai mengerjakan kuis ini.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-foreground/5 text-foreground/60 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Siswa</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom">
                    {pesertaList.map((p) => (
                      <tr key={p._id} className="hover:bg-foreground/5 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-bold text-foreground">{p.member_id?.nama_lengkap || 'Unknown'}</p>
                          <p className="text-[10px] text-foreground/40">Kelas: {p.member_id?.kelas} • NIS: {p.member_id?.nis}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'SUBMITTED' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            {p.status === 'SUBMITTED' ? '✅ Selesai' : '✍️ Mengerjakan'}
                          </span>
                        </td>
                         <td className="px-4 py-4 text-center font-black text-lg text-foreground">
                           {Number(p.nilai || 0).toFixed(2).replace(/\.00$/, '')}
                         </td>
                        <td className="px-4 py-4 text-right">
                          <button 
                            onClick={() => handleResetTimer(p._id, p.member_id?.nama_lengkap)}
                            className="bg-primary-500/10 text-primary-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-500/20 transition border border-primary-500/20"
                          >
                             🔄 Reset Waktu
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-4 bg-foreground/5 flex justify-end gap-2 border-t border-border-custom">
              <button 
                onClick={() => setMonitoringKuis(null)} 
                className="px-6 py-2 bg-surface border border-border-custom rounded-xl font-bold text-foreground/70 hover:bg-foreground/10 transition"
              >
                Tutup Monitoring
              </button>
            </div>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-xl font-bold text-foreground mb-4 px-2">
          {editingKuis ? '🛠️ Edit Kuis' : '📝 Buat Kuis Baru'}
        </h2>
        <FormBuatSoal 
          availableClasses={availableClasses} 
          editData={editingKuis} 
          onCancel={cancelEdit}
          fixedMapel={fixedMapel}
          fixedGuruId={fixedGuruId}
        />
        {editingKuis && (
          <button 
            onClick={cancelEdit}
            className="mt-4 w-full py-2 border-2 border-dashed border-border-custom text-foreground/40 rounded-xl hover:bg-foreground/5 font-medium transition"
          >
            Batal Edit (Kembali ke Buat Kuis Baru)
          </button>
        )}
      </section>

      {/* List Section */}
      <section className="bg-surface rounded-xl shadow-sm border border-border-custom overflow-hidden mt-8">
        <div className="p-6 border-b border-border-custom">
          <h3 className="font-bold text-foreground text-lg">Daftar Kuis Terpublikasi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/40 uppercase bg-foreground/5 border-b border-border-custom">
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
                  <td colSpan={5} className="px-6 py-8 text-center text-foreground/20 font-medium italic">Belum ada kuis yang dibuat.</td>
                </tr>
              ) : (
                initialKuis.map((kuis: any) => (
                  <tr key={kuis._id.toString()} className="border-b border-border-custom hover:bg-foreground/5 transition-all group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{kuis.judul}</p>
                      <p className="text-[10px] text-foreground/40 italic">Jadwal: {new Date(kuis.waktu_mulai).toLocaleDateString()} s/d {new Date(kuis.waktu_selesai).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(kuis.kelas) ? kuis.kelas : [kuis.kelas]).map((c: string) => (
                          <span key={c} className="bg-primary-500/10 text-primary-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary-500/20">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{kuis.daftar_soal?.length || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex bg-foreground/10 p-1 rounded-full border border-border-custom w-fit shadow-inner">
                        {[
                          { 
                            id: 'AUTO', 
                            label: '🕒 Auto', 
                            color: 'bg-surface text-foreground shadow-md ring-1 ring-border-custom' 
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
                                : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => openMonitoring(kuis)}
                          className="p-2 text-purple-500 hover:bg-purple-500/10 rounded-lg transition"
                          title="Monitor Peserta (Reset Waktu)"
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </button>
                        <a 
                          href={`/api/kuis/export-soal/${kuis._id}`} 
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                          title="Download Soal"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </a>
                        <a 
                          href={`/api/kuis/export/${kuis._id}`} 
                          className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition"
                          title="Download Hasil"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </a>
                        <button 
                          onClick={() => startEdit(kuis)}
                          disabled={kuis.sudahAdaJawaban}
                          className={`p-2 rounded-lg transition ${kuis.sudahAdaJawaban ? 'text-foreground/20 cursor-not-allowed opacity-50' : 'text-orange-500 hover:bg-orange-500/10'}`}
                          title="Edit Kuis"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteKuis(kuis._id, kuis.judul, kuis.sudahAdaJawaban)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
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
