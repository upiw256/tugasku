'use server'

import { connectDB } from '@/lib/db';
import { Kelompok } from '@/models';
import { revalidatePath } from 'next/cache';

export async function createKelompokAction(formData: FormData) {
  try {
    await connectDB();
    
    const kelas = formData.get('kelas') as string;
    const kelompokDataStr = formData.get('kelompok_data') as string;

    if (!kelas || !kelompokDataStr) {
      return { success: false, message: 'Semua field wajib diisi' };
    }

    const kelompokData = JSON.parse(kelompokDataStr); // Ekspektasi: [{ nama: "Kelompok 1", anggota: ["id1", "id2"] }]

    if (kelompokData.length === 0) {
      return { success: false, message: 'Kamu harus membuat minimal satu kelompok' };
    }

    // Hindari duplikasi jika admin sengaja buat lagi? Atau kita Replace/Delete yang lama?
    // Untuk saat ini kita hapus Kelompok yang lama untuk kelas tersebut biar tidak berlipat ganda
    await Kelompok.deleteMany({ kelas });

    // Buat Kelompok baru
    const kelompokPromises = kelompokData.map(async (k: any) => {
      // Simpan record Kelompok
      return Kelompok.create({
        nama_kelompok: k.nama,
        kelas,
        ketua: k.ketua,
        anggota: k.anggota
      });
    });

    await Promise.all(kelompokPromises);

    revalidatePath('/admin/tugas-kelompok');
    return { success: true, message: 'Kelompok berhasil di-generate dan disimpan!' };
  } catch (error: any) {
    console.error('Create Kelompok Error:', error);
    return { success: false, message: error.message || 'Gagal menyimpan kelompok' };
  }
}

export async function moveMemberAction(memberId: string, fromGroupId: string, toGroupId: string) {
  try {
    await connectDB();
    
    // Hapus dari grup asal
    const fromGroup = await Kelompok.findById(fromGroupId);
    if (!fromGroup) return { success: false, message: 'Kelompok asal tidak ditemukan' };
    
    fromGroup.anggota = fromGroup.anggota.filter((id: any) => id.toString() !== memberId);
    if (fromGroup.ketua && fromGroup.ketua.toString() === memberId) {
       fromGroup.ketua = fromGroup.anggota[0] || null;
    }
    await fromGroup.save();

    // Tambah ke grup tujuan
    const toGroup = await Kelompok.findById(toGroupId);
    if (!toGroup) return { success: false, message: 'Kelompok tujuan tidak ditemukan' };

    toGroup.anggota.push(memberId);
    if (!toGroup.ketua) {
       toGroup.ketua = memberId;
    }
    await toGroup.save();

    revalidatePath('/admin/tugas-kelompok');
    
    return { success: true, message: 'Berhasil memindahkan anggota' };
  } catch (error: any) {
    console.error('Move Member Error:', error);
    return { success: false, message: error.message || 'Gagal memindahkan anggota' };
  }
}

export async function setKetuaAction(groupId: string, memberId: string) {
  try {
    await connectDB();
    
    const group = await Kelompok.findById(groupId);
    if (!group) return { success: false, message: 'Kelompok tidak ditemukan' };
    
    group.ketua = memberId;
    await group.save();
    
    revalidatePath('/admin/tugas-kelompok');
    
    return { success: true, message: 'Berhasil mengubah ketua' };
  } catch (error: any) {
    console.error('Set Ketua Error:', error);
    return { success: false, message: error.message || 'Gagal mengubah ketua' };
  }
}

