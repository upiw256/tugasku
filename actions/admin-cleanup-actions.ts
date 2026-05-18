'use server'

import { connectDB } from '@/lib/db';
import { Member, User, Nilai, PengerjaanKuis, Absensi, Kelompok } from '@/models';
import { revalidatePath } from 'next/cache';

export async function cleanupDuplicateStudentsAction() {
  try {
    await connectDB();

    // 0. Trim all nis first agar pencarian ganda akurat
    const allMembers = await Member.find({});
    for (const m of allMembers) {
      if (m.nis && m.nis !== m.nis.trim()) {
        const trimmed = m.nis.trim();
        // Cek apakah hasil trim akan menyebabkan tabrakan index
        const exists = await Member.findOne({ nis: trimmed, _id: { $ne: m._id } });
        if (!exists) {
            m.nis = trimmed;
            await m.save();
        }
      }
    }

    // 1. Cari NIS yang ganda
    const duplicates = await Member.aggregate([
      { $group: { _id: "$nis", count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    let deletedCount = 0;

    for (const dup of duplicates) {
      const nis = dup._id;
      const memberIds = dup.ids;

      // Sisakan data yang memiliki riwayat nilai/kuis/absen
      let keptId = null;
      for (const mId of memberIds) {
        const hasNilai = await Nilai.exists({ member_id: mId });
        const hasKuis = await PengerjaanKuis.exists({ member_id: mId });
        const hasAbsen = await Absensi.exists({ member_id: mId });
        
        if (hasNilai || hasKuis || hasAbsen) {
          keptId = mId;
          break;
        }
      }

      if (!keptId) keptId = memberIds[0];

      // Hapus duplikat
      for (const mId of memberIds) {
        if (mId.toString() === keptId.toString()) continue;

        await Member.findByIdAndDelete(mId);
        await User.findOneAndDelete({ member_id: mId });
        deletedCount++;
      }
    }

    revalidatePath('/admin/siswa');
    return { success: true, message: `Pembersihan Selesai! Berhasil menghapus ${deletedCount} data siswa ganda yang tidak memiliki nilai.` };
  } catch (error) {
    console.error("Cleanup error:", error);
    return { success: false, message: 'Gagal melakukan pembersihan data.' };
  }
}
