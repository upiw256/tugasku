'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Nilai, Tugas } from '@/models';
import { revalidatePath } from 'next/cache';

type ActionState = {
    success: boolean;
    message: string;
};

export async function giveGradeAction(taskId: string, memberId: string, grade: number): Promise<ActionState> {
  try {
    await connectDB();
    
    // Gunakan findOneAndUpdate dengan upsert agar bisa memberi nilai ke yang belum mengumpulkan (offline)
    await Nilai.findOneAndUpdate(
        { tugas_id: taskId, member_id: memberId },
        { 
            nilai: grade,
            tanggal_dinilai: new Date()
        },
        { upsert: true, new: true }
    );
    
    revalidatePath(`/guru/tugas/${taskId}/pengumpulan`);
    return { success: true, message: 'Nilai berhasil disimpan!' };
  } catch (error) {
    console.error("Grade error:", error);
    return { success: false, message: 'Gagal menyimpan nilai.' };
  }
}

export async function createGuruTaskAction(formData: FormData): Promise<ActionState> {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'guru') {
            return { success: false, message: 'Unauthorized' };
        }

        const guru_id = (session.user as any).guru_id;
        const mapel = formData.get('mapel') as string;
        const kelas = formData.getAll('kelas') as string[];
        const judul = formData.get('judul') as string;
        const deskripsi = formData.get('deskripsi') as string;
        const deadline = formData.get('deadline') as string;

        if (!mapel || kelas.length === 0 || !judul || !deadline) {
            return { success: false, message: 'Harap isi semua field wajib!' };
        }

        await connectDB();
        await Tugas.create({
            guru_id,
            mapel,
            kelas,
            judul,
            deskripsi,
            deadline: new Date(deadline),
            is_active: true,
            tipe_pengumpulan: 'online'
        });

        revalidatePath('/guru/tugas');
        return { success: true, message: 'Tugas berhasil diterbitkan!' };
    } catch (error) {
        console.error("Create task error:", error);
        return { success: false, message: 'Gagal menerbitkan tugas.' };
    }
}
