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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Kuis</th>
                <th className="px-6 py-3 text-center">Benar</th>
                <th className="px-6 py-3 text-center">Salah</th>
                <th className="px-6 py-3 text-center">Skor</th>
                <th className="px-6 py-3 text-center">Detail</th>
                <th className="px-6 py-3 text-right">Tanggal Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Belum ada data nilai kuis.</td>
                </tr>
              ) : (
                history.map((h: any) => (
                  <tr key={h._id.toString()} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {h.kuis_id?.judul || 'Kuis Terhapus'}
                    </td>
                    <td className="px-6 py-4 text-center text-emerald-600 font-bold">{h.benar ?? '-'}</td>
                    <td className="px-6 py-4 text-center text-red-500 font-bold">{h.salah ?? '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full font-black text-lg ${
                        (h.nilai || 0) >= 75 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                      }`}>
                        {h.nilai || 0}
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
                    <td className="px-6 py-4 text-right text-gray-400 text-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedQuiz.kuis_id?.judul}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Skor: <span className="font-bold text-blue-600">{selectedQuiz.nilai}</span> | 
                  Benar: <span className="text-emerald-600 font-bold">{selectedQuiz.benar}</span> | 
                  Salah: <span className="text-red-500 font-bold">{selectedQuiz.salah}</span>
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
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
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <h3 className="text-gray-800 font-medium pt-1 leading-relaxed">
                        {soal.pertanyaan}
                      </h3>
                    </div>

                    <div className="ml-12 grid grid-cols-1 gap-2">
                      {['A', 'B', 'C', 'D', 'E'].map((optKey) => {
                        const optText = soal.opsi[optKey];
                        const isStudentAnswer = studentAnswer === optKey;
                        const isCorrectAnswer = soal.jawaban_benar === optKey;

                        let bgColor = 'bg-slate-50 border-slate-100';
                        let textColor = 'text-gray-600';
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
            <div className="p-4 border-t bg-gray-50 flex justify-end rounded-b-2xl">
              <button 
                onClick={closeModal}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition"
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
