"use client";

import { useState, useRef } from "react";
import { submitTaskAction } from "@/actions/submission-actions";
import { Mascot } from "@/components/ui/Mascot";

type Feedback = { type: "success" | "error" | "warning"; title: string; message: string };

export default function TaskSubmissionForm({ tugasId }: { tugasId: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      if (!isImage && !isPdf) {
        setFeedback({ type: "warning", title: "Format file belum sesuai", message: "Pilih file gambar atau PDF untuk mengirim tugas." });
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setSelectedFile(file);
      if (isImage) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else {
        setPreviewUrl(null); // PDF tidak perlu preview gambar
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (!selectedFile) {
      setFeedback({ type: "warning", title: "File tugas masih kosong", message: "Pilih foto atau PDF tugas terlebih dahulu, lalu coba kirim lagi." });
      return;
    }

    setIsUploading(true);
    const formData = new FormData(form);

    try {
      const res = await submitTaskAction(formData);
      if (res.success) {
        setFeedback({ type: "success", title: "Tugas berhasil dikirim!", message: "Terima kasih, tugasmu sudah diterima." });
        setPreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setFeedback({ type: "error", title: "Tugas gagal dikirim", message: res.message || "Coba periksa koneksi dan kirim kembali." });
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      setFeedback({ type: "error", title: "Tugas gagal dikirim", message: error?.message || "Terjadi kesalahan jaringan. Periksa koneksi lalu coba lagi." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-surface rounded-xl shadow-md border border-border-custom"
    >
      <input type="hidden" name="tugasId" value={tugasId} />

      <div className="space-y-2">
        <label className="block text-sm font-bold text-foreground">Upload Foto / PDF Tugas</label>
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-foreground/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-foreground/5 file:text-foreground hover:file:bg-foreground/10"
        />
      </div>

      {/* --- BOX PREVIEW --- */}
      {previewUrl && (
        <div className="mt-4 p-2 border-2 border-dashed border-border-custom rounded-lg bg-foreground/5 relative">
          <p className="text-[10px] font-bold text-foreground/40 mb-2 uppercase">Pratinjau Foto:</p>
          <img src={previewUrl} alt="Preview" className="max-h-60 mx-auto rounded shadow-sm" />
          <button 
            type="button" 
            onClick={() => { setPreviewUrl(null); setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs"
          >
            ✕ Hapus
          </button>
        </div>
      )}
      {selectedFile && !previewUrl && (
        <div className="mt-4 p-3 border-2 border-dashed border-border-custom rounded-lg bg-foreground/5 flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{selectedFile.name}</p>
            <p className="text-xs text-foreground/50">{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
            className="bg-red-500 text-white px-2 py-1 rounded-full text-xs shrink-0"
          >
            ✕ Hapus
          </button>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-bold text-foreground">Catatan Siswa</label>
        <textarea
          name="catatan"
          className="w-full p-2 bg-foreground/5 border border-border-custom rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Tambahkan catatan jika ada..."
          rows={3}
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isUploading}
        className={`w-full py-3 rounded-lg font-bold text-white transition-all 
          ${isUploading ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
      >
        {isUploading ? "Sedang Mengirim..." : "Kirim Tugas"}
      </button>

      {feedback && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFeedback(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="task-feedback-title" aria-describedby="task-feedback-message" className="w-full max-w-sm rounded-2xl border border-border-custom bg-surface px-6 py-5 text-center shadow-2xl">
            <Mascot mood={feedback.type} className="mx-auto h-32 w-36" />
            <h2 id="task-feedback-title" className="mt-2 text-lg font-bold text-foreground">{feedback.title}</h2>
            <p id="task-feedback-message" className="mt-2 text-sm leading-relaxed text-foreground/70">{feedback.message}</p>
            <button type="button" autoFocus onClick={() => setFeedback(null)} className="mt-5 w-full rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white transition hover:bg-primary-700">
              Mengerti
            </button>
          </section>
        </div>
      )}
    </form>
  );
}
