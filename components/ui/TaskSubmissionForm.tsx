"use client";

import { useState, useRef } from "react";
import { submitTaskAction } from "@/actions/submission-actions";
import { toast } from "react-hot-toast"; 

export default function TaskSubmissionForm({ tugasId }: { tugasId: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fungsi untuk Preview Gambar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Mohon pilih file gambar (JPG/PNG).");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <form 
      action={async (formData) => {
        setIsUploading(true);
        const res = await submitTaskAction(formData);
        if (res.success) {
          alert("Berhasil dikirim!");
          setPreviewUrl(null);
        } else {
          alert(res.message);
        }
        setIsUploading(false);
      }} 
      className="space-y-4 p-4 bg-surface rounded-xl shadow-md border border-border-custom"
    >
      <input type="hidden" name="tugasId" value={tugasId} />

      <div className="space-y-2">
        <label className="block text-sm font-bold text-foreground">Upload Foto Tugas</label>
        <input
          ref={fileInputRef}
          type="file"
          name="file" // Name harus "file" agar dibaca Server Action
          accept="image/*"
          onChange={handleFileChange}
          required
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
            onClick={() => { setPreviewUrl(null); if(fileInputRef.current) fileInputRef.current.value=""; }}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs"
          >
            ✕ Hapus
          </button>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-bold text-foreground">Catatan Siswa</label>
        <textarea
          name="catatan"
          className="w-full p-2 bg-foreground/5 border border-border-custom rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tambahkan catatan jika ada..."
          rows={3}
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isUploading}
        className={`w-full py-3 rounded-lg font-bold text-white transition-all 
          ${isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isUploading ? "Sedang Mengirim..." : "Kirim Tugas"}
      </button>
    </form>
  );
}