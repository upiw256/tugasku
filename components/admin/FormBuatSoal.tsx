'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Soal {
  id: string;
  pertanyaan: string;
  opsi: {
    A: string; B: string; C: string; D: string; E: string;
  };
  jawaban_benar: string;
}

export default function FormBuatSoal({ 
  availableClasses, 
  editData = null,
  onCancel = () => {}
}: { 
  availableClasses: string[];
  editData?: any;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [judul, setJudul] = useState(editData?.judul || '');
  const [deskripsi, setDeskripsi] = useState(editData?.deskripsi || '');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(editData?.kelas || []);
  const [waktuMulai, setWaktuMulai] = useState(editData?.waktu_mulai ? new Date(editData.waktu_mulai).toISOString().slice(0, 16) : '');
  const [waktuSelesai, setWaktuSelesai] = useState(editData?.waktu_selesai ? new Date(editData.waktu_selesai).toISOString().slice(0, 16) : '');
  const [durasi, setDurasi] = useState(editData?.durasi || 60);
  const [daftarSoal, setDaftarSoal] = useState<Soal[]>(editData?.daftar_soal || [
    { id: '1', pertanyaan: '', opsi: { A: '', B: '', C: '', D: '', E: '' }, jawaban_benar: 'A' }
  ]);

  useEffect(() => {
    if (editData) {
      setJudul(editData.judul);
      setDeskripsi(editData.deskripsi || '');
      setSelectedClasses(Array.isArray(editData.kelas) ? editData.kelas : [editData.kelas]);
      setWaktuMulai(new Date(editData.waktu_mulai).toISOString().slice(0, 16));
      setWaktuSelesai(new Date(editData.waktu_selesai).toISOString().slice(0, 16));
      setDurasi(editData.durasi || 60);
      setDaftarSoal(editData.daftar_soal);
    }
  }, [editData]);
  const [isKelasOpen, setIsKelasOpen] = useState(false);

  const [aiTopic, setAiTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiTopic) {
      toast.error('Masukkan topik soal terlebih dahulu!');
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-kuis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topik: aiTopic, jumlahSoal: numQuestions }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDaftarSoal(data);
        toast.success('Berhasil membuat soal secara otomatis!');
      } else {
        toast.error(data.error || 'Gagal generate soal');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem AI');
    } finally {
      setIsAiLoading(false);
    }
  };

  const addSoal = () => {
    const newId = (daftarSoal.length + 1).toString();
    setDaftarSoal([...daftarSoal, { id: newId, pertanyaan: '', opsi: { A: '', B: '', C: '', D: '', E: '' }, jawaban_benar: 'A' }]);
  };

  const removeSoal = (index: number) => {
    if (daftarSoal.length === 1) return;
    const newSoalList = daftarSoal.filter((_, i) => i !== index);
    setDaftarSoal(newSoalList);
  };

  const updateSoal = (index: number, field: string, value: any) => {
    const newSoalList = [...daftarSoal];
    if (field === 'pertanyaan' || field === 'jawaban_benar') {
      (newSoalList[index] as any)[field] = value;
    } else {
      (newSoalList[index].opsi as any)[field] = value;
    }
    setDaftarSoal(newSoalList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul || selectedClasses.length === 0 || !waktuMulai || !waktuSelesai) {
      toast.error('Harap isi semua informasi kuis!');
      return;
    }

    // Validasi soal minimal ada isinya
    const isSoalValid = daftarSoal.every(s => s.pertanyaan && s.opsi.A && s.opsi.B);
    if (!isSoalValid) {
      toast.error('Pastikan semua pertanyaan dan minimal opsi A & B terisi!');
      return;
    }

    setIsLoading(true);
    try {
      const url = editData ? `/api/soal-pg/${editData._id}` : '/api/soal-pg';
      const method = editData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul,
          deskripsi,
          kelas: selectedClasses,
          daftar_soal: daftarSoal,
          waktu_mulai: waktuMulai,
          waktu_selesai: waktuSelesai,
          durasi: Number(durasi)
        }),
      });

      if (res.ok) {
        toast.success(editData ? 'Kuis berhasil diperbarui!' : 'Kuis berhasil dibuat!');
        if (editData) onCancel();
        setJudul('');
        setDeskripsi('');
        setSelectedClasses([]);
        setWaktuMulai('');
        setWaktuSelesai('');
        setDaftarSoal([{ id: '1', pertanyaan: '', opsi: { A: '', B: '', C: '', D: '', E: '' }, jawaban_benar: 'A' }]);
        
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal membuat kuis');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Informasi Kuis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Judul Kuis <span className="text-red-500">*</span></label>
            <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Kuis Harian BAB 1" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi</label>
            <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={2} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Petunjuk pengerjaan..." />
          </div>
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kelas <span className="text-red-500">*</span></label>
            <div onClick={() => setIsKelasOpen(!isKelasOpen)} className="w-full min-h-[42px] px-3 py-2 border rounded-lg cursor-pointer bg-white flex flex-wrap gap-2 items-center">
              {selectedClasses.length === 0 && <span className="text-gray-400 text-sm">-- Pilih Kelas --</span>}
              {selectedClasses.map(cls => (
                <span key={cls} className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  {cls} <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedClasses(selectedClasses.filter(c => c !== cls)); }}>&times;</button>
                </span>
              ))}
            </div>
            {isKelasOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {availableClasses.map(cls => (
                  <div key={cls} onClick={() => { if(selectedClasses.includes(cls)) setSelectedClasses(selectedClasses.filter(c=>c!==cls)); else setSelectedClasses([...selectedClasses, cls]); }} className={`px-4 py-2 text-sm cursor-pointer ${selectedClasses.includes(cls) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>{cls}</div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Waktu Mulai <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={waktuMulai} onChange={(e) => setWaktuMulai(e.target.value)} required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Waktu Selesai <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={waktuSelesai} onChange={(e) => setWaktuSelesai(e.target.value)} required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Durasi (Menit) <span className="text-red-500">*</span></label>
              <input type="number" value={durasi} onChange={(e) => setDurasi(parseInt(e.target.value) || 0)} required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 px-2 flex justify-between items-center">
          Daftar Pertanyaan
          <div className="flex gap-2">
             <button type="button" onClick={addSoal} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 border">+ Tambah Manual</button>
          </div>
        </h2>

        {/* AI GENERATE BOX */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
             <span className="text-xl">✨</span>
             <h3 className="font-bold text-indigo-900">AI Soal Generator</h3>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Masukkan topik soal (misal: Pergaulan bebas, Matematika Bangun Ruang...)"
              className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="w-24">
              <input 
                type="number" 
                min="1" 
                max="20"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                className="w-full px-2 py-2 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                title="Jumlah Soal"
              />
            </div>
            <button 
              type="button"
              disabled={isAiLoading}
              onClick={handleAiGenerate}
              className={`px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 ${isAiLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isAiLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Proses AI...
                </>
              ) : 'Generate Soal'}
            </button>
          </div>
          <p className="text-[10px] text-indigo-400 mt-2 italic">* AI akan secara otomatis menyusun 5 pertanyaan pilihan ganda sesuai topik Anda.</p>
        </div>

        {daftarSoal.map((soal, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4 relative group">
            <button type="button" onClick={() => removeSoal(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold">&times;</button>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Pertanyaan #{index + 1}</label>
              <textarea value={soal.pertanyaan} onChange={(e) => updateSoal(index, 'pertanyaan', e.target.value)} rows={2} required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Tulis soal kuis..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D', 'E'] as const).map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <span className="font-bold text-gray-400">{opt}.</span>
                  <input type="text" value={(soal.opsi as any)[opt]} onChange={(e) => updateSoal(index, opt, e.target.value)} required className="flex-1 px-3 py-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder={`Opsi ${opt}`} />
                  <input type="radio" name={`correct-${index}`} checked={soal.jawaban_benar === opt} onChange={() => updateSoal(index, 'jawaban_benar', opt)} className="w-4 h-4 text-blue-600" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-gray-100 mt-12">
        <button type="submit" disabled={isLoading} className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${isLoading ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.01] active:scale-[0.99] hover:shadow-xl'}`}>
          {isLoading ? (
             <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Sedang Memproses...
             </span>
          ) : (
             <span className="flex items-center justify-center gap-2">
                🚀 {editData ? 'Perbarui dan Publikasikan Perubahan' : 'Simpan dan Publikasikan Kuis'}
             </span>
          )}
        </button>
      </div>
    </form>
  );
}
