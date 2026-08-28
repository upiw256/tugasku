'use server'

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Materi, MateriComment, Member, User } from '@/models';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


// Fungsi untuk mencatat download materi
export async function trackMateriDownload(materiId: string) {
  try {
    const session = await auth();
    if (!session) return { success: false, message: 'Harap login' };

    await connectDB();
    const user = await User.findOne({ user: session.user.email });
    if (!user) return { success: false, message: 'User tidak ditemukan' };

    // Update materi jika user belum download
    const result = await Materi.updateOne(
      { _id: materiId },
      { $addToSet: { downloads: user._id } }
    );
    
    // Jika dia pertama kali download, broadcast via Pusher
    if (result.modifiedCount > 0 && user.member_id) {
      const student = await Member.findById(user.member_id).lean();
      if (student) {
        await pusherServer.trigger(`materi-${materiId}`, 'new-download', {
          id: student._id.toString(),
          nama: student.nama_lengkap,
          kelas: student.kelas,
        });
      }
    }
    
    // Server component akan butuh dikasih tau ada update
    revalidatePath(`/admin/materi`);
    return { success: true };
  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/materi-discussion.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    console.error('Error tracking download:', error);
    return { success: false, message: 'Gagal mencatat log' };
  }
}

// Fungsi untuk ambil log realtime
export async function getLogUnduhan(materiId: string) {
  try {
    await connectDB();
    const materi = await Materi.findById(materiId).populate('downloads', 'user member_id').lean();
    if (!materi || !materi.downloads) return { success: true, data: [] };
    
    const memberIds = materi.downloads.map((u: any) => u.member_id).filter(Boolean);
    const members = await Member.find({ _id: { $in: memberIds } }).lean();
    
    const data = members.map((m: any) => ({
      id: m._id.toString(),
      nama: m.nama_lengkap,
      kelas: m.kelas,
    }));
    
    return { success: true, data };
  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/materi-discussion.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    console.error('Error getting download log:', error);
    return { success: false, data: [] };
  }
}

// Fungsi untuk ambil diskusi
export async function getDiskusiMateri(materiId: string, kelasSiswa?: string) {
  try {
    await connectDB();
    
    let query: any = { materi_id: materiId };
    
    // Jika auth adalah siswa, hanya ambil komentar admin dan orang di kelas yang sama
    if (kelasSiswa) {
      query = {
        materi_id: materiId,
        $or: [
          { role_pengirim: 'admin' },
          { role_pengirim: 'guru' },
          { kelas_siswa: kelasSiswa }
        ]
      };
    }
    
    const comments = await MateriComment.find(query).sort({ dibuat_pada: 1 }).lean();
    
    return {
      success: true,
      data: comments.map(c => ({
        id: c._id.toString(),
        nama: c.nama_pengirim,
        komentar: c.komentar,
        role: c.role_pengirim,
        kelas: c.kelas_siswa,
        waktu: c.dibuat_pada.toISOString(),
      }))
    };
  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/materi-discussion.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    console.error('Error getting discussions:', error);
    return { success: false, data: [] };
  }
}

// Fungsi post komentar
export async function postKomentarDiskusi(materiId: string, komentar: string) {
  try {
    const session = await auth();
    if (!session) return { success: false, message: 'Harap login' };

    await connectDB();
    
    const userEmail = session.user.email;
    const role = session.user.role;
    
    let namaPengirim = 'User';
    let kelasSiswa = '';

    if (role === 'siswa') {
      const dbUser = await User.findOne({ user: userEmail });
      if (dbUser && dbUser.member_id) {
        const student = await Member.findById(dbUser.member_id);
        if (student) {
          namaPengirim = student.nama_lengkap;
          kelasSiswa = student.kelas;
        }
      }
    } else {
      namaPengirim = role === 'admin' ? 'Admin' : 'Guru';
    }

    if (!komentar.trim()) {
      return { success: false, message: 'Komentar tidak boleh kosong' };
    }

    const newComment = await MateriComment.create({
      materi_id: materiId,
      user_email: userEmail,
      nama_pengirim: namaPengirim,
      role_pengirim: role,
      kelas_siswa: kelasSiswa,
      komentar: komentar,
    });

    return { 
      success: true, 
      data: {
        id: newComment._id.toString(),
        nama: newComment.nama_pengirim,
        komentar: newComment.komentar,
        role: newComment.role_pengirim,
        kelas: newComment.kelas_siswa,
        waktu: newComment.dibuat_pada.toISOString(),
      }
    };
  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/materi-discussion.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    console.error('Error posting comment:', error);
    return { success: false, message: 'Gagal mengirim komentar' };
  }
}

// Fungsi untuk admin menghapus satu komentar
export async function deleteKomentarDiskusi(commentId: string) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return { success: false, message: 'Tidak ada akses' };
    }

    await connectDB();
    await MateriComment.findByIdAndDelete(commentId);
    
    return { success: true };
  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/materi-discussion.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    console.error('Error deleting comment:', error);
    return { success: false, message: 'Gagal menghapus komentar' };
  }
}

// Fungsi untuk admin membersihkan diskusi per kelas
export async function clearDiskusiMateri(materiId: string, kelas?: string) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return { success: false, message: 'Tidak ada akses' };
    }

    await connectDB();
    
    let query: any = { materi_id: materiId };
    
    if (kelas) {
      // Hapus pesan dari siswa di kelas tersebut, DAN pesan admin yang ditujukan ke kelas (jika ada tracknya)
      // Agak rumit kalau pesan admin global. Kita hapus saja semua pesan di materi ini untuk kelas tersebut
      query = { materi_id: materiId, kelas_siswa: kelas };
    }
    
    await MateriComment.deleteMany(query);
    
    return { success: true };
  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/actions/materi-discussion.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    console.error('Error clearing discussions:', error);
    return { success: false, message: 'Gagal clear chat' };
  }
}
