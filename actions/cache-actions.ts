'use server'

import { revalidatePath } from 'next/cache';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function clearAppCache() {
  try {
    // Menghapus cache untuk seluruh aplikasi secara menyeluruh
    // 'layout' memberi tahu Next.js untuk merevalidasi dari root sampai ke bawah
    revalidatePath('/', 'layout'); 
    
    return { 
      success: true, 
      message: "Cache memori berhasil disegarkan!" 
    };
  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/cache-actions.ts'}): ${error?.message || error}`, tipe: 'error' }).catch(() => {});

    console.error("Gagal refresh cache:", error);
    return { 
      success: false, 
      message: "Terjadi kesalahan saat menyegarkan data." 
    };
  }
}