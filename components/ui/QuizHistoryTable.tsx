'use client'

import { useState } from 'react';

interface QuizHistoryTableProps {
  history: any[];
}

export default function QuizHistoryTable({ history }: QuizHistoryTableProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (quiz: any) => {
    setSelectedQuiz(quiz);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedQuiz(null);
  };

  return (
    <>
      <div className="bg-surface rounded-xl shadow-sm border border-border-custom overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/40 uppercase bg-foreground/5 border-b border-border-custom font-bold">
              <tr>
                <th className="px-6 py-3">Kuis</th>
                <th className="px-6 py-3 text-center">Benar</th>
                <th className="px-6 py-3 text-center">Salah</th>
                <th className="px-6 py-3 text-center">Skor</th>
                <th className="px-6 py-3 text-center">Detail</th>
                <th className="px-6 py-3 text-right">Tanggal Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-foreground/20 italic">Belum ada data nilai kuis.</td>
                </tr>
              ) : (
                history.map((h: any) => (
                  <tr key={h._id.toString()} className="hover:bg-foreground/5 transition">
                    <td className="px-6 py-4 font-bold text-foreground">
                      {h.kuis_id?.judul || 'Kuis Terhapus'}
                    </td>
                    <td className="px-6 py-4 text-center text-emerald-600 font-bold">{h.benar ?? '-'}</td>
                    <td className="px-6 py-4 text-center text-red-500 font-bold">{h.salah ?? '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-4 py-1.5 rounded-full font-black text-lg border ${
                        (h.nilai || 0) >= 75 
                          ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-red-500 bg-red-500/10 border-red-500/20'
                      }`}>
                        {Number(h.nilai || 0).toFixed(2).replace(/\.00$/, '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openModal(h)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold text-xs border border-blue-100"
                      >
                        Detail
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right text-foreground/30 text-xs">
                      {new Date(h.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL */}
      {isModalOpen && selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-border-custom animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="p-6 border-b border-border-custom flex justify-between items-center bg-foreground/5 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-foreground">{selectedQuiz.kuis_id?.judul}</h2>
                <p className="text-sm text-foreground/40 mt-1 font-medium">
                  Skor: <span className="font-black text-blue-500 underline decoration-blue-500/20">{Number(selectedQuiz.nilai || 0).toFixed(2).replace(/\.00$/, '')}</span> | 
                  Benar: <span className="text-emerald-500 font-bold">{selectedQuiz.benar}</span> | 
                  Salah: <span className="text-red-500 font-bold">{selectedQuiz.salah}</span>
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-foreground/40 hover:text-foreground"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Content Modal (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {selectedQuiz.kuis_id?.daftar_soal?.map((soal: any, idx: number) => {
                const studentAnswer = selectedQuiz.jawaban[soal.id] || selectedQuiz.jawaban[soal._id?.toString()];
                const isCorrect = studentAnswer === soal.jawaban_benar;

                return (
                  <div key={soal.id || soal._id} className="space-y-3">
                    <div className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold text-foreground">
                        {idx + 1}
                      </span>
                      <h3 className="text-foreground font-bold pt-1 leading-relaxed">
                        {soal.pertanyaan}
                      </h3>
                    </div>

                    <div className="ml-12 grid grid-cols-1 gap-2">
                      {['A', 'B', 'C', 'D', 'E'].map((optKey) => {
                        const optText = soal.opsi[optKey];
                        const isStudentAnswer = studentAnswer === optKey;
                        const isCorrectAnswer = soal.jawaban_benar === optKey;

                        let bgColor = 'bg-foreground/5 border-border-custom';
                        let textColor = 'text-foreground/70 font-medium';
                        let icon = null;

                        if (isCorrectAnswer) {
                          bgColor = 'bg-emerald-50 border-emerald-200';
                          textColor = 'text-emerald-700 font-bold';
                          icon = <span className="text-emerald-600">✅</span>;
                        } else if (isStudentAnswer && !isCorrect) {
                          bgColor = 'bg-red-50 border-red-200';
                          textColor = 'text-red-700 font-bold';
                          icon = <span className="text-red-600">❌</span>;
                        }

                        return (
                          <div 
                            key={optKey}
                            className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${bgColor} ${textColor}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 font-bold">{optKey}.</span>
                              <span>{optText}</span>
                            </div>
                            {icon}
                          </div>
                        );
                      })}
                    </div>
                    
                    {!isCorrect && (
                      <div className="ml-12 mt-2 p-2 px-4 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-700">
                        Jawaban Anda: <span className="font-bold underline">{studentAnswer || '-'}</span> | 
                        Jawaban Benar: <span className="font-bold underline">{soal.jawaban_benar}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-border-custom bg-foreground/5 flex justify-end rounded-b-2xl">
              <button 
                onClick={closeModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
