'use server'

import { revalidatePath } from 'next/cache';

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
    console.error("Gagal refresh cache:", error);
    return { 
      success: false, 
      message: "Terjadi kesalahan saat menyegarkan data." 
    };
  }
}