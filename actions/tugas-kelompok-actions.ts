'use server'

import { connectDB } from '@/lib/db';
import { Tugas, Kelompok, Member, Nilai } from '@/models';
import { revalidatePath } from 'next/cache';

export async function createTugasKelompokAction(formData: FormData) {
  try {
    await connectDB();
    
    const judul = formData.get('judul') as string;
    const deskripsi = formData.get('deskripsi') as string;
    const deadline = formData.get('deadline') as string;
    const kelas = formData.get('kelas') as string;
    const kelompokDataStr = formData.get('kelompok_data') as string;
    const tipe_pengumpulan = formData.get('tipe_pengumpulan') as string || 'online';

    if (!judul || !deadline || !kelas || !kelompokDataStr) {
      return { success: false, message: 'Semua field wajib diisi' };
    }

    const kelompokData = JSON.parse(kelompokDataStr); // Ekspektasi: [{ nama: "Kelompok 1", anggota: ["id1", "id2"] }]

    if (kelompokData.length === 0) {
      return { success: false, message: 'Kamu harus membuat minimal satu kelompok' };
    }

    // 1. Buat Tugas
    const newTugas = await Tugas.create({
      judul,
      deskripsi,
      deadline: new Date(deadline),
      kelas,
      tipe_pengumpulan,
      tipe_tugas: 'kelompok'
    });

    // 2. Buat Kelompok & Inisialisasi Nilai default = 0 untuk tiap siswa
    const kelompokPromises = kelompokData.map(async (k: any) => {
      // Simpan record Kelompok
      const savedK = await Kelompok.create({
        nama_kelompok: k.nama,
        tugas_id: newTugas._id,
        ketua: k.ketua,
        kelas,
        anggota: k.anggota
      });

      // Siapkan Nilai default untuk tiap anggota ke Tugas yang sama
      const nilaiPromises = k.anggota.map((memberId: string) => {
        return Nilai.create({
          member_id: memberId,
          tugas_id: newTugas._id,
          nilai: 0
        });
      });

      await Promise.all(nilaiPromises);
      return savedK;
    });

    await Promise.all(kelompokPromises);

    revalidatePath('/admin/tugas');
    return { success: true, message: 'Tugas kelompok berhasil dibuat' };
  } catch (error: any) {
    console.error('Create Tugas Kelompok Error:', error);
    return { success: false, message: error.message || 'Gagal menyimpan tugas kelompok' };
  }
}
