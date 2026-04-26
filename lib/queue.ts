import { Queue } from 'bullmq';
import { redisConnection } from './redis';

// Nama antrian, misal: 'upload-tugas'
export const uploadQueue = new Queue('upload-tugas', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Coba lagi 3 kali jika gagal
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true, // Hapus dari Redis jika sukses
    removeOnFail: false,    // Simpan di Redis jika gagal untuk dicek Admin
  },
});