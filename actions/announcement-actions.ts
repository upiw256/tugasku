'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Pengumuman } from '@/models';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';

export async function deleteAnnouncementAction(id: string) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') return { success: false, message: 'Unauthorized' };

        await connectDB();
        await Pengumuman.findByIdAndDelete(id);
        
        revalidatePath('/');
        return { success: true, message: 'Pengumuman dihapus.' };
    } catch (error) {
        return { success: false, message: 'Gagal menghapus.' };
    }
}

export async function createAnnouncementAction(formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') return { success: false, message: 'Unauthorized' };

    const judul = formData.get('judul');
    const konten = formData.get('konten');
    const prioritas = formData.get('prioritas');

    if (!judul || !konten) return { success: false, message: 'Lengkapi data.' };

    await connectDB();

    const newInfo = await Pengumuman.create({
      judul,
      konten,
      prioritas,
      dibuat_oleh: session.user.email,
      tanggal: new Date()
    });

    // --- REALTIME TRIGGER ---
    // Kirim sinyal ke channel 'sekolah-channel' dengan event 'info-baru'
    await pusherServer.trigger('sekolah-channel', 'info-baru', {
      _id: newInfo._id,
      judul: newInfo.judul,
      konten: newInfo.konten,
      prioritas: newInfo.prioritas,
      tanggal: newInfo.tanggal
    });

    revalidatePath('/');
    return { success: true, message: 'Terposting!' };

  } catch (error) {
    return { success: false, message: 'Gagal.' };
  }
}