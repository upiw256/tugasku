'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

interface Soal {
  id: string;
  pertanyaan: string;
  opsi: { A: string; B: string; C: string; D: string; E: string; };
  jawaban_benar: string;
}

export default function QuizPengerjaan({ 
  kuis, 
  initialJawaban = {},
  memberId,
  initialTimeLeft
}: { 
  kuis: any; 
  initialJawaban: Record<string, string>;
  memberId: string;
  initialTimeLeft: number;
}) {
  const router = useRouter();
  const [jawaban, setJawaban] = useState<Record<string, string>>(initialJawaban);
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLeft * 1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. Cek jika waktu sudah habis saat pertama kali masuk
    if (timeLeft <= 0) {
      Swal.fire({
        title: 'Waktu Habis!',
        text: 'Waktu pengerjaan kuis ini sudah berakhir.',
        icon: 'error',
        confirmButtonText: 'Kembali ke Daftar Kuis',
        confirmButtonColor: '#9333ea',
        allowOutsideClick: false,
      }).then(() => {
        router.replace('/siswa/kuis');
      });
      return;
    }

    // 2. Deteksi Pindah Halaman/Tab (Penalti 20 Detik)
    const handleViolation = async () => {
      if (isSubmitting) return;

      console.log("Violation detected: Student left the page/tab");
      
      // Berikan penalti di server
      try {
        await fetch('/api/kuis/penalti', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kuis_id: kuis._id,
            member_id: memberId,
            penalti_detik: 20
          })
        });
      } catch (err) {}

      Swal.fire({
        title: '🚨 Pelanggaran!',
        text: 'Anda terdeteksi meninggalkan halaman kuis. Waktu pengerjaan dikurangi 20 detik sebagai penalti.',
        icon: 'warning',
        confirmButtonText: 'Saya Mengerti',
        confirmButtonColor: '#ef4444',
        allowOutsideClick: false,
      }).then(() => {
        router.replace('/siswa/kuis');
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleViolation();
    };

    const handleBlur = () => {
      handleViolation();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // 3. Timer Countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(timer);
          if (!isSubmitting) autoSubmit();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handlePilihJawaban = async (soalId: string, pilihan: string) => {
    const barujawaban = { ...jawaban, [soalId]: pilihan };
    setJawaban(barujawaban);

    // Auto-Save ke DB
    try {
      const res = await fetch(`/api/kuis/save-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kuis_id: kuis._id,
          member_id: memberId,
          jawaban: barujawaban
        })
      });

      if (res.status === 403) {
        toast.error("Maaf, kuis ini telah ditutup oleh Admin secara mendadak.");
        setTimeout(() => window.location.href = '/siswa/kuis', 2000);
      }
    } catch (err) {
      console.error("Auto-save failed");
    }
  };

  const autoSubmit = () => {
    toast.error("Waktu habis! Kuis otomatis dikumpulkan.");
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Validasi apakah semua soal sudah dijawab (opsional, tapi guru mungkin ingin siswa diingatkan)
    const jumlahSoal = kuis.daftar_soal.length;
    const sudahDijawab = Object.keys(jawaban).length;
    
    if (sudahDijawab < jumlahSoal && timeLeft > 0) {
      if (!window.confirm(`Anda baru menjawab ${sudahDijawab} dari ${jumlahSoal} soal. Yakin ingin mengumpulkan?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/kuis/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kuis_id: kuis._id,
          member_id: memberId,
          jawaban: jawaban
        })
      });

      if (res.ok) {
        toast.success("Kuis berhasil dikumpulkan!");
        router.push('/siswa/kuis');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal mengumpulkan kuis");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours > 0 ? hours + 'j ' : ''}${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-8 pb-24 relative">
      {/* Sticky Header Waktu */}
      <div className="sticky top-4 z-10 flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-purple-100">
        <div>
          <h1 className="font-bold text-gray-800 text-lg leading-tight">{kuis.judul}</h1>
          <p className="text-xs text-purple-600 font-medium">Progress: {Object.keys(jawaban).length} / {kuis.daftar_soal.length} Terjawab</p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-mono font-bold text-center border-2 ${timeLeft < 300000 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
          <div className="text-[10px] uppercase opacity-60">Sisa Waktu</div>
          <div className="text-xl">{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className="space-y-6">
        {kuis.daftar_soal.map((soal: any, index: number) => (
          <div key={soal.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition">
            <div className="flex gap-4">
               <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 flex items-center justify-center rounded-lg font-bold text-sm">{index + 1}</span>
               <p className="text-gray-800 font-medium leading-relaxed pt-1 whitespace-pre-wrap">{soal.pertanyaan}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 pl-12 mt-2">
              {(['A', 'B', 'C', 'D', 'E'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => handlePilihJawaban(soal.id, opt)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    jawaban[soal.id] === opt 
                      ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm ring-1 ring-purple-200' 
                      : 'bg-white border-gray-100 text-gray-600 hover:border-purple-200 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                     jawaban[soal.id] === opt ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>{opt}</span>
                  <span className="flex-1 text-sm font-medium">{soal.opsi?.[opt] || '-'}</span>
                  {jawaban[soal.id] === opt && (
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-4 md:px-0">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-2xl transition-all ${
              isSubmitting ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? 'Mengirim Jawaban...' : '✅ Kumpulkan Jawaban Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}
