'use server'

import { connectDB } from '@/lib/db';
import { Member, User, Nilai } from '@/models';
import ExcelJS from 'exceljs';
import md5 from 'md5';
import { revalidatePath } from 'next/cache';

// Interface untuk tipe data kembalian
type ActionState = {
  success: boolean;
  message: string;
};

export async function importStudentsAction(formData: FormData): Promise<ActionState> {
  await connectDB();
  
  const file = formData.get('file') as File;
  if (!file) return { success: false, message: 'File tidak ditemukan' };

  try {
    // Ubah file jadi buffer agar bisa dibaca ExcelJS
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1); // Ambil sheet pertama
    if (!worksheet) return { success: false, message: 'Sheet excel kosong atau rusak' };

    let count = 0;
    const promises: Promise<any>[] = [];

    // Baca baris per baris (mulai baris 2, karena baris 1 itu Header)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; 

      // Ambil data kolom (Pastikan urutannya di Excel nanti: NIS, Nama, Kelas, Email, Password)
      // getCell(1) artinya kolom A, getCell(2) kolom B, dst.
      const nisRaw = row.getCell(1).value; 
      const namaRaw = row.getCell(2).value;
      const kelasRaw = row.getCell(3).value;
      const emailRaw = row.getCell(4).value;
      const passRaw = row.getCell(5).value;

      // Konversi ke string aman
      const nis = nisRaw?.toString() || '';
      const nama = namaRaw?.toString() || '';
      const kelas = kelasRaw?.toString() || '';
      const email = emailRaw?.toString() || '';
      const pass = passRaw?.toString() || '';

      if (nis && nama) {
        const processRow = async () => {
          // 1. Simpan/Update Data Siswa (Member)
          const newMember = await Member.findOneAndUpdate(
            { nis: nis },
            { nama_lengkap: nama, kelas: kelas },
            { upsert: true, new: true } // Buat baru jika belum ada
          );

          // 2. Simpan/Update Akun Login (User)
          await User.findOneAndUpdate(
            { user: email || `${nis}@siswa.com` }, // Kalau email kosong, pakai NIS@siswa.com
            { 
              password: md5(pass || '123456'), // Default password '123456'
              role: 'siswa',
              member_id: newMember._id
            },
            { upsert: true }
          );
        };
        promises.push(processRow());
        count++;
      }
    });

    // Tunggu semua proses selesai
    await Promise.all(promises);

    // Refresh halaman agar data terbaru muncul
    revalidatePath('/admin/siswa');
    return { success: true, message: `Sukses! Berhasil memproses ${count} data siswa.` };

  } catch (error) {
    console.error("Error import:", error);
    return { success: false, message: 'Gagal import data. Cek format excel Anda.' };
  }
}
export async function resetPasswordAction(memberId: string) {
  try {
    await connectDB();

    // 1. Reset password user yang terhubung dengan member_id ini
    const defaultPassword = md5('123456');

    const updatedUser = await User.findOneAndUpdate(
      { member_id: memberId },
      { password: defaultPassword },
      { new: true }
    );

    if (!updatedUser) {
      return { success: false, message: 'Akun user tidak ditemukan untuk siswa ini.' };
    }

    // 2. Refresh halaman agar UI update (opsional, tapi bagus untuk konsistensi)
    revalidatePath('/admin/siswa');

    return { success: true, message: 'Password berhasil direset menjadi: 123456' };
  } catch (error) {
    console.error("Reset error:", error);
    return { success: false, message: 'Gagal mereset password.' };
  }
}
export async function deleteStudentAction(memberId: string) {
  try {
    await connectDB();
    
    // Hapus data member
    await Member.findByIdAndDelete(memberId);
    
    // Hapus user login terkait
    await User.findOneAndDelete({ member_id: memberId });
    
    // Opsional: Hapus nilai-nilai siswa tersebut agar database bersih
    await Nilai.deleteMany({ member_id: memberId });

    revalidatePath('/admin/siswa');
    return { success: true, message: 'Data siswa berhasil dihapus' };
  } catch (error) {
    return { success: false, message: 'Gagal menghapus siswa' };
  }
}
export async function updateStudentAction(memberId: string, formData: FormData) {
  try {
    await connectDB();
    
    const nama = formData.get('nama') as string;
    const nis = formData.get('nis') as string;
    const kelas = formData.get('kelas') as string;

    // Update Member
    await Member.findByIdAndUpdate(memberId, {
      nama_lengkap: nama,
      nis: nis,
      kelas: kelas
    });

    // Update User (Jika NIS berubah, username login juga bisa diupdate jika mau, tapi opsional)
    // Di sini kita update member saja cukup.

    revalidatePath('/admin/siswa');
    return { success: true, message: 'Data siswa berhasil diupdate' };
  } catch (error) {
    return { success: false, message: 'Gagal mengupdate data' };
  }
}
export async function createStudentAction(formData: FormData) {
  try {
    await connectDB();
    
    const nis = formData.get('nis') as string;
    const nama = formData.get('nama') as string;
    const kelas = formData.get('kelas') as string;

    // Cek apakah NIS sudah terdaftar
    const existingMember = await Member.findOne({ nis });
    if (existingMember) {
      return { success: false, message: 'Gagal: NIS sudah terdaftar.' };
    }

    // 1. Buat Member Baru
    const newMember = await Member.create({
      nis,
      nama_lengkap: nama,
      kelas
    });

    // 2. Buat User Login Otomatis
    // Default email: nis@siswa.com
    // Default password: 123456
    await User.create({
      user: `${nis}@siswa.com`,
      password: md5('123456'), 
      role: 'siswa',
      member_id: newMember._id
    });

    revalidatePath('/admin/siswa');
    return { success: true, message: 'Berhasil menambah siswa baru!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan server.' };
  }
}