// actions/academic-actions.ts
'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Tugas } from '@/models';
import { revalidatePath } from 'next/cache';
import { LogTugas } from '@/models';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function createTugasAction(formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') return { success: false, message: 'Unauthorized' };

    const judul = formData.get('judul');
    const deskripsi = formData.get('deskripsi');
    const deadline = formData.get('deadline');
    const kelas = formData.get('kelas');
    
    // AMBIL DATA TIPE
    const tipe_pengumpulan = formData.get('tipe_pengumpulan') || 'online';

    await connectDB();

    await Tugas.create({
      judul,
      deskripsi,
      deadline: new Date(deadline as string),
      kelas,
      tipe_pengumpulan // Simpan ke DB
    });

    revalidatePath('/admin/tugas');
    revalidatePath('/siswa/tugas');
    return { success: true, message: 'Tugas berhasil dibuat!' };

  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/academic-actions.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    return { success: false, message: 'Gagal membuat tugas.' };
  }
}
// --- ACTION BARU: UPDATE TUGAS ---
export async function updateTugasAction(formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Akses ditolak.' };
    }

    const id = formData.get('id');
    const judul = formData.get('judul');
    const deskripsi = formData.get('deskripsi');
    const deadline = formData.get('deadline');
    const tipe_pengumpulan = formData.get('tipe_pengumpulan');
    
    // Ambil array kelas
    const kelas = formData.getAll('kelas'); 

    if (!id || !judul || !deadline) {
        return { success: false, message: 'Judul dan Deadline wajib diisi.' };
    }

    if (kelas.length === 0) {
        return { success: false, message: 'Pilih minimal satu kelas target.' };
    }

    await connectDB();

    // Gunakan strict: false agar update tipe_pengumpulan pasti masuk
    await Tugas.findByIdAndUpdate(
        id, 
        {
          judul,
          deskripsi,
          deadline: new Date(deadline as string),
          kelas: kelas,
          tipe_pengumpulan: tipe_pengumpulan 
        },
        { 
            new: true, 
            strict: false // 🔥 Penyelamat: Memaksa simpan data meskipun Schema cache bermasalah
        } 
    );

    revalidatePath('/admin/tugas');         
    revalidatePath(`/admin/tugas/${id}`);   
    revalidatePath('/siswa/tugas');         

    return { success: true, message: 'Tugas berhasil diperbarui!' };

  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/academic-actions.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    console.error("Error updateTugas:", error);
    return { success: false, message: 'Terjadi kesalahan saat mengupdate tugas.' };
  }
}