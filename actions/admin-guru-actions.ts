'use server'

import { connectDB } from '@/lib/db';
import { Guru, User, Tugas, SoalPG, Materi, Absensi, Member } from '@/models';
import md5 from 'md5';
import { revalidatePath } from 'next/cache';

// Interface untuk tipe data kembalian
type ActionState = {
  success: boolean;
  message: string;
};

// CREATE GURU
export async function createGuruAction(formData: FormData): Promise<ActionState> {
  try {
    await connectDB();
    
    const nip = formData.get('nip') as string;
    const nama = formData.get('nama') as string;
    
    // Parse pengajaran from formData. It should be passed as a JSON string for simplicity.
    const pengajaranRaw = formData.get('pengajaran') as string;
    let pengajaran = [];
    try {
      if (pengajaranRaw) {
        pengajaran = JSON.parse(pengajaranRaw);
      }
    } catch (e) {
      return { success: false, message: 'Format pengajaran tidak valid.' };
    }

    // Cek apakah NIP sudah terdaftar
    const existingGuru = await Guru.findOne({ nip });
    if (existingGuru) {
      return { success: false, message: 'Gagal: NIP sudah terdaftar.' };
    }

    // 1. Buat Guru Baru
    const newGuru = await Guru.create({
      nip,
      nama_lengkap: nama,
      pengajaran
    });

    // 2. Buat User Login Otomatis
    // Default email: nip@guru.com
    // Default password: nip (atau 123456)
    await User.create({
      user: `${nip}@guru.com`,
      password: md5('654321'), 
      role: 'guru',
      guru_id: newGuru._id
    });

    revalidatePath('/admin/guru');
    return { success: true, message: 'Berhasil menambah guru baru!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan server saat menambah guru.' };
  }
}

