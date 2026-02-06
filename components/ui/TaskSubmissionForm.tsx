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
      className="space-y-4 p-4 bg-white rounded-xl shadow-md border"
    >
      <input type="hidden" name="tugasId" value={tugasId} />

      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">Upload Foto Tugas</label>
        <input
          ref={fileInputRef}
          type="file"
          name="file" // Name harus "file" agar dibaca Server Action
          accept="image/*"
          onChange={handleFileChange}
          required
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* --- BOX PREVIEW --- */}
      {previewUrl && (
        <div className="mt-4 p-2 border-2 border-dashed rounded-lg bg-gray-50 relative">
          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Pratinjau Foto:</p>
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
        <label className="block text-sm font-bold text-gray-700">Catatan Siswa</label>
        <textarea
          name="catatan"
          className="w-full p-2 border rounded-lg text-sm"
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