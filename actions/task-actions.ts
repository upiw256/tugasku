'use server'

import { connectDB } from '@/lib/db';
import { Tugas, Nilai } from '@/models';
import ExcelJS from 'exceljs';
import { revalidatePath } from 'next/cache';

export async function importTasksAction(formData: FormData) {
  await connectDB();
  const file = formData.get('file') as File;

  if (!file) return { success: false, message: 'File tidak ditemukan' };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return { success: false, message: 'Sheet excel kosong' };

    let count = 0;
    const promises: Promise<any>[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip Header

      // Urutan Kolom: Judul, Deskripsi, Deadline, Kelas
      const judul = row.getCell(1).text;
      const deskripsi = row.getCell(2).text;
      const deadlineRaw = row.getCell(3).value;
      const kelasRaw = row.getCell(4).text;

      if (judul && kelasRaw) {
        // Proses Data
        const processRow = async () => {
          // 1. Format Tanggal
          let deadline = new Date();
          if (deadlineRaw instanceof Date) {
            deadline = deadlineRaw;
          } else if (typeof deadlineRaw === 'string') {
            deadline = new Date(deadlineRaw);
          }

          // 2. Format Kelas (Pisahkan koma jika banyak kelas. Contoh: "X 1, X 2")
          // Hasilnya jadi array: ["X 1", "X 2"]
          const listKelas = kelasRaw.includes(',') 
            ? kelasRaw.split(',').map(k => k.trim()) 
            : kelasRaw.trim();

          // 3. Simpan ke DB
          await Tugas.create({
            judul,
            deskripsi,
            deadline,
            kelas: listKelas
          });
        };
        promises.push(processRow());
        count++;
      }
    });

    await Promise.all(promises);

    revalidatePath('/admin/tugas');
    return { success: true, message: `Berhasil import ${count} tugas!` };

  } catch (error) {
    console.error("Error import tugas:", error);
    return { success: false, message: 'Gagal import. Cek format tanggal/kolom excel.' };
  }
}
export async function deleteTaskAction(tugasId: string) {
  try {
    await connectDB();

    // 1. Hapus Tugasnya
    await Tugas.findByIdAndDelete(tugasId);

    // 2. Hapus semua nilai siswa yang terkait tugas ini (Biar database bersih)
    await Nilai.deleteMany({ tugas_id: tugasId });

    revalidatePath('/admin/tugas');
    return { success: true, message: 'Tugas berhasil dihapus' };
  } catch (error) {
    return { success: false, message: 'Gagal menghapus tugas' };
  }
}
export async function createTaskAction(formData: FormData) {
  try {
    await connectDB();

    const judul = formData.get('judul') as string;
    const deskripsi = formData.get('deskripsi') as string;
    const deadlineString = formData.get('deadline') as string;
    const kelasRaw = formData.get('kelas') as string;

    // Validasi sederhana
    if (!judul || !deadlineString || !kelasRaw) {
      return { success: false, message: 'Judul, Deadline, dan Kelas wajib diisi!' };
    }

    // 1. Format Kelas (Pisahkan koma menjadi array)
    // Contoh input: "XI 1, XI 2" -> Menjadi ["XI 1", "XI 2"]
    const listKelas = kelasRaw.includes(',') 
      ? kelasRaw.split(',').map(k => k.trim()) 
      : [kelasRaw.trim()];

    // 2. Simpan ke Database
    await Tugas.create({
      judul,
      deskripsi,
      deadline: new Date(deadlineString),
      kelas: listKelas
    });

    revalidatePath('/admin/tugas');
    return { success: true, message: 'Berhasil membuat tugas baru!' };

  } catch (error) {
    console.error("Create task error:", error);
    return { success: false, message: 'Gagal membuat tugas. Cek koneksi server.' };
  }
}