// UPDATE GURU
export async function updateGuruAction(guruId: string, formData: FormData): Promise<ActionState> {
  try {
    await connectDB();
    
    const nip = formData.get('nip') as string;
    const nama = formData.get('nama') as string;
    
    const pengajaranRaw = formData.get('pengajaran') as string;
    let pengajaran = [];
    try {
      if (pengajaranRaw) {
        pengajaran = JSON.parse(pengajaranRaw);
      }
    } catch (e) {
      return { success: false, message: 'Format pengajaran tidak valid.' };
    }

    // Update Guru
    await Guru.findByIdAndUpdate(guruId, {
      nip: nip,
      nama_lengkap: nama,
      pengajaran: pengajaran
    });

    revalidatePath('/admin/guru');
    return { success: true, message: 'Data guru berhasil diupdate' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Gagal mengupdate data guru' };
  }
}

// DELETE GURU
export async function deleteGuruAction(guruId: string): Promise<ActionState> {
  try {
    await connectDB();
    
    // Hapus data guru
    await Guru.findByIdAndDelete(guruId);
    
    // Hapus user login terkait
    await User.findOneAndDelete({ guru_id: guruId });
    
    revalidatePath('/admin/guru');
    return { success: true, message: 'Data guru berhasil dihapus' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Gagal menghapus guru' };
  }
}

// RESET PASSWORD GURU
export async function resetPasswordGuruAction(guruId: string): Promise<ActionState> {
  try {
    await connectDB();

    const defaultPassword = md5('654321');

    const updatedUser = await User.findOneAndUpdate(
      { guru_id: guruId },
      { password: defaultPassword },
      { new: true }
    );

    if (!updatedUser) {
      return { success: false, message: 'Akun user tidak ditemukan untuk guru ini.' };
    }

    revalidatePath('/admin/guru');
    return { success: true, message: 'Password guru berhasil direset menjadi: 654321' };
  } catch (error) {
    console.error("Reset error:", error);
    return { success: false, message: 'Gagal mereset password guru.' };
  }
}

// SYNC GURU FROM API
export async function syncGuruFromApiAction(): Promise<ActionState> {
  try {
    await connectDB();

    const response = await fetch('https://api.sman1margaasih.sch.id/api/guru', {
      headers: {
        'X-Barrier': 'margaasih'
      }
    });

    if (!response.ok) {
      return { success: false, message: `Gagal mengambil data dari API: ${response.statusText}` };
    }

    const data = await response.json();
    const rows = data.rows || [];

    let updatedCount = 0;
    let createdCount = 0;

    for (const row of rows) {
      // Abaikan Tenaga Administrasi Sekolah
      if (row.jenis_ptk_id_str === 'Tenaga Administrasi Sekolah') continue;

      const nip = row.nip;
      const nama = row.nama;
      const mapelDefault = row.jabatan_ptk_id_str || 'Guru';

      if (!nip || !nama) continue;

      // 1. Simpan/Update Guru
      const existingGuru = await Guru.findOne({ nip: nip }).lean();

      const guru = await Guru.findOneAndUpdate(
        { nip: nip },
        { 
          nama_lengkap: nama,
          // Opsional: Jika pengajaran kosong, isi dengan mapel default
          $setOnInsert: { pengajaran: [{ mapel: mapelDefault, kelas: [] }] }
        },
        { upsert: true, new: true }
      );

      if (existingGuru) {
          updatedCount++;
      } else {
          createdCount++;
      }

      // 2. Simpan/Update User Login Otomatis
      await User.findOneAndUpdate(
        { user: `${nip}@guru.com` },
        { 
          password: md5('654321'), 
          role: 'guru',
          guru_id: guru._id
        },
        { upsert: true }
      );
    }

    revalidatePath('/admin/guru');
    return { 
      success: true, 
      message: `Sinkronisasi Selesai! Berhasil membuat ${createdCount} guru baru dan memperbarui ${updatedCount} data guru.` 
    };

  } catch (error) {
    console.error("Sync API error:", error);
    return { success: false, message: 'Terjadi kesalahan saat sinkronisasi data API.' };
  }
}

// RESET ALL GURU AUTH
export async function resetAllGuruAuthAction(): Promise<ActionState> {
  try {
    await connectDB();

    const gurus = await Guru.find({}).lean();
    const defaultPassword = md5('654321');
    let count = 0;

    for (const g of gurus) {
      // Cari user berdasarkan guru_id
      const user = await User.findOne({ guru_id: g._id });
      if (user) {
        user.user = `${g.nip}@guru.com`;
        user.password = defaultPassword;
        await user.save();
        count++;
      }
    }

    revalidatePath('/admin/guru');
    return { success: true, message: `Berhasil mereset ${count} akun guru ke format default.` };
  } catch (error) {
    console.error("Bulk reset error:", error);
    return { success: false, message: 'Gagal mereset semua akun guru.' };
  }
}

// SETUP GURU PENGAJARAN (Self-Setup)
export async function setupGuruPengajaranAction(guruId: string, mapel: string, kelas: string[]): Promise<ActionState> {
  try {
    await connectDB();

    await Guru.findByIdAndUpdate(guruId, {
      $push: {
        pengajaran: { mapel, kelas }
      }
    });

    revalidatePath('/guru');
    return { success: true, message: 'Berhasil mengatur kelas pengajaran!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Gagal mengatur kelas pengajaran.' };
  }
}

// MIGRATE MAPEL DATA
export async function migrateMapelAction(): Promise<ActionState> {
  try {
    await connectDB();
    
    // 1. Update Tugas
    const tasks = await Tugas.find({});
    for (const t of tasks) {
      const kelasList = Array.isArray(t.kelas) ? t.kelas : [t.kelas];
      if (kelasList.some((k: any) => k.startsWith('X-'))) {
          t.mapel = 'KKA';
      } else if (kelasList.some((k: any) => k.startsWith('XI-'))) {
          t.mapel = 'Informatika';
      }
      await (t as any).save();
    }
    
    // 2. Update SoalPG
    const quizzes = await SoalPG.find({});
    for (const q of quizzes) {
      const kelasList = Array.isArray(q.kelas) ? q.kelas : [q.kelas];
      if (kelasList.some((k: any) => k.startsWith('X-'))) {
          q.mapel = 'KKA';
      } else if (kelasList.some((k: any) => k.startsWith('XI-'))) {
          q.mapel = 'Informatika';
      }
      await (q as any).save();
    }
    
    // 3. Update Materi
    const materi = await Materi.find({});
    for (const m of materi) {
      const kelasList = Array.isArray(m.kelas) ? m.kelas : [m.kelas];
      if (kelasList.some((k: any) => k.startsWith('X-'))) {
          m.mapel = 'KKA';
      } else if (kelasList.some((k: any) => k.startsWith('XI-'))) {
          m.mapel = 'Informatika';
      }
      await (m as any).save();
    }

    // 4. Update Absensi (Menggunakan Nilai.mapel jika perlu, tapi Absensi punya mapel sendiri)
    // Untuk absensi, kita cek kelas siswanya
    const absensi = await Absensi.find({}).populate('member_id').exec();
    for (const a of absensi) {
        const student = a.member_id as any;
        if (student && student.kelas) {
            if (student.kelas.startsWith('X-')) {
                a.mapel = 'KKA';
            } else if (student.kelas.startsWith('XI-')) {
                a.mapel = 'Informatika';
            }
            await (a as any).save();
        }
    }

    revalidatePath('/guru');
    revalidatePath('/admin');
    
    return { success: true, message: 'Berhasil memigrasi data Mata Pelajaran (X -> KKA, XI -> Informatika)' };
  } catch (error) {
    console.error("Migration error:", error);
    return { success: false, message: 'Gagal memigrasi data Mata Pelajaran.' };
  }
}
// UPDATE FULL PENGAJARAN
export async function updateGuruFullPengajaranAction(guruId: string, pengajaran: any[]): Promise<ActionState> {
  try {
    await connectDB();

    await Guru.findByIdAndUpdate(guruId, {
      pengajaran: pengajaran
    });

    revalidatePath('/guru');
    return { success: true, message: 'Berhasil memperbarui data pengajaran!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Gagal memperbarui data pengajaran.' };
  }
}
