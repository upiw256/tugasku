import { pusherServer } from './pusher';
import { LogAktivitasSiswa } from '@/models';
import { connectDB } from './db';

interface LogData {
  nama_siswa?: string;
  kelas?: string;
  kategori?: 'Siswa' | 'Sistem' | 'Console' | 'Client';
  aksi: string;
  tipe: 'success' | 'warning' | 'error';
}

export async function logAktivitasSiswa(data: LogData) {
  try {
    await connectDB();

    // Default ke string jika undefined (Mongoose sudah ada default, namun TS memerlukannya untuk payload pusher later)
    const logDataToSave = {
      ...data,
      kategori: data.kategori || 'Sistem'
    };

    // Simpan ke DB
    const newLog = await LogAktivitasSiswa.create(logDataToSave);

    // Batasi maksimum 500 log
    const count = await LogAktivitasSiswa.countDocuments();
    if (count > 500) {
      // Hapus yang paling lama
      const logsToDelete = await LogAktivitasSiswa.find()
        .sort({ waktu: 1 })
        .limit(count - 500)
        .select('_id');
      
      const idsToDelete = logsToDelete.map(log => log._id);
      await LogAktivitasSiswa.deleteMany({ _id: { $in: idsToDelete } });
    }

    // Trigger realtime update event melalui pusher
    // Convert to plain object for Pusher
    const logDataPayload = {
      _id: newLog._id.toString(),
      nama_siswa: newLog.nama_siswa,
      kelas: newLog.kelas,
      kategori: newLog.kategori,
      aksi: newLog.aksi,
      tipe: newLog.tipe,
      waktu: newLog.waktu.toISOString(),
    };
    
    await pusherServer.trigger('admin-logs', 'new-log', logDataPayload);
  } catch (error) {
    console.error('Failed to save log aktivitas:', error);
  }
}
